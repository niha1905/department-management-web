from flask import request, jsonify
from bson import ObjectId
import datetime

# Handles versioning (history, rollback) for notes
class VersionsController:
    def __init__(self, db, socketio=None):
        self.notes_collection = db.notes
        # self.socketio = socketio
    # Emits socket events if available
    def emit_socket_event(self, event, data):
        """Helper method to emit socket events if socketio is available"""
        pass
        # if self.socketio:
        #     self.socketio.emit(event, data)
    # Converts MongoDB objects to JSON-serializable format
    def parse_json(self, data):
        if isinstance(data, list):
            return [self.parse_json(item) for item in data]
        elif isinstance(data, dict):
            for key, value in data.items():
                if isinstance(value, ObjectId):
                    data[key] = str(value)
                elif isinstance(value, datetime.datetime):
                    data[key] = value.isoformat()
                elif isinstance(value, (dict, list)):
                    data[key] = self.parse_json(value)
            return data
        elif isinstance(data, ObjectId):
            return str(data)
        elif isinstance(data, datetime.datetime):
            return data.isoformat()
        return data
    
    # Updates a note, saves previous version in history
    def update_note(self, note_id):
        try:
            data = request.get_json()
            user_email = request.args.get('user_email')
            user_role = request.args.get('user_role')
            user_name = request.args.get('user_name') or data.get('user_name')
            
            # Print debugging info
            print(f"Updating note with user info: email={user_email}, name={user_name}, role={user_role}")
            print(f"Request args: {request.args}")
            print(f"Raw data: {data}")
            
            # Ensure we have a default name if none is provided
            if not user_name:
                user_name = 'Unknown User'
            
            # Get the note to check permissions
            note = self.notes_collection.find_one({"_id": ObjectId(note_id)})
            if not note:
                return jsonify({"error": "Note not found"}), 404
            
            # Check if user has edit permission - only admin or creator can edit
            if user_role != 'admin' and note.get('created_by') != user_email:
                return jsonify({"error": "You don't have permission to edit this note"}), 403
            
            # Create a version entry from the current note
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
                "type": note.get('type', 'daily task'),
            }
            
            # Prepare update data
            update_data = {
                "updated_at": current_timestamp,
                "last_editor": user_email,
                "last_editor_name": user_name
            }
            
            # Only update fields that are provided
            for field in ['title', 'description', 'tags', 'color', 'completed', 'deadline', 'type']:
                if field in data:
                    update_data[field] = data[field]
            
            # Add note type to tags if type is being updated or if tags are being updated
            if 'type' in data or 'tags' in data:
                current_tags = data.get('tags', note.get('tags', []))
                current_type = data.get('type', note.get('type', 'daily task'))
                
                # Ensure tags is a list
                if isinstance(current_tags, str):
                    current_tags = [current_tags] if current_tags else []
                
                # Add note type to tags if not already present
                if current_type and current_type not in current_tags:
                    current_tags.append(current_type)
                
                update_data['tags'] = current_tags
            
            # Push the version to the versions array and update the note
            result = self.notes_collection.update_one(
                {"_id": ObjectId(note_id)}, 
                {
                    "$set": update_data,
                    "$push": {"versions": version_entry}
                }
            )
            
            # Return the updated note
            updated_note = self.notes_collection.find_one({"_id": ObjectId(note_id)})
            parsed_note = self.parse_json(updated_note)
            return jsonify({"message": "Note updated successfully", "note": parsed_note}), 200
        
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    # Returns all versions (history) for a note
    def get_note_versions(self, note_id):
        try:
            note = self.notes_collection.find_one({"_id": ObjectId(note_id)})
            if not note:
                return jsonify({"error": "Note not found"}), 404
            
            versions = note.get('versions', [])
            
            # Add the current version at the top
            current_version = {
                "version_id": "current",
                "timestamp": note.get('updated_at'),
                "editor_email": note.get('last_editor') or note.get('created_by'),
                "editor_name": note.get('last_editor_name') or note.get('created_by_name', 'Unknown'),
                "editor_role": "unknown",  # We don't store this in the note
                "title": note.get('title'),
                "description": note.get('description'),
                "tags": note.get('tags', []),
                "color": note.get('color'),
                "deadline": note.get('deadline'),
                "type": note.get('type', 'daily task'),
                "is_current": True
            }
            
            result = [current_version]
            for version in versions:
                version["is_current"] = False
                result.append(version)
                
            return jsonify({"versions": self.parse_json(result)}), 200
        
        except Exception as e:
            return jsonify({"error": str(e)}), 500
            
    # Rolls back a note to a previous version, saves current as new version
    def rollback_note(self, note_id, version_id):
        try:
            data = request.get_json() or {}
            user_email = request.args.get('user_email')
            user_role = request.args.get('user_role')
            user_name = request.args.get('user_name') or data.get('user_name')
            
            # Print debugging info
            print(f"Rolling back note with user info: email={user_email}, name={user_name}, role={user_role}")
            
            # Ensure we have a default name if none is provided
            if not user_name:
                user_name = 'Unknown User'
            
            note = self.notes_collection.find_one({"_id": ObjectId(note_id)})
            if not note:
                return jsonify({"error": "Note not found"}), 404
                
            # Check if user has edit permission - only admin or creator can rollback
            if user_role != 'admin' and note.get('created_by') != user_email:
                return jsonify({"error": "You don't have permission to rollback this note"}), 403
                
            # Create a version entry from the current note before rollback
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
                "type": note.get('type', 'daily task'),
                "rollback_comment": f"Version before rollback to {version_id}"
            }
            
            # Find the target version to roll back to
            target_version = None
            for version in note.get('versions', []):
                if version.get('version_id') == version_id:
                    target_version = version
                    break
                    
            if not target_version:
                return jsonify({"error": "Version not found"}), 404
                
            # Update data with version data
            update_data = {
                "updated_at": current_timestamp,
                "last_editor": user_email,
                "last_editor_name": user_name,
                "title": target_version.get('title'),
                "description": target_version.get('description'),
                "tags": target_version.get('tags', []),
                "color": target_version.get('color'),
            }
            
            # Only update deadline and type if they exist in the version
            if 'deadline' in target_version:
                update_data['deadline'] = target_version['deadline']
            if 'type' in target_version:
                update_data['type'] = target_version['type']
                
            # Add a rollback comment and push the version
            rollback_message = {
                "version_id": str(ObjectId()),
                "timestamp": current_timestamp,
                "editor_email": user_email,
                "editor_name": user_name,
                "editor_role": user_role,
                "rollback_from": version_id,
                "rollback_comment": f"Rolled back to version from {target_version.get('timestamp')}"
            }
            
            result = self.notes_collection.update_one(
                {"_id": ObjectId(note_id)}, 
                {
                    "$set": update_data,
                    "$push": {"versions": {"$each": [version_entry, rollback_message]}}
                }
            )
              # Return the updated note
            updated_note = self.notes_collection.find_one({"_id": ObjectId(note_id)})
            parsed_note = self.parse_json(updated_note)
            
            # Emit socket event for live updates
            # self.emit_socket_event('note_rollback', {
            #     'note': parsed_note,
            #     'note_id': note_id,
            #     'rolled_back_to': version_id,
            #     'rolled_back_by': user_email
            # })
            
            return jsonify({"message": "Note rolled back successfully", "note": parsed_note}), 200
            
        except Exception as e:
            return jsonify({"error": str(e)}), 500