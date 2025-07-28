#!/usr/bin/env python3
"""
Setup script for Gemini API key configuration
"""

import os
import sys

def setup_gemini():
    print("🔧 Gemini API Setup")
    print("=" * 50)
    
    # Check if API key is already set
    api_key = os.getenv('GOOGLE_API_KEY')
    if api_key:
        print(f"✅ GOOGLE_API_KEY is already set: {api_key[:10]}...")
        return True
    
    print("❌ GOOGLE_API_KEY not found in environment")
    print("\n📋 To set up Gemini:")
    print("1. Go to https://makersuite.google.com/app/apikey")
    print("2. Sign in and create an API key")
    print("3. Copy the API key")
    print("\n🔧 Then set the environment variable:")
    print("\nWindows (PowerShell):")
    print('$env:GOOGLE_API_KEY="your_api_key_here"')
    print("\nWindows (Command Prompt):")
    print('set GOOGLE_API_KEY=your_api_key_here')
    print("\nLinux/Mac:")
    print('export GOOGLE_API_KEY="your_api_key_here"')
    print("\n📁 Or create a .env file in the backend directory:")
    print("GOOGLE_API_KEY=your_api_key_here")
    
    # Check if .env file exists
    env_file = os.path.join('backend', '.env')
    if os.path.exists(env_file):
        print(f"\n📄 Found .env file at: {env_file}")
        try:
            with open(env_file, 'r') as f:
                content = f.read()
                if 'GOOGLE_API_KEY' in content:
                    print("✅ GOOGLE_API_KEY found in .env file")
                    return True
                else:
                    print("❌ GOOGLE_API_KEY not found in .env file")
        except Exception as e:
            print(f"❌ Error reading .env file: {e}")
    else:
        print(f"\n📄 No .env file found at: {env_file}")
        print("📝 Creating .env file template...")
        try:
            env_content = """# Google API Key for Gemini
# Get your API key from: https://makersuite.google.com/app/apikey
GOOGLE_API_KEY=your_google_api_key_here

# Database Configuration
MONGO_URI=mongodb://localhost:27017
MONGO_DB_NAME=grandmagnum

# Other API Keys
GROQ_API_KEY=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
"""
            with open(env_file, 'w') as f:
                f.write(env_content)
            print("✅ Created .env file template")
            print("📝 Please edit backend/.env and add your actual Google API key")
        except Exception as e:
            print(f"❌ Error creating .env file: {e}")
    
    return False

def test_gemini():
    """Test if Gemini is working"""
    try:
        import google.generativeai as genai
        
        api_key = os.getenv('GOOGLE_API_KEY')
        if not api_key:
            print("❌ GOOGLE_API_KEY not set")
            return False
        
        # Configure Gemini
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Simple test
        response = model.generate_content("Say 'Hello World'")
        if response and response.text:
            print("✅ Gemini is working!")
            print(f"Test response: {response.text}")
            return True
        else:
            print("❌ No response from Gemini")
            return False
            
    except ImportError:
        print("❌ google-generativeai not installed")
        print("Run: pip install google-generativeai==0.8.4")
        return False
    except Exception as e:
        print(f"❌ Gemini test failed: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Gemini Setup and Test")
    print("=" * 50)
    
    # Setup check
    is_setup = setup_gemini()
    
    if is_setup:
        print("\n🧪 Testing Gemini...")
        if test_gemini():
            print("\n🎉 Everything is working! You can now use Gemini for note classification.")
        else:
            print("\n❌ Gemini test failed. Check your API key and try again.")
    else:
        print("\n📝 Please set up your API key and run this script again.") 