import os
from dotenv import load_dotenv

print("=== Testing Credentials ===")
load_dotenv()

# Check if variable exists
creds = os.getenv('GOOGLE_CREDENTIALS_JSON')
print(f"1. GOOGLE_CREDENTIALS_JSON exists: {creds is not None}")
print(f"2. Length of credentials: {len(creds) if creds else 0} characters")

# Try to parse JSON
if creds:
    try:
        import json
        json.loads(creds)
        print("3. ✅ JSON is valid")
        print(f"4. Client email: {json.loads(creds).get('client_email', 'Not found')}")
    except Exception as e:
        print(f"3. ❌ JSON error: {e}")
else:
    print("3. No credentials found")

# Check other variables
print(f"\n5. Sheet IDs:")
print(f"   Mapping: {os.getenv('GOOGLE_SHEET_ID_MAPPING')}")
print(f"   Questions: {os.getenv('GOOGLE_SHEET_ID_QUESTIONS')}")
print(f"   Responses: {os.getenv('GOOGLE_SHEET_ID_RESPONSES')}")
