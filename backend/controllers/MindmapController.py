from flask import request, jsonify
from bson import ObjectId
import datetime

class MindmapController:
    def __init__(self, db, socketio=None):
        self.db = db
        self.mindmap_collection = db.mindmap_nodes
        self.socketio = socketio

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

    def save_node(self):
        try:
            data = request.get_json()
            if not data.get('id') or not data.get('label'):
                return jsonify({'error': 'Node id and label are required'}), 400
            # Upsert node by id
            self.mindmap_collection.update_one(
                {'id': data['id']},
                {'$set': data},
                upsert=True
            )
            return jsonify({'status': 'success'}), 201
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    def get_nodes(self):
        try:
            nodes = list(self.mindmap_collection.find({}, {'_id': 0}))
            return jsonify({'nodes': nodes}), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500 