# app.py
from flask import Flask, jsonify, request
from flask_cors import CORS
import os
from dotenv import load_dotenv
import gspread
from google.oauth2.service_account import Credentials
import json
import datetime
import traceback
from datetime import datetime as dt

load_dotenv()

app = Flask(__name__)
CORS(app)

# Global variables to track Google Sheets status
google_sheets_status = {
    'initialized': False,
    'client': None,
    'error': None
}

def get_google_sheets_client():
    """Initialize Google Sheets client with better error handling"""
    global google_sheets_status
    
    # If already initialized, return the client
    if google_sheets_status['initialized'] and google_sheets_status['client']:
        return google_sheets_status['client']
    
    try:
        print("=" * 60)
        print("Attempting to initialize Google Sheets client...")
        
        # Try credentials.json file FIRST
        if os.path.exists('credentials.json'):
            print("✅ Found credentials.json file")
            scopes = ['https://www.googleapis.com/auth/spreadsheets']
            creds = Credentials.from_service_account_file('credentials.json', scopes=scopes)
            client = gspread.authorize(creds)
            print("✅ Google Sheets client initialized from file!")
            google_sheets_status = {
                'initialized': True,
                'client': client,
                'error': None
            }
            return client
        
        # Try environment variable
        creds_json = os.getenv('GOOGLE_CREDENTIALS_JSON')
        if creds_json: 
            print("✅ Found GOOGLE_CREDENTIALS_JSON in environment")
            
            try:
                creds_dict = json.loads(creds_json)
                print(f"Service account email: {creds_dict.get('client_email', 'Not found')}")
                
                # Fix private key formatting
                if 'private_key' in creds_dict:
                    creds_dict['private_key'] = creds_dict['private_key'].replace('\\n', '\n')
                    print("✅ Fixed private key formatting")
                
                scopes = ['https://www.googleapis.com/auth/spreadsheets']
                creds = Credentials.from_service_account_info(creds_dict, scopes=scopes)
                client = gspread.authorize(creds)
                print("✅ Google Sheets client initialized from environment!")
                
                google_sheets_status = {
                    'initialized': True,
                    'client': client,
                    'error': None
                }
                return client
            except json.JSONDecodeError as e:
                error_msg = f"Invalid JSON in GOOGLE_CREDENTIALS_JSON: {e}"
                print(f"❌ {error_msg}")
                google_sheets_status['error'] = error_msg
                raise Exception(error_msg)
            
        raise Exception("No Google credentials found. Please check:")
            
    except Exception as e:
        error_msg = f"Failed to initialize Google Sheets client: {str(e)}"
        print(f"❌ {error_msg}")
        print(traceback.format_exc())
        
        google_sheets_status = {
            'initialized': False,
            'client': None,
            'error': error_msg
        }
        raise

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        # Test Google Sheets connection
        sheets_status = "Not initialized"
        if google_sheets_status['initialized']:
            sheets_status = "Connected"
        elif google_sheets_status['error']:
            sheets_status = f"Error: {google_sheets_status['error']}"
        
        return jsonify({
            'status': 'healthy',
            'service': 'Feedback Hub Backend',
            'timestamp': dt.now().isoformat(),
            'port': os.getenv('PORT', 5000),
            'google_sheets': sheets_status,
            'environment': os.getenv('FLASK_ENV', 'development')
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

@app.route('/api/test-sheets', methods=['GET'])
def test_sheets():
    """Test Google Sheets connection"""
    try:
        client = get_google_sheets_client()
        
        # Try to list spreadsheets to test connection
        # This requires the spreadsheet to be shared with the service account
        spreadsheet_id = os.getenv('GOOGLE_SHEET_ID_RESPONSES')
        if not spreadsheet_id:
            return jsonify({
                'success': False,
                'error': 'GOOGLE_SHEET_ID_RESPONSES not set in environment'
            }), 400
        
        sheet = client.open_by_key(spreadsheet_id)
        sheet_title = sheet.title
        
        return jsonify({
            'success': True,
            'message': 'Google Sheets connection successful',
            'sheet_title': sheet_title,
            'spreadsheet_id': spreadsheet_id,
            'service_account': sheet.client.auth.service_account_email
        })
        
    except Exception as e:
        print(f"❌ Sheets test error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc() if os.getenv('FLASK_ENV') == 'development' else None
        }), 500

# FIXED QUESTIONS ENDPOINT
@app.route('/api/questions', methods=['GET'])
def get_questions():
    """Get survey questions - FIXED VERSION"""
    try:
        print("\n=== Fetching Questions ===")
        
        sheet_id = os.getenv('GOOGLE_SHEET_ID_QUESTIONS')
        if not sheet_id:
            return jsonify({
                'success': False,
                'error': 'GOOGLE_SHEET_ID_QUESTIONS not configured'
            }), 400
        
        sheet_name = os.getenv('QUESTIONS_SHEET_NAME', 'Sheet1')
        
        print(f"Opening questions sheet: {sheet_id}, sheet: {sheet_name}")
        client = get_google_sheets_client()
        spreadsheet = client.open_by_key(sheet_id)
        sheet = spreadsheet.worksheet(sheet_name)
        
        print("✅ Successfully opened questions sheet")
        
        # Get all data from the sheet
        all_data = sheet.get_all_values()
        print(f"Found {len(all_data)} rows in questions sheet")
        
        if not all_data or len(all_data) < 2:
            print("⚠️ No data or insufficient rows in questions sheet")
            return jsonify({
                'success': True,
                'data': [],
                'count': 0,
                'message': 'No questions found in sheet'
            })
        
        # Debug: Print first few rows
        print("First 5 rows of questions sheet:")
        for i, row in enumerate(all_data[:5]):
            print(f"  Row {i}: {row}")
        
        questions_list = []
        current_category = "General"
        
        for row in all_data:
            if not row or len(row) == 0:
                continue
                
            first_cell = row[0] if len(row) > 0 else ''
            
            if not first_cell or not isinstance(first_cell, str):
                continue
                
            text = first_cell.strip()
            
            if not text:
                continue
            
            # Check if this is a topic header
            if text.lower().startswith('topic:'):
                current_category = text.replace('Topic:', '').replace('topic:', '').strip()
                print(f"  Found category: {current_category}")
                continue
            
            # Skip rating options
            if text.lower() in ['strongly disagree', 'disagree', 'neutral', 'agree', 'strongly agree']:
                continue
            
            # Skip section headers and demographic questions
            skip_keywords = [
                'about you', 'overall experience', 'your role', 
                'overall rating', 'gender', 'tenure', 'designation', 
                'level', 'age', 'section', 'instructions'
            ]
            
            if any(keyword in text.lower() for keyword in skip_keywords):
                print(f"  Skipping header: {text[:50]}...")
                continue
            
            # Check if this is likely a question
            if len(text) > 10 and not text.lower().startswith('topic:'):
                question_id = f'q{len(questions_list) + 1}'
                print(f"  Found question {question_id}: {text[:50]}...")
                
                questions_list.append({
                    'question_id': question_id,
                    'question_text': text,
                    'question_type': 'rating',
                    'options': ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
                    'category': current_category,
                    'required': True
                })
        
        print(f"✅ Transformed {len(questions_list)} questions")
        
        if questions_list:
            print("Sample questions:")
            for i, q in enumerate(questions_list[:3]):
                print(f"  {i+1}. [{q['category']}] {q['question_text'][:50]}...")
        
        return jsonify({
            'success': True,
            'data': questions_list,
            'count': len(questions_list),
            'categories': list(set([q['category'] for q in questions_list]))
        })
        
    except Exception as e:
        print(f"❌ Error in get_questions: {str(e)}")
        print(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc() if os.getenv('FLASK_ENV') == 'development' else None
        }), 500

