from flask import jsonify, request, Blueprint
hierarchical_mindmap_bp = Blueprint('hierarchical_mindmap', __name__)
from bson import ObjectId
from datetime import datetime


# Save the entire real estate mindmap as a single document
@hierarchical_mindmap_bp.route('/api/real_estate_mindmap/save', methods=['POST'])
def save_real_estate_mindmap_route():
    from flask import current_app
    db = current_app.db
    controller = HierarchicalMindmapController(db)
    return controller.save_real_estate_mindmap()

class HierarchicalMindmapController:
    # ...existing code...
    def save_real_estate_mindmap(self):
        """Save the entire real estate mindmap (nodes, edges, metadata) as a single document"""
        try:
            data = request.get_json()
            print("Received mindmap data:", data)
            if not data or not data.get('nodes'):
                return jsonify({"error": "Nodes are required"}), 400

            mindmap_doc = {
                "nodes": data.get("nodes", []),
                "edges": data.get("edges", []),
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "created_by": data.get("created_by", ""),
                "created_by_name": data.get("created_by_name", ""),
                "type": "real_estate_mindmap"
            }
            result = self.db.real_estate_mindmaps.insert_one(mindmap_doc)
            mindmap_doc['_id'] = str(result.inserted_id)
            return jsonify({
                "message": "Real estate mindmap saved successfully",
                "mindmap": mindmap_doc
            }), 201
        except Exception as e:
            print("Error saving mindmap:", str(e))
            return jsonify({"error": str(e)}), 500


