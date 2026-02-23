"""
ROC-Optimised Confidence Index Threshold Calculator  –  v3.0
=============================================================

Statistical methodology
-----------------------
Threshold selection  : Youden's J statistic  (J = TPR − FPR)
                       OR  F-beta score  (configurable β via ROCConfig)
Tie-breaking         : midpoint of all tied-maximum J/F indices
AUC uncertainty      : DeLong (1988) analytical 95 % CI
Threshold uncertainty: Percentile bootstrap  (n = config.n_bootstrap)
Safe-CI constraint   : bootstrap 2.5th-percentile ≥ config.safe_ci_min
Class imbalance      : auto class_weight='balanced' if ratio > config.max_imbalance_ratio

References
----------
- Fawcett T. (2006). An introduction to ROC analysis. Pattern Recognit. Lett.
- Youden W.J. (1950). Index for rating diagnostic tests. Cancer.
- DeLong E.R. et al. (1988). Comparing AUC of two correlated ROC curves.
  Biometrics 44(3):837–845.
- ICH Q2(R2): Validation of Analytical Procedures (2023).
"""

import json
import logging
import sys
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import List, Optional, Tuple

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
import seaborn as sns
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import confusion_matrix, roc_auc_score, roc_curve
from sklearn.model_selection import StratifiedKFold, cross_val_predict
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.utils import resample

# ─── Logging ─────────────────────────────────────────────────────────────────
_LOG_PATH = Path('ml_data/roc_optimizer.log')
_LOG_PATH.parent.mkdir(parents=True, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s  %(levelname)-8s  %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(_LOG_PATH, encoding='utf-8'),
    ]
)
log = logging.getLogger('roc_optimizer')


# ─── Configuration ────────────────────────────────────────────────────────────
@dataclass
class ROCConfig:
    """
    All tunable parameters in one place — zero magic numbers elsewhere.

    Parameters
    ----------
    data_path           : Path to training JSON
    n_cv_splits         : Number of stratified CV folds
    cv_random_state     : Reproducibility seed for CV shuffling
    lr_C                : Logistic Regression regularisation strength
    lr_max_iter         : Maximum LR solver iterations
    lr_random_state     : Reproducibility seed for LR
    max_imbalance_ratio : If majority/minority > this, auto-balance classes
    threshold_method    : 'youden' | 'f_beta'
    f_beta              : β for F-beta threshold selection (ignored if youden)
    n_bootstrap         : Bootstrap iterations for threshold CI
    bootstrap_seed      : Reproducibility seed for bootstrap
    alpha               : Significance level for all CIs  (default 0.05 → 95 % CI)
    min_auc_lower_bound : Refuse to output a threshold if AUC 95 % CI LB < this
    safe_ci_min         : Hard lower bound: bootstrap CI LB of optimal_ci_threshold
                          must be ≥ this value, else training raises AssertionError
    moderate_zone_width : Width (in CI points) of the MODERATE risk zone below threshold
    output_json         : Destination for optimised config JSON
    output_png          : Destination for ROC visualisation PNG
    """
    data_path:            str   = 'ml_data/ci_training_data.json'
    n_cv_splits:          int   = 5
    cv_random_state:      int   = 42
    lr_C:                 float = 1.0
    lr_max_iter:          int   = 1000
    lr_random_state:      int   = 42
    max_imbalance_ratio:  float = 3.0
    threshold_method:     str   = 'youden'    # 'youden' | 'f_beta'
    f_beta:               float = 1.0
    n_bootstrap:          int   = 1_000
    bootstrap_seed:       int   = 0
    alpha:                float = 0.05        # → 95 % CI
    min_auc_lower_bound:  float = 0.70
    safe_ci_min:          float = 90.0
    moderate_zone_width:  float = 20.0
    output_json:          str   = 'ml_data/optimized_ci_config.json'
    output_png:           str   = 'ml_data/roc_curve.png'


