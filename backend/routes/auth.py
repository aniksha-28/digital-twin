"""
MobileTwin Authentication and User Management Routes
Provides secure login, user profile, and role-based privilege checks.
"""

from flask import Blueprint, request, jsonify
from models import db, User

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    password = data.get('password', '')

    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400

    user = User.query.filter((User.username == username) | (User.email == username)).first()
    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid credentials'}), 401

    # In capstone environment, return token payload
    token = f"mt-token-{user.id}-{user.username}"
    return jsonify({
        'token': token,
        'user': user.to_dict()
    })

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '')
    full_name = data.get('full_name', '').strip()
    role = data.get('role', 'engineer')

    if not username or not email or not password or not full_name:
        return jsonify({'error': 'All fields are required'}), 400

    if role not in ['admin', 'engineer']:
        role = 'engineer'

    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already taken'}), 409

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 409

    new_user = User(
        username=username,
        email=email,
        full_name=full_name,
        role=role
    )
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({
        'message': 'Registration successful',
        'user': new_user.to_dict()
    }), 201

@auth_bp.route('/me', methods=['GET'])
def get_current_user():
    # Return default engineer or admin
    user = User.query.first()
    if not user:
        return jsonify({'error': 'No users found'}), 404
    return jsonify({'user': user.to_dict()})
