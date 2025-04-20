from flask import Flask, render_template, request, jsonify
from models import db, User, Favorite, Order
from agents import UserProfileAgent, IntentDetectionAgent, ScraperAgent, FilterAgent, RecommendationAgent
from datetime import datetime, timedelta
import random

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

# Initialize agents
profile_agent = UserProfileAgent()
intent_agent = IntentDetectionAgent()
scraper_agent = ScraperAgent()
filter_agent = FilterAgent()
recommendation_agent = RecommendationAgent()

# Mock food categories for recommendations
FOOD_CATEGORIES = [
    "vegetarian", "vegan", "gluten-free", "organic", 
    "protein-rich", "low-carb", "desserts", "snacks"
]

# Mock restaurant types
RESTAURANT_TYPES = [
    "Indian", "Italian", "Chinese", "Mexican", 
    "Thai", "Mediterranean", "Japanese", "American"
]

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/save_profile', methods=['POST'])
def save_profile():
    data = request.json
    user = profile_agent.create_profile(data)
    return jsonify({"status": "success", "user_id": user.id})

@app.route('/api/get_recommendations', methods=['POST'])
def get_recommendations():
    data = request.json
    user_id = data.get('user_id')
    query = data.get('query', '')
    
    # In a real app, we would fetch user from database
    user = User.query.get(user_id) if user_id else None
    
    # Generate mock recommendations
    num_items = random.randint(4, 8)
    mock_items = []
    
    for i in range(num_items):
        category = random.choice(FOOD_CATEGORIES)
        restaurant = random.choice(RESTAURANT_TYPES)
        price = random.randint(50, 500)
        rating = round(random.uniform(3.5, 5.0), 1)
        
        mock_items.append({
            "name": f"{category.capitalize()} {restaurant} Food Item {i+1}",
            "price": price,
            "brand": f"{restaurant} Kitchen",
            "rating": rating,
            "reviews": random.randint(10, 200),
            "link": f"https://example.com/product{i+1}",
            "source": random.choice(["BigBasket", "Swiggy", "Zomato", "Amazon"]),
            "image": f"https://source.unsplash.com/random/300x200/?food,{category},{restaurant}&sig={i}"
        })
    
    return jsonify({
        "intent": "recommendation",
        "search_query": query,
        "items": mock_items
    })

@app.route('/api/get_favorites', methods=['POST'])
def get_favorites():
    user_id = request.json.get('user_id')
    
    # In a real app, we would fetch from database
    mock_favorites = [
        {
            "name": "Organic Quinoa Salad",
            "link": "https://example.com/favorite1",
            "date": (datetime.now() - timedelta(days=random.randint(1, 30))).strftime('%Y-%m-%d'),
            "image": "https://source.unsplash.com/random/300x200/?salad,healthy"
        },
        {
            "name": "Vegan Protein Shake",
            "link": "https://example.com/favorite2",
            "date": (datetime.now() - timedelta(days=random.randint(1, 30))).strftime('%Y-%m-%d'),
            "image": "https://source.unsplash.com/random/300x200/?shake,vegan"
        }
    ]
    
    return jsonify({"items": mock_favorites})

@app.route('/api/get_order_history', methods=['POST'])
def get_order_history():
    user_id = request.json.get('user_id')
    
    # Generate mock order history
    num_orders = random.randint(3, 6)
    mock_orders = []
    
    for i in range(num_orders):
        days_ago = random.randint(1, 60)
        mock_orders.append({
            "name": f"Order #{random.randint(1000, 9999)}",
            "link": f"https://example.com/order{i+1}",
            "date": (datetime.now() - timedelta(days=days_ago)).strftime('%Y-%m-%d'),
            "price": random.randint(150, 1200),
            "status": random.choice(["Delivered", "Cancelled", "In Transit"]),
            "image": f"https://source.unsplash.com/random/300x200/?food,order&sig={i}"
        })
    
    return jsonify({"items": mock_orders})

@app.route('/api/save_favorite', methods=['POST'])
def save_favorite():
    data = request.json
    # In a real app, we would save to database
    return jsonify({"status": "success"})

@app.route('/api/remove_favorite', methods=['POST'])
def remove_favorite():
    data = request.json
    # In a real app, we would remove from database
    return jsonify({"status": "success"})

@app.route('/api/add_order', methods=['POST'])
def add_order():
    data = request.json
    # In a real app, we would save to database
    return jsonify({"status": "success"})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)