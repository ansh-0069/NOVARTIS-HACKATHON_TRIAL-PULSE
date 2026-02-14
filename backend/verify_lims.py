
import requests
import json
import time

BASE_URL = "http://localhost:5000/api"

def print_result(test_name, success, details=None):
    symbol = "✓" if success else "✗"
    print(f"{symbol} {test_name}")
    if details:
        print(f"  Details: {details}")

def test_list_systems():
    try:
        response = requests.get(f"{BASE_URL}/lims/systems")
        if response.status_code == 200:
            data = response.json()
            systems = data.get("systems", [])
            print_result("List LIMS Systems", True, f"Found {len(systems)} systems: {', '.join([s['name'] for s in systems])}")
            return systems
        else:
            print_result("List LIMS Systems", False, f"Status: {response.status_code}, {response.text}")
            return []
    except Exception as e:
        print_result("List LIMS Systems", False, str(e))
        return []

def test_initialize(system_name):
    try:
        payload = {
            "system_name": system_name,
            "config": {
                "base_url": "http://mock-lims.com",
                "api_key": "test_key",
                "username": "test_user",
                "password": "test_password"
            }
        }
        response = requests.post(f"{BASE_URL}/lims/initialize", json=payload)
        if response.status_code == 200:
            data = response.json()
            print_result(f"Initialize {system_name}", True, data.get("message"))
            return True
        else:
            print_result(f"Initialize {system_name}", False, f"Status: {response.status_code}, {response.text}")
            return False
    except Exception as e:
        print_result(f"Initialize {system_name}", False, str(e))
        return False

def test_status():
    try:
        response = requests.get(f"{BASE_URL}/lims/status")
        if response.status_code == 200:
            data = response.json()
            print_result("Get LIMS Status", True, json.dumps(data.get("status"), indent=2))
        else:
            print_result("Get LIMS Status", False, f"Status: {response.status_code}")
    except Exception as e:
        print_result("Get LIMS Status", False, str(e))

def main():
    print("--- Starting LIMS Verification ---\n")
    
    systems = test_list_systems()
    
    if not systems:
        print("No systems found to test.")
        return

    # Pick the first supported system
    target_system = next((s for s in systems if s.get('supported')), None)
    
    if target_system:
        system_id = target_system['id']
        test_initialize(system_id)
        test_status()
    else:
        print("No supported systems found.")
        
    print("\n--- Verification Complete ---")

if __name__ == "__main__":
    main()
