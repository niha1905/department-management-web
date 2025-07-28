from flask import request, jsonify
from bson import ObjectId
import datetime

class ProjectController:
    def __init__(self, db, socketio=None):
        self.db = db
        self.projects_collection = db.projects
        self.people_collection = db.people
        self.socketio = socketio

    def parse_json(self, data):
        if isinstance(data, list):
            return [self.parse_json(item) for item in data]
        elif isinstance(data, dict):
            return {
                key: self.parse_json(value)
                if isinstance(value, (dict, list, ObjectId, datetime.datetime))
                else value
                for key, value in data.items()
            }
        elif isinstance(data, ObjectId):
            return str(data)
        elif isinstance(data, datetime.datetime):
            return data.isoformat()
        return data

    def _create_person(self, name, email=None):
        name = name.strip() if name else ''
        email = email.strip() if email else None
        if not name and not email:
            return
        query = {}
        if name:
            query["name"] = name
        if email:
            query["email"] = email
        if not self.people_collection.find_one(query):
            doc = {"created_at": datetime.datetime.now(), "updated_at": datetime.datetime.now()}
            if name:
                doc["name"] = name
            if email:
                doc["email"] = email
            self.people_collection.insert_one(doc)

    def create_project(self):
        try:
            data = request.get_json()
            user_email = data.get('created_by')
            user_name = data.get('created_by_name', 'Unknown')

            if not user_email or not data.get('name'):
                return jsonify({"error": "Project name and user email are required."}), 400

            if self.projects_collection.find_one({"name": data.get('name'), "created_by": user_email, "in_trash": False}):
                return jsonify({"error": "Project with this name already exists"}), 400

            assigned_users = [u.strip() for u in data.get('assigned_users', []) if u.strip()]
            # Lookup users collection for name/email
            users_collection = self.db.users
            for user in assigned_users:
                # If user looks like an email, try to get name
                if "@" in user:
                    user_doc = users_collection.find_one({"email": user})
                    name = user_doc["name"] if user_doc and "name" in user_doc else user
                    self._create_person(name, user)
                else:
                    # Try to get email by name
                    user_doc = users_collection.find_one({"name": user})
                    email = user_doc["email"] if user_doc and "email" in user_doc else None
                    self._create_person(user, email)

            new_project = {
                "name": data.get('name'),
                "description": data.get('description', ''),
                "status": data.get('status', 'active'),
                "priority": data.get('priority', 'medium'),
                "start_date": data.get('start_date'),
                "end_date": data.get('end_date'),
                "assigned_users": assigned_users,
                "created_by": user_email,
                "created_by_name": user_name,
                "created_at": datetime.datetime.now(),
                "updated_at": datetime.datetime.now(),
                "in_trash": False,
                "notes_count": 0,
                "completed_notes_count": 0,
            }
            result = self.projects_collection.insert_one(new_project)
            new_project['_id'] = str(result.inserted_id)

            if self.socketio:
                self.socketio.emit('project_created', {'project': self.parse_json(new_project)})

            return jsonify({"message": "Project created successfully", "project": self.parse_json(new_project)}), 201

        except Exception as e:
            return jsonify({"error": str(e)}), 500

    def get_projects(self):
        try:
            user_email = request.args.get("user_email")
            query = {"in_trash": False}
            if user_email:
                query.update({"created_by": user_email})  # pylint: disable=no-member
            projects = list(self.projects_collection.find(query).sort("created_at", -1))
            return jsonify({"projects": self.parse_json(projects)})
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    def get_project(self, project_id):
        try:
            project = self.projects_collection.find_one({"_id": ObjectId(project_id)})
            if not project:
                return jsonify({"error": "Project not found"}), 404
            return jsonify({"project": self.parse_json(project)})
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    def detect_projects_in_text(self):
        """Detect project names mentioned in text using AI and database matching"""
        try:
            data = request.get_json()
            text = data.get('text', '')
            existing_projects = data.get('existing_projects', [])
            
            if not text:
                return jsonify({"error": "Text is required"}), 400
            
            # Get all projects from database
            user_email = request.args.get('user_email')
            query = {"in_trash": False}
            if user_email:
                query["created_by"] = user_email
            
            projects = list(self.projects_collection.find(query))
            
            detected_projects = []
            text_lower = text.lower()
            
            # Direct database matching
            for project in projects:
                project_name = project['name'].lower()
                if project_name in text_lower:
                    # Calculate confidence based on context
                    confidence = 0.9 if f" {project_name} " in text_lower else 0.8
                    detected_projects.append({
                        "name": project['name'],
                        "id": str(project['_id']),
                        "confidence": confidence,
                        "type": "exact_match"
                    })
            
            # AI-based detection for potential project names
            try:
                import google.generativeai as genai
                import os
                
                # Initialize Gemini client
                api_key = os.getenv('GOOGLE_API_KEY')
                if not api_key:
                    raise ValueError("GOOGLE_API_KEY environment variable not set")
                
                genai.configure(api_key=api_key)
                
                existing_names = [p['name'] for p in projects]
                prompt = f"""
                Analyze the following text and identify potential project names or references that might be mentioned.
                
                Existing projects in database: {existing_names}
                
                Text to analyze: "{text}"
                
                Look for:
                - Proper nouns that could be project names
                - References to initiatives, campaigns, or systems
                - Names of products, platforms, or services
                - Any capitalized terms that seem like project identifiers
                
                Return only a JSON array of potential project names with confidence scores (0.0-1.0).
                Format: [{"name": "Project Name", "confidence": 0.8, "type": "ai_detected"}]
                
                If no potential projects found, return an empty array: []
                """
                
                model = genai.GenerativeModel('gemini-1.5-flash')
                response = model.generate_content(prompt)
                
                ai_response = response.text.strip()
                
                try:
                    import json
                    # Handle potential formatting issues in the response
                    ai_response = ai_response.replace("''", '"').replace("'", '"')
                    # Remove any code block markers that might be in the response
                    ai_response = ai_response.replace('```json', '').replace('```', '')
                    # Strip any leading/trailing whitespace
                    ai_response = ai_response.strip()
                    
                    ai_detected = json.loads(ai_response)
                    
                    # Add AI-detected projects that aren't already in detected_projects
                    for ai_project in ai_detected:
                        # Ensure required fields exist
                        if not isinstance(ai_project, dict) or 'name' not in ai_project or 'confidence' not in ai_project:
                            continue
                            
                        if not any(dp['name'].lower() == ai_project['name'].lower() for dp in detected_projects):
                            # Check if this AI-detected project matches any existing project
                            matching_project = next((p for p in projects if p['name'].lower() == ai_project['name'].lower()), None)
                            if matching_project:
                                detected_projects.append({
                                    "name": matching_project['name'],
                                    "id": str(matching_project['_id']),
                                    "confidence": ai_project['confidence'] * 0.8,  # Slightly reduce confidence for AI
                                    "type": "ai_matched"
                                })
                            else:
                                detected_projects.append({
                                    "name": ai_project['name'],
                                    "id": None,
                                    "confidence": ai_project['confidence'] * 0.6,  # Lower confidence for new projects
                                    "type": "ai_suggested"
                                })
                except Exception as e:
                    print(f"[AI] Project detection JSON parsing error: {e}")
                    # If AI response is not valid JSON, continue with database matches only
                    
            except Exception as e:
                print(f"AI project detection error: {e}")
                # Continue with database matches only
            
            # Sort by confidence and remove duplicates
            detected_projects.sort(key=lambda x: x['confidence'], reverse=True)
            
            return jsonify({"detected_projects": detected_projects}), 200
            
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    def update_project(self, project_id):
        try:
            data = request.get_json()
            user_email = data.get('created_by')

            if not user_email:
                return jsonify({"error": "User email is required"}), 400

            project = self.projects_collection.find_one({"_id": ObjectId(project_id)})
            if not project:
                return jsonify({"error": "Project not found"}), 404
            if project.get('created_by') != user_email:
                return jsonify({"error": "No permission to update this project"}), 403

            assigned_users = [u.strip() for u in data.get('assigned_users', []) if u.strip()]
            users_collection = self.db.users
            for user in assigned_users:
                if "@" in user:
                    user_doc = users_collection.find_one({"email": user})
                    name = user_doc["name"] if user_doc and "name" in user_doc else user
                    self._create_person(name, user)
                else:
                    user_doc = users_collection.find_one({"name": user})
                    email = user_doc["email"] if user_doc and "email" in user_doc else None
                    self._create_person(user, email)

            update_data = {field: data[field] for field in ['name', 'description', 'status', 'priority', 'start_date', 'end_date', 'assigned_users'] if field in data}
            update_data['updated_at'] = datetime.datetime.now()

            self.projects_collection.update_one({"_id": ObjectId(project_id)}, {"$set": update_data})
            updated_project = self.projects_collection.find_one({"_id": ObjectId(project_id)})
            return jsonify({"message": "Project updated successfully", "project": self.parse_json(updated_project)}), 200

        except Exception as e:
            return jsonify({"error": str(e)}), 500

    def delete_project(self, project_id):
        try:
            project = self.projects_collection.find_one({"_id": ObjectId(project_id)})
            if not project:
                return jsonify({"error": "Project not found"}), 404
            self.projects_collection.delete_one({"_id": ObjectId(project_id)})
            return jsonify({"message": "Project deleted successfully"}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    def get_people(self):
        try:
            people = list(self.people_collection.distinct("name"))
            return jsonify({"people": people}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    def add_person(self):
        try:
            data = request.get_json()
            name = data.get("name", "").strip()
            if not name:
                return jsonify({"error": "Name cannot be empty"}), 400
            if self.people_collection.find_one({"name": name}):
                return jsonify({"message": "Person already exists"}), 200
            self.people_collection.insert_one({
                "name": name, "created_at": datetime.datetime.now(), "updated_at": datetime.datetime.now()
            })
            return jsonify({"message": "Person added successfully"}), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 500