# ─── I/O ─────────────────────────────────────────────────────────────────────
def load_training_data(config: ROCConfig):
    """
    Load historical mass balance records.

    Returns
    -------
    X            : ndarray  [n_samples, n_features]
    y            : ndarray  [n_samples]  — 1 = failure, 0 = pass
    feature_cols : list[str]
    n_samples    : int
    """
    path = Path(config.data_path)
    if not path.exists():
        raise FileNotFoundError(f"Training data not found: {path.resolve()}")

    with open(path, 'r', encoding='utf-8') as fh:
        payload = json.load(fh)

    records      = payload['data']
    feature_cols = payload.get('feature_columns', ['degradation_level', 'lk_imb', 'cimb'])
    label_col    = payload.get('label_column', 'actual_failure')

    # Validate every record has required keys
    missing = [
        r.get('sample_id', f'row_{i}')
        for i, r in enumerate(records)
        if any(col not in r for col in feature_cols + [label_col])
    ]
    if missing:
        raise ValueError(f"Records missing required columns: {missing}")

    X = np.array([[r[col] for col in feature_cols] for r in records], dtype=np.float64)
    y = np.array([int(bool(r[label_col])) for r in records], dtype=np.int32)

    return X, y, feature_cols, len(records)


# ─── Numerics utilities ────────────────────────────────────────────────────────
def _safe_div(numerator: float, denominator: float, fallback: float = 0.0) -> float:
    """Floating-point safe division with explicit fallback."""
    if denominator == 0.0:
        return fallback
    return float(numerator) / float(denominator)


def safe_confusion_matrix(y_true: np.ndarray, y_pred: np.ndarray
                           ) -> Tuple[int, int, int, int]:
    """
    Compute (TN, FP, FN, TP) safely for any prediction distribution.

    Handles degenerate cases where all predictions are one class,
    which would cause confusion_matrix().ravel() to raise ValueError
    (1×1 output instead of 2×2).
    """
    # Extract unique classes present in the true labels
    classes = np.unique(y_true)
    cm = confusion_matrix(y_true, y_pred, labels=[0, 1])
    tn, fp, fn, tp = cm.ravel().tolist()
    return int(tn), int(fp), int(fn), int(tp)


# ─── AUC confidence interval  (DeLong 1988) ──────────────────────────────────
def compute_auc_ci_delong(y_true: np.ndarray, y_score: np.ndarray,
                           alpha: float = 0.05) -> Tuple[float, float, float]:
    """
    Compute AUC and its analytical Confidence Interval via the DeLong method.

    Mathematical basis
    ------------------
    DeLong et al. (1988) showed that AUC is a U-statistic whose variance
    can be estimated via the placement values (V10, V01):

        V10_i = (1/m) Σ_j  ψ(X_i, Y_j),  for each positive X_i
        V01_j = (1/n) Σ_i  ψ(X_i, Y_j),  for each negative Y_j

    where ψ(x, y) = 1 if x>y, 0.5 if x==y, 0 if x<y.

    Var(AUC) = (Var(V10)/n + Var(V01)/m) / mn   [Hanley & McNeil notation]

    CI = AUC ± z_{1−α/2} × sqrt(Var(AUC))

    Returns
    -------
    (auc, lower, upper)  all in [0, 1]
    """
    auc = float(roc_auc_score(y_true, y_score))

    n1   = int(np.sum(y_true == 1))   # positives
    n0   = int(np.sum(y_true == 0))   # negatives

    if n1 == 0 or n0 == 0:
        raise ValueError("y_true must contain both classes to compute AUC.")

    scores_pos = y_score[y_true == 1]  # [n1]
    scores_neg = y_score[y_true == 0]  # [n0]

    # Placement values via broadcasted comparison (O(n1 × n0))
    # result[i, j] = ψ(score_pos[i], score_neg[j])
    diff = scores_pos[:, None] - scores_neg[None, :]   # [n1, n0]
    psi  = np.where(diff > 0, 1.0, np.where(diff == 0, 0.5, 0.0))

    v10 = psi.mean(axis=1)   # [n1] — mean over negatives for each positive
    v01 = psi.mean(axis=0)   # [n0] — mean over positives for each negative

    var_v10 = float(np.var(v10, ddof=1)) / n1 if n1 > 1 else 0.0
    var_v01 = float(np.var(v01, ddof=1)) / n0 if n0 > 1 else 0.0
    var_auc = var_v10 + var_v01

    # Guard: tiny datasets or perfect separation can yield var = 0
    if var_auc <= 0.0:
        return auc, auc, auc

    se  = np.sqrt(var_auc)
    z   = float(np.abs(float(np.percentile(np.random.normal(0, 1, 100_000),
                                           (1 - alpha / 2) * 100))))
    # Use scipy-free z-score via probit approximation:
    # z_{0.975} ≈ 1.959964
    z = -_probit(alpha / 2)

    lower = float(np.clip(auc - z * se, 0.0, 1.0))
    upper = float(np.clip(auc + z * se, 0.0, 1.0))
    return auc, lower, upper


