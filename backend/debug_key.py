# debug_key.py
import os
import json
from dotenv import load_dotenv

load_dotenv()

creds_json = os.getenv('GOOGLE_CREDENTIALS_JSON')
if creds_json:
    print("Original private key from .env:")
    creds_dict = json.loads(creds_json)
    private_key = creds_dict.get('private_key', '')
    print(f"Length: {len(private_key)}")
    print(f"First 100 chars: {private_key[:100]}")
    print(f"Last 100 chars: {private_key[-100:]}")
    
    # Check for escaped newlines
    backslash_n = '\\n'
    print(f"Contains '\\n' (backslash-n): {backslash_n in private_key}")
    
    # Check for actual newlines
    newline_char = '\n'
    print(f"Contains actual newline: {newline_char in private_key}")
    
    # Count occurrences
    backslash_n_count = private_key.count(backslash_n)
    newline_count = private_key.count(newline_char)
    print(f"Number of '\\n' sequences: {backslash_n_count}")
    print(f"Number of actual newlines: {newline_count}")
    
    # Show what the key actually looks like
    print("\nRaw private key (with escape sequences visible):")
    # Replace newlines with [NEWLINE] for visibility
    display_key = private_key.replace('\n', '[NEWLINE]').replace('\\n', '[BACKSLASH-n]')
    print(display_key[:200] + "..." if len(display_key) > 200 else display_key)
    
    # Fix the newlines
    fixed_key = private_key.replace('\\n', '\n')
    print(f"\nFixed key length: {len(fixed_key)}")
    
    # Check if it looks like a valid key
    lines = fixed_key.split('\n')
    print(f"Number of lines after fix: {len(lines)}")
    
    if len(lines) > 1:
        print(f"First line: {lines[0]}")
        print(f"Last line: {lines[-1] if lines[-1] else lines[-2]}")
    
    if fixed_key.startswith('-----BEGIN PRIVATE KEY-----') and '-----END PRIVATE KEY-----' in fixed_key:
        print("\n✅ Key structure looks valid after fixing!")
    else:
        print("\n❌ Key doesn't look valid")
        print(f"Starts with BEGIN: {fixed_key.startswith('-----BEGIN PRIVATE KEY-----')}")
        print(f"Contains END: {'-----END PRIVATE KEY-----' in fixed_key}")
        
    # Try to parse as valid key
    try:
        from google.oauth2.service_account import Credentials
        scopes = ['https://www.googleapis.com/auth/spreadsheets']
        creds_dict['private_key'] = fixed_key
        test_creds = Credentials.from_service_account_info(creds_dict, scopes=scopes)
        print("\n✅ SUCCESS: Google can parse the fixed key!")
    except Exception as e:
        print(f"\n❌ FAILED: Google cannot parse the key: {e}")
        
else:
    print("GOOGLE_CREDENTIALS_JSON not found in .env file")