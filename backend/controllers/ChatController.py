from flask import request, jsonify
from bson import ObjectId
from datetime import datetime
import uuid

# Controller for chat functionality (rooms, messages, etc.)
class ChatController:
    def __init__(self, db, socketio=None):
        self.db = db
        self.chat_rooms = db.chat_rooms
        self.messages = db.messages
        # self.socketio = socketio
        
    # Creates a new chat room (direct or group), or returns existing direct room
    def create_chat_room(self):
        try:
            data = request.get_json()
            participants = data.get('participants', [])
            chat_type = data.get('type', 'direct')
            created_by = data.get('created_by')
            
            if not participants or len(participants) < 2:
                return jsonify({"error": "At least 2 participants required"}), 400
                
            # Check if direct chat already exists
            if chat_type == 'direct' and len(participants) == 2:
                existing_room = self.chat_rooms.find_one({
                    "type": "direct",
                    "participants": {"$all": participants, "$size": 2}
                })
                if existing_room:
                    existing_room['_id'] = str(existing_room['_id'])
                    return jsonify({"room": existing_room}), 200
            
            # Create new chat room
            room_data = {
                "participants": participants,
                "type": chat_type,
                "created_by": created_by,
                "created_at": datetime.utcnow(),
                "last_message": None,
                "last_activity": datetime.utcnow()
            }
            
            if chat_type == 'group':
                room_data["name"] = data.get('name', 'Group Chat')
                room_data["description"] = data.get('description', '')
                
            result = self.chat_rooms.insert_one(room_data)
            room_data['_id'] = str(result.inserted_id)
            
            return jsonify({"room": room_data}), 201
            
        except Exception as e:
            print(f"Error creating chat room: {e}")
            return jsonify({"error": "Failed to create chat room"}), 500
    
    # Returns all chat rooms for a user
    def get_chat_rooms(self):
        try:
            user_email = request.args.get('user_email')
            if not user_email:
                return jsonify({"error": "User email required"}), 400
                
            # Find all chat rooms where user is a participant
            rooms = list(self.chat_rooms.find({
                "participants": user_email
            }).sort("last_activity", -1))
            
            # Convert ObjectId to string and add additional info
            for room in rooms:
                room['_id'] = str(room['_id'])
                
                # Get last message for each room
                last_message = self.messages.find_one(
                    {"chat_id": str(room['_id'])},
                    sort=[("timestamp", -1)]
                )
                if last_message:
                    last_message['_id'] = str(last_message['_id'])
                    room['last_message'] = last_message
                    
            return jsonify({"rooms": rooms}), 200
            
        except Exception as e:
            print(f"Error fetching chat rooms: {e}")
            return jsonify({"error": "Failed to fetch chat rooms"}), 500
    
    # Returns all messages for a chat room
    def get_messages(self, chat_id):
        try:
            # Validate chat_id
            if not ObjectId.is_valid(chat_id):
                return jsonify({"error": "Invalid chat ID"}), 400
                
            # Get messages for the chat room
            messages = list(self.messages.find({
                "chat_id": chat_id
            }).sort("timestamp", 1))
            
            # Convert ObjectId to string
            for message in messages:
                message['_id'] = str(message['_id'])
                
            return jsonify({"messages": messages}), 200
            
        except Exception as e:
            print(f"Error fetching messages: {e}")
            return jsonify({"error": "Failed to fetch messages"}), 500
    
    # Sends a message in a chat room, updates last activity/message
    def send_message(self):
        try:
            data = request.get_json()
            chat_id = data.get('chatId')
            content = data.get('content')
            sender = data.get('sender')
            sender_name = data.get('senderName')
            message_type = data.get('type', 'text')
            
            if not all([chat_id, content, sender]):
                return jsonify({"error": "Missing required fields"}), 400
                
            # Validate chat_id
            if not ObjectId.is_valid(chat_id):
                return jsonify({"error": "Invalid chat ID"}), 400
                
            # Check if chat room exists and user is participant
            chat_room = self.chat_rooms.find_one({"_id": ObjectId(chat_id)})
            if not chat_room:
                return jsonify({"error": "Chat room not found"}), 404
                
            if sender not in chat_room['participants']:
                return jsonify({"error": "User not authorized to send messages in this chat"}), 403
            
            # Create message
            message_data = {
                "chat_id": chat_id,
                "content": content,
                "sender": sender,
                "senderName": sender_name,
                "type": message_type,
                "timestamp": datetime.utcnow(),
                "read_by": [sender],  # Sender has read their own message
                "edited": False,
                "deleted": False
            }
            
            result = self.messages.insert_one(message_data)
            message_data['_id'] = str(result.inserted_id)
            
            # Update chat room's last activity and last message
            self.chat_rooms.update_one(
                {"_id": ObjectId(chat_id)},
                {
                    "$set": {
                        "last_activity": datetime.utcnow(),
                        "last_message": {
                            "content": content,
                            "sender": sender,
                            "timestamp": message_data['timestamp']
                        }
                    }
                }
            )
            
            return jsonify({"message": message_data}), 201
            
        except Exception as e:
            print(f"Error sending message: {e}")
            return jsonify({"error": "Failed to send message"}), 500
    
    # Marks all messages in a chat as read by a user
    def mark_messages_as_read(self, chat_id):
        try:
            data = request.get_json()
            user_email = data.get('user_email')
            
            if not user_email:
                return jsonify({"error": "User email required"}), 400
                
            # Validate chat_id
            if not ObjectId.is_valid(chat_id):
                return jsonify({"error": "Invalid chat ID"}), 400
                
            # Mark all messages in the chat as read by this user
            self.messages.update_many(
                {
                    "chat_id": chat_id,
                    "sender": {"$ne": user_email}  # Don't update own messages
                },
                {
                    "$addToSet": {"read_by": user_email}
                }
            )
            
            return jsonify({"success": True}), 200
            
        except Exception as e:
            print(f"Error marking messages as read: {e}")
            return jsonify({"error": "Failed to mark messages as read"}), 500
    
    # Marks a message as deleted (soft delete)
    def delete_message(self, message_id):
        try:
            data = request.get_json()
            user_email = data.get('user_email')
            
            if not user_email:
                return jsonify({"error": "User email required"}), 400
                
            # Validate message_id
            if not ObjectId.is_valid(message_id):
                return jsonify({"error": "Invalid message ID"}), 400
                
            # Find the message
            message = self.messages.find_one({"_id": ObjectId(message_id)})
            if not message:
                return jsonify({"error": "Message not found"}), 404
                
            # Check if user is the sender
            if message['sender'] != user_email:
                return jsonify({"error": "Not authorized to delete this message"}), 403
                
            # Mark message as deleted instead of actually deleting
            self.messages.update_one(
                {"_id": ObjectId(message_id)},
                {
                    "$set": {
                        "deleted": True,
                        "content": "This message was deleted",
                        "deleted_at": datetime.utcnow()
                    }
                }
            )
            
            return jsonify({"success": True}), 200
            
        except Exception as e:
            print(f"Error deleting message: {e}")
            return jsonify({"error": "Failed to delete message"}), 500
    
    # Edits a message if the user is the sender
    def edit_message(self, message_id):
        try:
            data = request.get_json()
            user_email = data.get('user_email')
            new_content = data.get('content')
            
            if not all([user_email, new_content]):
                return jsonify({"error": "Missing required fields"}), 400
                
            # Validate message_id
            if not ObjectId.is_valid(message_id):
                return jsonify({"error": "Invalid message ID"}), 400
                
            # Find the message
            message = self.messages.find_one({"_id": ObjectId(message_id)})
            if not message:
                return jsonify({"error": "Message not found"}), 404
                
            # Check if user is the sender
            if message['sender'] != user_email:
                return jsonify({"error": "Not authorized to edit this message"}), 403
                
            # Update message
            self.messages.update_one(
                {"_id": ObjectId(message_id)},
                {
                    "$set": {
                        "content": new_content,
                        "edited": True,
                        "edited_at": datetime.utcnow()
                    }
                }
            )
            
            # Get updated message
            updated_message = self.messages.find_one({"_id": ObjectId(message_id)})
            updated_message['_id'] = str(updated_message['_id'])
            
            return jsonify({"message": updated_message}), 200
            
        except Exception as e:
            print(f"Error editing message: {e}")
            return jsonify({"error": "Failed to edit message"}), 500
    
    # Returns unread message count for all chat rooms for a user
    def get_unread_count(self):
        try:
            user_email = request.args.get('user_email')
            if not user_email:
                return jsonify({"error": "User email required"}), 400
                
            # Get all chat rooms for the user
            user_rooms = list(self.chat_rooms.find({
                "participants": user_email
            }))
            
            total_unread = 0
            room_unread = {}
            
            for room in user_rooms:
                room_id = str(room['_id'])
                # Count unread messages in this room
                unread_count = self.messages.count_documents({
                    "chat_id": room_id,
                    "sender": {"$ne": user_email},
                    "read_by": {"$ne": user_email}
                })
                
                room_unread[room_id] = unread_count
                total_unread += unread_count
                
            return jsonify({
                "total_unread": total_unread,
                "room_unread": room_unread
            }), 200
            
        except Exception as e:
            print(f"Error getting unread count: {e}")
            return jsonify({"error": "Failed to get unread count"}), 500