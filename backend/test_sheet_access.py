
import gspread
from google.oauth2.service_account import Credentials
import json
import os
from dotenv import load_dotenv

load_dotenv()

print("=== Testing Google Sheets Access ===")

# Get credentials
creds_json = os.getenv('GOOGLE_CREDENTIALS_JSON')
creds_dict = json.loads(creds_json)

print(f"1. Service account: {creds_dict['client_email']}")

# Create client
scopes = ['https://www.googleapis.com/auth/spreadsheets.readonly']
creds = Credentials.from_service_account_info(creds_dict, scopes=scopes)
client = gspread.authorize(creds)

print("2. ✅ Authentication successful")

# Test each sheet
sheets = {
    "responses": "1i0E018Pj_J5GpufMGSkrVQ-XPgCtGmeCRe3_g4sUni0",
    "questions": "1L2ODRKS-YGTwzW1v7fbNsOKnNesw3u9tz7UlH3qXnXg",
    "mapping": "16Uj5ZXaSi2EQwGPT3Rfy_HNhd3xRQ9fIVCZYzUmiRLw"
}

for name, sheet_id in sheets.items():
    try:
        print(f"\n3. Testing {name} sheet (ID: {sheet_id}):")
        sheet = client.open_by_key(sheet_id)
        worksheet = sheet.worksheet('Sheet1')
        data = worksheet.get_all_values()
        print(f"   ✅ ACCESS GRANTED! Found {len(data)} rows")
        if data:
            print(f"   First row headers: {data[0]}")
    except Exception as e:
        print(f"   ❌ ACCESS DENIED: {str(e)}")
        print(f"   🔗 Share this sheet with: {creds_dict['client_email']}")
