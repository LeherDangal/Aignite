from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    age = db.Column(db.Integer)
    gender = db.Column(db.String(20))
    allergies = db.Column(db.String(200))
    diet = db.Column(db.String(50))
    location = db.Column(db.String(100))
    preferred_brands = db.Column(db.String(200))
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    
    favorites = db.relationship('Favorite', backref='user', lazy=True)
    orders = db.relationship('Order', backref='user', lazy=True)

class Favorite(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    product_name = db.Column(db.String(200))
    product_link = db.Column(db.String(500))
    saved_at = db.Column(db.DateTime, default=db.func.current_timestamp())

class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    product_name = db.Column(db.String(200))
    product_link = db.Column(db.String(500))
    price = db.Column(db.Float)
    status = db.Column(db.String(50))
    ordered_at = db.Column(db.DateTime, default=db.func.current_timestamp())