"""
ROC-Optimized Confidence Index Threshold Calculator
Uses scikit-learn to find optimal CI cutoff based on historical data
"""

import json
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import roc_curve, roc_auc_score, confusion_matrix, classification_report
from pathlib import Path

def load_training_data(filepath='ml_data/ci_training_data.json'):
    """Load historical mass balance data"""
    with open(filepath, 'r') as f:
        data = json.load(f)
    return data['data']

def optimize_ci_threshold(data):
    """
    Use ROC analysis to find optimal Confidence Index threshold
    
    Returns:
        dict: Optimal threshold and performance metrics
    """
    # Extract features
    y_true = np.array([1 if d['actual_failure'] else 0 for d in data])
    ci_scores = np.array([d['confidence_index'] for d in data])
    
    # Since CI is "confidence in passing", invert for failure prediction
    # Higher CI = less likely to fail, so we use (100 - CI) as failure score
    y_scores = 100 - ci_scores
    
    # Calculate ROC curve
    fpr, tpr, thresholds = roc_curve(y_true, y_scores)
    auc_score = roc_auc_score(y_true, y_scores)
    
    # Find optimal threshold (Youden's J statistic)
    j_scores = tpr - fpr
    optimal_idx = np.argmax(j_scores)
    optimal_threshold_inverted = thresholds[optimal_idx]
    
    # Convert back to CI threshold (remember we inverted)
    optimal_ci_threshold = 100 - optimal_threshold_inverted
    
    # Calculate metrics at optimal threshold
    y_pred = (ci_scores >= optimal_ci_threshold).astype(int)
    y_pred_inverted = 1 - y_pred  # Invert for failure prediction
    
    tn, fp, fn, tp = confusion_matrix(y_true, y_pred_inverted).ravel()
    
    sensitivity = tp / (tp + fn) if (tp + fn) > 0 else 0
    specificity = tn / (tn + fp) if (tn + fp) > 0 else 0
    ppv = tp / (tp + fp) if (tp + fp) > 0 else 0
    npv = tn / (tn + fn) if (tn + fn) > 0 else 0
    accuracy = (tp + tn) / (tp + tn + fp + fn)
    
    results = {
        'optimal_ci_threshold': round(optimal_ci_threshold, 1),
        'auc_score': round(auc_score, 4),
        'sensitivity': round(sensitivity, 4),
        'specificity': round(specificity, 4),
        'ppv': round(ppv, 4),
        'npv': round(npv, 4),
        'accuracy': round(accuracy, 4),
        'true_positives': int(tp),
        'true_negatives': int(tn),
        'false_positives': int(fp),
        'false_negatives': int(fn),
        'fpr': fpr.tolist(),
        'tpr': tpr.tolist(),
        'thresholds': (100 - thresholds).tolist(),  # Convert back to CI scale
        'j_statistic': round(j_scores[optimal_idx], 4)
    }
    
    return results

def plot_roc_curve(results, output_path='ml_data/roc_curve.png'):
    """Generate ROC curve visualization"""
    plt.figure(figsize=(10, 8))
    
    # Plot ROC curve
    plt.subplot(2, 2, 1)
    plt.plot(results['fpr'], results['tpr'], 'b-', linewidth=2, label=f"AUC = {results['auc_score']:.4f}")
    plt.plot([0, 1], [0, 1], 'r--', linewidth=1, label='Random Classifier')
    plt.xlabel('False Positive Rate', fontsize=12)
    plt.ylabel('True Positive Rate (Sensitivity)', fontsize=12)
    plt.title('ROC Curve for Confidence Index', fontsize=14, fontweight='bold')
    plt.legend(loc='lower right', fontsize=10)
    plt.grid(True, alpha=0.3)
    
    # Plot J statistic
    plt.subplot(2, 2, 2)
    j_scores = np.array(results['tpr']) - np.array(results['fpr'])
    plt.plot(results['thresholds'], j_scores, 'g-', linewidth=2)
    plt.axvline(results['optimal_ci_threshold'], color='r', linestyle='--', linewidth=2, 
                label=f"Optimal CI = {results['optimal_ci_threshold']:.1f}")
    plt.xlabel('Confidence Index Threshold', fontsize=12)
    plt.ylabel("Youden's J Statistic", fontsize=12)
    plt.title('Threshold Optimization', fontsize=14, fontweight='bold')
    plt.legend(loc='best', fontsize=10)
    plt.grid(True, alpha=0.3)
    
    # Confusion matrix
    plt.subplot(2, 2, 3)
    cm = np.array([[results['true_negatives'], results['false_positives']],
                   [results['false_negatives'], results['true_positives']]])
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', cbar=False,
                xticklabels=['Predict Pass', 'Predict Fail'],
                yticklabels=['Actual Pass', 'Actual Fail'],
                annot_kws={'size': 14, 'weight': 'bold'})
    plt.title('Confusion Matrix', fontsize=14, fontweight='bold')
    
    # Performance metrics
    plt.subplot(2, 2, 4)
    metrics = ['Sensitivity', 'Specificity', 'PPV', 'NPV', 'Accuracy']
    values = [results['sensitivity'], results['specificity'], results['ppv'], 
              results['npv'], results['accuracy']]
    colors = ['#2ecc71' if v >= 0.8 else '#f39c12' if v >= 0.6 else '#e74c3c' for v in values]
    
    bars = plt.barh(metrics, values, color=colors)
    plt.xlabel('Score', fontsize=12)
    plt.title('Performance Metrics', fontsize=14, fontweight='bold')
    plt.xlim(0, 1)
    plt.grid(axis='x', alpha=0.3)
    
    for i, (bar, value) in enumerate(zip(bars, values)):
        plt.text(value + 0.02, i, f'{value:.3f}', va='center', fontsize=10, fontweight='bold')
    
    plt.tight_layout()
    plt.savefig(output_path, dpi=300, bbox_inches='tight')
    print(f"ROC curve saved to {output_path}")
    
    return output_path

