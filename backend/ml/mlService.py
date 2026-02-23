
import sys
import json
import os
import joblib
import pandas as pd
import numpy as np

# Suppress sklearn warnings
import warnings
warnings.filterwarnings("ignore")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR = os.path.join(BASE_DIR, 'ml_models')

def load_models():
    try:
        iso_forest = joblib.load(os.path.join(MODEL_DIR, 'isolation_forest.joblib'))
        rf_classifier = joblib.load(os.path.join(MODEL_DIR, 'random_forest.joblib'))
        return iso_forest, rf_classifier
    except Exception as e:
        return None, None

def predict(input_data):
    iso_forest, rf_classifier = load_models()
    
    if not iso_forest:
        return {"error": "ML models not found. Please train models first."}

    # Prepare features
    features = ['mass_balance', 'degradation', 'recovery', 'purity']
    
    # Check if input has all features
    for f in features:
        if f not in input_data:
            return {"error": f"Missing feature: {f}"}
            
    X = pd.DataFrame([input_data])[features]
    
    # 1. Anomaly Score (Isolation Forest)
    # decision_function returns negative values for outliers, positive for inliers
    # We want anomaly score: lower is more anomalous
    anomaly_score = iso_forest.decision_function(X)[0]
    
    # Convert to probability-like score (0-100)
    # Roughly scale: -0.5 (bad) to 0.5 (good)
    # We want 100 = highly anomalous, 0 = normal
    # decision_function: positive (normal), negative (anomaly)
    # So invert: lower score -> higher probability of anomaly
    
    # Normalize roughly based on typical IF output range
    is_anomaly = iso_forest.predict(X)[0] # -1 for anomaly, 1 for normal
    
    # 2. Failure Prediction (Random Forest)
    if rf_classifier:
        rf_prob = rf_classifier.predict_proba(X)[0]
        # Assuming class 1 is "anomaly/failure"
        failure_prob = rf_prob[1] * 100
        
        # Feature importance Contribution (local interpretability using simple mult)
        importances = rf_classifier.feature_importances_
        feature_impact = {}
        for idx, feat in enumerate(features):
            feature_impact[feat] = float(importances[idx] * X.iloc[0, idx])
            
        top_factors = sorted(feature_impact.items(), key=lambda x: x[1], reverse=True)[:2]
    else:
        failure_prob = 0
        top_factors = []

    # Combine metrics
    result = {
        "is_anomaly": bool(is_anomaly == -1),
        "anomaly_score": float(anomaly_score),
        "failure_probability": float(failure_prob),
        "risk_level": "HIGH" if failure_prob > 70 else "MODERATE" if failure_prob > 30 else "LOW",
        "top_factors": [f[0] for f in top_factors],
        "model_version": "v1.0"
    }
    
    return result

if __name__ == "__main__":
    try:
        # Read input from stdin
        input_str = sys.stdin.read()
        if not input_str:
            print(json.dumps({"error": "No input provided"}))
            sys.exit(1)
            
        input_data = json.loads(input_str)
        result = predict(input_data)
        print(json.dumps(result))
        sys.stdout.flush()
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.stdout.flush()
        sys.exit(1)
