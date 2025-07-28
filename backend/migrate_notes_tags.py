#!/usr/bin/env python3
"""
Migration script to add note type to tags for existing notes
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from pymongo import MongoClient
from bson import ObjectId
import datetime

def migrate_notes_tags():
    """Add note type to tags for all existing notes"""
    
    # Connect to MongoDB
    try:
        client = MongoClient('mongodb://localhost:27017/')
        db = client['notes_app']  # Adjust database name if needed
        notes_collection = db.notes
        
        print("Starting migration: Adding note type to tags...")
        
        # Get all notes
        notes = list(notes_collection.find({}))
        print(f"Found {len(notes)} notes to process")
        
        updated_count = 0
        
        for note in notes:
            note_type = note.get('type', 'daily task')
            current_tags = note.get('tags', [])
            
            # Ensure tags is a list
            if isinstance(current_tags, str):
                current_tags = [current_tags] if current_tags else []
            elif not isinstance(current_tags, list):
                current_tags = []
            
            # Add note type to tags if not already present
            if note_type and note_type not in current_tags:
                current_tags.append(note_type)
                
                # Update the note
                result = notes_collection.update_one(
                    {"_id": note["_id"]},
                    {
                        "$set": {
                            "tags": current_tags,
                            "updated_at": datetime.datetime.now()
                        }
                    }
                )
                
                if result.modified_count > 0:
                    updated_count += 1
                    print(f"Updated note: {note.get('title', 'Untitled')} - Added '{note_type}' to tags")
        
        print(f"\nMigration completed!")
        print(f"Total notes processed: {len(notes)}")
        print(f"Notes updated: {updated_count}")
        print(f"Notes already had type in tags: {len(notes) - updated_count}")
        
    except Exception as e:
        print(f"Error during migration: {e}")
        return False
    
    return True

if __name__ == "__main__":
    print("Note Tags Migration Script")
    print("=" * 30)
    
    success = migrate_notes_tags()
    
    if success:
        print("\n✅ Migration completed successfully!")
    else:
        print("\n❌ Migration failed!")
        sys.exit(1) 