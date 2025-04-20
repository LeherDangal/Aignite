import logging

class FilterService:
    def apply_filters(self, recommendations, user_profile):
        try:
            dietary_restrictions = user_profile.get('dietary_restrictions', [])
            allergies = user_profile.get('allergies', [])
            food_habits = user_profile.get('food_habits', '')
            
            filtered = []
            for item in recommendations:
                if self._is_item_suitable(item, dietary_restrictions, allergies, food_habits):
                    filtered.append(item)
            
            return filtered
        except Exception as e:
            logging.error(f"Filtering error: {str(e)}")
            return recommendations

    def _is_item_suitable(self, item, dietary_restrictions, allergies, food_habits):
        # Check against dietary restrictions
        if 'vegetarian' in dietary_restrictions and 'non-veg' in item.get('tags', []):
            return False
        if 'vegan' in dietary_restrictions and any(tag in item.get('description', '').lower() for tag in ['dairy', 'cheese', 'milk']):
            return False
            
        # Check against allergies
        for allergen in allergies:
            if allergen.lower() in item.get('description', '').lower():
                return False
                
        # Check food habits
        if food_habits == 'vegetarian' and 'non-veg' in item.get('tags', []):
            return False
            
        return True