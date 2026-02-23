import requests
import json
import sys

BASE_URL = "http://localhost:5000/api"

def test_endpoint(name, url, method="GET", data=None):
    try:
        if method == "GET":
            response = requests.get(url)
        else:
            response = requests.post(url, json=data)
        
        response.raise_for_status()
        print(f"✅ {name}: SUCCESS ({response.status_code})")
        return True
    except Exception as e:
        print(f"❌ {name}: FAILED - {str(e)}")
        if hasattr(e, 'response') and e.response:
            print(f"   Response: {e.response.text}")
        return False

print("running verification tests...")

# 1. Test Regulatory Matrix
test_endpoint("Regulatory Matrix", f"{BASE_URL}/regulatory/matrix")

# 2. Test ROC Config
test_endpoint("ROC Config", f"{BASE_URL}/roc/config")

# 3. Test Calculation with Hybrid Detection
hybrid_payload = {
    "initial_api": 99.5,
    "stressed_api": 85.0,
    "initial_degradants": 0.2,
    "stressed_degradants": 12.3,
    "degradant_mw": 200,
    "parent_mw": 400,
    "stress_type": "Acid",
    "detection_method": "UV+ELSD",
    "uv_rrf": 1.0,
    "elsd_rrf": 1.5,
    "ms_intensity": 500000,
    "gc_ms_detected": False
}
test_endpoint("Hybrid Calculation", f"{BASE_URL}/calculate", "POST", hybrid_payload)

# 4. Test Excel Generation (should return binary)
excel_payload = hybrid_payload.copy()
excel_payload["sample_id"] = "TEST-001"
# Excel generation might fail if file handles interfere, but let's try
# Just check status code
try:
    resp = requests.post(f"{BASE_URL}/excel/generate", json=excel_payload)
    if resp.status_code == 200 and len(resp.content) > 0:
        print(f"✅ Excel Generation: SUCCESS ({len(resp.content)} bytes)")
    else:
        print(f"❌ Excel Generation: FAILED (Status {resp.status_code})")
except Exception as e:
    print(f"❌ Excel Generation: FAILED - {str(e)}")

print("\nVerification Complete.")
