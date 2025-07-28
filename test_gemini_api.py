#!/usr/bin/env python3
"""
Test Gemini API directly using requests
"""

import requests
import json
import os

def test_gemini_api():
    """Test Gemini API directly"""
    
    # Get API key from environment
    api_key = os.getenv('GOOGLE_API_KEY')
    if not api_key:
        print("❌ GOOGLE_API_KEY not set in environment")
        print("Please set your API key first:")
        print("$env:GOOGLE_API_KEY='your_api_key_here'")
        return
    
    # API endpoint
    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
    
    # Headers
    headers = {
        'Content-Type': 'application/json',
        'X-goog-api-key': api_key
    }
    
    # Request data
    data = {
        "contents": [
            {
                "parts": [
                    {
                        "text": "Explain how AI works in a few words"
                    }
                ]
            }
        ]
    }
    
    try:
        print("🧪 Testing Gemini API...")
        print(f"URL: {url}")
        print(f"API Key: {api_key[:10]}...")
        
        response = requests.post(url, headers=headers, json=data)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ API call successful!")
            
            # Extract the response text
            if 'candidates' in result and len(result['candidates']) > 0:
                content = result['candidates'][0].get('content', {})
                parts = content.get('parts', [])
                if parts and len(parts) > 0:
                    text = parts[0].get('text', '')
                    print(f"Response: {text}")
                else:
                    print("No text in response")
            else:
                print("No candidates in response")
                print(f"Full response: {json.dumps(result, indent=2)}")
        else:
            print("❌ API call failed")
            print(f"Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

def test_note_classification():
    """Test note classification specifically"""
    
    api_key = os.getenv('GOOGLE_API_KEY')
    if not api_key:
        print("❌ GOOGLE_API_KEY not set")
        return
    
    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
    headers = {
        'Content-Type': 'application/json',
        'X-goog-api-key': api_key
    }
    
    # Test cases for note classification
    test_cases = [
        "Review quarterly sales report and prepare presentation for board meeting",
        "Buy groceries on the way home",
        "Implement new authentication system for the mobile app"
    ]
    
    print("\n🧪 Testing Note Classification...")
    print("=" * 50)
    
    for note_content in test_cases:
        prompt = f"""Analyze the following note content and classify it as either "daily work" or "project".

Classification criteria:
- "daily work": Routine tasks, daily activities, short-term tasks, personal tasks, meetings, appointments, errands, quick actions
- "project": Long-term initiatives, complex tasks, multi-step processes, strategic work, ongoing initiatives, team projects, major deliverables

Note content: "{note_content}"

Respond with ONLY one word: "daily work" or "project"
"""
        
        data = {
            "contents": [
                {
                    "parts": [
                        {
                            "text": prompt
                        }
                    ]
                }
            ]
        }
        
        try:
            response = requests.post(url, headers=headers, json=data)
            
            if response.status_code == 200:
                result = response.json()
                if 'candidates' in result and len(result['candidates']) > 0:
                    content = result['candidates'][0].get('content', {})
                    parts = content.get('parts', [])
                    if parts and len(parts) > 0:
                        classification = parts[0].get('text', '').strip().lower()
                        print(f"✅ '{note_content[:50]}...' -> {classification}")
                    else:
                        print(f"❌ No response for '{note_content[:50]}...'")
                else:
                    print(f"❌ No candidates for '{note_content[:50]}...'")
            else:
                print(f"❌ API error for '{note_content[:50]}...': {response.status_code}")
                
        except Exception as e:
            print(f"❌ Error classifying '{note_content[:50]}...': {e}")

if __name__ == "__main__":
    print("🚀 Gemini API Direct Test")
    print("=" * 50)
    
    # Test basic API call
    test_gemini_api()
    
    # Test note classification
    test_note_classification() 