class HierarchicalMindmapController:
    def __init__(self, db):
        self.db = db

    def build_people_mindmap(self):
        people = list(self.db.people.find())
        projects = list(self.db.projects.find())
        notes = list(self.db.notes.find())
        personal_nodes = list(self.db.personal_child_nodes.find())
        
        # Create email to name mapping and name to email mapping
        email_to_name = {}
        name_to_email = {}
        for person in people:
            email = person.get('email')
            name = person.get('name')
            if email and name:
                email_to_name[email] = name
                name_to_email[name] = email
        
        # Get unique people from people collection and from project assignments
        unique_people_names = set()
        for person in people:
            if person.get('name'):
                unique_people_names.add(person.get('name'))
        
        # Also include people who are assigned to projects but might not be in people collection
        for project in projects:
            for assigned_user in project.get('assigned_users', []):
                # If it's an email, convert to name
                if assigned_user in email_to_name:
                    unique_people_names.add(email_to_name[assigned_user])
                else:
                    unique_people_names.add(assigned_user)
        
        # Convert ObjectIds to strings for JSON serialization
        for project in projects:
            project['_id'] = str(project['_id'])
        for note in notes:
            note['id'] = str(note.get('_id', note.get('id', '')))
        
        result = []
        # Track all people who have personal nodes, even if not in unique_people_names
        personal_people = set()
        for node in personal_nodes:
            person = node.get('person')
            if person:
                personal_people.add(person)

        all_people = unique_people_names.union(personal_people)

        for person_name in all_people:
            if not person_name:
                continue
            person_email = name_to_email.get(person_name, person_name)
            children = []
            person_total_tasks = 0

            # Add projects this person is involved in
            for project in projects:
                assigned_users = project.get('assigned_users', [])
                is_assigned = (person_name in assigned_users or person_email in assigned_users)
                if is_assigned:
                    project_children = []
                    for note in notes:
                        note_assigned_to = note.get('assigned_to', '')
                        if (note.get('project') == project.get('name') and
                            (note_assigned_to == person_name or note_assigned_to == person_email)):
                            project_children.append({
                                'id': f"task-{note['id']}",
                                'title': note.get('title', 'Untitled Task'),
                                'description': note.get('content', ''),
                                'icon': 'target',
                                'status': note.get('status', 'incomplete'),
                                'comments': note.get('comments', []),
                                'priority': note.get('priority', 'medium'),
                                'due_date': note.get('due_date', ''),
                                'created_at': note.get('created_at', ''),
                                'updated_at': note.get('updated_at', '')
                            })
                    person_total_tasks += len(project_children)
                    children.append({
                        'id': f"project-{project['_id']}",
                        'title': project.get('name', 'Untitled Project'),
                        'description': project.get('description', ''),
                        'icon': 'rocket',
                        'children': project_children,
                        'taskCount': len(project_children)
                    })

            # Add personal child nodes for this person (for RealEstate page, etc.)
            person_children = []
            for node in personal_nodes:
                if (node.get('person') == person_name or node.get('person') == person_email):
                    person_children.append({
                        'id': f"personal-{node['id']}",
                        'title': node.get('title', 'Personal Item'),
                        'description': node.get('description', ''),
                        'icon': node.get('icon', 'star'),
                        'extra': node.get('extra', {})
                    })
            children.extend(person_children)

            # Only add person node if they have at least one child (project or personal)
            if children:
                result.append({
                    'id': f"person-{person_email}",
                    'title': person_name,
                    'email': person_email,
                    'icon': 'users',
                    'children': children,
                    'projectCount': len([c for c in children if c['id'].startswith('project-')]),
                    'personalItemCount': len([c for c in children if c['id'].startswith('personal-')]),
                    'totalTasks': person_total_tasks
                })

        return jsonify({'mindmap': result}), 200

    def build_projects_mindmap(self):
        people = list(self.db.people.find())
        projects = list(self.db.projects.find())
        notes = list(self.db.notes.find())
        personal_nodes = list(self.db.personal_child_nodes.find())

        # Create email to name mapping and name to email mapping
        email_to_name = {}
        name_to_email = {}
        for person in people:
            email = person.get('email')
            name = person.get('name')
            if email and name:
                email_to_name[email] = name
                name_to_email[name] = email

        # Convert ObjectIds to strings for JSON serialization
        for project in projects:
            project['_id'] = str(project['_id'])
        for note in notes:
            note['id'] = str(note.get('_id', note.get('id', '')))

        result = []
        for project in projects:
            project_name = project.get('name', 'Untitled Project')
            assigned_users = project.get('assigned_users', [])
            children = []
            project_total_tasks = 0

            # Add assigned users as children
            for assigned_user in assigned_users:
                # Convert email to name if possible
                user_name = email_to_name.get(assigned_user, assigned_user)
                user_email = name_to_email.get(user_name, assigned_user)
                user_children = []
                user_total_tasks = 0

                # Find all notes/tasks for this user in this project
                for note in notes:
                    note_assigned_to = note.get('assigned_to', '')
                    if (note.get('project') == project_name and 
                        (note_assigned_to == user_name or note_assigned_to == user_email)):
                        user_children.append({
                            'id': f"task-{note['id']}",
                            'title': note.get('title', 'Untitled Task'),
                            'description': note.get('content', ''),
                            'icon': 'target',
                            'status': note.get('status', 'incomplete'),
                            'comments': note.get('comments', []),
                            'priority': note.get('priority', 'medium'),
                            'due_date': note.get('due_date', ''),
                            'created_at': note.get('created_at', ''),
                            'updated_at': note.get('updated_at', '')
                        })
                user_total_tasks += len(user_children)

                # Add personal child nodes for this user
                personal_items = []
                for node in personal_nodes:
                    if (node.get('person') == user_name or node.get('person') == user_email):
                        personal_items.append({
                            'id': f"personal-{node['id']}",
                            'title': node.get('title', 'Personal Item'),
                            'description': node.get('description', ''),
                            'icon': node.get('icon', 'star'),
                            'extra': node.get('extra', {})
                        })
                user_children.extend(personal_items)

                children.append({
                    'id': f"user-{user_email}",
                    'title': user_name,
                    'email': user_email,
                    'icon': 'user',
                    'children': user_children,
                    'taskCount': len([c for c in user_children if c['id'].startswith('task-')]),
                    'personalItemCount': len([c for c in user_children if c['id'].startswith('personal-')]),
                    'totalTasks': user_total_tasks
                })
                project_total_tasks += user_total_tasks

            result.append({
                'id': f"project-{project['_id']}",
                'title': project_name,
                'description': project.get('description', ''),
                'icon': 'rocket',
                'children': children,
                'userCount': len(children),
                'totalTasks': project_total_tasks
            })

        return jsonify({'mindmap': result}), 200

    def save_project_node(self):
        """Save a project node"""
        try:
            data = request.get_json()
            if not data:
                return jsonify({"error": "No data provided"}), 400
            
            # Create a project document
            current_time = datetime.utcnow()
            project_doc = {
                "name": data.get('title', 'Untitled Project'),
                "description": data.get('description', ''),
                "assigned_users": data.get('assigned_users', []),
                "created_at": data.get('created_at', current_time),
                "updated_at": data.get('updated_at', current_time),
                "status": data.get('status', 'active')
            }
            
            # Insert the project
            result = self.db.projects.insert_one(project_doc)
            project_doc['_id'] = str(result.inserted_id)
            
            return jsonify({
                "message": "Project node saved successfully",
                "project": project_doc
            }), 201
            
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    def save_personal_child_node(self):
        """Save a personal child node"""
        try:
            data = request.get_json()
            print("Received personal child node data:", data)  # Debug print
            if not data:
                return jsonify({"error": "No data provided"}), 400

            # Create a personal child node document
            current_time = datetime.utcnow()
            personal_node_doc = {
                "id": str(ObjectId()),  # Generate a unique ID
                "title": data.get('title', 'Personal Item'),
                "description": data.get('description', ''),
                "person": data.get('person', ''),  # Email or name of the person
                "icon": data.get('icon', 'star'),
                "extra": data.get('extra', {}),
                "created_at": data.get('created_at', current_time),
                "updated_at": data.get('updated_at', current_time)
            }

            print("Saving personal node to DB:", personal_node_doc)  # Debug print
            # Insert the personal child node
            result = self.db.personal_child_nodes.insert_one(personal_node_doc)
            personal_node_doc['_id'] = str(result.inserted_id)

            return jsonify({
                "message": "Personal child node saved successfully",
                "node": personal_node_doc
            }), 201

        except Exception as e:
            print("Error saving personal child node:", str(e))  # Debug print
            return jsonify({"error": str(e)}), 500

    def save_real_estate_child_node(self):
        """Save a real estate mindmap child node"""
        try:
            data = request.get_json()
            print("Received data for new real estate node:", data)  # Debug print
            if not data:
                print("No data provided in request!")
                return jsonify({"error": "No data provided"}), 400

            current_time = datetime.utcnow()
            node_doc = {
                "id": str(ObjectId()),
                "name": data.get("label", ""),  # Store 'label' as 'name' for easier querying
                **data,  # include all fields from the frontend form
                "created_at": data.get("created_at", current_time),
                "updated_at": data.get("updated_at", current_time)
            }
            try:
                result = self.db.real_estate_mindmaps.insert_one(node_doc)
                print("Inserted node with _id:", result.inserted_id)  # Debug print
                node_doc['_id'] = str(result.inserted_id)
                return jsonify({
                    "message": "Real estate child node saved successfully",
                    "node": node_doc
                }), 201
            except Exception as db_e:
                print("Error inserting node into MongoDB:", str(db_e))
                return jsonify({"error": str(db_e)}), 500
        except Exception as e:
            print("Error saving real estate node:", str(e))  # Debug print
            return jsonify({"error": str(e)}), 500

    def get_all_real_estate_nodes(self):
        try:
            nodes = list(self.db.real_estate_mindmaps.find())
            print("Fetched nodes from MongoDB:", nodes)  # Debug print
            for node in nodes:
                node['_id'] = str(node['_id'])
                if 'name' in node and 'label' not in node:
                    node['label'] = node['name']
            return jsonify({'nodes': nodes}), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    def delete_real_estate_child_node(self, node_id):
        """Delete a real estate mindmap child node by its id"""
        try:
            result = self.db.real_estate_mindmaps.delete_one({"id": node_id})
            if result.deleted_count == 1:
                return jsonify({"message": "Node deleted successfully"}), 200
            else:
                return jsonify({"error": "Node not found"}), 404
        except Exception as e:
            return jsonify({"error": str(e)}), 500

