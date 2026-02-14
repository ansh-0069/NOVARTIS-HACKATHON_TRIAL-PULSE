
import requests
import json
import time

BASE_URL = "http://localhost:5000/api"

def print_result(test_name, success, details=None):
    symbol = "✓" if success else "✗"
    print(f"{symbol} {test_name}")
    if details:
        print(f"  Details: {details}")

def test_ml_anomaly():
    # Anomalous data: High degradation, very low mass balance
    payload = {
        "initial_api": 100.0,
        "stressed_api": 70.0,
        "initial_degradants": 0.0,
        "stressed_degradants": 5.0, # Missing 25% of mass
        "rrf": 1.0,
        "parent_mw": 500,
        "degradant_mw": 250,
        "stress_type": "Thermal",
        "sample_id": "TEST-ANOMALY-001"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/calculate", json=payload)
        if response.status_code == 200:
            data = response.json()
            
            # Check for ml_prediction field
            if "ml_prediction" in data and data["ml_prediction"]:
                pred = data["ml_prediction"]
                print_result("ML Prediction Field", True, f"Score: {pred['anomaly_score']:.2f}, Anomaly: {pred['is_anomaly']}")
                
                if pred['is_anomaly']:
                    print_result("Detects Anomaly", True, "Successfully returned is_anomaly=True")
                else:
                    print_result("Detects Anomaly", False, "Expected is_anomaly=True but got False")
            else:
                 print_result("ML Prediction Field", False, "Missing ml_prediction in response")
                 print(json.dumps(data, indent=2))
                 
            return True
        else:
            print_result("Calculate Request", False, f"Status: {response.status_code}, {response.text}")
            return False
    except Exception as e:
        print_result("Test Execution", False, str(e))
        return False

if __name__ == "__main__":
    print("--- Starting ML Anomaly Verification ---\n")
    test_ml_anomaly()
    print("\n--- Verification Complete ---")
