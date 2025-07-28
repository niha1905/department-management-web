from flask import request, jsonify
from bson import ObjectId
import datetime
import json
import os
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables from .env if present
load_dotenv()

# Try to use Google Gemini for summarization
try:
    import google.generativeai as genai
    import os
    
    # Initialize Gemini client
    api_key = os.getenv('GOOGLE_API_KEY')
    if not api_key:
        raise ValueError("GOOGLE_API_KEY environment variable not set")
    
    genai.configure(api_key=api_key)
    
    # Create a summarization function using Gemini
    def summarize_text(text, max_length=130):
        try:
            prompt = f"Summarize the following text in about {max_length} words:\n\n{text}"
            model = genai.GenerativeModel('gemini-1.5-flash')
            response = model.generate_content(prompt)
            
            if response and response.text:
                # Clean up the response to handle potential formatting issues
                summary_text = response.text.strip()
                summary_text = summary_text.replace('```', '').strip()
                return [{"summary_text": summary_text}]
            else:
                return [{"summary_text": "Error generating summary."}]
        except Exception as e:
            print(f"Gemini summarization error: {e}")
            return [{"summary_text": "Error generating summary."}]
    
    # Replace the original summarizer with our function
    summarizer = summarize_text
    
except Exception as e:
    print(f"Warning: Could not set up Gemini summarization: {e}")
    print("Continuing with a simple summarization function")
    
    # Create a simple summarization function that just returns the first few sentences
    def simple_summarize(text, max_length=130):
        sentences = text.split('. ')
        summary = '. '.join(sentences[:3]) + '.'
        return [{"summary_text": summary}]
    
    summarizer = simple_summarize

