import json
import os
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, 'ml_data', 'anomaly_training_data.json')
MODEL_DIR = os.path.join(BASE_DIR, 'ml_models')

# Ensure model directory exists
if not os.path.exists(MODEL_DIR):
    os.makedirs(MODEL_DIR)

def train_models():
    print("Loading training data...")
    try:
        with open(DATA_PATH, 'r') as f:
            data = json.load(f)
            df = pd.DataFrame(data)
    except FileNotFoundError:
        print(f"Error: Training data not found at {DATA_PATH}")
        return

    # Features
    features = ['mass_balance', 'degradation', 'recovery', 'purity']
    X = df[features]
    y = df['is_anomaly']

    print(f"Training on {len(df)} samples...")

    # 1. Isolation Forest (Unsupervised Anomaly Detection)
    # Contamination is expected proportion of outliers
    iso_forest = IsolationForest(contamination=0.1, random_state=42)
    iso_forest.fit(X)
    
    # Save Isolation Forest
    iso_path = os.path.join(MODEL_DIR, 'isolation_forest.joblib')
    joblib.dump(iso_forest, iso_path)
    print(f"✓ Isolation Forest saved to {iso_path}")

    # 2. Random Forest Classifier (Supervised)
    # Only if we have labeled data (which we do)
    if 'is_anomaly' in df.columns:
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        rf_classifier = RandomForestClassifier(n_estimators=100, random_state=42)
        rf_classifier.fit(X_train, y_train)
        
        # Evaluate
        y_pred = rf_classifier.predict(X_test)
        print("\nRandom Forest Performance:")
        print(classification_report(y_test, y_pred))
        
        # Save Random Forest
        rf_path = os.path.join(MODEL_DIR, 'random_forest.joblib')
        joblib.dump(rf_classifier, rf_path)
        print(f"✓ Random Forest saved to {rf_path}")

        # Feature Importance
        importances = rf_classifier.feature_importances_
        feature_importance = dict(zip(features, importances))
        print("\nFeature Importance:")
        for feature, importance in feature_importance.items():
            print(f"  {feature}: {importance:.4f}")
            
        # Save feature names for inference
        features_path = os.path.join(MODEL_DIR, 'model_features.json')
        with open(features_path, 'w') as f:
            json.dump(features, f)

if __name__ == "__main__":
    train_models()
