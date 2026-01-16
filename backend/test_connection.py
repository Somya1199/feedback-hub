# test_connection.py
import requests
import json

def test_backend():
    base_url = "http://localhost:5000"
    
    print("Testing backend connection...")
    
    # Test health endpoint
    print("\n1. Testing /api/health...")
    try:
        health_response = requests.get(f"{base_url}/api/health")
        print(f"   Status: {health_response.status_code}")
        print(f"   Response: {json.dumps(health_response.json(), indent=2)}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test questions endpoint
    print("\n2. Testing /api/questions...")
    try:
        questions_response = requests.get(f"{base_url}/api/questions")
        print(f"   Status: {questions_response.status_code}")
        if questions_response.status_code == 200:
            data = questions_response.json()
            print(f"   Success: {data.get('success')}")
            print(f"   Count: {data.get('count')}")
            if data.get('data'):
                print(f"   Sample questions:")
                for i, q in enumerate(data['data'][:3]):
                    print(f"     {i+1}. {q.get('question_text', 'No text')[:50]}...")
        else:
            print(f"   Error: {questions_response.text}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test mapping endpoint
    print("\n3. Testing /api/mapping-data...")
    try:
        mapping_response = requests.get(f"{base_url}/api/mapping-data")
        print(f"   Status: {mapping_response.status_code}")
        if mapping_response.status_code == 200:
            data = mapping_response.json()
            print(f"   Success: {data.get('success')}")
            print(f"   Count: {data.get('count')}")
            if data.get('data'):
                print(f"   Sample mapping:")
                for i, m in enumerate(data['data'][:2]):
                    print(f"     {i+1}. Email: {m.get('Email', 'No email')}")
        else:
            print(f"   Error: {mapping_response.text}")
    except Exception as e:
        print(f"   ❌ Error: {e}")

if __name__ == '__main__':
    test_backend()