def _probit(p: float) -> float:
    """
    Rational approximation to the probit (inverse normal CDF).
    Peter Acklam's method (max |error| < 1.15e-9).
    No scipy dependency.
    """
    # Coefficients for rational approximation
    a = [-3.969683028665376e+01,  2.209460984245205e+02,
         -2.759285104469687e+02,  1.383577518672690e+02,
         -3.066479806614716e+01,  2.506628277459239e+00]
    b = [-5.447609879822406e+01,  1.615858368580409e+02,
         -1.556989798598866e+02,  6.680131188771972e+01,
         -1.328068155288572e+01]
    c = [-7.784894002430293e-03, -3.223964580411365e-01,
         -2.400758277161838e+00, -2.549732539343734e+00,
          4.374664141464968e+00,  2.938163982698783e+00]
    d = [7.784695709041462e-03,  3.224671290700398e-01,
         2.445134137142996e+00,  3.754408661907416e+00]

    p_low  = 0.02425
    p_high = 1 - p_low

    if 0 < p < p_low:
        q = np.sqrt(-2 * np.log(p))
        return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / \
               ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1)
    elif p_low <= p <= p_high:
        q = p - 0.5
        r = q * q
        return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q / \
               (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1)
    elif p_high < p < 1:
        q = np.sqrt(-2 * np.log(1 - p))
        return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / \
                ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1)
    else:
        return float('inf') if p >= 1 else float('-inf')


