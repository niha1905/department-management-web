#!/usr/bin/env python3
"""
Script to help set the Google API key
"""

import os
import sys

def set_api_key():
    print("🔧 Google API Key Setup")
    print("=" * 50)
    
    # Check if API key is already set
    current_key = os.getenv('GOOGLE_API_KEY')
    if current_key:
        print(f"✅ API key is already set: {current_key[:10]}...")
        return True
    
    print("❌ No API key found")
    print("\n📋 To get your API key:")
    print("1. Go to: https://makersuite.google.com/app/apikey")
    print("2. Sign in with your Google account")
    print("3. Click 'Create API Key'")
    print("4. Copy the generated API key")
    
    # Get API key from user
    print("\n🔑 Enter your Google API key (or press Enter to skip):")
    api_key = input().strip()
    
    if not api_key:
        print("❌ No API key provided")
        return False
    
    # Set environment variable for current session
    os.environ['GOOGLE_API_KEY'] = api_key
    print(f"✅ API key set for this session: {api_key[:10]}...")
    
    # Also save to .env file
    env_file = os.path.join('backend', '.env')
    try:
        # Read existing content
        existing_content = ""
        if os.path.exists(env_file):
            with open(env_file, 'r') as f:
                existing_content = f.read()
        
        # Update or add the API key
        lines = existing_content.split('\n')
        updated_lines = []
        key_found = False
        
        for line in lines:
            if line.startswith('GOOGLE_API_KEY='):
                updated_lines.append(f'GOOGLE_API_KEY={api_key}')
                key_found = True
            else:
                updated_lines.append(line)
        
        if not key_found:
            updated_lines.append(f'GOOGLE_API_KEY={api_key}')
        
        # Write back to file
        with open(env_file, 'w') as f:
            f.write('\n'.join(updated_lines))
        
        print(f"✅ API key saved to {env_file}")
        
    except Exception as e:
        print(f"❌ Error saving to .env file: {e}")
    
    return True

def test_api_key():
    """Test if the API key works"""
    api_key = os.getenv('GOOGLE_API_KEY')
    if not api_key:
        print("❌ No API key to test")
        return False
    
    try:
        import requests
        
        url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
        headers = {
            'Content-Type': 'application/json',
            'X-goog-api-key': api_key
        }
        
        data = {
            "contents": [
                {
                    "parts": [
                        {
                            "text": "Say 'Hello World'"
                        }
                    ]
                }
            ]
        }
        
        print("🧪 Testing API key...")
        response = requests.post(url, headers=headers, json=data)
        
        if response.status_code == 200:
            result = response.json()
            if 'candidates' in result and len(result['candidates']) > 0:
                content = result['candidates'][0].get('content', {})
                parts = content.get('parts', [])
                if parts and len(parts) > 0:
                    text = parts[0].get('text', '')
                    print(f"✅ API key works! Response: {text}")
                    return True
        
        print(f"❌ API test failed: {response.status_code}")
        print(f"Error: {response.text}")
        return False
        
    except ImportError:
        print("❌ requests library not available")
        print("Install with: pip install requests")
        return False
    except Exception as e:
        print(f"❌ Error testing API: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Google API Key Setup and Test")
    print("=" * 50)
    
    # Set up API key
    if set_api_key():
        print("\n🧪 Testing API key...")
        if test_api_key():
            print("\n🎉 Everything is working! You can now use Gemini for note classification.")
            print("\n📝 Next steps:")
            print("1. Start your backend server")
            print("2. Create some notes")
            print("3. Watch them get automatically classified!")
        else:
            print("\n❌ API key test failed. Please check your key and try again.")
    else:
        print("\n📝 Please get your API key and run this script again.") 