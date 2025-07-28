from flask import request, jsonify
from bson import ObjectId
import datetime

class CommentsController:
    def __init__(self, db):
        self.notes_collection = db.notes
    
    # Helper function to convert ObjectId to string for JSON serialization
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
    
    def add_comment(self, note_id):
        try:
            data = request.get_json()
            
            if not data.get('text'):
                return jsonify({"error": "Comment text is required"}), 400
            
            # Generate a unique comment ID
            comment_id = str(ObjectId())
            
            comment = {
                "id": comment_id,
                "text": data.get('text'),
                "author": data.get('author', 'Anonymous'),
                "author_email": data.get('author_email', ''),
                "created_at": datetime.datetime.now(),
                "updated_at": datetime.datetime.now(),
                "color": data.get('color', 'blue'),
                "completed": False,
                "parent_id": data.get('parent_id', None)  # Parent comment ID (None for top-level)
            }
            
            # Add comment to the note's comments array (flat structure)
            result = self.notes_collection.update_one(
                {"_id": ObjectId(note_id)},
                {
                    "$push": {"comments": comment},
                    "$set": {"updated_at": datetime.datetime.now()}
                }
            )
            
            if result.matched_count == 0:
                return jsonify({"error": "Note not found"}), 404
            
            # Return the updated note with the new comment
            updated_note = self.notes_collection.find_one({"_id": ObjectId(note_id)})
            
            # Process comments to create a hierarchical structure for response
            # (but keep them flat in the database)
            processed_note = self.parse_json(updated_note)
            
            return jsonify({
                "message": "Comment added successfully",
                "note": processed_note,
                "comment": self.parse_json(comment)
            }), 200
        
        except Exception as e:
            print(f"Error adding comment: {str(e)}")
            return jsonify({"error": str(e)}), 500
    
    def update_comment(self, note_id, comment_id):
        try:
            data = request.get_json()
            update_data = {}
            
            # Only update fields that are provided
            for field in ['text', 'color', 'completed']:
                if field in data:
                    update_data[f"comments.$.{field}"] = data[field]
            
            update_data["comments.$.updated_at"] = datetime.datetime.now()
            
            # Update the comment directly - with flat structure, all comments are at the same level
            result = self.notes_collection.update_one(
                {
                    "_id": ObjectId(note_id),
                    "comments.id": comment_id
                },
                {"$set": update_data}
            )
            
            if result.matched_count == 0:
                return jsonify({"error": "Comment not found"}), 404
                
            # Return the updated note
            updated_note = self.notes_collection.find_one({"_id": ObjectId(note_id)})
            parsed_note = self.parse_json(updated_note)
            return jsonify({"message": "Comment updated successfully", "note": parsed_note}), 200
        
        except Exception as e:
            print(f"Error updating comment: {str(e)}")
            return jsonify({"error": str(e)}), 500
            
    def delete_comment(self, note_id, comment_id):
        try:
            # Get the note to find all replies to the comment being deleted
            note = self.notes_collection.find_one({"_id": ObjectId(note_id)})
            
            if not note:
                return jsonify({"error": "Note not found"}), 404
            
            # Find all child comments (all comments that have this comment as parent)
            # We'll need to delete these recursively
            comment_ids_to_delete = [comment_id]
            
            # Find all descendants recursively
            def find_child_comments(parent_id):
                children = [c['id'] for c in note.get('comments', []) if c.get('parent_id') == parent_id]
                descendant_ids = []
                for child_id in children:
                    comment_ids_to_delete.append(child_id)
                    descendant_ids.extend(find_child_comments(child_id))
                return descendant_ids
            
            # Add all descendant comment IDs to the deletion list
            find_child_comments(comment_id)
            
            # Delete all identified comments in one operation
            result = self.notes_collection.update_one(
                {"_id": ObjectId(note_id)},
                {
                    "$pull": {"comments": {"id": {"$in": comment_ids_to_delete}}},
                    "$set": {"updated_at": datetime.datetime.now()}
                }
            )
            
            if result.modified_count == 0:
                return jsonify({"error": "Failed to delete comments"}), 500
                    
            return jsonify({
                "message": "Comment and all replies deleted successfully",
                "deleted_comments": comment_ids_to_delete
            }), 200
            
        except Exception as e:
            print(f"Error deleting comment: {str(e)}")
            return jsonify({"error": str(e)}), 500
