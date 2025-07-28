from flask import request, jsonify
from bson import ObjectId
import datetime

# Handles assigning notes to users and tracking assignment changes
class AssignmentController:
    def __init__(self, db):
        self.notes_collection = db.notes
    
    # Converts MongoDB objects to JSON-serializable format
    def parse_json(self, data):
        if isinstance(data, list):
            return [self.parse_json(item) for item in data]
        elif isinstance(data, dict):
            for key, value in data.items():
                if isinstance(value, ObjectId):
                    data[key] = str(value)
                elif isinstance(value, (dict, list)):
                    data[key] = self.parse_json(value)
            return data
        return data
    
    # Assigns a note to a user, only allowed by admin or note creator
    def assign_note(self, note_id):
        try:
            data = request.get_json()
            user_email = request.args.get('user_email')
            user_role = request.args.get('user_role')
            user_name = request.args.get('user_name') or data.get('user_name', 'Unknown User')
            
            # Print debugging info
            print(f"Assign note request: note_id={note_id}, assigning to={data.get('assigned_to')}")
            print(f"Current user: email={user_email}, role={user_role}, name={user_name}")
            
            # Get the note to check permissions
            note = self.notes_collection.find_one({"_id": ObjectId(note_id)})
            if not note:
                return jsonify({"error": "Note not found"}), 404
                
            # Check if user has permission to assign (admin or creator)
            if user_role != 'admin' and note.get('created_by') != user_email:
                return jsonify({"error": "You don't have permission to assign this note"}), 403
            
            # --- NEW LOGIC STARTS HERE ---
            # Ensure both old and new assigned_to are lists
            new_assignees = data.get('assigned_to', [])
            if isinstance(new_assignees, str):
                new_assignees = [new_assignees]
            note = self.notes_collection.find_one({"_id": ObjectId(note_id)})
            old_assigned_to = note.get('assigned_to', [])
            if isinstance(old_assigned_to, str):
                old_assigned_to = [old_assigned_to] if old_assigned_to else []

            # Append new assignees if not already present
            for assignee in new_assignees:
                if assignee and assignee not in old_assigned_to:
                    from_user = old_assigned_to[-1] if old_assigned_to else None
                    old_assigned_to.append(assignee)
                    history_entry = {
                        "from_user": from_user,
                        "to_user": assignee,
                        "timestamp": datetime.datetime.now(),
                        "action": "handoff"
                    }
                    self.notes_collection.update_one(
                        {"_id": ObjectId(note_id)},
                        {
                            "$set": {"assigned_to": old_assigned_to, "updated_at": datetime.datetime.now()},
                            "$push": {"history": history_entry}
                        }
                    )   

            current_timestamp = datetime.datetime.now()
            version_entry = {
                "version_id": str(ObjectId()),
                "timestamp": current_timestamp,
                "editor_email": user_email,
                "editor_name": user_name,
                "editor_role": user_role,
                "title": note.get('title'),
                "description": note.get('description'),
                "tags": note.get('tags', []),
                "color": note.get('color'),
                "deadline": note.get('deadline'),
                "assigned_to": old_assigned_to,
                "assignment_change": f"Changed assignment to {old_assigned_to}"
            }

            result = self.notes_collection.update_one(
                {"_id": ObjectId(note_id)},
                {
                    "$set": {
                        "assigned_to": old_assigned_to,
                        "updated_at": current_timestamp,
                        "last_editor": user_email,
                        "last_editor_name": user_name
                    },
                    "$push": {
                        "versions": version_entry,
                    }
                }
            )

            if result.matched_count == 0:
                return jsonify({"error": "Failed to update note assignment"}), 500

            updated_note = self.notes_collection.find_one({"_id": ObjectId(note_id)})
            parsed_note = self.parse_json(updated_note)
            return jsonify({"message": "Note assigned successfully", "note": parsed_note}), 200

        except Exception as e:
            print(f"Exception in assign_note: {str(e)}")
            return jsonify({"error": str(e)}), 500
            
            
