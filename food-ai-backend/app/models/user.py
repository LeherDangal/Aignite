from app import db
from werkzeug.security import generate_password_hash, check_password_hash
import json

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    name = db.Column(db.String(80), nullable=False)
    age = db.Column(db.Integer)
    sex = db.Column(db.String(20))
    city = db.Column(db.String(80))
    state = db.Column(db.String(80))
    pincode = db.Column(db.String(10))
    dietary_restrictions = db.Column(db.Text)  # JSON string
    allergies = db.Column(db.Text)             # JSON string
    food_habits = db.Column(db.String(50))
    cuisine_preferences = db.Column(db.Text)   # JSON string
    search_history = db.Column(db.Text)        # JSON string
    saved_items = db.Column(db.Text)           # JSON string
    
    @property
    def password(self):
        raise AttributeError('password is not a readable attribute')
    
    @password.setter
    def password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def verify_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    @property
    def location(self):
        return f"{self.city}, {self.state} - {self.pincode}"
    
    @property
    def dietary_list(self):
        return json.loads(self.dietary_restrictions) if self.dietary_restrictions else []
    
    @property
    def allergies_list(self):
        return json.loads(self.allergies) if self.allergies else []
    
    @property
    def cuisine_list(self):
        return json.loads(self.cuisine_preferences) if self.cuisine_preferences else []
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'age': self.age,
            'sex': self.sex,
            'city': self.city,
            'state': self.state,
            'pincode': self.pincode,
            'dietary_restrictions': self.dietary_list,
            'allergies': self.allergies_list,
            'food_habits': self.food_habits,
            'cuisine_preferences': self.cuisine_list,
            'location': self.location
        }
    
    def __repr__(self):
        return f'<User {self.name}>'