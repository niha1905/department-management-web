# Typical Flask setup
from flask import Flask, current_app, jsonify, request, send_file
from flask_cors import CORS
from pymongo import MongoClient
import json
from controllers.Notes import NotesController
from controllers.ChatController import ChatController
from controllers.TranscriptionController import TranscriptionController, register_transcription_routes
from controllers.ProjectController import ProjectController
from auth import auth_bp
from werkzeug.utils import secure_filename
from datetime import datetime
import os
import shutil
import whisper
import subprocess
import re
import uuid
from flask_socketio import SocketIO, emit, join_room, leave_room
from controllers.MindmapController import MindmapController
from controllers.HierarchicalMindmapController import HierarchicalMindmapController, hierarchical_mindmap_bp

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    load_dotenv()
    print("✅ Environment variables loaded from .env file")
except ImportError:
    print("⚠️ python-dotenv not installed, using system environment variables")

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173"])
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")

# MongoDB setup
try:
    mongo_uri = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/')
    mongo_db_name = os.environ.get('MONGO_DB_NAME', 'grandmagnum')
    client = MongoClient(mongo_uri)
    db = client[mongo_db_name]
    app.config['db'] = db
    print("MongoDB connection established")
except Exception as e:
    print(f"Failed to connect to MongoDB: {e}")
    db = None

if db is not None:
    try:
        app.register_blueprint(auth_bp, url_prefix='/')
        app.register_blueprint(hierarchical_mindmap_bp, url_prefix='/')
        mindmap_controller = MindmapController(db, socketio)
        hierarchical_mindmap_controller = HierarchicalMindmapController(db)
        # Make db available to the app context for the blueprint routes
        app.db = db
    except Exception as e:
        print(f"Blueprint registration failed: {e}")
elif db is None:
    print("DB not available, blueprints not registered.")

APP_ROOT = os.path.dirname(os.path.abspath(__file__))
TEMP_AUDIO_DIR = os.path.join(APP_ROOT, 'temp_audio')
os.makedirs(TEMP_AUDIO_DIR, exist_ok=True)

TEMP_CHAT_AUDIO_DIR = os.path.join(APP_ROOT, 'temp_chataudio')
os.makedirs(TEMP_CHAT_AUDIO_DIR, exist_ok=True)
CHAT_UPLOAD_DIR = os.path.join(APP_ROOT, 'chat_uploads')
os.makedirs(CHAT_UPLOAD_DIR, exist_ok=True)

try:
    mongo_uri = os.environ.get('MONGO_URI', 'mongodb://localhost:27017')
    client = MongoClient(mongo_uri)
    db = client.notes_app_db
    app.config['db'] = db
    print("MongoDB connection established")
    notes_controller = NotesController(db, socketio)
    chat_controller = ChatController(db)
    transcription_controller = TranscriptionController(db)
    project_controller = ProjectController(db, socketio)
except Exception as e:
    print(f"Error connecting to MongoDB: {e}")
import os

print(f"MONGO_URI from environment: {os.environ.get('MONGO_URI')}")

@app.route('/')
def home():
    return jsonify({"message": "Notes API with Authentication is running"})

# ====================== NOTES ENDPOINTS ======================
@app.route('/api/notes', methods=['POST'])
def create_note():
    return notes_controller.create_note()

@app.route('/api/notes/ai', methods=['POST'])
def ai_notes():
    return notes_controller.ai()

