from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.user_service import UserService
from app.services.ai.intent import IntentService
from app.services.ai.filter import FilterService
from app.services.ai.rank import RankService
from app.services.scraper.swiggy import SwiggyService
from app.utils.validation import validate_user_input
import logging

api_bp = Blueprint('api', __name__)
user_service = UserService()
intent_service = IntentService()
filter_service = FilterService()
rank_service = RankService()
swiggy_service = SwiggyService()

@api_bp.route('/register', methods=['POST'])
def register():
    """Register a new user with preferences"""
    data = request.get_json()
    
    # Validate input
    is_valid, message = validate_user_input(data)
    if not is_valid:
        return jsonify({'error': message}), 400
    
    try:
        user = user_service.create_user(data)
        return jsonify({
            'message': 'User registered successfully',
            'user': user.to_dict()
        }), 201
    except Exception as e:
        logging.error(f"Registration error: {str(e)}")
        return jsonify({'error': 'Registration failed'}), 500

@api_bp.route('/recommendations', methods=['POST'])
@jwt_required()
def get_recommendations():
    """Get personalized food recommendations"""
    user_id = get_jwt_identity()
    data = request.get_json()
    query = data.get('query', '').strip()
    
    if not query:
        return jsonify({'error': 'Search query is required'}), 400
    
    try:
        # Get user preferences
        user = user_service.get_user(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Understand user intent
        intent = intent_service.analyze(query, user.to_dict())
        
        # Get raw recommendations
        recommendations = []
        if intent['platform'] == 'all' or intent['platform'] == 'swiggy':
            recommendations += swiggy_service.search(query, user.location)
        # Add other platforms here...
        
        # Filter based on dietary needs
        filtered = filter_service.apply_filters(recommendations, user.to_dict())
        
        # Personalize ranking
        ranked = rank_service.rank_results(filtered, user.to_dict())
        
        return jsonify({
            'query': query,
            'intent': intent,
            'results': ranked,
            'count': len(ranked)
        })
    except Exception as e:
        logging.error(f"Recommendation error: {str(e)}")
        return jsonify({'error': 'Failed to get recommendations'}), 500

@api_bp.route('/user', methods=['GET'])
@jwt_required()
def get_user_profile():
    """Get current user profile"""
    user_id = get_jwt_identity()
    try:
        user = user_service.get_user(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        return jsonify(user.to_dict())
    except Exception as e:
        logging.error(f"Get user error: {str(e)}")
        return jsonify({'error': 'Failed to get user profile'}), 500