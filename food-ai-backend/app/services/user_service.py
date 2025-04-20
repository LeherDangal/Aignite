from app.models.user import User
from werkzeug.security import generate_password_hash
from app import db
import json
import logging

class UserService:
    def create_user(self, user_data):
        try:
            hashed_password = generate_password_hash(user_data.get('password', ''))
            
            user = User(
                email=user_data['email'],
                password_hash=hashed_password,
                name=user_data['name'],
                age=user_data.get('age'),
                sex=user_data.get('sex'),
                city=user_data.get('city'),
                state=user_data.get('state'),
                pincode=user_data.get('pincode'),
                dietary_restrictions=json.dumps(user_data.get('dietary_restrictions', [])),
                allergies=json.dumps(user_data.get('allergies', [])),
                food_habits=user_data.get('food_habits'),
                cuisine_preferences=json.dumps(user_data.get('cuisine_preferences', []))
            )
            
            db.session.add(user)
            db.session.commit()
            return user
        except Exception as e:
            db.session.rollback()
            logging.error(f"User creation error: {str(e)}")
            raise

    def get_user(self, user_id):
        return User.query.get(user_id)

    def update_user(self, user_id, update_data):
        try:
            user = User.query.get(user_id)
            if not user:
                return None
                
            for key, value in update_data.items():
                if hasattr(user, key):
                    if key in ['dietary_restrictions', 'allergies', 'cuisine_preferences']:
                        setattr(user, key, json.dumps(value))
                    else:
                        setattr(user, key, value)
            
            db.session.commit()
            return user
        except Exception as e:
            db.session.rollback()
            logging.error(f"User update error: {str(e)}")
            raise