# Route function must be outside the class
@hierarchical_mindmap_bp.route('/api/save_project_node', methods=['POST'])
def save_project_node_route():
    from flask import current_app
    db = current_app.db
    controller = HierarchicalMindmapController(db)
    return controller.save_project_node()


@hierarchical_mindmap_bp.route('/api/save_personal_child_node', methods=['POST'])
def save_personal_child_node_route():
    from flask import current_app
    db = current_app.db
    controller = HierarchicalMindmapController(db)
    response = controller.save_personal_child_node()
    # If save was successful, return updated mindmap
    if isinstance(response, tuple) and response[1] == 201:
        return controller.build_people_mindmap()
    return response

@hierarchical_mindmap_bp.route('/api/real_estate_mindmap/add_child', methods=['POST'])
def save_real_estate_child_node_route():
    from flask import current_app
    db = current_app.db
    controller = HierarchicalMindmapController(db)
    return controller.save_real_estate_child_node()

@hierarchical_mindmap_bp.route('/api/real_estate_mindmap/delete_child/<string:node_id>', methods=['DELETE'])
def delete_real_estate_child_node_route(node_id):
    from flask import current_app
    db = current_app.db
    controller = HierarchicalMindmapController(db)
    return controller.delete_real_estate_child_node(node_id)

    # ...existing code...
@hierarchical_mindmap_bp.route('/api/real_estate_mindmap/all', methods=['GET'])
def get_all_real_estate_nodes_route():
    from flask import current_app
    db = current_app.db
    controller = HierarchicalMindmapController(db)
    return controller.get_all_real_estate_nodes()

# Add route for /api/mindmap to return people mindmap (GET) and handle POST gracefully
@hierarchical_mindmap_bp.route('/api/mindmap', methods=['GET', 'POST'])
def people_mindmap_route():
    from flask import current_app, request
    db = current_app.db
    controller = HierarchicalMindmapController(db)
    if request.method == 'GET':
        return controller.build_people_mindmap()
    elif request.method == 'POST':
        # If you want to support saving/updating mindmap, implement here
        return jsonify({'error': 'POST to /api/mindmap is not supported. Use GET.'}), 405

# Add route for /api/mindmap/projects to return projects mindmap
@hierarchical_mindmap_bp.route('/api/mindmap/projects', methods=['GET'])
def get_projects_mindmap_route():
    from flask import current_app
    db = current_app.db
    controller = HierarchicalMindmapController(db)
    return controller.build_projects_mindmap()

# Add route for /api/mindmap/people to return people mindmap (alias for /api/mindmap)
@hierarchical_mindmap_bp.route('/api/mindmap/people', methods=['GET'])
def get_people_mindmap_alias_route():
    from flask import current_app
    db = current_app.db
    controller = HierarchicalMindmapController(db)
    return controller.build_people_mindmap()


    # ...existing code...
