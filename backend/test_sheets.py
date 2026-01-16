# test_sheets.py
import gspread
from google.oauth2.service_account import Credentials

def test_sheets():
    try:
        print("Testing Google Sheets connection with credentials.json...")
        
        # Load credentials
        scopes = ['https://www.googleapis.com/auth/spreadsheets']
        creds = Credentials.from_service_account_file('credentials.json', scopes=scopes)
        
        # Authorize
        client = gspread.authorize(creds)
        print("✅ Google Sheets authorization successful!")
        
        # Test each sheet
        sheet_ids = {
            'mapping': '17CWcNbX_vWBlZ94F0DIyCathXF4_EaPeUHAvm7yAlzA',
            'questions': '1txqK-1XRi0mymZ60z56j86kq0OlfSJmijaS8hXWoe1o',
            'responses': '1dqk53KFSpZXb62PsAz--UaPmN3MEq94NyyaLGFDO2uM'
        }
        
        for name, sheet_id in sheet_ids.items():
            try:
                print(f"\nTrying to open {name} sheet ({sheet_id})...")
                spreadsheet = client.open_by_key(sheet_id)
                print(f"✅ Success! Sheet title: {spreadsheet.title}")
                
                # Try to get the first worksheet
                worksheets = spreadsheet.worksheets()
                print(f"  Worksheets found: {len(worksheets)}")
                for i, ws in enumerate(worksheets[:3]):  # Show first 3
                    print(f"  {i+1}. {ws.title}")
                    
            except Exception as e:
                print(f"❌ Error opening {name} sheet: {e}")
        
        print("\n✅ All tests completed!")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")

if __name__ == '__main__':
    test_sheets()