def save_optimized_config(results, output_path='ml_data/optimized_ci_config.json'):
    """Save optimized configuration for use in backend"""
    config = {
        'version': '1.0',
        'training_date': '2026-02-14',
        'optimal_ci_threshold': results['optimal_ci_threshold'],
        'model_performance': {
            'auc': results['auc_score'],
            'sensitivity': results['sensitivity'],
            'specificity': results['specificity'],
            'accuracy': results['accuracy']
        },
        'risk_classification': {
            'LOW': {
                'ci_range': [results['optimal_ci_threshold'], 100],
                'description': 'High confidence - Likely to pass mass balance'
            },
            'MODERATE': {
                'ci_range': [results['optimal_ci_threshold'] - 10, results['optimal_ci_threshold']],
                'description': 'Borderline - Requires expert review'
            },
            'HIGH': {
                'ci_range': [0, results['optimal_ci_threshold'] - 10],
                'description': 'Low confidence - Likely to fail mass balance'
            }
        },
        'usage_notes': [
            'This threshold maximizes Youden\'s J statistic (sensitivity + specificity - 1)',
            'Trained on validated historical mass balance data',
            'Review and update quarterly as more data becomes available'
        ]
    }
    
    with open(output_path, 'w') as f:
        json.dump(config, f, indent=2)
    
    print(f"Optimized config saved to {output_path}")
    return config

def main():
    """Main execution"""
    print("=" * 60)
    print("ROC-Optimized Confidence Index Threshold Calculator")
    print("=" * 60)
    
    # Load data
    print("\n[1/4] Loading training data...")
    data = load_training_data()
    print(f"Loaded {len(data)} samples")
    print(f"  - Pass: {sum(1 for d in data if not d['actual_failure'])}")
    print(f"  - Fail: {sum(1 for d in data if d['actual_failure'])}")
    
    # Optimize threshold
    print("\n[2/4] Running ROC analysis...")
    results = optimize_ci_threshold(data)
    print(f"Optimal CI Threshold: {results['optimal_ci_threshold']:.1f}")
    print(f"  - AUC Score: {results['auc_score']:.4f}")

    print(f"  - Sensitivity: {results['sensitivity']:.4f}")
    print(f"  - Specificity: {results['specificity']:.4f}")
    print(f"  - Accuracy: {results['accuracy']:.4f}")
    
    # Generate visualizations
    print("\n[3/4] Generating ROC curve visualization...")
    plot_path = plot_roc_curve(results)
    
    # Save configuration
    print("\n[4/4] Saving optimized configuration...")
    config = save_optimized_config(results)
    
    print("\n" + "=" * 60)
    print("ROC Optimization Complete!")
    print("=" * 60)
    print(f"\nRecommendation:")
    print(f"  Replace fixed CI thresholds with: {results['optimal_ci_threshold']:.1f}")
    print(f"  This maximizes diagnostic accuracy to {results['accuracy']*100:.1f}%")
    print(f"\nNext Steps:")
    print(f"  1. Review ROC curve: {plot_path}")
    print(f"  2. Update backend to use: ml_data/optimized_ci_config.json")
    print(f"  3. Retrain quarterly as new data accumulates")
    
    return results

if __name__ == '__main__':
    results = main()
