
import requests
import json
import time

BASE_URL = "http://localhost:5000/api"

def print_result(test_name, success, details=None):
    symbol = "✓" if success else "✗"
    print(f"{symbol} {test_name}")
    if details:
        print(f"  Details: {details}")

def test_bayesian_integration():
    # Use standard test data
    payload = {
        "initial_api": 100.0,
        "stressed_api": 90.0,
        "initial_degradants": 0.0,
        "stressed_degradants": 10.0, 
        "rrf": 1.0,
        "parent_mw": 500,
        "degradant_mw": 500,
        "stress_type": "Thermal",
        "sample_id": "TEST-BAYES-001"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/calculate", json=payload)
        if response.status_code == 200:
            data = response.json()
            
            # Check for bayesian results in 'results' object
            results = data.get("results", {})
            bayesian_methods = [k for k in results.keys() if k.endswith("_bayesian")]
            
            if bayesian_methods:
                print_result("Bayesian Analysis Triggered", True, f"Found results for: {', '.join(bayesian_methods)}")
                
                # Check structure of one result
                first_key = bayesian_methods[0]
                bayes_res = results[first_key]
                
                if "posterior_mean" in bayes_res and "credible_interval_95" in bayes_res:
                    print_result("Bayesian Result Structure", True, 
                                 f"Posterior Mean: {bayes_res['posterior_mean']:.2f}, CI: {bayes_res['credible_interval_95']}")
                else:    
                    print_result("Bayesian Result Structure", False, f"Missing critical fields in {first_key}")
                    print(json.dumps(bayes_res, indent=2))
            else:
                 print_result("Bayesian Analysis Triggered", False, "No keys ending in _bayesian found in results")
                 print(json.dumps(results, indent=2))
                 
            return True
        else:
            print_result("Calculate Request", False, f"Status: {response.status_code}, {response.text}")
            return False
    except Exception as e:
        print_result("Test Execution", False, str(e))
        return False

if __name__ == "__main__":
    print("--- Starting Bayesian Integration Verification ---\n")
    test_bayesian_integration()
    print("\n--- Verification Complete ---")
