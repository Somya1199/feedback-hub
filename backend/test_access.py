# test_access.py
import os
import json
import gspread
from google.oauth2.service_account import Credentials
from dotenv import load_dotenv

load_dotenv()

def test_access():
    print("🔍 Testing Google Sheets access...")
    
    # Load credentials
    credentials_path = os.path.join(os.path.dirname(__file__), 'credentials.json')
    print(f"Credentials path: {credentials_path}")
    print(f"File exists: {os.path.exists(credentials_path)}")
    
    if not os.path.exists(credentials_path):
        print("❌ credentials.json not found!")
        return
    
    # Initialize client
    SCOPES = ['https://www.googleapis.com/auth/spreadsheets']
    creds = Credentials.from_service_account_file(credentials_path, scopes=SCOPES)
    client = gspread.authorize(creds)
    
    # Test each sheet
    sheet_ids = {
        'QUESTIONS': os.getenv('GOOGLE_SHEET_ID_QUESTIONS'),
        'MAPPING': os.getenv('GOOGLE_SHEET_ID_MAPPING'),
        'RESPONSES': os.getenv('GOOGLE_SHEET_ID_RESPONSES')
    }
    
    for name, sheet_id in sheet_ids.items():
        print(f"\n📊 Testing {name} sheet...")
        print(f"Sheet ID: {sheet_id}")
        
        if not sheet_id:
            print(f"❌ Sheet ID not set in .env for {name}")
            continue
        
        try:
            spreadsheet = client.open_by_key(sheet_id)
            print(f"✅ Successfully opened: {spreadsheet.title}")
            
            # List worksheets
            worksheets = spreadsheet.worksheets()
            print(f"   Worksheets ({len(worksheets)}):")
            for ws in worksheets:
                print(f"   - {ws.title} ({ws.row_count} rows × {ws.col_count} cols)")
                
                # Get first few rows if it's a small sheet
                if ws.row_count < 10:
                    values = ws.get_all_values()
                    print(f"     Sample data:")
                    for i, row in enumerate(values[:3]):
                        print(f"     Row {i}: {row}")
                        
        except Exception as e:
            print(f"❌ Error accessing {name} sheet: {e}")
            print(f"   Make sure the service account ({creds.service_account_email}) has access to this sheet!")

if __name__ == "__main__":
    test_access()