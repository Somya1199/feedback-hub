#!/bin/bash
echo "=== Fixing Python Environment ==="

# Check current setup
echo "1. Python version: $(python3 --version 2>/dev/null || echo 'Not found')"
echo "2. Current directory: $(pwd)"

# Recreate virtual environment
echo "3. Recreating virtual environment..."
deactivate 2>/dev/null || true
rm -rf venv
python3 -m venv venv
source venv/bin/activate

# Install packages
echo "4. Installing dependencies..."
pip install flask==2.3.3 flask-cors==4.0.0 --quiet
pip install gspread==5.11.3 google-auth==2.22.0 --quiet
pip install pandas==2.0.3 python-dotenv==1.0.0 --quiet

# Verify
echo "5. Verifying installation..."
python3 -c "
import flask
print(f'✅ Flask {flask.__version__} installed')
import flask_cors
print(f'✅ Flask-CORS installed')
import gspread
print(f'✅ gspread installed')
import pandas as pd
print(f'✅ pandas {pd.__version__} installed')
"

# Create requirements.txt for future
echo "6. Creating requirements.txt..."
cat > requirements.txt << 'REQ_EOF'
Flask==2.3.3
Flask-CORS==4.0.0
gspread==5.11.3
google-auth==2.22.0
pandas==2.0.3
python-dotenv==1.0.0
REQ_EOF

echo "✅ Installation complete!"