# FIXED MAPPING ENDPOINT
@app.route('/api/mapping-data', methods=['GET'])
def get_mapping_data():
    """Get management mapping data - FIXED VERSION"""
    try:
        print("\n=== Fetching Mapping Data ===")
        
        sheet_id = os.getenv('GOOGLE_SHEET_ID_MAPPING')
        if not sheet_id:
            return jsonify({
                'success': False,
                'error': 'GOOGLE_SHEET_ID_MAPPING not configured'
            }), 400
        
        sheet_name = os.getenv('MAPPING_SHEET_NAME', 'Sheet1')
        user_email = request.args.get('email', '').strip().lower()
        
        print(f"Opening mapping sheet: {sheet_id}, sheet: {sheet_name}")
        print(f"Filter by user email: {user_email if user_email else 'All users'}")
        
        client = get_google_sheets_client()
        spreadsheet = client.open_by_key(sheet_id)
        sheet = spreadsheet.worksheet(sheet_name)
        
        print("✅ Successfully opened mapping sheet")
        
        # Get all data
        all_data = sheet.get_all_values()
        print(f"Found {len(all_data)} rows in mapping sheet")
        
        if not all_data or len(all_data) < 2:
            print("⚠️ No data or insufficient rows in mapping sheet")
            return jsonify({
                'success': True,
                'data': [],
                'count': 0
            })
        
        # Get headers from first row
        headers = [str(h).strip() for h in all_data[0]]
        print(f"Headers: {headers}")
        
        # Convert rows to dictionaries
        mapping_data = []
        for i, row in enumerate(all_data[1:], start=1):
            row_dict = {}
            for j, header in enumerate(headers):
                if j < len(row):
                    row_dict[header] = str(row[j]).strip()
                else:
                    row_dict[header] = ''
            
            # Only add rows that have at least some data
            if any(row_dict.values()):
                mapping_data.append(row_dict)
        
        # Filter by user email if provided
        filtered_data = []
        if user_email:
            for item in mapping_data:
                item_email = item.get('Email', '').strip().lower()
                if item_email == user_email:
                    filtered_data.append(item)
            print(f"Filtered to {len(filtered_data)} rows for user: {user_email}")
        else:
            filtered_data = mapping_data
        
        print(f"✅ Returning {len(filtered_data)} mapping entries")
        
        if filtered_data and len(filtered_data) > 0:
            print("Sample mapping data:")
            for i, item in enumerate(filtered_data[:3]):
                print(f"  {i+1}. Email: {item.get('Email', 'N/A')}, Process: {item.get('Process', 'N/A')}")
        
        return jsonify({
            'success': True,
            'data': filtered_data,
            'count': len(filtered_data),
            'user_email': user_email
        })
        
    except Exception as e:
        print(f"❌ Error in get_mapping_data: {str(e)}")
        print(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc() if os.getenv('FLASK_ENV') == 'development' else None
        }), 500