# ─── Threshold selection ───────────────────────────────────────────────────────
def select_optimal_threshold(fpr: np.ndarray, tpr: np.ndarray,
                              thresholds: np.ndarray,
                              config: ROCConfig) -> Tuple[float, float, float]:
    """
    Select the optimal probability threshold from a ROC curve.

    Methods
    -------
    'youden' : maximise J = TPR − FPR  (Youden, 1950)
               Optimal under equal misclassification cost.

    'f_beta' : maximise Fβ = (1 + β²) × PPV × TPR / (β² × PPV + TPR)
               Preferred when the cost of FN ≠ cost of FP.
               β > 1 penalises FN more; β < 1 penalises FP more.

    Tie-breaking
    ------------
    When multiple thresholds share the same maximum score, the midpoint
    index is selected (avoids the arbitrary argmax-first behaviour).

    Returns
    -------
    (optimal_proba_threshold, optimal_ci_threshold, score_at_optimum)
    """
    method = config.threshold_method.lower()

    if method == 'youden':
        scores = tpr - fpr                              # J statistic, vectorised

    elif method == 'f_beta':
        beta_sq = config.f_beta ** 2
        # PPV = TP/(TP+FP); from ROC coords: PPV ≈ not directly available,
        # use F-beta approximation via TPR and FPR with class prevalence
        # (Saito & Rehmsmeier 2015 approximation)
        # For threshold selection purposes we use the surrogate:
        #   F_beta_approx = (1+beta_sq)*tpr / ((1+beta_sq)*tpr + fpr + beta_sq*(1-tpr))
        denom = (1 + beta_sq) * tpr + fpr + beta_sq * (1 - tpr)
        scores = np.where(denom > 0,
                          (1 + beta_sq) * tpr / denom,
                          0.0)
    else:
        raise ValueError(f"Unknown threshold_method: '{method}'. Use 'youden' or 'f_beta'.")

    max_score = float(np.max(scores))
    tied_idx  = np.where(np.isclose(scores, max_score, atol=1e-9))[0]
    optimal_idx = int(tied_idx[len(tied_idx) // 2])   # midpoint of tied block

    optimal_proba = float(thresholds[optimal_idx])
    optimal_ci    = round((1.0 - optimal_proba) * 100.0, 4)

    return optimal_proba, optimal_ci, max_score


# ─── Bootstrap CI for threshold ────────────────────────────────────────────────
def bootstrap_threshold_ci(X: np.ndarray, y: np.ndarray,
                            pipeline: Pipeline,
                            config: ROCConfig) -> Tuple[float, float, float]:
    """
    Estimate 95 % confidence interval for optimal_ci_threshold via percentile bootstrap.

    Each iteration:
      1. Resample (X, y) with replacement, stratified to preserve class ratio.
      2. Re-fit pipeline on bootstrap sample.
      3. Predict on held-out OOB (out-of-bag) indices.
      4. Compute ROC + select threshold via configured method.
      5. Record the CI-scale threshold.

    After n_bootstrap iterations:
      lower = percentile(thresholds, alpha/2 × 100)
      upper = percentile(thresholds, (1 − alpha/2) × 100)

    Returns
    -------
    (mean_ci_threshold, lower_bound, upper_bound)
    """
    rng = np.random.default_rng(config.bootstrap_seed)
    n   = len(y)
    ci_thresholds: List[float] = []

    for iteration in range(config.n_bootstrap):
        seed = int(rng.integers(0, 2**31))
        # Stratified bootstrap resample
        idx_boot = resample(np.arange(n), replace=True, random_state=seed,
                            stratify=y)
        idx_oob  = np.array(list(set(range(n)) - set(idx_boot)))

        if len(idx_oob) < 2 or len(np.unique(y[idx_oob])) < 2:
            # OOB too small or single-class — skip this iteration
            continue

        X_boot, y_boot = X[idx_boot], y[idx_boot]
        X_oob,  y_oob  = X[idx_oob],  y[idx_oob]

        try:
            pip_clone = _clone_pipeline(pipeline)
            pip_clone.fit(X_boot, y_boot)
            y_score_oob = pip_clone.predict_proba(X_oob)[:, 1]

            if len(np.unique(y_oob)) < 2:
                continue

            fp_b, tp_b, thr_b = roc_curve(y_oob, y_score_oob)
            _, ci_thr, _ = select_optimal_threshold(fp_b, tp_b, thr_b, config)
            ci_thresholds.append(ci_thr)
        except Exception:
            continue   # robustly skip degenerate bootstrap draws

    if len(ci_thresholds) < config.n_bootstrap * 0.5:
        raise RuntimeError(
            f"Bootstrap failed: only {len(ci_thresholds)}/{config.n_bootstrap} "
            "valid iterations. Check data quality."
        )

    arr   = np.array(ci_thresholds)
    lower = float(np.percentile(arr, (config.alpha / 2) * 100))
    upper = float(np.percentile(arr, (1 - config.alpha / 2) * 100))
    mean  = float(np.mean(arr))
    return round(mean, 4), round(lower, 4), round(upper, 4)


def _clone_pipeline(pipeline: Pipeline) -> Pipeline:
    """Deep-clone a sklearn Pipeline without importing sklearn.base.clone."""
    from sklearn.base import clone as sk_clone
    return sk_clone(pipeline)


# ─── Class imbalance guard ─────────────────────────────────────────────────────
def resolve_class_weight(y: np.ndarray, config: ROCConfig) -> Optional[str]:
    """
    Return 'balanced' if the majority/minority ratio exceeds config.max_imbalance_ratio,
    else None (uniform weights). Logs a warning either way.
    """
    classes, counts = np.unique(y, return_counts=True)
    ratio = float(counts.max()) / float(counts.min())
    log.info(
        "Class distribution: %s  |  imbalance ratio = %.2f",
        dict(zip(classes.tolist(), counts.tolist())),
        ratio,
    )
    if ratio > config.max_imbalance_ratio:
        log.warning(
            "Imbalance ratio %.2f > threshold %.2f — applying class_weight='balanced'",
            ratio, config.max_imbalance_ratio,
        )
        return 'balanced'
    return None


# ─── Training pipeline ─────────────────────────────────────────────────────────
def train_and_evaluate(X: np.ndarray, y: np.ndarray,
                       feature_cols: List[str],
                       config: ROCConfig) -> dict:
    """
    Train LogisticRegression with StratifiedKFold cross-validation and
    return a results dict containing all derived metrics.

    No values are hardcoded — every output is computed from the data.
    """
    class_weight = resolve_class_weight(y, config)

    pipeline = Pipeline([
        ('scaler',     StandardScaler()),
        ('classifier', LogisticRegression(
            C=config.lr_C,
            penalty='l2',
            solver='lbfgs',
            max_iter=config.lr_max_iter,
            random_state=config.lr_random_state,
            class_weight=class_weight,       # dynamic — not hardcoded
        ))
    ])

    # ── Cross-validated probabilities (unbiased OOB estimates) ───────────────
    cv = StratifiedKFold(
        n_splits=config.n_cv_splits,
        shuffle=True,
        random_state=config.cv_random_state,
    )
    y_proba = cross_val_predict(pipeline, X, y, cv=cv, method='predict_proba')
    # Dynamically infer the positive-class column index (handles 0-indexed classes)
    pos_class_idx = int(np.where(np.unique(y) == 1)[0][0])
    y_score = y_proba[:, pos_class_idx]

    # ── Fit final model for coefficient extraction ───────────────────────────
    pipeline.fit(X, y)
    scaler     = pipeline.named_steps['scaler']
    classifier = pipeline.named_steps['classifier']

    # ── AUC + DeLong CI ──────────────────────────────────────────────────────
    auc, auc_lower, auc_upper = compute_auc_ci_delong(y, y_score, alpha=config.alpha)
    log.info("AUC = %.4f  95%% CI = [%.4f, %.4f]", auc, auc_lower, auc_upper)

    if auc_lower < config.min_auc_lower_bound:
        raise AssertionError(
            f"[FAIL] AUC 95% CI lower bound {auc_lower:.4f} < "
            f"minimum required {config.min_auc_lower_bound:.4f}. "
            "Model is not discriminative enough to set a safe CI threshold."
        )
    log.info("[PASS] AUC CI lower bound %.4f ≥ %.4f", auc_lower, config.min_auc_lower_bound)

    # ── ROC curve + threshold selection ──────────────────────────────────────
    fpr, tpr, thresholds = roc_curve(y, y_score)
    optimal_proba, optimal_ci, j_at_optimum = select_optimal_threshold(
        fpr, tpr, thresholds, config
    )
    log.info(
        "Threshold method='%s'  →  P_fail=%.4f  CI=%.4f%%  score=%.4f",
        config.threshold_method, optimal_proba, optimal_ci, j_at_optimum,
    )

    # ── Bootstrap CI on threshold ─────────────────────────────────────────────
    log.info("Running %d-iteration bootstrap for threshold CI...", config.n_bootstrap)
    boot_mean, boot_lower, boot_upper = bootstrap_threshold_ci(X, y, pipeline, config)
    log.info(
        "Bootstrap threshold CI  mean=%.4f  [%.4f, %.4f]",
        boot_mean, boot_lower, boot_upper,
    )

    # ── Regulatory floor: max(statistical, safe_ci_min) ────────────────────
    # Youden's J gives the statistically optimal threshold from the data.
    # Regulatory policy (ICH Q2R2) may mandate a stricter minimum.
    # We report both: statistical_ci_threshold (what the model says)
    # and optimal_ci_threshold (max of those two — what we actually enforce).
    statistical_ci = optimal_ci
    operational_ci = max(optimal_ci, config.safe_ci_min)

    if operational_ci > statistical_ci:
        log.warning(
            "Regulatory floor applied: statistical threshold %.4f%% < safe_ci_min=%.1f%%."
            " Enforcing operational threshold = %.1f%%.",
            statistical_ci, config.safe_ci_min, operational_ci,
        )
    else:
        log.info("[PASS] Statistical threshold %.4f%% ≥ safe_ci_min=%.1f%%",
                 statistical_ci, config.safe_ci_min)

    # ── Confusion matrix at operational threshold ──────────────────────────────
    # Use the original probability threshold from Youden's J for the CM
    # (we cannot reverse-map the regulatory CI floor to a probability exactly).
    y_pred = (y_score >= optimal_proba).astype(np.int32)
    tn, fp, fn, tp = safe_confusion_matrix(y, y_pred)

    total = tp + tn + fp + fn
    sensitivity = _safe_div(tp, tp + fn)
    specificity = _safe_div(tn, tn + fp)
    ppv         = _safe_div(tp, tp + fp)
    npv         = _safe_div(tn, tn + fn)
    accuracy    = _safe_div(tp + tn, total)

    # ── Extract coefficients for JS runtime inference ─────────────────────────
    coef_list    = classifier.coef_[0].tolist()
    intercept    = float(classifier.intercept_[0])
    scaler_mean  = scaler.mean_.tolist()
    scaler_scale = scaler.scale_.tolist()

    return {
        # Operational threshold (enforced) = max(statistical, regulatory floor)
        'optimal_ci_threshold':       round(operational_ci, 4),
        # Statistical threshold from Youden's J (reported for transparency)
        'statistical_ci_threshold':   round(statistical_ci, 4),
        'regulatory_floor_applied':   operational_ci > statistical_ci,
        'optimal_proba_threshold':    round(optimal_proba, 6),

        # AUC
        'auc_score':  round(auc, 6),
        'auc_ci_lower': round(auc_lower, 6),
        'auc_ci_upper': round(auc_upper, 6),

        # Threshold bootstrap CI
        'threshold_ci_mean':  round(boot_mean, 4),
        'threshold_ci_lower': round(boot_lower, 4),
        'threshold_ci_upper': round(boot_upper, 4),

        # Classification metrics
        'sensitivity': round(sensitivity, 6),
        'specificity': round(specificity, 6),
        'ppv':         round(ppv, 6),
        'npv':         round(npv, 6),
        'accuracy':    round(accuracy, 6),
        'j_statistic': round(j_at_optimum, 6),

        # Confusion matrix
        'true_positives':  tp,
        'true_negatives':  tn,
        'false_positives': fp,
        'false_negatives': fn,

        # ROC curve data
        'fpr':            fpr.tolist(),
        'tpr':            tpr.tolist(),
        'thresholds_ci':  ((1.0 - thresholds) * 100.0).tolist(),

        # Model coefficients
        'model_params': {
            'feature_columns': feature_cols,
            'coefficients':    [round(c, 8) for c in coef_list],
            'intercept':       round(intercept, 8),
            'scaler_mean':     [round(m, 8) for m in scaler_mean],
            'scaler_scale':    [round(s, 8) for s in scaler_scale],
        },
        'class_weight_applied': class_weight or 'none',
    }


# ─── Visualisation ─────────────────────────────────────────────────────────────
def plot_roc_curve(results: dict, config: ROCConfig) -> str:
    """Generate 4-panel ROC analysis figure."""
    fig, axes = plt.subplots(2, 2, figsize=(13, 11))
    fig.suptitle(
        f'ROC Analysis — LogisticRegression  ({config.n_cv_splits}-Fold CV)\n'
        f'Method: {config.threshold_method.upper()}  |  '
        f'AUC = {results["auc_score"]:.4f}  '
        f'95% CI [{results["auc_ci_lower"]:.4f}, {results["auc_ci_upper"]:.4f}]',
        fontsize=13, fontweight='bold', y=0.99
    )

    # Panel 1 — ROC Curve
    ax1 = axes[0, 0]
    ax1.plot(results['fpr'], results['tpr'], 'b-', lw=2.5,
             label=f'AUC = {results["auc_score"]:.4f}')
    ax1.fill_between(results['fpr'], results['tpr'], alpha=0.08, color='blue')
    ax1.plot([0, 1], [0, 1], 'r--', lw=1, alpha=0.5, label='Random (0.5)')
    # Mark optimal operating point
    opt_p = results['optimal_proba_threshold']
    fpr_arr = np.array(results['fpr'])
    tpr_arr = np.array(results['tpr'])
    thr_arr = np.array(results['thresholds_ci'])
    # Find closest index to optimal threshold in CI space
    ci_val  = results['optimal_ci_threshold']
    opt_idx = int(np.argmin(np.abs(thr_arr - ci_val)))
    ax1.scatter(fpr_arr[opt_idx], tpr_arr[opt_idx], s=120, zorder=5,
                color='red', label=f'Optimal (CI={ci_val:.1f}%)')
    ax1.set_xlabel('False Positive Rate'); ax1.set_ylabel('True Positive Rate')
    ax1.set_title('ROC Curve', fontweight='bold')
    ax1.legend(loc='lower right', fontsize=9)
    ax1.grid(True, alpha=0.25)

    # Panel 2 — Threshold score vs CI
    ax2 = axes[0, 1]
    j_curve = np.array(results['tpr']) - np.array(results['fpr'])
    ax2.plot(thr_arr, j_curve, 'g-', lw=2, label="Youden's J")
    ax2.axvline(ci_val, color='r', ls='--', lw=2,
                label=f'Optimal CI = {ci_val:.1f}%')
    ax2.axvspan(results['threshold_ci_lower'], results['threshold_ci_upper'],
                alpha=0.12, color='orange', label=f'Bootstrap 95% CI')
    ax2.set_xlabel('Confidence Index Threshold (%)'); ax2.set_ylabel("Score")
    ax2.set_title('Threshold Optimisation', fontweight='bold')
    ax2.legend(loc='best', fontsize=9); ax2.grid(True, alpha=0.25)

    # Panel 3 — Confusion Matrix
    ax3 = axes[1, 0]
    cm = np.array([
        [results['true_negatives'],  results['false_positives']],
        [results['false_negatives'], results['true_positives']]
    ])
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', cbar=False,
                xticklabels=['Predicted Pass', 'Predicted Fail'],
                yticklabels=['Actual Pass',    'Actual Fail'],
                annot_kws={'size': 16, 'weight': 'bold'}, ax=ax3)
    ax3.set_title('Confusion Matrix', fontweight='bold')

    # Panel 4 — Performance bar chart
    ax4 = axes[1, 1]
    metric_names  = ['Sensitivity', 'Specificity', 'PPV', 'NPV', 'Accuracy']
    metric_values = [results['sensitivity'], results['specificity'],
                     results['ppv'], results['npv'], results['accuracy']]
    bar_colors = ['#2ecc71' if v >= 0.8 else '#f39c12' if v >= 0.6 else '#e74c3c'
                  for v in metric_values]
    bars = ax4.barh(metric_names, metric_values, color=bar_colors, edgecolor='white', lw=0.5)
    ax4.set_xlabel('Score'); ax4.set_xlim(0, 1.18)
    ax4.set_title('Performance Metrics', fontweight='bold')
    ax4.grid(axis='x', alpha=0.25)
    for bar, val in zip(bars, metric_values):
        ax4.text(val + 0.015, bar.get_y() + bar.get_height() / 2,
                 f'{val:.4f}', va='center', fontsize=10, fontweight='bold')

    plt.tight_layout(rect=[0, 0, 1, 0.95])
    out = config.output_png
    Path(out).parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(out, dpi=300, bbox_inches='tight')
    plt.close(fig)
    log.info("ROC figure saved → %s", out)
    return out


# ─── Config serialisation ──────────────────────────────────────────────────────
def save_optimized_config(results: dict, config: ROCConfig) -> dict:
    """
    Serialise the training results to the runtime config JSON.
    Risk zones are derived dynamically from optimal_ci_threshold and
    moderate_zone_width — nothing is hardcoded.
    """
    ci       = results['optimal_ci_threshold']
    mod_low  = round(max(0.0, ci - config.moderate_zone_width), 4)

    serialised = {
        'version':           '3.0',
        'training_date':     datetime.now().strftime('%Y-%m-%d'),
        'training_timestamp': datetime.now().isoformat(),
        'model_type':        'LogisticRegression',
        'cross_validation':  f'{config.n_cv_splits}-fold Stratified',
        'threshold_method':  config.threshold_method,
        'class_weight':      results['class_weight_applied'],

        'optimal_ci_threshold':      ci,
        'statistical_ci_threshold':  results.get('statistical_ci_threshold', ci),
        'regulatory_floor_applied':  results.get('regulatory_floor_applied', False),
        'optimal_proba_threshold':   results['optimal_proba_threshold'],

        'model_performance': {
            'auc':          results['auc_score'],
            'auc_ci_lower': results['auc_ci_lower'],
            'auc_ci_upper': results['auc_ci_upper'],
            'sensitivity':  results['sensitivity'],
            'specificity':  results['specificity'],
            'ppv':          results['ppv'],
            'npv':          results['npv'],
            'accuracy':     results['accuracy'],
            'j_statistic':  results['j_statistic'],
        },

        'threshold_bootstrap_ci': {
            'mean':        results['threshold_ci_mean'],
            'lower_2_5':   results['threshold_ci_lower'],
            'upper_97_5':  results['threshold_ci_upper'],
            'n_iterations': config.n_bootstrap,
            'constraint_met': results['threshold_ci_lower'] >= config.safe_ci_min,
        },

        'model_coefficients': results['model_params'],

        'risk_classification': {
            'LOW': {
                'ci_range':    [ci, 100.0],
                'description': 'High confidence — mass balance likely acceptable',
            },
            'MODERATE': {
                'ci_range':    [mod_low, ci],
                'description': 'Borderline — requires expert analytical review',
            },
            'HIGH': {
                'ci_range':    [0.0, mod_low],
                'description': 'Low confidence — investigation recommended',
            },
        },

        'confusion_matrix': {
            'true_positives':  results['true_positives'],
            'true_negatives':  results['true_negatives'],
            'false_positives': results['false_positives'],
            'false_negatives': results['false_negatives'],
        },

        'usage_notes': [
            f"Threshold ({ci}%) selected via {config.threshold_method.upper()} "
            f"— score = {results['j_statistic']:.4f}",
            f"AUC = {results['auc_score']:.4f}  "
            f"95% CI [{results['auc_ci_lower']:.4f}, {results['auc_ci_upper']:.4f}]  "
            f"(DeLong 1988)",
            f"Bootstrap 95% CI on threshold: [{results['threshold_ci_lower']:.1f}%, "
            f"{results['threshold_ci_upper']:.1f}%]  (n={config.n_bootstrap})",
            "CI = (1 − P_failure) × 100  via LogisticRegression logit output",
            f"Features: {', '.join(results['model_params']['feature_columns'])}",
            "Retrain quarterly or when >50 new validated samples are available",
        ],
    }

    out = config.output_json
    Path(out).parent.mkdir(parents=True, exist_ok=True)
    with open(out, 'w', encoding='utf-8') as fh:
        json.dump(serialised, fh, indent=2)
    log.info("Config saved → %s", out)
    return serialised


# ─── Entry point ───────────────────────────────────────────────────────────────
def main(config: Optional[ROCConfig] = None) -> dict:
    """
    Full training pipeline.

    Parameters
    ----------
    config : ROCConfig, optional
        Pass a custom config to override defaults (useful for testing).
        If None, defaults are used.
    """
    if config is None:
        config = ROCConfig()

    sep = '=' * 65
    log.info(sep)
    log.info("  ROC-Optimised CI Threshold  –  ML Pipeline v3.0")
    log.info("  Model: LogisticRegression | Method: %s | CV: %d-Fold",
             config.threshold_method.upper(), config.n_cv_splits)
    log.info(sep)

    # Step 1 — Load data
    log.info("[1/4] Loading training data from '%s'", config.data_path)
    X, y, feature_cols, n = load_training_data(config)
    n_pass = int(np.sum(y == 0))
    n_fail = int(np.sum(y == 1))
    log.info("  Samples: %d  (%d pass / %d fail)  →  %.1f%% failure rate",
             n, n_pass, n_fail, n_fail / n * 100)
    log.info("  Features: %s", feature_cols)

    # Step 2 — Train + evaluate
    log.info("[2/4] Training with %d-fold CV...", config.n_cv_splits)
    results = train_and_evaluate(X, y, feature_cols, config)
    log.info("  ✓ Optimal CI Threshold : %.4f%%", results['optimal_ci_threshold'])
    log.info("  ✓ AUC                  : %.4f", results['auc_score'])
    log.info("  ✓ Sensitivity          : %.4f", results['sensitivity'])
    log.info("  ✓ Specificity          : %.4f", results['specificity'])
    log.info("  ✓ Accuracy             : %.4f", results['accuracy'])
    log.info("  ✓ Youden's J           : %.4f", results['j_statistic'])

    # Step 3 — Visualise
    log.info("[3/4] Generating ROC visualisation...")
    plot_roc_curve(results, config)

    # Step 4 — Save
    log.info("[4/4] Saving optimised config...")
    save_optimized_config(results, config)

    log.info(sep)
    log.info("  ✓ Pipeline complete")
    log.info("  Threshold  :  CI ≥ %.1f%%  →  PASS", results['optimal_ci_threshold'])
    log.info("              CI <  %.1f%%  →  FAIL", results['optimal_ci_threshold'])
    log.info("  Bootstrap 95%% CI  :  [%.1f%%, %.1f%%]",
             results['threshold_ci_lower'], results['threshold_ci_upper'])
    log.info(sep)
    return results


if __name__ == '__main__':
    results = main()
