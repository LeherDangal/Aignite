import logging
from math import exp

class RankService:
    def rank_results(self, recommendations, user_profile):
        try:
            # Score each recommendation based on user preferences
            scored_recs = []
            for rec in recommendations:
                score = self._calculate_score(rec, user_profile)
                scored_recs.append((score, rec))
            
            # Sort by score (descending)
            scored_recs.sort(key=lambda x: x[0], reverse=True)
            
            # Return just the recommendations without scores
            return [rec for (score, rec) in scored_recs]
        except Exception as e:
            logging.error(f"Ranking error: {str(e)}")
            return recommendations

    def _calculate_score(self, recommendation, user_profile):
        score = 0
        
        # Cuisine preference match
        preferred_cuisines = user_profile.get('cuisine_preferences', [])
        if recommendation.get('cuisine') in preferred_cuisines:
            score += 2
            
        # Price sensitivity (lower price better)
        price = recommendation.get('price', 0)
        score += 1 / (1 + price/100)  # Normalized price impact
            
        # Rating importance
        rating = recommendation.get('rating', 0)
        score += rating / 2  # Half point per star
            
        # Distance penalty
        distance = float(recommendation.get('distance', '0').split()[0])
        score -= distance * 0.1  # Small penalty per km
            
        return score