def summarize_transcription(transcription_text, max_length=150, min_length=50):
    """Summarize the given transcription text using the Hugging Face transformers library"""
    try:
        # For long texts, we need to chunk them as the model has input limits
        if len(transcription_text) > 1000:
            chunks = [transcription_text[i:i+1000] for i in range(0, len(transcription_text), 1000)]
            summaries = []
            
            for chunk in chunks:
                summary = summarizer(chunk, max_length=max_length//len(chunks))
                summaries.append(summary[0]['summary_text'])
            
            return " ".join(summaries)
        else:
            summary = summarizer(transcription_text, max_length=max_length)
            return summary[0]['summary_text']
    except Exception as e:
        print(f"Error in summarization: {str(e)}")
        return None

def generate_mind_map(summary_text):
    """Generate a simple mind map structure from the summary text"""
    # Split by sentences and create a hierarchical structure
    sentences = summary_text.split('.')
    sentences = [s.strip() for s in sentences if s.strip()]
    
    # Create a simple mind map structure
    main_topic = sentences[0] if sentences else "Summary"
    subtopics = sentences[1:] if len(sentences) > 1 else []
    
    mind_map = {
        "central": main_topic,
        "branches": [{"text": topic} for topic in subtopics]
    }
    
    return mind_map

def summarize_transcription_endpoint():
    """API endpoint to summarize a transcription"""
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400
    transcription_id = data.get('transcription_id')
    transcription_text = data.get('text')
    
    if not transcription_text:
        return jsonify({"error": "No text provided for summarization"}), 400
    
    # Generate summary
    summary = summarize_transcription(transcription_text)
    if not summary:
        return jsonify({"error": "Failed to generate summary"}), 500
    
    # Generate mind map
    mind_map = generate_mind_map(summary)
    
    # Extract key points (simplified approach)
    sentences = summary.split('.')
    key_points = [s.strip() for s in sentences if len(s.strip()) > 10]
    
    return jsonify({
        "transcription_id": transcription_id,
        "summary": summary,
        "key_points": key_points,
        "mind_map": mind_map
    })

class TranscriptionController:
    def __init__(self, db, socketio=None):
        self.transcriptions_collection = db.transcriptions
        self.ai_notes_collection = db.ai_notes
        # self.socketio = socketio
        from controllers.Notes import NotesController
        self.notes_controller = NotesController(db)
    
    def emit_socket_event(self, event, data):
        """Helper method to emit socket events if socketio is available"""
        pass
        # if self.socketio:
        #     self.socketio.emit(event, data)
    
    # Helper function to convert ObjectId and datetime to string for JSON serialization
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
    
    def save_transcription(self):
        try:
            data = request.get_json()
            
            # Validate required fields
            if not data.get('content') or not data.get('language'):
                return jsonify({"error": "Content and language are required"}), 400
            
            # Get user info from the request data or query params
            user_email = request.args.get('user_email') or data.get('user_email')
            user_name = request.args.get('user_name') or data.get('user_name')
            
            # Ensure we have a default name if none is provided
            if not user_name:
                user_name = 'Unknown User'
                
            # Process the transcription with AI
            ai_response, status_code = self.notes_controller._process_ai_extraction(
                data.get('content'), 
                user_email, 
                user_name
            )
            
            if status_code != 200:
                return ai_response, status_code
                
            # Parse AI output to get structured notes
            processed_notes = []
            
            try:
                # Use the new notes format if available
                if ai_response and ai_response.json and ai_response.json.get('notes'):
                    processed_notes = ai_response.json.get('notes')
                elif ai_response and ai_response.json and ai_response.json.get('ai_output'):
                    # Fallback to old ai_output format
                    ai_content = ai_response.json.get('ai_output')
                    if ai_content:
                        processed_notes = json.loads(ai_content)
                    else:
                        raise json.JSONDecodeError("No AI content", "", 0)
                else:
                    raise json.JSONDecodeError("No AI content", "", 0)
            except (json.JSONDecodeError, TypeError):
                # If AI output isn't valid JSON, use original content
                processed_notes = [{
                    "title": f"Transcription ({data.get('language_name', data.get('language'))})", 
                    "description": data.get('content'),
                    "tags": ["Transcription", data.get('language_name', data.get('language'))]
                }]
            
            # Create a record with both the original transcription and processed notes
            new_record = {
                "original_content": data.get('content'),
                "language": data.get('language'),
                "language_name": data.get('language_name', ''),
                "processed_notes": processed_notes,
                "created_at": datetime.datetime.now(),
                "created_by": user_email,
                "created_by_name": user_name,
                "in_trash": False
            }
            
            # Insert into database
            result = self.ai_notes_collection.insert_one(new_record)
            
            # Return the created record with its ID
            new_record['_id'] = str(result.inserted_id)
            
            # Emit socket event for live updates
            # self.emit_socket_event('transcription_created', {
            #     'transcription': self.parse_json(new_record),
            #     'user': user_email
            # })
            
            return jsonify({"message": "Transcription processed and saved successfully", "record": new_record}), 201
        
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    def get_transcriptions(self):
        try:
            user_email = request.args.get('user_email')
            view = request.args.get('view', 'active')  # 'active' or 'trash'
            
            query = {}
            
            # Add user filter if provided
            if user_email:
                query['created_by'] = user_email
                
            # Filter by view
            if view == 'active':
                query['in_trash'] = False
            elif view == 'trash':
                query['in_trash'] = True
                
            # Execute query
            records_cursor = self.ai_notes_collection.find(query).sort('created_at', -1)
            records = list(records_cursor)
            
            # Convert ObjectId to string for JSON serialization
            parsed_records = self.parse_json(records)
            return jsonify({"transcriptions": parsed_records}), 200
        
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    def delete_transcription(self, transcription_id):
        try:
            # Instead of deleting, mark as in_trash
            result = self.ai_notes_collection.update_one(
                {"_id": ObjectId(transcription_id)},
                {"$set": {"in_trash": True}}
            )
            
            if result.matched_count == 0:
                return jsonify({"error": "Transcription not found"}), 404
            
            # Emit socket event for live updates
            # self.emit_socket_event('transcription_deleted', {
            #     'transcription_id': transcription_id,
            #     'action': 'moved_to_trash'
            # })
            
            return jsonify({"message": "Transcription moved to trash"}), 200
        
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    def permanently_delete_transcription(self, transcription_id):
        try:
            result = self.ai_notes_collection.delete_one({"_id": ObjectId(transcription_id)})
            
            if result.deleted_count == 0:
                return jsonify({"error": "Transcription not found"}), 404
            
            # Emit socket event for live updates
            # self.emit_socket_event('transcription_permanently_deleted', {
            #     'transcription_id': transcription_id
            # })
            
            return jsonify({"message": "Transcription permanently deleted"}), 200
        
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    def restore_transcription(self, transcription_id):
        try:
            result = self.ai_notes_collection.update_one(
                {"_id": ObjectId(transcription_id)},
                {"$set": {"in_trash": False}}
            )
            
            if result.matched_count == 0:
                return jsonify({"error": "Transcription not found"}), 404
            
            # Get the restored transcription to emit with full data
            restored_transcription = self.ai_notes_collection.find_one({"_id": ObjectId(transcription_id)})
            
            # Emit socket event for live updates
            # self.emit_socket_event('transcription_restored', {
            #     'transcription': self.parse_json(restored_transcription),
            #     'transcription_id': transcription_id
            # })
            
            return jsonify({"message": "Transcription restored from trash"}), 200
        
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    def add_to_notes(self, transcription_id):
        try:
            record = self.ai_notes_collection.find_one({"_id": ObjectId(transcription_id)})
            
            if not record:
                return jsonify({"error": "Transcription not found"}), 404
            
            # Make sure user info is passed through
            user_email = request.args.get('user_email') or request.get_json().get('user_email', '')
            user_name = request.args.get('user_name') or request.get_json().get('user_name', '')
            
            # Process all available notes from the transcription
            notes_data = []
            
            if record.get('processed_notes') and len(record['processed_notes']) > 0:
                for note in record['processed_notes']:
                    tags = note.get('tags', ["Transcription", record.get('language_name', record.get('language'))])
                    note_type = note.get('type', 'daily task')
                    
                    # Add note type to tags if not already present
                    if note_type and note_type not in tags:
                        tags.append(note_type)
                    
                    # Enhance note with proper metadata and structure
                    enhanced_note = {
                        # Basic note fields
                        "title": note.get('title') or f"Transcription ({record.get('language_name', record.get('language'))})",
                        "description": note.get('description', record.get('original_content', '')),
                        
                        # Metadata - include all fields from AI
                        "color": note.get('color', 'blue'),
                        "tags": tags,
                        "type": note_type,
                        "deadline": note.get('deadline', ''),
                        
                        # Creation metadata
                        "created_by": user_email,
                        "created_by_name": user_name,
                        
                        # Reference to the source transcription
                        "source_transcription": str(record['_id']),
                        "language": record.get('language'),
                        "language_name": record.get('language_name', '')
                    }
                    notes_data.append(enhanced_note)
            else:
                # Create at least one note if none were processed
                default_tags = ["Transcription", record.get('language_name', record.get('language')), "daily task"]
                default_note = {
                    "title": f"Transcription ({record.get('language_name', record.get('language'))})",
                    "description": record.get('original_content', ''),
                    "color": "blue",
                    "tags": default_tags,
                    "type": "daily task",
                    "deadline": "",
                    "created_by": user_email,
                    "created_by_name": user_name,
                    "source_transcription": str(record['_id']),
                    "language": record.get('language'),
                    "language_name": record.get('language_name', '')
                }
                notes_data.append(default_note)
            
            # Track that notes were extracted from this transcription
            # This helps prevent duplicate note creation
            self.ai_notes_collection.update_one(
                {"_id": ObjectId(transcription_id)},
                {"$set": {
                    "notes_added": True,
                    "notes_added_at": datetime.datetime.now(),
                    "notes_added_by": user_email
                }}
            )
            
            # Get updated transcription for socket emission
            updated_transcription = self.ai_notes_collection.find_one({"_id": ObjectId(transcription_id)})
            
            # Emit socket event for transcription update
            # self.emit_socket_event('transcription_notes_added', {
            #     'transcription': self.parse_json(updated_transcription),
            #     'transcription_id': transcription_id,
            #     'notes_count': len(notes_data)
            # })
                
            # Return transcription record and all processed notes data
            parsed_record = self.parse_json(record)
            return jsonify({
                "message": "Transcription ready for notes",
                "transcription": parsed_record,
                "notes_data": notes_data
            }), 200
        
        except Exception as e:
            return jsonify({"error": str(e)}), 500

def register_transcription_routes(app, db, socketio=None):
    """Register all transcription-related routes to the Flask app."""
    controller = TranscriptionController(db, socketio)

    @app.route('/api/transcriptions', methods=['GET'])
    def get_transcriptions():
        return controller.get_transcriptions()

    @app.route('/api/transcriptions', methods=['POST'])
    def save_transcription():
        return controller.save_transcription()

    @app.route('/api/transcriptions/<transcription_id>/delete', methods=['POST'])
    def delete_transcription(transcription_id):
        return controller.delete_transcription(transcription_id)

    @app.route('/api/transcriptions/<transcription_id>/permanent_delete', methods=['POST'])
    def permanently_delete_transcription(transcription_id):
        return controller.permanently_delete_transcription(transcription_id)

    @app.route('/api/transcriptions/<transcription_id>/restore', methods=['POST'])
    def restore_transcription(transcription_id):
        return controller.restore_transcription(transcription_id)

    @app.route('/api/transcriptions/<transcription_id>/add_to_notes', methods=['POST'])
    def add_to_notes(transcription_id):
        return controller.add_to_notes(transcription_id)

    @app.route('/api/summarize_transcription', methods=['POST'])
    def summarize_transcription_api():
        return summarize_transcription_endpoint()
