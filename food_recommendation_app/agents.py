from typing import List, Dict, Optional
from dataclasses import dataclass
import requests
from bs4 import BeautifulSoup
import re
from models import db, User, Favorite, Order
import random
from datetime import datetime, timedelta

# Configuration
SCRAPER_CONFIG = {
    "headers": {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
}

@dataclass
class Product:
    name: str
    price: float
    brand: str
    rating: float
    reviews: int
    link: str
    ingredients: List[str]
    source: str
    image: str

class UserProfileAgent:
    """Collects and stores user information"""
    
    def create_profile(self, form_data: Dict) -> User:
        """Process form submission and create user profile"""
        user = User(
            name=form_data.get('name', ''),
            age=int(form_data.get('age', 25)),
            gender=form_data.get('gender', ''),
            allergies=form_data.get('allergies', ''),
            diet=form_data.get('diet', 'non-vegetarian'),
            location=form_data.get('location', ''),
            preferred_brands=form_data.get('brands', '')
        )
        
        db.session.add(user)
        db.session.commit()
        return user
    
    def get_profile(self, user_id: int) -> Optional[User]:
        """Retrieve user profile by ID"""
        return User.query.get(user_id)

class IntentDetectionAgent:
    """Determines user intent using NLP"""
    
    def detect_intent(self, query: str) -> str:
        """Classify user intent into categories"""
        query = query.lower()
        
        if any(term in query for term in ['recipe', 'cook', 'make', 'prepare', 'homemade']):
            return "cook_from_scratch"
        elif any(term in query for term in ['buy', 'order', 'deliver', 'restaurant', 'near me']):
            return "buy_ready_made"
        elif any(term in query for term in ['healthy', 'diet', 'nutrition']):
            return "healthy_options"
        return "general_recommendation"
    
    def build_search_query(self, query: str, user: User) -> str:
        """Generate search query based on user context"""
        base_query = query
        
        # Add dietary restrictions
        if user.diet == 'vegetarian':
            base_query += " vegetarian"
        elif user.diet == 'vegan':
            base_query += " vegan"
            
        # Add allergy-free tags for major allergies
        allergies = [a.strip() for a in user.allergies.split(',') if a.strip()]
        for allergy in allergies:
            base_query += f" {allergy}-free"
            
        # Add location if buying ready-made
        if user.location and self.detect_intent(query) == "buy_ready_made":
            base_query += f" near {user.location}"
            
        return base_query.strip()

class ScraperAgent:
    """Scrapes product data from multiple e-commerce sites"""
    
    def scrape_all(self, query: str) -> List[Product]:
        """Scrape multiple sites or return mock data"""
        # In a production app, this would scrape real sites
        # For demo purposes, we'll return mock data
        
        num_items = random.randint(4, 8)
        mock_products = []
        
        for i in range(num_items):
            mock_products.append(
                Product(
                    name=f"{query.capitalize()} Product {i+1}",
                    price=round(random.uniform(50, 500), 2),
                    brand=f"Brand {random.choice(['A', 'B', 'C'])}",
                    rating=round(random.uniform(3.5, 5.0), 1),
                    reviews=random.randint(10, 200),
                    link=f"https://example.com/product{i+1}",
                    ingredients=["ingredient1", "ingredient2"],
                    source=random.choice(["BigBasket", "Swiggy", "Zomato"]),
                    image=f"https://source.unsplash.com/random/300x200/?food,{query}&sig={i}"
                )
            )
        
        return mock_products

class FilterAgent:
    """Filters products based on user restrictions"""
    
    def filter_products(self, products: List[Product], user: User) -> List[Product]:
        """Apply all filters"""
        if not user:
            return products
            
        filtered = []
        allergies = [a.strip().lower() for a in user.allergies.split(',') if a.strip()]
        
        for product in products:
            if not self._check_diet(product, user.diet):
                continue
                
            if not self._check_allergies(product, allergies):
                continue
                
            filtered.append(product)
            
        return filtered
    
    def _check_diet(self, product: Product, diet: str) -> bool:
        """Check dietary restrictions"""
        if diet == 'vegetarian':
            return not any(non_veg in product.name.lower() for non_veg in ['chicken', 'meat', 'fish', 'egg'])
        elif diet == 'vegan':
            return not any(non_vegan in product.name.lower() for non_vegan in ['dairy', 'milk', 'cheese', 'honey'])
        return True
    
    def _check_allergies(self, product: Product, allergies: List[str]) -> bool:
        """Check for allergens"""
        ingredients = ' '.join(product.ingredients).lower()
        product_name = product.name.lower()
        
        for allergen in allergies:
            if allergen.lower() in ingredients or allergen.lower() in product_name:
                return False
        return True

class RecommendationAgent:
    """Ranks and recommends products"""
    
    def recommend(self, products: List[Product], user: User) -> List[Product]:
        """Sort products by relevance"""
        if not products:
            return []
            
        # Score each product
        scored_products = []
        preferred_brands = [b.strip().lower() for b in user.preferred_brands.split(',') if b.strip()]
        
        for product in products:
            score = 0
            
            # Brand preference (30% weight)
            if any(brand in product.brand.lower() for brand in preferred_brands):
                score += 30
                
            # Rating (25% weight)
            score += product.rating * 5  # 5*5=25
            
            # Reviews (20% weight) - logarithmic scale to avoid extreme bias
            score += min(20, (product.reviews ** 0.5) * 0.2) if product.reviews > 0 else 0
            
            # Price (15% weight) - lower is better
            if product.price < 100:
                score += 15
            elif product.price < 500:
                score += 10
            else:
                score += 5
                
            # Source preference (10% weight)
            if product.source in ["BigBasket", "Nature's Basket"]:
                score += 10
                
            scored_products.append((product, score))
        
        # Sort by score descending
        scored_products.sort(key=lambda x: x[1], reverse=True)
        return [p[0] for p in scored_products]