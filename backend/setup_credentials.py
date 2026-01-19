# setup_credentials.py
import os
import json

def check_credentials():
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    
    print("📁 Checking backend directory:", backend_dir)
    print("\n🔍 Looking for credential files...")
    
    files = os.listdir(backend_dir)
    credential_files = [f for f in files if 'json' in f.lower() and ('credential' in f.lower() or 'service' in f.lower())]
    
    if credential_files:
        print("✅ Found credential files:")
        for file in credential_files:
            file_path = os.path.join(backend_dir, file)
            print(f"   - {file}")
            try:
                with open(file_path, 'r') as f:
                    data = json.load(f)
                    if 'client_email' in data:
                        print(f"     Service Account Email: {data['client_email']}")
            except:
                print(f"     Could not read JSON")
    else:
        print("❌ No credential JSON files found.")
        print("\n📝 To fix this, you need to:")
        print("1. Create a service account in Google Cloud Console")
        print("2. Download the JSON key file")
        print("3. Place it in the backend directory")
        print("4. Rename it to 'service_account.json' or 'credentials.json'")
    
    # Check .env file
    env_path = os.path.join(backend_dir, '.env')
    if os.path.exists(env_path):
        print("\n✅ Found .env file")
        with open(env_path, 'r') as f:
            print(f.read())
    else:
        print("\n❌ No .env file found")
        print("   Create a .env file with: GOOGLE_SHEETS_ID=your-sheet-id")

if __name__ == "__main__":
    check_credentials()