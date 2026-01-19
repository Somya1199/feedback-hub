# test_submit.py
import requests
import json

def test_submit_feedback():
    url = "http://localhost:5000/api/submit-feedback"
    
    # Sample feedback data (simplified)
    test_data = {
        'Timestamp': '2024-01-19T04:22:40.123Z',
        'Encrypted Submitter ID': 'test_user_123',
        'Role Reviewed': 'Manager',
        'Process': 'Engineering',
        'Management Email ID': 'manager@company.com',
        'Additional Comments': 'Test comment',
        'My manager provides clear direction': 4,
        'I feel comfortable approaching my manager': 5
    }
    
    print("Testing submit-feedback endpoint...")
    print(f"URL: {url}")
    print(f"Data keys: {list(test_data.keys())}")
    
    try:
        response = requests.post(
            url,
            json=test_data,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        
        print(f"\nStatus Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                print(f"\nParsed JSON: {json.dumps(data, indent=2)}")
            except:
                print("Could not parse JSON response")
        
    except Exception as e:
        print(f"\nRequest failed: {e}")

if __name__ == "__main__":
    test_submit_feedback()