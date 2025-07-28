#!/usr/bin/env python3

"""
Test script to verify the transcription feature implementation
"""

import requests
import json
import sys

# Backend URL
BASE_URL = "http://192.168.1.100:5000"

def test_project_detection():
    """Test the project detection API endpoint"""
    print("Testing project detection API...")
    
    test_data = {
        "text": "I need to work on the ChatGPT Integration project and also update the Mobile App project",
        "existing_projects": ["chatgpt integration", "mobile app"]
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/projects/detect", json=test_data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            print("✅ Project detection API working correctly!")
            return True
        else:
            print("❌ Project detection API failed")
            return False
    except Exception as e:
        print(f"❌ Error testing project detection: {e}")
        return False

def test_ai_extraction():
    """Test the AI extraction API endpoint"""
    print("\nTesting AI extraction API...")
    
    test_data = {
        "text": "I need to call John about the meeting tomorrow at 3 PM, and also work on the Dashboard Redesign project. Don't forget to buy groceries and schedule a dentist appointment.",
        "user_email": "test@example.com",
        "user_name": "Test User"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/notes/ai", json=test_data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            print("✅ AI extraction API working correctly!")
            return True
        else:
            print("❌ AI extraction API failed")
            return False
    except Exception as e:
        print(f"❌ Error testing AI extraction: {e}")
        return False

def test_note_creation():
    """Test creating a note with project assignment"""
    print("\nTesting note creation API...")
    
    test_data = {
        "title": "Test transcription note",
        "description": "This is a test note created from transcription",
        "tags": ["transcription", "test"],
        "color": "blue",
        "type": "daily task",
        "project_id": None,
        "assigned_to": [],
        "delegated_to": [],
        "source": "transcription",
        "user_email": "test@example.com",
        "user_name": "Test User"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/notes", json=test_data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 201:
            print("✅ Note creation API working correctly!")
            return True
        else:
            print("❌ Note creation API failed")
            return False
    except Exception as e:
        print(f"❌ Error testing note creation: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Testing Voice Transcription Feature Implementation")
    print("=" * 60)
    
    tests = [
        test_project_detection,
        test_ai_extraction,
        test_note_creation
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
    
    print("\n" + "=" * 60)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! The transcription feature is ready.")
    else:
        print("⚠️  Some tests failed. Please check the backend implementation.")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)