# test_all_endpoints.py
import requests
import json

BASE_URL = "http://localhost:5000"

def test_endpoint(endpoint):
    try:
        response = requests.get(f"{BASE_URL}{endpoint}")
        print(f"\n🔍 Testing {endpoint}:")
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   Success: {data.get('success', 'Not specified')}")
            
            if 'error' in data:
                print(f"   ❌ Error: {data['error']}")
            
            if 'data' in data:
                print(f"   Data count: {len(data['data']) if isinstance(data['data'], list) else 'Not a list'}")
            
            # Print first few items for debugging
            if 'data' in data and isinstance(data['data'], list) and data['data']:
                print(f"   First item: {json.dumps(data['data'][0], indent=2)[:200]}...")
        else:
            print(f"   Response: {response.text[:200]}")
            
    except Exception as e:
        print(f"   ❌ Exception: {e}")

def main():
    print("=" * 60)
    print("Testing All Backend Endpoints")
    print("=" * 60)
    
    # Test all endpoints
    endpoints = [
        '/api/health',
        '/api/questions',
        '/api/mapping-data',
        '/api/responses'
    ]
    
    for endpoint in endpoints:
        test_endpoint(endpoint)

if __name__ == '__main__':
    main()