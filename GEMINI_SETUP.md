# Gemini API Setup Guide

## Getting a Google API Key

1. **Go to Google AI Studio**:
   - Visit: https://makersuite.google.com/app/apikey
   - Sign in with your Google account

2. **Create API Key**:
   - Click "Create API Key"
   - Copy the generated API key

3. **Set Environment Variable**:

### Option 1: Set in your shell/terminal
```bash
# Windows (PowerShell)
$env:GOOGLE_API_KEY="your_api_key_here"

# Windows (Command Prompt)
set GOOGLE_API_KEY=your_api_key_here

# Linux/Mac
export GOOGLE_API_KEY="your_api_key_here"
```

### Option 2: Create a .env file
Create a file named `.env` in the `backend` directory:
```
GOOGLE_API_KEY=your_api_key_here
```

### Option 3: Set in your IDE
If you're using VS Code or another IDE, you can set environment variables in your launch configuration.

## Testing the Setup

Run the test script to verify everything works:
```bash
python test_gemini.py
```

You should see output like:
```
Testing Gemini note classification...
==================================================
✅ 'Review quarterly sales report and prepare present...' -> project
✅ 'Buy groceries on the way home' -> daily task
✅ 'Implement new authentication system for the mob...' -> project
✅ 'Call dentist to schedule appointment' -> daily task
✅ 'Develop comprehensive marketing strategy for Q4...' -> project
✅ 'Pick up dry cleaning' -> daily task
==================================================
Test completed!
```

## Troubleshooting

- **"GOOGLE_API_KEY not set"**: Make sure you've set the environment variable correctly
- **"Import error"**: Run `pip install google-generativeai==0.8.4` in the backend directory
- **"API key invalid"**: Check that you copied the API key correctly from Google AI Studio

## Security Note

Never commit your actual API key to version control. Always use environment variables or .env files (and add .env to .gitignore). 