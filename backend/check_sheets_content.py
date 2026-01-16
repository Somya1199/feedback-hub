# check_sheets_content.py
import gspread
from google.oauth2.service_account import Credentials
import json

def check_sheets():
    try:
        # Load credentials
        scopes = ['https://www.googleapis.com/auth/spreadsheets']
        creds = Credentials.from_service_account_file('credentials.json', scopes=scopes)
        client = gspread.authorize(creds)
        
        print("Checking Questions Sheet...")
        print("="*60)
        
        # Check questions sheet
        questions_sheet_id = '1txqK-1XRi0mymZ60z56j86kq0OlfSJmijaS8hXWoe1o'
        questions_spreadsheet = client.open_by_key(questions_sheet_id)
        questions_ws = questions_spreadsheet.worksheet('Sheet1')
        
        questions_data = questions_ws.get_all_values()
        print(f"Questions sheet has {len(questions_data)} rows")
        print("\nFirst 15 rows of questions sheet:")
        for i, row in enumerate(questions_data[:15]):
            print(f"Row {i}: {row}")
        
        print("\n" + "="*60)
        print("Checking Responses Sheet...")
        print("="*60)
        
        # Check responses sheet
        responses_sheet_id = '1dqk53KFSpZXb62PsAz--UaPmN3MEq94NyyaLGFDO2uM'
        responses_spreadsheet = client.open_by_key(responses_sheet_id)
        responses_ws = responses_spreadsheet.worksheet('Sheet1')
        
        responses_data = responses_ws.get_all_values()
        print(f"Responses sheet has {len(responses_data)} rows")
        if responses_data:
            print("\nHeaders (first row):")
            print(responses_data[0])
            if len(responses_data) > 1:
                print("\nFirst data row:")
                print(responses_data[1])
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    check_sheets()