from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow
from flask_cors import CORS
from flask_caching import Cache

# Initialize extensions
db = SQLAlchemy()
ma = Marshmallow()
cache = Cache()

def create_app(config_class):
    """Application factory function"""
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(config_class)
    
    # Initialize extensions with app
    CORS(app)
    db.init_app(app)
    ma.init_app(app)
    cache.init_app(app)
    
    # Import and register blueprints HERE to avoid circular imports
    from app.routes.api import api_bp
    from app.routes.auth import auth_bp
    from app.routes.scraper import scraper_bp
    
    app.register_blueprint(api_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(scraper_bp)
    
    # Create database tables
    with app.app_context():
        db.create_all()
    
    return app