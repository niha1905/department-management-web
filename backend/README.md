# Notes App Backend

A Flask-based API backend for the Notes application with MongoDB database.

## Setup

1. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

2. Set up MongoDB:
   - Install MongoDB locally or use a cloud service
   - Copy `.env.example` to `.env` and update the MongoDB URI

3. Run the application:
   ```
   python main.py
   ```

## API Endpoints

### Notes
- `GET /api/notes` - Get all notes (with optional tag filter: `/api/notes?tag=work`)
- `GET /api/notes/<note_id>` - Get a specific note
- `POST /api/notes` - Create a new note
- `PUT /api/notes/<note_id>` - Update a note
- `DELETE /api/notes/<note_id>` - Delete a note

### Comments
- `POST /api/notes/<note_id>/comments` - Add a comment to a note

### Tags
- `GET /api/tags` - Get all unique tags

### Note Actions
- `PATCH /api/notes/<note_id>/complete` - Toggle note completion status
- `PATCH /api/notes/<note_id>/prioritize` - Toggle note priority status
