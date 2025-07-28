from controllers.Notes import NotesController
import os

# Set a test API key
os.environ['GOOGLE_API_KEY'] = 'test-key'

# Create a mock database
db = {}

# Define output file path
output_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'test_result.txt')

# Initialize the NotesController and write results to file
with open(output_file, 'w') as f:
    try:
        f.write("Starting NotesController initialization...\n")
        notes = NotesController(db)
        f.write('NotesController initialized successfully\n')
        f.write(f'Gemini initialized: {notes.genai is not None}\n')
        
    except Exception as e:
        f.write(f"Error initializing NotesController: {e}\n")

print(f"Test results written to {output_file}")