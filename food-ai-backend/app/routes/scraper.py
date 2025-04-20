from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.services.scraper.swiggy import SwiggyService
from app.services.scraper.zomato import ZomatoService
import logging

scraper_bp = Blueprint('scraper', __name__)
swiggy_service = SwiggyService()
zomato_service = ZomatoService()

@scraper_bp.route('/status', methods=['GET'])
@jwt_required()
def scraper_status():
    return jsonify({
        'swiggy': 'active',
        'zomato': 'active',
        'last_updated': '2023-07-20T12:00:00Z'
    })

@scraper_bp.route('/test/swiggy', methods=['POST'])
@jwt_required()
def test_swiggy():
    data = request.get_json()
    query = data.get('query', 'pizza')
    location = data.get('location', 'Bangalore')
    
    try:
        results = swiggy_service.search(query, location)
        return jsonify({
            'query': query,
            'location': location,
            'results': results,
            'count': len(results)
        })
    except Exception as e:
        logging.error(f"Swiggy test error: {str(e)}")
        return jsonify({'error': 'Scraping failed'}), 500