# FIXED RESPONSES ENDPOINT (for admin dashboard)
@app.route('/api/responses', methods=['GET'])
def get_responses():
    """Get all feedback responses - FIXED VERSION"""
    try:
        print("\n=== Fetching Responses ===")
        
        sheet_id = os.getenv('GOOGLE_SHEET_ID_RESPONSES')
        if not sheet_id:
            return jsonify({
                'success': False,
                'error': 'GOOGLE_SHEET_ID_RESPONSES not configured'
            }), 400
        
        sheet_name = os.getenv('RESPONSES_SHEET_NAME', 'Sheet1')
        
        print(f"Opening responses sheet: {sheet_id}, sheet: {sheet_name}")
        client = get_google_sheets_client()
        spreadsheet = client.open_by_key(sheet_id)
        sheet = spreadsheet.worksheet(sheet_name)
        
        print("✅ Successfully opened responses sheet")
        
        # Get all data
        all_data = sheet.get_all_values()
        print(f"Found {len(all_data)} rows in responses sheet")
        
        if not all_data:
            return jsonify({
                'success': True,
                'data': [],
                'total': 0
            })
        
        # Get headers from first row
        headers = [str(h).strip() for h in all_data[0]]
        
        # Convert rows to dictionaries (skip header row)
        responses_data = []
        for i, row in enumerate(all_data[1:], start=1):
            row_dict = {}
            for j, header in enumerate(headers):
                if j < len(row):
                    row_dict[header] = str(row[j]).strip()
                else:
                    row_dict[header] = ''
            
            # Only add rows that have at least some data
            if any(value for value in row_dict.values() if value):
                responses_data.append(row_dict)
        
        print(f"✅ Returning {len(responses_data)} responses")
        
        if responses_data and len(responses_data) > 0:
            print("Sample responses:")
            for i, resp in enumerate(responses_data[:2]):
                print(f"  Response {i+1}: {resp.get('Timestamp', 'No timestamp')} - {resp.get('Management Email ID', 'No email')}")
        
        return jsonify({
            'success': True,
            'data': responses_data,
            'total': len(responses_data)
        })
        
    except Exception as e:
        print(f"❌ Error in get_responses: {str(e)}")
        print(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc() if os.getenv('FLASK_ENV') == 'development' else None
        }), 500

