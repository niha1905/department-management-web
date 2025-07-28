#!/usr/bin/env python3
"""
Test script for Gemini note classification
"""

import os

def test_gemini_classification():
    """Test Gemini classification directly"""
    try:
        import google.generativeai as genai
        
        # Get API key from environment
        api_key = os.getenv('GOOGLE_API_KEY')
        if not api_key:
            print("❌ GOOGLE_API_KEY not set in environment")
            return
        
        # Configure Gemini
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Test cases
        test_cases = [
            ("Review quarterly sales report and prepare presentation for board meeting", "project"),
            ("Buy groceries on the way home", "daily work"),
            ("Implement new authentication system for the mobile app", "project"),
            ("Call dentist to schedule appointment", "daily work"),
            ("Develop comprehensive marketing strategy for Q4 product launch", "project"),
            ("Pick up dry cleaning", "daily work"),
        ]
        
        print("Testing Gemini note classification...")
        print("=" * 50)
        
        for note_content, expected in test_cases:
            try:
                prompt = f"""
                Analyze the following note content and classify it as either "daily work" or "project".
                
                Classification criteria:
                - "daily work": Routine tasks, daily activities, short-term tasks, personal tasks, meetings, appointments, errands, quick actions
                - "project": Long-term initiatives, complex tasks, multi-step processes, strategic work, ongoing initiatives, team projects, major deliverables
                
                Note content: "{note_content}"
                
                Respond with ONLY one word: "daily work" or "project"
                """
                
                response = model.generate_content(prompt)
                if response and response.text:
                    classification = response.text.strip().lower()
                    # Map to our note types
                    if classification == "project":
                        result = "project"
                    else:
                        result = "daily task"
                    
                    status = "✅" if result in ["project", "daily task"] else "❌"
                    print(f"{status} '{note_content[:50]}...' -> {result}")
                else:
                    print(f"❌ No response for '{note_content[:50]}...'")
                    
            except Exception as e:
                print(f"❌ Error classifying '{note_content[:50]}...': {e}")
        
        print("=" * 50)
        print("Test completed!")
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("Make sure to install google-generativeai: pip install google-generativeai==0.8.4")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_gemini_classification() 