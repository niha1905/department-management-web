from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import generate_password_hash, check_password_hash
from bson.objectid import ObjectId
import re
import random
import string
import smtplib
from email.mime.text import MIMEText

# Blueprint for authentication and user management routes
auth_bp = Blueprint('auth', __name__)

# Email config
SMTP_SERVER = 'smtp.gmail.com'
SMTP_PORT = 465
SENDER_EMAIL = 'arjunr3773@gmail.com'
SENDER_PASSWORD = 'ewwftjtrmzmejmbz'

# Sends email with temporary password to new users
def send_email(to_email, temp_password):
    subject = "Your Grand Magnum AI Dashboard Account"
    body = f"""Hello,

Your temporary password is: {temp_password}

Please login at http://localhost:5173/login and change your password immediately.

Best regards,
Grand Magnum Team"""

    msg = MIMEText(body)
    msg['Subject'] = subject
    msg['From'] = SENDER_EMAIL
    msg['To'] = to_email

    try:
        print(f"Attempting to send email to {to_email} ...")
        with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT) as server:
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            server.sendmail(SENDER_EMAIL, to_email, msg.as_string())
        print(f"Email sent to {to_email}")
    except Exception as e:
        print(f"Error sending email to {to_email}: {str(e)}")

# User signup endpoint (registers new user)
@auth_bp.route('/signup', methods=['POST'])
def signup():
    try:
        db = current_app.config['db']
        users_collection = db.users
        data = request.get_json()
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({'message': 'Email and password are required'}), 400

        email = data['email'].lower().strip()
        password = data['password']
        role = data.get('role', 'member')
        department = data.get('department', '')
        name = data.get('name', '')
        phone = data.get('phone', '')

        if not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', email):
            return jsonify({'message': 'Invalid email format'}), 400

        # Allow only @grandmagnum.in or @gmail.com emails for registration
        if not (email.endswith('@grandmagnum.in') or email.endswith('@gmail.com')):
            return jsonify({'message': 'Registration allowed only for @grandmagnum.in or @gmail.com emails'}), 400

        if users_collection.find_one({'email': email}):
            return jsonify({'message': 'User already exists with this email'}), 400

        if role not in ['member', 'admin']:
            return jsonify({'message': 'Invalid role. Must be member or admin'}), 400

        if role == "admin":
            admin_count = users_collection.count_documents({'role': 'admin'})
            if admin_count >= 2:
                return jsonify({'message': 'Maximum admin users (2) already registered'}), 400
            if not name or not phone:
                return jsonify({'message': 'Name and phone are required for admin registration'}), 400
        else:
            allowed_departments = ["Finance", "CAD", "Audit"]
            if department not in allowed_departments:
                return jsonify({'message': f'Department must be one of {allowed_departments}'}), 400

        hashed_password = generate_password_hash(password)
        user_doc = {
            'email': email,
            'password': hashed_password,
            'role': role,
            'department': department if role == 'member' else '',
            'name': name,
            'phone': phone
        }
        result = users_collection.insert_one(user_doc)

        return jsonify({
            'message': 'User created successfully',
            'user_id': str(result.inserted_id)
        }), 201

    except Exception as e:
        return jsonify({'message': f'Error creating user: {str(e)}'}), 500

# User login endpoint (returns user info if credentials valid)
@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        db = current_app.config['db']
        users_collection = db.users
        data = request.get_json()
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({'message': 'Email and password are required'}), 400

        email = data['email'].lower().strip()
        password = data['password']

        user = users_collection.find_one({'email': email})
        if not user:
            return jsonify({'message': 'Invalid email or password'}), 401

        if not check_password_hash(user['password'], password):
            return jsonify({'message': 'Invalid email or password'}), 401

        temp_password = user.get('temp_password', False)
        
        # Ensure name is included in the response
        user_name = user.get('name', '')
        print(f"User logged in: {email}, name: {user_name}")
        
        return jsonify({
            'message': 'Login successful',
            'user': {
                'id': str(user['_id']),
                'email': user['email'],
                'role': user['role'],
                'department': user.get('department', ''),
                'name': user_name,  # Ensure name is included
                'phone': user.get('phone', '')
            },
            'temp_password': temp_password,
            'role': user['role'],
            'email': user['email']
        }), 200

    except Exception as e:
        return jsonify({'message': f'Error during login: {str(e)}'}), 500

