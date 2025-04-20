import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
import re
import logging

nltk.download('punkt')
nltk.download('stopwords')

class IntentService:
    def __init__(self):
        self.stop_words = set(stopwords.words('english'))
        self.cuisine_keywords = {
            'indian': ['indian', 'curry', 'biryani', 'tandoori'],
            'italian': ['italian', 'pasta', 'pizza', 'risotto'],
            'chinese': ['chinese', 'noodles', 'dim sum', 'szechuan'],
            'mexican': ['mexican', 'taco', 'burrito', 'quesadilla']
        }
        self.meal_type_keywords = {
            'breakfast': ['breakfast', 'pancake', 'omelet'],
            'lunch': ['lunch', 'sandwich', 'salad'],
            'dinner': ['dinner', 'steak', 'grill'],
            'snack': ['snack', 'appetizer', 'finger food']
        }
    
    def analyze(self, query, user_profile):
        """Analyze user query to determine intent"""
        try:
            # Basic cleaning
            query = query.lower()
            tokens = word_tokenize(query)
            tokens = [word for word in tokens if word.isalnum() and word not in self.stop_words]
            
            # Determine intent type (buy or cook)
            intent_type = 'buy'
            if any(word in tokens for word in ['recipe', 'make', 'cook', 'prepare']):
                intent_type = 'cook'
            
            # Detect cuisine preference
            detected_cuisine = None
            for cuisine, keywords in self.cuisine_keywords.items():
                if any(keyword in query for keyword in keywords):
                    detected_cuisine = cuisine
                    break
            
            # Use user preference if no cuisine detected
            cuisine = detected_cuisine or (user_profile['cuisine_preferences'][0] 
                      if user_profile['cuisine_preferences'] else None)
            
            # Detect meal type
            meal_type = 'any'
            for meal, keywords in self.meal_type_keywords.items():
                if any(keyword in query for keyword in keywords):
                    meal_type = meal
                    break
            
            return {
                'type': intent_type,
                'cuisine': cuisine,
                'meal_type': meal_type,
                'platform': self.detect_platform(query),
                'original_query': query
            }
        except Exception as e:
            logging.error(f"Intent analysis error: {str(e)}")
            return {
                'type': 'buy',
                'cuisine': None,
                'meal_type': 'any',
                'platform': 'all',
                'original_query': query
            }
    
    def detect_platform(self, query):
        """Detect if user wants results from specific platform"""
        query = query.lower()
        if 'swiggy' in query:
            return 'swiggy'
        elif 'zomato' in query:
            return 'zomato'
        elif 'blinkit' in query:
            return 'blinkit'
        return 'all'