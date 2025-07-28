#!/usr/bin/env python3
"""
Test backend integration with Gemini classification
"""

import requests
import json
import os

def test_backend_integration():
    """Test the backend with Gemini classification"""
    
    # Set API key for this session
    os.environ['GOOGLE_API_KEY'] = 'AIzaSyBHF4T_4ElrGXI5G2Cv19UJs8GLdZEPDhQ'
    
    # Test cases
    test_notes = [
        {
            "title": "Project: Mobile App Authentication",
            "description": "Implement new authentication system for the mobile app with OAuth2 and JWT tokens, including user registration, login, and password reset functionality",
            "user_email": "test@example.com",
            "user_name": "Test User"
        },
        {
            "title": "Daily Task: Grocery Shopping",
            "description": "Buy groceries on the way home - need milk, bread, eggs, and vegetables",
            "user_email": "test@example.com",
            "user_name": "Test User"
        },
        {
            "title": "Project: Quarterly Report",
            "description": "Review quarterly sales report and prepare comprehensive presentation for board meeting with financial analysis and strategic recommendations",
            "user_email": "test@example.com",
            "user_name": "Test User"
        }
    ]
    
    print("🧪 Testing Backend Integration with Gemini")
    print("=" * 60)
    
    for i, note_data in enumerate(test_notes, 1):
        print(f"\n📝 Test {i}: {note_data['title']}")
        print(f"Description: {note_data['description'][:80]}...")
        
        try:
            response = requests.post(
                'http://192.168.1.100:5000/api/notes',
                headers={'Content-Type': 'application/json'},
                json=note_data
            )
            
            if response.status_code == 201:
                result = response.json()
                note = result.get('note', {})
                note_type = note.get('type', 'unknown')
                source = note.get('source', 'unknown')
                
                print(f"✅ Created successfully!")
                print(f"   Type: {note_type}")
                print(f"   Source: {source}")
                print(f"   ID: {note.get('_id', 'N/A')}")
                
                # Verify classification
                expected_type = "project" if "project" in note_data['title'].lower() or "implement" in note_data['description'].lower() else "daily task"
                if note_type == expected_type:
                    print(f"   🎯 Classification: Correct!")
                else:
                    print(f"   ⚠️  Classification: Expected {expected_type}, got {note_type}")
                    
            else:
                print(f"❌ Failed to create note: {response.status_code}")
                print(f"   Error: {response.text}")
                
        except requests.exceptions.ConnectionError:
            print("❌ Could not connect to backend server")
            print("   Make sure the backend is running: cd backend && python main.py")
            break
        except Exception as e:
            print(f"❌ Error: {e}")

def test_ai_extraction():
    """Test AI note extraction"""
    
    os.environ['GOOGLE_API_KEY'] = 'AIzaSyBHF4T_4ElrGXI5G2Cv19UJs8GLdZEPDhQ'
    
    test_text = """
    In our meeting today, we discussed several important items:
    1. Need to implement new authentication system for mobile app
    2. Buy groceries on the way home
    3. Review quarterly sales report for board presentation
    4. Call dentist to schedule appointment
    """
    
    print("\n🧪 Testing AI Note Extraction")
    print("=" * 60)
    print(f"Input text: {test_text[:100]}...")
    
    try:
        response = requests.post(
            'http://192.168.1.100:5000/api/notes/ai',
            headers={'Content-Type': 'application/json'},
            json={
                'text': test_text,
                'user_email': 'test@example.com',
                'user_name': 'Test User'
            }
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ AI extraction successful!")
            print(f"   Message: {result.get('message', 'N/A')}")
            
            # Parse AI output
            ai_output = result.get('ai_output', '[]')
            try:
                tasks = json.loads(ai_output)
                print(f"   Extracted {len(tasks)} notes:")
                for i, task in enumerate(tasks, 1):
                    print(f"     {i}. {task.get('title', 'N/A')} ({task.get('type', 'N/A')})")
            except:
                print("   Could not parse AI output")
        else:
            print(f"❌ AI extraction failed: {response.status_code}")
            print(f"   Error: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to backend server")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    print("🚀 Backend Integration Test")
    print("=" * 60)
    
    # Test note creation with classification
    test_backend_integration()
    
    # Test AI extraction
    test_ai_extraction()
    
    print("\n🎉 Test completed!")
    print("\n📝 Next steps:")
    print("1. Start your frontend: cd frontend && npm run dev")
    print("2. Create notes through the UI")
    print("3. Watch automatic classification in action!") 