# FIXED SUBMIT FEEDBACK ENDPOINT
@app.route('/api/submit-feedback', methods=['POST'])
def submit_feedback():
    """Submit new feedback - FIXED VERSION"""
    try:
        data = request.json
        print(f"\n📤 Received feedback submission: {len(data)} fields")
        print("First 5 fields:", list(data.keys())[:5])
        
        # Check required fields
        required_fields = ['Management Email ID', 'Role Reviewed', 'Process']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({
                'success': False,
                'error': f'Missing required fields: {", ".join(missing_fields)}'
            }), 400
        
        sheet_id = os.getenv('GOOGLE_SHEET_ID_RESPONSES')
        if not sheet_id:
            return jsonify({
                'success': False,
                'error': 'GOOGLE_SHEET_ID_RESPONSES not configured'
            }), 500
        
        sheet_name = os.getenv('RESPONSES_SHEET_NAME', 'Sheet1')
        
        print(f"Opening spreadsheet: {sheet_id}, sheet: {sheet_name}")
        client = get_google_sheets_client()
        spreadsheet = client.open_by_key(sheet_id)
        sheet = spreadsheet.worksheet(sheet_name)
        
        print("✅ Successfully opened sheet")
        
        # Get headers
        headers = sheet.row_values(1)
        print(f"Found {len(headers)} headers in sheet")
        
        # Prepare row data matching headers
        row_data = []
        for header in headers:
            header_lower = header.strip().lower()
            
            # Handle special cases
            if any(time_key in header_lower for time_key in ['timestamp', 'date', 'time']):
                row_data.append(dt.now().isoformat())
            elif header in data:
                value = data[header]
                # Ensure value is a string
                row_data.append(str(value) if value is not None else '')
            else:
                row_data.append('')
        
        print(f"Prepared row with {len(row_data)} columns")
        
        # Append the row
        print("Appending row to sheet...")
        sheet.append_row(row_data)
        print("✅ Row appended successfully!")
        
        return jsonify({
            'success': True,
            'message': 'Feedback submitted successfully',
            'timestamp': dt.now().isoformat(),
            'fields_submitted': len(data)
        })
        
    except gspread.exceptions.APIError as e:
        error_msg = f"Google Sheets API Error: {e.response.json()['error']['message']}"
        print(f"❌ {error_msg}")
        return jsonify({
            'success': False,
            'error': error_msg,
            'type': 'google_api_error',
            'details': e.response.json() if hasattr(e, 'response') else str(e)
        }), 500
        
    except Exception as e:
        error_msg = f"Error in submit_feedback: {str(e)}"
        print(f"❌ {error_msg}")
        print(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': error_msg,
            'traceback': traceback.format_exc() if os.getenv('FLASK_ENV') == 'development' else None
        }), 500

# Add endpoint for frontend API compatibility
@app.route('/api/survey-questions', methods=['GET'])
def survey_questions():
    """Alias for /api/questions for frontend compatibility"""
    return get_questions()

@app.route('/api/management-mapping', methods=['GET'])
def management_mapping():
    """Alias for /api/mapping-data for frontend compatibility"""
    return get_mapping_data()

@app.route('/api/feedback-responses', methods=['GET'])
def feedback_responses():
    """Alias for /api/responses for frontend compatibility"""
    return get_responses()

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    
    print("=" * 60)
    print("🚀 Starting Feedback Hub Backend")
    print("=" * 60)
    print(f"📡 Health check: http://localhost:{port}/api/health")
    print(f"🧪 Sheets test: http://localhost:{port}/api/test-sheets")
    print(f"❓ Questions: http://localhost:{port}/api/questions")
    print(f"❓ Questions (alias): http://localhost:{port}/api/survey-questions")
    print(f"👥 Mapping: http://localhost:{port}/api/mapping-data")
    print(f"👥 Mapping (alias): http://localhost:{port}/api/management-mapping")
    print(f"📊 Responses: http://localhost:{port}/api/responses")
    print(f"📊 Responses (alias): http://localhost:{port}/api/feedback-responses")
    print("=" * 60)
    
    try:
        # Test Google Sheets connection on startup
        client = get_google_sheets_client()
        print("✅ Google Sheets connection test passed!")
        
        # Test opening a sheet
        sheet_id = os.getenv('GOOGLE_SHEET_ID_RESPONSES')
        if sheet_id:
            spreadsheet = client.open_by_key(sheet_id)
            print(f"✅ Can access responses spreadsheet: {spreadsheet.title}")
    except Exception as e:
        print(f"⚠️ Google Sheets connection test failed: {e}")
        print("The server will start, but Google Sheets features may not work.")
        print("Please check:")
        print("1. credentials.json file exists OR GOOGLE_CREDENTIALS_JSON is set")
        print("2. Google Sheets API is enabled")
        print("3. Service account has access to the spreadsheet")
    
    app.run(debug=True, host='0.0.0.0', port=port)