@app.route('/api/notes/ai-test', methods=['POST'])
def ai_notes_test():
    try:
        data = request.get_json()
        text = data.get('text', '')
        user_email = data.get('user_email', 'test@example.com')
        user_name = data.get('user_name', 'Test User')
        
        test_note = {
            "title": f"Test Note from Transcript",
            "description": text[:200] + "..." if len(text) > 200 else text,
            "tags": ["test", "ai-generated", "transcript"],
            "color": "blue",
            "deadline": None,
            "type": "daily task",
            "completed": False,
            "comments": [],
            "versions": [],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "in_trash": False,
            "created_by": user_email,
            "created_by_name": user_name,
            "source_transcript_id": "test-transcript"
        }
        
        print("⚠️ Database insertion skipped for now")
        
        mock_ai_output = [
            {
                "title": "Test Note from Transcript",
                "description": text[:200] + "..." if len(text) > 200 else text,
                "tags": ["test", "ai-generated", "transcript"],
                "type": "daily task",
                "deadline": None
            }
        ]
        
        return jsonify({
            "ai_output": json.dumps(mock_ai_output),
            "message": "Test note created successfully"
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/notes', methods=['GET'])
def get_notes():
    return notes_controller.get_notes()

@app.route('/api/notes/<note_id>', methods=['GET'])
def get_note(note_id):
    return notes_controller.get_note(note_id)

@app.route('/api/notes/<note_id>', methods=['PUT'])
def update_note(note_id):
    return notes_controller.update_note(note_id)

@app.route('/api/notes/<note_id>', methods=['DELETE'])
def delete_note(note_id):
    return notes_controller.delete_note(note_id)

@app.route('/api/notes/<note_id>/comments', methods=['POST'])
def add_comment(note_id):
    return notes_controller.add_comment(note_id)

# ====================== MINDMAP COMMENT ENDPOINTS ======================

# Mindmap comment endpoints
@app.route('/api/notes/<note_id>/mindmap-comments', methods=['GET'])
def get_mindmap_comments(note_id):
    return notes_controller.get_mindmap_comments(note_id)

@app.route('/api/notes/<note_id>/mindmap-comments', methods=['POST'])
def add_mindmap_comment(note_id):
    return notes_controller.add_mindmap_comment(note_id)

# New: Edit mindmap comment
@app.route('/api/notes/<note_id>/mindmap-comments/<comment_id>', methods=['PUT'])
def edit_mindmap_comment(note_id, comment_id):
    return notes_controller.edit_mindmap_comment(note_id, comment_id)

# New: Delete mindmap comment
@app.route('/api/notes/<note_id>/mindmap-comments/<comment_id>', methods=['DELETE'])
def delete_mindmap_comment(note_id, comment_id):
    return notes_controller.delete_mindmap_comment(note_id, comment_id)

@app.route('/api/tags', methods=['GET'])
def get_tags():
    return notes_controller.get_tags()

@app.route('/api/notes/<note_id>/complete', methods=['PATCH'])
def toggle_complete(note_id):
    return notes_controller.toggle_complete(note_id)

@app.route('/api/notes/<note_id>/restore', methods=['PATCH'])
def restore_note(note_id):
    return notes_controller.restore_note(note_id)

@app.route('/api/notes/<note_id>/permanent-delete', methods=['DELETE'])
def permanently_delete_note(note_id):
    return notes_controller.permanently_delete_note(note_id)

@app.route('/api/notes/<note_id>/comments/<comment_id>', methods=['PUT'])
def update_comment(note_id, comment_id):
    return notes_controller.update_comment(note_id, comment_id)

@app.route('/api/notes/<note_id>/comments/<comment_id>', methods=['DELETE'])
def delete_comment(note_id, comment_id):
    return notes_controller.delete_comment(note_id, comment_id)

@app.route('/api/notes/<note_id>/versions', methods=['GET'])
def get_note_versions(note_id):
    return notes_controller.get_note_versions(note_id)

@app.route('/api/notes/<note_id>/rollback/<version_id>', methods=['POST'])
def rollback_note(note_id, version_id):
    return notes_controller.rollback_note(note_id, version_id)

@app.route('/api/notes/cleanup-delegated-to', methods=['POST'])
def cleanup_delegated_to():
    return notes_controller.cleanup_delegated_to_field()

# ====================== CHAT ROUTES ======================
@app.route('/api/chat/rooms', methods=['POST'])
def create_chat_room():
    return chat_controller.create_chat_room()

@app.route('/api/chat/rooms', methods=['GET'])
def get_chat_rooms():
    return chat_controller.get_chat_rooms()

@app.route('/api/chat/rooms/<chat_id>/messages', methods=['GET'])
def get_messages(chat_id):
    return chat_controller.get_messages(chat_id)

@app.route('/api/chat/messages', methods=['POST'])
def send_message():
    return chat_controller.send_message()

@app.route('/api/chat/rooms/<chat_id>/read', methods=['PATCH'])
def mark_messages_as_read(chat_id):
    return chat_controller.mark_messages_as_read(chat_id)

@app.route('/api/chat/messages/<message_id>', methods=['DELETE'])
def delete_message(message_id):
    return chat_controller.delete_message(message_id)

@app.route('/api/chat/messages/<message_id>', methods=['PUT'])
def edit_message(message_id):
    return chat_controller.edit_message(message_id)

@app.route('/api/chat/unread', methods=['GET'])
def get_unread_count():
    return chat_controller.get_unread_count()

# ====================== CHAT FILE UPLOAD/DOWNLOAD ======================
@app.route('/api/chat/upload', methods=['POST'])
def upload_chat_file():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
        filename = secure_filename(file.filename)
        unique_name = f"{uuid.uuid4().hex}_{filename}"
        dest_path = os.path.join(CHAT_UPLOAD_DIR, unique_name)
        file.save(dest_path)

        file_size = os.path.getsize(dest_path)
        mime_type = file.mimetype or 'application/octet-stream'

        file_doc = {
            'filename': unique_name,
            'originalName': filename,
            'fileSize': file_size,
            'mimeType': mime_type,
            'url': f"/api/chat/download/{unique_name}",
            'uploaded_at': datetime.utcnow(),
            'uploaded_by': request.form.get('user_email'),
            'uploaded_by_name': request.form.get('user_name'),
        }
        return jsonify(file_doc), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/chat/download/<filename>', methods=['GET'])
def download_chat_file(filename):
    try:
        safe_name = secure_filename(filename)
        path = os.path.join(CHAT_UPLOAD_DIR, safe_name)
        if not os.path.exists(path):
            return jsonify({'error': 'File not found'}), 404
        return send_file(path, as_attachment=True, download_name=safe_name)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ====================== AUDIO HANDLING ======================
@app.route('/upload_audio', methods=['POST'])
def upload_audio():
    if 'audio' not in request.files:
        print('❌ No audio file part in request')
        return jsonify({'error': 'No audio file part'}), 400
    file = request.files['audio']
    if file.filename == '':
        print('❌ No selected file')
        return jsonify({'error': 'No selected file'}), 400

    filename = secure_filename(f"{uuid.uuid4()}.webm")
    filepath = os.path.join(TEMP_AUDIO_DIR, filename)
    file.save(filepath)
    print(f'💾 Saved audio to {filepath}')

    try:
        print('🧠 Loading Whisper model...')
        model = whisper.load_model("large")
        print('🎙️ Transcribing audio...')
        result = model.transcribe(filepath)
        transcript_text = result["text"]
        print('✅ Transcription complete!')
        print(f'📝 Transcript text: {transcript_text}')
    except Exception as e:
        print(f'❌ Transcription failed: {str(e)}')
        try:
            os.remove(filepath)
            print(f'🗑️ Deleted temp file {filepath}')
        except Exception as del_e:
            print(f'⚠️ Could not delete temp file {filepath}: {del_e}')
        return jsonify({'error': f'Transcription failed: {str(e)}'}), 500

    event_id = request.form.get('event_id') or filename.split('.')[0]
    transcript_doc = {
        "file_id": filename.rsplit('.', 1)[0],
        "event_id": event_id,
        "transcript": transcript_text,
        "created_at": datetime.utcnow()
    }
    db = app.config['db']
    db.transcripts.insert_one(transcript_doc)
    print(f'📦 Transcript saved to MongoDB for event_id: {event_id}')

    try:
        print('🔗 Sending transcript to AI for task extraction...')
        print("⚠️ AI processing skipped - will be implemented later")
        ai_data = {"ai_output": "[]", "message": "AI processing not implemented"}
        print(f'🤖 AI response JSON: {ai_data}')
        if "ai_output" in ai_data:
            import json
            try:
                tasks = json.loads(ai_data["ai_output"])
                print(f'📝 Parsed tasks: {tasks}')
                for task in tasks:
                    tags = task.get("tags", [])
                    if isinstance(tags, str):
                        tags = [tags] if tags else []
                    
                    note_type = task.get("type", "daily task")
                    if note_type and note_type not in tags:
                        tags.append(note_type)
                    
                    note_doc = {
                        "title": task.get("title"),
                        "description": task.get("description"),
                        "tags": tags,
                        "color": task.get("color", "blue"),
                        "deadline": task.get("deadline"),
                        "type": note_type,
                        "completed": False,
                        "comments": [],
                        "versions": [],
                        "created_at": datetime.utcnow(),
                        "updated_at": datetime.utcnow(),
                        "in_trash": False,
                        "created_by": "meeting_ai",
                        "created_by_name": "Meeting AI",
                        "source_transcript_id": transcript_doc["file_id"]
                    }
                    db.notes.insert_one(note_doc)
                print("Tasks were made")
            except Exception as e:
                print(f"⚠️ Failed to parse AI output or insert tasks: {e}")
        else:
            print("⚠️ No 'ai_output' in AI response")
    except Exception as e:
        print(f"Task generation failed: {e}")

    try:
        os.remove(filepath)
        print(f'🗑️ Deleted temp file {filepath}')
    except Exception as e:
        print(f'⚠️ Warning: could not delete temp file {filepath}: {e}')

    return jsonify({'message': 'Transcription complete', 'transcript': transcript_text}), 200

# ====================== OTHER ENDPOINTS ======================
@app.route('/api/notes/keyword-note', methods=['POST', 'OPTIONS'])
def keyword_note():
    if request.method == 'OPTIONS':
        return '', 204
    return notes_controller.keyword_note()

@app.route('/api/routine-tasks', methods=['POST'])
def create_routine_task():
    """Create a routine task specifically"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        # Ensure it's marked as a routine task
        data['type'] = 'routine task'
        if not data.get('tags'):
            data['tags'] = []
        if 'routine task' not in data['tags']:
            data['tags'].append('routine task')
        if 'routine' not in data['tags']:
            data['tags'].append('routine')
            
        # Set default values for routine tasks
        if not data.get('color'):
            data['color'] = 'blue'
        if 'completed' not in data:
            data['completed'] = False
            
        return notes_controller.create_note()
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/routine-tasks', methods=['GET'])
def get_routine_tasks():
    """Get all routine tasks"""
    try:
        # Filter for routine tasks only
        from flask import request
        from copy import deepcopy
        
        # Create a modified request with routine task filter
        original_args = request.args
        modified_args = dict(original_args)
        modified_args['filter_type'] = 'routine task'
        
        # Temporarily modify request.args
        request.args = modified_args
        response = notes_controller.get_notes()
        request.args = original_args
        
        return response
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/notifications/deadlines', methods=['GET'])
def get_deadline_notifications():
    try:
        user_email = request.args.get('user_email')
        if not user_email:
            return jsonify({"error": "User email is required"}), 400
        
        from datetime import datetime, timedelta
        now = datetime.now()
        five_minutes_from_now = now + timedelta(minutes=5)
        
        notes_with_deadlines = notes_controller.notes_collection.find({
            "deadline": {
                "$gte": now,
                "$lte": five_minutes_from_now
            },
            "completed": False,
            "in_trash": False,
            "created_by": user_email
        })
        
        ai_notes_with_deadlines = transcription_controller.ai_notes_collection.find({
            "processed_notes.deadline": {
                "$gte": now.isoformat(),
                "$lte": five_minutes_from_now.isoformat()
            },
            "in_trash": False,
            "created_by": user_email
        })
        
        notifications = []
        
        for note in notes_with_deadlines:
            if note.get('deadline'):
                deadline_date = note['deadline']
                time_until_deadline = (deadline_date - now).total_seconds() / 60
                
                if 0 < time_until_deadline <= 5:
                    notifications.append({
                        "id": f"note_{note['_id']}_{int(deadline_date.timestamp())}",
                        "type": "note_deadline",
                        "title": "Note Deadline Alert",
                        "message": f'"{note["title"]}" is due in {int(time_until_deadline)} minutes',
                        "deadline": deadline_date.isoformat(),
                        "type": note.get('type', 'daily task'),
                        "item_id": str(note['_id']),
                        "timestamp": now.isoformat()
                    })
        
        for transcription in ai_notes_with_deadlines:
            if transcription.get('processed_notes'):
                for index, ai_note in enumerate(transcription['processed_notes']):
                    if ai_note.get('deadline'):
                        try:
                            deadline_date = datetime.fromisoformat(ai_note['deadline'].replace('Z', ''))
                            time_until_deadline = (deadline_date - now).total_seconds() / 60
                            
                            if 0 < time_until_deadline <= 5:
                                notifications.append({
                                    "id": f"ai_note_{transcription['_id']}_{index}_{int(deadline_date.timestamp())}",
                                    "type": "ai_note_deadline",
                                    "title": "AI Note Deadline Alert",
                                    "message": f'"{ai_note["title"]}" is due in {int(time_until_deadline)} minutes',
                                    "deadline": deadline_date.isoformat(),
                                    "type": ai_note.get('type', 'daily task'),
                                    "item_id": str(transcription['_id']),
                                    "timestamp": now.isoformat()
                                })
                        except (ValueError, TypeError):
                            continue
        
        return jsonify({"notifications": notifications}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/transcriptions', methods=['POST', 'OPTIONS'])
def save_transcription():
    if request.method == 'OPTIONS':
        return '', 204
    return transcription_controller.save_transcription()

@app.route('/api/transcriptions', methods=['GET'])
def get_transcriptions():
    return transcription_controller.get_transcriptions()

@app.route('/api/transcriptions/<transcription_id>', methods=['DELETE'])
def delete_transcription(transcription_id):
    return transcription_controller.delete_transcription(transcription_id)

@app.route('/api/transcriptions/<transcription_id>/permanent-delete', methods=['DELETE'])
def permanently_delete_transcription(transcription_id):
    return transcription_controller.permanently_delete_transcription(transcription_id)

@app.route('/api/transcriptions/<transcription_id>/restore', methods=['PATCH'])
def restore_transcription(transcription_id):
    return transcription_controller.restore_transcription(transcription_id)

@app.route('/api/transcriptions/<transcription_id>/to-notes', methods=['POST'])
def add_transcription_to_notes(transcription_id):
    return transcription_controller.add_to_notes(transcription_id)

@app.route('/api/transcribe', methods=['POST'])
def api_transcribe():
    return upload_audio()

@app.route('/api/migrate/notes-tags', methods=['POST'])
def migrate_notes_tags():
    try:
        from pymongo import MongoClient
        import datetime
        
        client = MongoClient('mongodb://localhost:27017/')
        db = client['notes_app']
        notes_collection = db.notes
        
        notes = list(notes_collection.find({}))
        updated_count = 0
        
        for note in notes:
            note_type = note.get('type', 'daily task')
            current_tags = note.get('tags', [])
            
            if isinstance(current_tags, str):
                current_tags = [current_tags] if current_tags else []
            elif not isinstance(current_tags, list):
                current_tags = []
            
            if note_type and note_type not in current_tags:
                current_tags.append(note_type)
                
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
        
        return jsonify({
            'message': 'Migration completed successfully',
            'total_notes': len(notes),
            'updated_notes': updated_count
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/summarize_transcription', methods=['POST'])
def summarize_transcription():
    try:
        data = request.get_json()
        transcript = data.get('transcript', '')
        if not transcript:
            return jsonify({'error': 'Transcript is required'}), 400
        summary_points = [line.strip() for line in transcript.split('.') if line.strip()]
        summary = '\n'.join(f'- {point}' for point in summary_points)
        return jsonify({'summary': summary}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ====================== PROJECT ROUTES ======================
@app.route('/api/projects', methods=['POST'])
def create_project():
    return project_controller.create_project()

# ====================== HIERARCHICAL MINDMAP ENDPOINTS ======================
@app.route('/api/mindmap/hierarchical/projects', methods=['GET'])
def get_projects_mindmap():
    return hierarchical_mindmap_controller.build_projects_mindmap()

@app.route('/api/mindmap/hierarchical/projects', methods=['POST'])
def save_project_mindmap_node():
    return hierarchical_mindmap_controller.save_project_node()

@app.route('/api/mindmap/hierarchical/people', methods=['GET'])
def get_people_mindmap():
    return hierarchical_mindmap_controller.build_people_mindmap()

@app.route('/api/projects', methods=['GET'])
def get_projects():
    return project_controller.get_projects()

@app.route('/api/projects/<project_id>', methods=['GET'])
def get_project(project_id):
    return project_controller.get_project(project_id)

@app.route('/api/projects/<project_id>', methods=['PUT'])
def update_project(project_id):
    return project_controller.update_project(project_id)

@app.route('/api/projects/<project_id>', methods=['DELETE'])
def delete_project(project_id):
    return project_controller.delete_project(project_id)

@app.route('/api/projects/<project_id>/notes', methods=['GET'])
def get_project_notes(project_id):
    return project_controller.get_project_notes(project_id)

@app.route('/api/projects/detect', methods=['POST'])
def detect_projects():
    return project_controller.detect_projects_in_text()

@app.route('/api/projects/users', methods=['GET'])
def get_available_users():
    return project_controller.get_available_users()

# ====================== PEOPLE ENDPOINTS ======================
@app.route('/api/people', methods=['GET'])
def get_people():
    try:
        db = app.config['db']
        people = list(db.people.find({}, {"_id": 0, "name": 1}))
        return jsonify({"people": people}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/people', methods=['POST'])
def add_person():
    try:
        db = app.config['db']
        data = request.get_json()
        name = data.get("name", "").strip()
        if not name:
            return jsonify({"error": "Empty name"}), 400
        if db.people.find_one({"name": name}):
            return jsonify({"created": False, "message": "Already exists"}), 200
        db.people.insert_one({"name": name})
        return jsonify({"created": True, "name": name}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/users', methods=['GET'])
def get_users():
    db = app.config['db']
    users = list(db.users.find())
    for user in users:
        user['_id'] = str(user['_id'])
        user.pop('password', None)
        user.pop('temp_password', None)
    return jsonify({'users': users}), 200

@app.route('/api/analytics/users', methods=['GET'])
def get_user_analytics():
    try:
        if db is None:
            return jsonify({'error': 'Database not available'}), 500
        
        user_role = request.args.get('user_role') or request.headers.get('X-User-Role')
        
        if user_role != 'admin':
            return jsonify({'error': 'Access denied: Admin role required'}), 403
        
        total_users = db.users.count_documents({})
        active_users = db.users.count_documents({'last_login': {'$exists': True, '$ne': None}})
        
        from datetime import timedelta
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_activity = db.users.count_documents({
            'last_login': {'$gte': thirty_days_ago}
        })
        
        total_notes = db.notes.count_documents({})
        completed_notes = db.notes.count_documents({'completed': True})
        active_notes = db.notes.count_documents({'completed': False, 'in_trash': False})
        
        role_distribution = list(db.users.aggregate([
            {'$group': {'_id': '$role', 'count': {'$sum': 1}}}
        ]))
        
        analytics_data = {
            'user_stats': {
                'total_users': total_users,
                'active_users': active_users,
                'recent_activity': recent_activity
            },
            'note_stats': {
                'total_notes': total_notes,
                'completed_notes': completed_notes,
                'active_notes': active_notes
            },
            'role_distribution': role_distribution
        }
        
        return jsonify(analytics_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/mindmap', methods=['POST'])
def save_mindmap_node():
    return mindmap_controller.save_node()

@app.route('/api/mindmap', methods=['GET'])
def get_mindmap_nodes():
    return mindmap_controller.get_nodes()

@socketio.on('add_node')
def handle_add_node(data):
    db.mindmap_nodes.update_one({'id': data['id']}, {'$set': data}, upsert=True)
    emit('node_added', data, broadcast=True)

@socketio.on('update_node')
def handle_update_node(data):
    db.mindmap_nodes.update_one({'id': data['id']}, {'$set': data}, upsert=True)
    emit('node_updated', data, broadcast=True)

@socketio.on('delete_node')
def handle_delete_node(data):
    db.mindmap_nodes.delete_one({'id': data['id']})
    emit('node_deleted', data, broadcast=True)

if __name__ == '__main__':
    if not os.path.exists(TEMP_AUDIO_DIR):
        os.makedirs(TEMP_AUDIO_DIR)
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)