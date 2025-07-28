from flask import request, jsonify
from bson import ObjectId
import datetime
import json
import os
import google.generativeai as genai

from controllers.CommentsController import CommentsController
from controllers.VersionsController import VersionsController

class NotesController:
    def edit_mindmap_comment(self, note_id, comment_id):
        try:
            data = request.get_json()
            update_fields = {}
            if 'comment_text' in data:
                update_fields['comment_text'] = data['comment_text']
            update_fields['updated_at'] = datetime.datetime.utcnow()
            result = self.db.comments.update_one(
                {"_id": ObjectId(comment_id), "note_id": note_id},
                {"$set": update_fields}
            )
            if result.matched_count == 0:
                return jsonify({"error": "Comment not found"}), 404
            updated_comment = self.db.comments.find_one({"_id": ObjectId(comment_id)})
            updated_comment["_id"] = str(updated_comment["_id"])
            return jsonify({"comment": updated_comment}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    def delete_mindmap_comment(self, note_id, comment_id):
        try:
            result = self.db.comments.delete_one({"_id": ObjectId(comment_id), "note_id": note_id})
            if result.deleted_count == 0:
                return jsonify({"error": "Comment not found"}), 404
            return jsonify({"message": "Comment deleted"}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    def get_mindmap_comments(self, note_id):
        try:
            comments = list(self.db.comments.find({"note_id": note_id}))
            for comment in comments:
                comment["_id"] = str(comment["_id"])
            return jsonify({"comments": comments}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    def add_mindmap_comment(self, note_id):
        try:
            data = request.get_json()
            new_comment = {
                "note_id": note_id,
                "author_name": data.get("author_name"),
                "author_email": data.get("author_email"),
                "comment_text": data.get("comment_text"),
                "created_at": datetime.datetime.utcnow(),
                "updated_at": datetime.datetime.utcnow()
            }
            result = self.db.comments.insert_one(new_comment)
            new_comment["_id"] = str(result.inserted_id)
            return jsonify({"comment": new_comment}), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    def __init__(self, db, socketio=None):
        self.db = db
        self.notes_collection = db.notes
        
        # Initialize Gemini client
        api_key = os.getenv('GOOGLE_API_KEY')
        if api_key:
            genai.configure(api_key=api_key)
            self.genai = genai
        else:
            print("Warning: GOOGLE_API_KEY environment variable not set")
            self.genai = None
            
        self.comments_controller = CommentsController(db)
        self.versions_controller = VersionsController(db)
        self.socketio = socketio

    def emit_socket_event(self, event, data):
        if hasattr(self, 'socketio') and self.socketio:
            self.socketio.emit(event, data)

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

    def cleanup_delegated_to_field(self):
        """Remove the delegated_to field from all existing notes and populate assigned_to from projects"""
        try:
            # Remove delegated_to field from all notes
            result = self.notes_collection.update_many(
                {"delegated_to": {"$exists": True}},
                {"$unset": {"delegated_to": ""}}
            )
            
            # Auto-populate assigned_to for notes that have project_id but empty assigned_to
            notes_with_projects = self.notes_collection.find({
                "project_id": {"$exists": True, "$ne": None},
                "$or": [
                    {"assigned_to": {"$exists": False}},
                    {"assigned_to": []},
                    {"assigned_to": None}
                ]
            })
            
            updated_count = 0
            for note in notes_with_projects:
                try:
                    project = self.db.projects.find_one({"_id": ObjectId(note['project_id'])})
                    if project and project.get('assigned_users'):
                        assigned_users = [user.strip() for user in project['assigned_users'] if user.strip()]
                        if assigned_users:
                            self.notes_collection.update_one(
                                {"_id": note['_id']},
                                {"$set": {"assigned_to": assigned_users}}
                            )
                            updated_count += 1
                except Exception as e:
                    print(f"Error updating note {note['_id']}: {e}")
                    continue
            
            return jsonify({
                "message": "Cleanup completed successfully",
                "delegated_to_removed": result.modified_count,
                "assigned_to_populated": updated_count
            }), 200
            
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    def check_duplicate_note(self, title, description, user_email, within_hours=24):
        try:
            time_threshold = datetime.datetime.now() - datetime.timedelta(hours=within_hours)
            
            exact_title_match = self.notes_collection.find_one({
                "title": title,
                "created_by": user_email,
                "created_at": {"$gte": time_threshold},
                "in_trash": False
            })
            
            if exact_title_match:
                return True, "Note with same title already exists"
            
            similar_content = self.notes_collection.find_one({
                "description": description,
                "created_by": user_email,
                "created_at": {"$gte": time_threshold},
                "in_trash": False
            })
            
            if similar_content:
                return True, "Note with similar content already exists"
            
            title_words = title.lower().split()
            if len(title_words) > 2:
                for existing_note in self.notes_collection.find({
                    "created_by": user_email,
                    "created_at": {"$gte": time_threshold},
                    "in_trash": False
                }):
                    existing_title_words = existing_note.get("title", "").lower().split()
                    if len(existing_title_words) > 2:
                        common_words = set(title_words) & set(existing_title_words)
                        similarity = len(common_words) / max(len(title_words), len(existing_title_words))
                        if similarity >= 0.8:
                            return True, "Note with very similar title already exists"
            
            return False, None
        except Exception as e:
            print(f"Error checking for duplicates: {e}")
            return False, None

    def create_note(self):
        try:
            data = request.get_json()
            if not data.get('title') or not data.get('description'):
                return jsonify({"error": "Title and description are required"}), 400
            user_email = request.args.get('user_email') or data.get('user_email')
            user_name = request.args.get('user_name') or data.get('user_name')
            if not user_name:
                user_name = 'Unknown User'
            
            is_duplicate, duplicate_message = self.check_duplicate_note(
                data.get('title'), 
                data.get('description'), 
                user_email
            )
            
            if is_duplicate:
                return jsonify({
                    "error": "Duplicate note detected",
                    "message": duplicate_message,
                    "duplicate": True
                }), 409
            
            tags = data.get('tags', [])
            if isinstance(tags, str):
                tags = [tags] if tags else []
            
            note_type = data.get('type')
            if not note_type:
                note_content = f"{data.get('title', '')} {data.get('description', '')}".strip()
                if note_content:
                    note_type = self.classify_note_with_gemini(note_content)
                else:
                    note_type = 'daily task'
            
            if note_type and note_type not in tags:
                tags.append(note_type)
            
            deadline = data.get('deadline')
            if deadline and isinstance(deadline, str):
                try:
                    deadline = datetime.datetime.fromisoformat(deadline.replace('Z', '+00:00'))
                except ValueError:
                    deadline = None
            
            assigned_to = data.get('assigned_to', [])
            if assigned_to and isinstance(assigned_to, list):
                assigned_to = [assignee.strip() for assignee in assigned_to if assignee.strip()]
            
            # Auto-populate assigned_to from project if project_id is provided and assigned_to is empty
            project_id = data.get('project_id')
            if project_id and not assigned_to:
                try:
                    project = self.db.projects.find_one({"_id": ObjectId(project_id)})
                    if project and project.get('assigned_users'):
                        assigned_to = [user.strip() for user in project['assigned_users'] if user.strip()]
                except Exception as e:
                    print(f"Error fetching project users: {e}")
                    # Continue with empty assigned_to if project lookup fails

            new_note = {
                "_id": ObjectId(),
                "title": data.get('title'),
                "description": data.get('description'),
                "color": data.get('color', 'blue'),
                "tags": tags,
                "deadline": deadline,
                "type": note_type,
                "project_id": data.get('project_id'),
                "assigned_to": assigned_to,
                "versions": [],
                "comments": [],
                "completed": data.get('completed', False),
                "in_trash": data.get('in_trash', False),
                "created_at": datetime.datetime.now(),
                "updated_at": datetime.datetime.now(),
                "created_by": user_email,
                "created_by_name": user_name,
                "source": data.get('source', 'manual'),
                "last_editor": user_email,
                "last_editor_name": user_name
            }
            result = self.notes_collection.insert_one(new_note)
            new_note['_id'] = str(result.inserted_id)
            self.emit_socket_event('note_created', {'note': self.parse_json(new_note)})
            return jsonify({"message": "Note created successfully", "note": new_note}), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    def get_notes(self):
        try:
            tag = request.args.get('tag')
            view = request.args.get('view', 'active')
            user_email = request.args.get('user_email')
            user_role = request.args.get('user_role')
            filter_created_start = request.args.get('filter_created_start')
            filter_created_end = request.args.get('filter_created_end')
            filter_deadline_start = request.args.get('filter_deadline_start')
            filter_deadline_end = request.args.get('filter_deadline_end')
            filter_type = request.args.get('filter_type')
            filter_created_by = request.args.get('filter_created_by')
            filter_timeframe = request.args.get('filter_timeframe')
            sort_field = request.args.get('sort_field', 'updated_at')
            sort_direction = request.args.get('sort_direction', 'desc')
            search_query = request.args.get('search_query')

            query = {}
            if view == 'active':
                query['completed'] = False
                query['in_trash'] = False
            elif view == 'completed':
                query['completed'] = True
                query['in_trash'] = False
            elif view == 'trash':
                query['in_trash'] = True
            if tag and tag != 'all':
                query['tags'] = tag
            if filter_type and filter_type != 'all':
                query['type'] = filter_type
            if filter_created_by:
                query['created_by'] = filter_created_by
            if filter_created_start or filter_created_end:
                date_query = {}
                if filter_created_start:
                    try:
                        if 'T' in filter_created_start:
                            start_date = datetime.datetime.fromisoformat(filter_created_start.replace('Z', ''))
                        else:
                            start_date = datetime.datetime.strptime(filter_created_start, '%Y-%m-%d')
                        date_query['$gte'] = start_date
                    except (ValueError, TypeError):
                        pass
                if filter_created_end:
                    try:
                        if 'T' in filter_created_end:
                            end_date = datetime.datetime.fromisoformat(filter_created_end.replace('Z', ''))
                        else:
                            end_date = datetime.datetime.strptime(filter_created_end, '%Y-%m-%d')
                            end_date = end_date.replace(hour=23, minute=59, second=59)
                        date_query['$lte'] = end_date
                    except (ValueError, TypeError):
                        pass
                if date_query:
                    query['created_at'] = date_query
            if filter_deadline_start or filter_deadline_end:
                deadline_query = {}
                if filter_deadline_start:
                    try:
                        if 'T' in filter_deadline_start:
                            start_date = datetime.datetime.fromisoformat(filter_deadline_start.replace('Z', ''))
                        else:
                            start_date = datetime.datetime.strptime(filter_deadline_start, '%Y-%m-%d')
                        deadline_query['$gte'] = start_date
                    except (ValueError, TypeError):
                        pass
                if filter_deadline_end:
                    try:
                        if 'T' in filter_deadline_end:
                            end_date = datetime.datetime.fromisoformat(filter_deadline_end.replace('Z', ''))
                        else:
                            end_date = datetime.datetime.strptime(filter_deadline_end, '%Y-%m-%d')
                            end_date = end_date.replace(hour=23, minute=59, second=59)
                        deadline_query['$lte'] = end_date
                    except (ValueError, TypeError):
                        pass
                if deadline_query:
                    query['deadline'] = deadline_query
            if filter_timeframe and filter_timeframe != 'all':
                now = datetime.datetime.now()
                if filter_timeframe == 'today':
                    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
                    query['created_at'] = {'$gte': today_start}
                elif filter_timeframe == 'week':
                    week_start = now - datetime.timedelta(days=7)
                    query['created_at'] = {'$gte': week_start}
                elif filter_timeframe == 'month':
                    month_start = now - datetime.timedelta(days=30)
                    query['created_at'] = {'$gte': month_start}
            if search_query:
                search_regex = {'$regex': search_query, '$options': 'i'}
                query['$or'] = [
                    {'title': search_regex},
                    {'description': search_regex},
                    {'tags': search_regex},
                    {'created_by_name': search_regex}
                ]
            sort_dir = 1 if sort_direction == 'asc' else -1
            valid_sort_fields = ['updated_at', 'created_at', 'deadline', 'title']
            if sort_field not in valid_sort_fields:
                sort_field = 'updated_at'
            notes_cursor = self.notes_collection.find(query).sort(sort_field, sort_dir)
            notes = list(notes_cursor)
            parsed_notes = self.parse_json(notes)
            return jsonify({"notes": parsed_notes}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    def get_note(self, note_id):
        try:
            note = self.notes_collection.find_one({"_id": ObjectId(note_id)})
            if not note:
                return jsonify({"error": "Note not found"}), 404
            parsed_note = self.parse_json(note)
            return jsonify({"note": parsed_note}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    def update_note(self, note_id):
        try:
            data = request.get_json()
            if not data.get('title') and not data.get('description'):
                return jsonify({"error": "At least title or description is required for update"}), 400
            
            update_data = {
                "updated_at": datetime.datetime.now(),
                "last_editor": request.args.get('user_email') or data.get('user_email'),
                "last_editor_name": request.args.get('user_name') or data.get('user_name')
            }
            
            for field in ['title', 'description', 'color', 'tags', 'deadline', 'type', 'project_id', 'assigned_to', 'completed', 'in_trash']:
                if field in data:
                    if field == 'assigned_to' and data['assigned_to'] and isinstance(data['assigned_to'], list):
                        update_data[field] = [assignee.strip() for assignee in data['assigned_to'] if assignee.strip()]
                    else:
                        update_data[field] = data[field]
            
            # Auto-populate assigned_to from project if project_id is being updated and assigned_to is not explicitly set
            if 'project_id' in data and 'assigned_to' not in data:
                try:
                    project = self.db.projects.find_one({"_id": ObjectId(data['project_id'])})
                    if project and project.get('assigned_users'):
                        update_data['assigned_to'] = [user.strip() for user in project['assigned_users'] if user.strip()]
                except Exception as e:
                    print(f"Error fetching project users for update: {e}")
                    # Continue without auto-populating if project lookup fails
            
            result = self.notes_collection.update_one(
                {"_id": ObjectId(note_id)},
                {"$set": update_data}
            )
            if result.matched_count == 0:
                return jsonify({"error": "Note not found"}), 404
            
            updated_note = self.notes_collection.find_one({"_id": ObjectId(note_id)})
            parsed_note = self.parse_json(updated_note)
            self.emit_socket_event('note_updated', {'note': parsed_note, 'note_id': note_id})
            return jsonify({"message": "Note updated successfully", "note": parsed_note}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    def delete_note(self, note_id):
        try:
            result = self.notes_collection.update_one(
                {"_id": ObjectId(note_id)},
                {"$set": {"in_trash": True, "updated_at": datetime.datetime.now()}}
            )
            if result.matched_count == 0:
                return jsonify({"error": "Note not found"}), 404
            return jsonify({"message": "Note moved to trash"}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    def permanently_delete_note(self, note_id):
        try:
            result = self.notes_collection.delete_one({"_id": ObjectId(note_id)})
            if result.deleted_count == 0:
                return jsonify({"error": "Note not found"}), 404
            return jsonify({"message": "Note permanently deleted"}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    def restore_note(self, note_id):
        try:
            result = self.notes_collection.update_one(
                {"_id": ObjectId(note_id)},
                {"$set": {"in_trash": False, "updated_at": datetime.datetime.now()}}
            )
            if result.matched_count == 0:
                return jsonify({"error": "Note not found"}), 404
            return jsonify({"message": "Note restored from trash"}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    def add_comment(self, note_id):
        return self.comments_controller.add_comment(note_id)

    def update_comment(self, note_id, comment_id):
        return self.comments_controller.update_comment(note_id, comment_id)

    def get_tags(self):
        try:
            tags = self.notes_collection.distinct('tags')
            return jsonify({"tags": tags}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    def toggle_complete(self, note_id):
        try:
            note = self.notes_collection.find_one({"_id": ObjectId(note_id)})
            if not note:
                return jsonify({"error": "Note not found"}), 404
            new_status = not note.get('completed', False)
            self.notes_collection.update_one(
                {"_id": ObjectId(note_id)},
                {"$set": {"completed": new_status, "updated_at": datetime.datetime.now()}}
            )
            updated_note = self.notes_collection.find_one({"_id": ObjectId(note_id)})
            return jsonify({
                "message": f"Note marked as {'completed' if new_status else 'incomplete'}",
                "completed": new_status
            }), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    def delete_comment(self, note_id, comment_id):
        return self.comments_controller.delete_comment(note_id, comment_id)

    def get_note_versions(self, note_id):
        return self.versions_controller.get_note_versions(note_id)

    def rollback_note(self, note_id, version_id):
        return self.versions_controller.rollback_note(note_id, version_id)

    def classify_note_with_gemini(self, note_content):
        try:
            # Check if Gemini is properly initialized
            if not self.genai:
                print("[Warning] Gemini not initialized, skipping classification")
                return "daily task"  # Default classification
                
            prompt = f"""
            Analyze the following note content and classify it as either "daily task" or "project".
            
            Classification criteria:
            - "daily task": Routine tasks, daily activities, short-term tasks, personal tasks, meetings, appointments, errands, quick actions, simple tasks, immediate actions, single-step tasks, routine work, daily chores, simple reminders
            - "project": Long-term initiatives, complex tasks, multi-step processes, strategic work, ongoing initiatives, team projects, major deliverables, complex work, multi-phase work, collaborative tasks, strategic initiatives, complex deliverables
            
            Examples:
            - "Call John about meeting" → daily task
            - "Pay bills" → daily task  
            - "Buy groceries" → daily task
            - "Schedule dentist appointment" → daily task
            - "Develop new website" → project
            - "Launch marketing campaign" → project
            - "Implement new CRM system" → project
            - "Plan quarterly strategy" → project
            
            Note content: "{note_content}"
            
            Respond with ONLY one word: "daily task" or "project"
            """
            
            model = self.genai.GenerativeModel('gemini-2.0-flash')
            response = model.generate_content(prompt)
            
            if response and response.text:
                classification = response.text.strip().lower()
                print(f"[AI] Raw classification response: '{classification}'")
                
                # Clean up the response to handle potential formatting issues
                classification = classification.replace('"', '').replace("'", '')
                classification = classification.replace('```', '').strip()
                
                # Check for project keyword anywhere in the response
                if "project" in classification:
                    return "project"
                else:
                    return "daily task"
            else:
                print("[AI] No classification response received, using default")
                return "daily task"
                
        except Exception as e:
            print(f"Note classification error: {e}")
            return "daily task"

    def ai(self):
        from flask import request, jsonify
        import json
        db = self.db
        data = request.get_json()
        text = data.get('text', '')
        user_email = data.get('user_email', 'meeting_ai')
        user_name = data.get('user_name', 'Meeting AI')
        
        return self._process_ai_extraction(text, user_email, user_name)
    
    def _process_ai_extraction(self, text, user_email='meeting_ai', user_name='Meeting AI'):
        import json
        db = self.db

        print(f"[AI] Received text: {text[:100]}...")

        prompt = f"""
        You are an assistant that extracts actionable items, plans, events, or intentions from any conversation or meeting transcript. 
        This includes work tasks, personal plans, social events, errands, or anything the speaker intends to do.

        For example, given this transcript:
        "Yeah, and also I forgot to mention, I've got an important lunch with my best friend who has just reached Chennai from Perth. So, yeah, I've got to go take him for lunch, you know, like get to know how he spent his last semester in Perth doing mechanical engineering. And yeah, obviously have a bit fun too. Like we are planning on going for pickleball. So that's there. But then, yeah, meeting him is one of the highest priority."
        
        You should return:
        [
          {{
            "title": "Lunch with best friend from Perth",
            "description": "Meet my best friend who just arrived from Perth, take him for lunch, and catch up.",
            "tags": ["personal", "friend", "lunch", "perth", "chennai", "mechanical-engineering", "reunion"],
            "deadline": "2024-06-07T15:00:00"
          }},
          {{
            "title": "Play pickleball with friend",
            "description": "Plan to play pickleball with my friend after lunch.",
            "tags": ["personal", "pickleball", "friend", "sports", "recreation"],
            "deadline": null
          }}
        ]

        IMPORTANT: For the deadline field, ALWAYS return either a valid ISO 8601 datetime string (e.g., "2024-06-07T15:00:00") if a specific date/time is mentioned, or null if not specified. Do NOT use any other format.

        Include relevant tags that provide context about:
        - Project names, client names, or company names mentioned
        - User names, team members, or stakeholders involved
        - Technologies, tools, or platforms referenced
        - Locations, venues, or meeting places
        - Categories like "urgent", "important", "follow-up", "review", etc.
        - Any specific context that would help with organization and search

        Note: Do NOT include a "type" field in your response. The note type will be automatically classified by our system.

        Now, extract all such items from the following transcript. Only include actionable items. Ignore conversational or irrelevant content. Output ONLY a valid JSON array, no extra text.

        Meeting transcript:
        {text}
        """

        # Check if Gemini is properly initialized
        if self.genai is None:
            print("[AI] Gemini not initialized, cannot process extraction")
            return jsonify({"error": "AI service not available"}), 500
            
        try:
            # Use Gemini for content generation
            model = self.genai.GenerativeModel('gemini-2.0-flash')
            response = model.generate_content(prompt)
            ai_response = response.text.strip() if response.text else ""
        except Exception as e:
            print(f"[AI] Gemini processing error: {e}")
            ai_response = ""
            
        if ai_response:
            ai_response = ai_response.strip()
        else:
            ai_response = ""
        print("[AI] Raw response:", ai_response)
        try:
            # Handle potential formatting issues in the response
            # Replace single quotes with double quotes for valid JSON
            ai_response = ai_response.replace("'", '"')
            # Remove any code block markers that might be in the response
            ai_response = ai_response.replace('```json', '').replace('```', '')
            # Strip any leading/trailing whitespace
            ai_response = ai_response.strip()
            
            tasks = json.loads(ai_response)
            if not isinstance(tasks, list):
                raise ValueError("AI did not return a list")
        except Exception as e:
            print(f"[AI] Extraction failed: {e}")
            tasks = []
        print(f"[AI] Extracted tasks: {tasks}")

        preview_notes = []
        saved_notes = []
        
        for task in tasks:
            tags = task.get("tags", [])
            if isinstance(tags, str):
                tags = [tags] if tags else []

            deadline = task.get("deadline")
            if isinstance(deadline, str):
                try:
                    deadline_dt = datetime.datetime.fromisoformat(deadline)
                except Exception:
                    deadline_dt = None
            else:
                deadline_dt = None
            
            note_content = f"{task.get('title', '')} {task.get('description', '')}".strip()
            if note_content:
                note_type = self.classify_note_with_gemini(note_content)
                print(f"[AI] Classified note '{task.get('title', '')}' as: {note_type}")
            else:
                note_type = "daily task"
            
            if note_type and note_type not in tags:
                tags.append(note_type)
            
            note_obj = {
                "title": task.get("title"),
                "description": task.get("description"),
                "tags": tags,
                "color": task.get("color", "blue"),
                "deadline": deadline,
                "type": note_type
            }
            
            is_duplicate, duplicate_message = self.check_duplicate_note(
                task.get("title"),
                task.get("description"),
                user_email,
                within_hours=48
            )
            
            if is_duplicate:
                print(f"[AI] Skipping duplicate note: {task.get('title')} - {duplicate_message}")
                continue
            
            preview_notes.append(note_obj)
            
            note_doc = {
                "_id": ObjectId(),
                "title": task.get("title"),
                "description": task.get("description"),
                "tags": tags,
                "color": task.get("color", "blue"),
                "deadline": deadline_dt,
                "type": note_type,
                "project_id": None,
                "assigned_to": [],
                "delegated_to": [],
                "completed": False,
                "comments": [],
                "versions": [],
                "created_at": datetime.datetime.utcnow(),
                "updated_at": datetime.datetime.utcnow(),
                "in_trash": False,
                "created_by": user_email,
                "created_by_name": user_name,
                "source_transcript_id": None,
                "source": "chat"
            }
            saved_notes.append(note_doc)

        return jsonify({
            "notes": preview_notes,
            "ai_output": json.dumps(tasks), 
            "message": f"Extracted {len(preview_notes)} notes from text"
        }), 200

    def keyword_note(self):
        try:
            data = request.get_json()
            if not data.get('text'):
                return jsonify({"error": "Text is required"}), 400
            text = data.get('text')
            language = data.get('language', 'en-US')
            language_name = data.get('language_name', 'English')
            user_email = data.get('user_email', '')
            user_name = data.get('user_name', '')
            trigger_type = data.get('trigger_type', 'keyword')
            meeting_date = datetime.datetime.now().strftime('%Y-%m-%d')
            prompt = f"""
You are processing a text segment that was flagged by a keyword trigger (like "notes", "remember", "important", etc.).
The user wants to capture this specific information as a note.
Analyze the following text segment and determine if it contains actionable information worthy of a note:

Text segment: "{text}"

If this text contains:
- A task or action item
- Important information to remember
- A decision or commitment
- Contact information
- A deadline or appointment
- Any other significant information

Then create a single note with:
1. A clear, descriptive title
2. Essential details in the description
3. Relevant tags (include project names, user names, technologies, locations, categories)
4. A suitable color
5. Deadline if mentioned (YYYY-MM-DD format)

IMPORTANT: Include relevant tags that provide context about:
- Project names, client names, or company names mentioned
- User names, team members, or stakeholders involved
- Technologies, tools, or platforms referenced
- Locations, venues, or meeting places
- Categories like "urgent", "important", "follow-up", "review", etc.

Note: Do NOT include a "type" field in your response. The note type will be automatically classified by our system.

Output MUST be ONLY a valid JSON object (not an array) with no additional text:
{{
    "title": "Clear note title",
    "description": "Essential details from the text segment",
    "deadline": "YYYY-MM-DD or null",
    "tags": ["Keyword-Note", "Relevant", "Categories", "Project-Name", "User-Name"],
    "color": "blue"
}}

If the text segment does NOT contain actionable or important information, return:
{{"actionable": false}}

Today's date is {meeting_date}.
Language context: {language_name}
"""
            # Check if Gemini is properly initialized
            if not self.genai:
                print("[Warning] Gemini not initialized, skipping AI processing")
                return jsonify({"error": "AI service not available"}), 500
                
            try:
                model = self.genai.GenerativeModel('gemini-1.5-flash')
                response = model.generate_content(prompt)
                ai_response = response.text
            except Exception as e:
                print(f"[Error] Gemini processing error: {e}")
                return jsonify({"error": "Error processing with AI service"}), 500
            if ai_response:
                ai_response = ai_response.strip()
            else:
                ai_response = ""
            try:
                note_data = json.loads(ai_response)
                if note_data.get('actionable') == False:
                    return jsonify({"message": "No actionable content found"}), 200
                
                tags = note_data.get('tags', ['Keyword-Note', language_name])
                note_content = f"{note_data.get('title', '')} {note_data.get('description', '')}".strip()
                if note_content:
                    note_type = self.classify_note_with_gemini(note_content)
                else:
                    note_type = "daily task"
                
                if note_type and note_type not in tags:
                    tags.append(note_type)
                
                deadline = note_data.get('deadline')
                if deadline and isinstance(deadline, str):
                    try:
                        deadline_dt = datetime.datetime.strptime(deadline, '%Y-%m-%d')
                    except ValueError:
                        deadline_dt = None
                else:
                    deadline_dt = None
                
                enhanced_note = {
                    "_id": ObjectId(),
                    "title": note_data.get('title', f'Keyword Note ({language_name})'),
                    "description": note_data.get('description', text),
                    "deadline": deadline_dt,
                    "tags": tags,
                    "color": note_data.get('color', 'blue'),
                    "type": note_type,
                    "project_id": None,
                    "assigned_to": [],
                    "delegated_to": [],
                    "created_by": user_email,
                    "created_by_name": user_name,
                    "trigger_type": trigger_type,
                    "source_text": text,
                    "language": language,
                    "language_name": language_name,
                    "source": "mic",
                    "created_at": datetime.datetime.now(),
                    "updated_at": datetime.datetime.now(),
                    "completed": False,
                    "in_trash": False,
                    "versions": [],
                    "comments": [],
                    "last_editor": user_email,
                    "last_editor_name": user_name
                }
                result = self.notes_collection.insert_one(enhanced_note)
                enhanced_note['_id'] = str(result.inserted_id)
                return jsonify({"note": self.parse_json(enhanced_note)}), 200
            except json.JSONDecodeError:
                note_content = f"Keyword Note ({language_name}): {text}"
                note_type = self.classify_note_with_gemini(note_content)
                tags = ["Keyword-Note", language_name, note_type]
                simple_note = {
                    "_id": ObjectId(),
                    "title": f"Keyword Note ({language_name})",
                    "description": text,
                    "deadline": None,
                    "tags": tags,
                    "color": "blue",
                    "type": note_type,
                    "project_id": None,
                    "assigned_to": [],
                    "delegated_to": [],
                    "created_by": user_email,
                    "created_by_name": user_name,
                    "trigger_type": trigger_type,
                    "source_text": text,
                    "language": language,
                    "language_name": language_name,
                    "source": "mic",
                    "created_at": datetime.datetime.now(),
                    "updated_at": datetime.datetime.now(),
                    "completed": False,
                    "in_trash": False,
                    "versions": [],
                    "comments": [],
                    "last_editor": user_email,
                    "last_editor_name": user_name
                }
                result = self.notes_collection.insert_one(simple_note)
                simple_note['_id'] = str(result.inserted_id)
                return jsonify({"note": self.parse_json(simple_note)}), 200
        except Exception as e:
            return jsonify({"error": f"Keyword note processing failed: {str(e)}"}), 500