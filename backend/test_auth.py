import os
import json
from google.oauth2.service_account import Credentials
from dotenv import load_dotenv

load_dotenv()

def test_credentials():
    """Test if Google credentials are working"""
    print("Testing Google credentials...")
    
    # Test 1: Check if env var exists
    creds_json = os.getenv('GOOGLE_CREDENTIALS_JSON')
    print(f"1. GOOGLE_CREDENTIALS_JSON exists: {bool(creds_json)}")
    
    if creds_json:
        try:
            creds_dict = json.loads(creds_json)
            print(f"2. JSON parsing successful: {bool(creds_dict)}")
            print(f"3. Has client_email: {creds_dict.get('client_email', 'Not found')}")
            print(f"4. Has private_key: {bool(creds_dict.get('private_key', ''))}")
        except Exception as e:
            print(f"2. JSON parsing failed: {e}")
    
    # Test 2: Check for credentials.json file
    if os.path.exists('credentials.json'):
        print("5. credentials.json file exists")
        with open('credentials.json', 'r') as f:
            content = f.read()
            print(f"6. File size: {len(content)} bytes")
    
    print("\nEnvironment variables:")
    for key in os.environ:
        if 'GOOGLE' in key or 'SHEET' in key:
            value = os.environ[key]
            masked = '***' if 'KEY' in key or 'PRIVATE' in key else value[:50]
            print(f"  {key}: {masked}")

if __name__ == '__main__':
    test_credentials()