# Admin creates a new user (member), sends temp password by email
@auth_bp.route('/create-user', methods=['POST'])
def create_user():
    try:
        db = current_app.config['db']
        users_collection = db.users
        data = request.get_json()
        admin_email = data.get('admin_email')
        # Only allow admins to create users
        admin = users_collection.find_one({'email': admin_email, 'role': 'admin'})
        if not admin:
            return jsonify({'message': 'Admin authorization failed'}), 403

        # --- Check if user already exists ---
        email = data.get('email', '').lower().strip()
        if not email:
            return jsonify({'message': 'Email is required'}), 400
        if users_collection.find_one({'email': email}):
            return jsonify({'message': 'User already exists with this email'}), 400

        # --- Validate email format ---
        if not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', email):
            return jsonify({'message': 'Invalid email format'}), 400

        # --- Validate department ---
        allowed_departments = ["Finance", "CAD", "Audit"]
        department = data.get('department', '')
        if department not in allowed_departments:
            return jsonify({'message': f'Department must be one of {allowed_departments}'}), 400

        member_count = users_collection.count_documents({'role': 'member'})
        if member_count >= 10:
            return jsonify({'message': 'Member limit (10) reached'}), 400

        password = data.get('password', '')
        if not password:
            return jsonify({'message': 'Password is required'}), 400
        user_doc = {
            'email': email,
            'password': generate_password_hash(password),
            'name': data['name'],
            'phone': data['phone'],
            'role': 'member',
            'department': department
        }
        users_collection.insert_one(user_doc)
        return jsonify({'message': 'User created successfully'}), 201

    except Exception as e:
        print(f"Exception in /create-user: {e}")
        return jsonify({'message': str(e)}), 500

# User updates their password
@auth_bp.route('/update-password', methods=['POST'])
def update_password():
    try:
        db = current_app.config['db']
        users_collection = db.users
        data = request.get_json()
        user = users_collection.find_one({'email': data['email']})
        if not user:
            return jsonify({'message': 'User not found'}), 404
        if not check_password_hash(user['password'], data['old_password']):
            return jsonify({'message': 'Invalid current password'}), 401
        users_collection.update_one(
            {'email': data['email']},
            {'$set': {
                'password': generate_password_hash(data['new_password']),
                'temp_password': False
            }}
        )
        return jsonify({'message': 'Password updated successfully'}), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

# Admin deletes a user by ID
@auth_bp.route('/users/<user_id>', methods=['DELETE'])
def delete_user(user_id):
    try:
        db = current_app.config['db']
        users_collection = db.users
        result = users_collection.delete_one({'_id': ObjectId(user_id)})
        if result.deleted_count == 0:
            return jsonify({'message': 'User not found'}), 404
        return jsonify({'message': 'User deleted successfully'}), 200
    except Exception as e:
        return jsonify({'message': f'Error deleting user: {str(e)}'}), 500

# Returns all users (excluding passwords)
@auth_bp.route('/users', methods=['GET'])
def get_users():
    try:
        db = current_app.config['db']
        users_collection = db.users
        users = list(users_collection.find({}, {'password': 0}))
        for user in users:
            user['_id'] = str(user['_id'])
            user.setdefault('name', '')
            user.setdefault('email', '')
            user.setdefault('department', '')
            user.setdefault('phone', '')
        return jsonify({'users': users}), 200
    except Exception as e:
        return jsonify({'message': f'Error fetching users: {str(e)}'}), 500
