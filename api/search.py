# Celeste Yacht AI - Search Module
# Handles yacht search and recommendation functionality

import json
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class YachtSearchEngine:
    """Advanced yacht search and recommendation engine"""
    
    def __init__(self):
        self.search_filters = [
            'type', 'length', 'price_range', 'location', 
            'year', 'manufacturer', 'crew_capacity', 'guest_capacity'
        ]
        self.yacht_categories = [
            'motor_yacht', 'sailing_yacht', 'catamaran', 
            'superyacht', 'expedition_yacht', 'classic_yacht'
        ]
        
    def search_yachts(self, query: str, filters: Dict = None) -> Dict:
        """
        Search for yachts based on query and filters
        
        Args:
            query: Search query string
            filters: Dictionary of search filters
            
        Returns:
            Dict containing search results
        """
        logger.info(f"Searching yachts with query: '{query}'")
        
        try:
            # Parse and validate filters
            validated_filters = self._validate_filters(filters or {})
            
            # Perform search (placeholder implementation)
            results = self._execute_search(query, validated_filters)
            
            return {
                "success": True,
                "query": query,
                "filters": validated_filters,
                "results": results,
                "total_count": len(results),
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Search error: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "query": query,
                "timestamp": datetime.now().isoformat()
            }
    
    def get_yacht_recommendations(self, preferences: Dict) -> Dict:
        """
        Get yacht recommendations based on user preferences
        
        Args:
            preferences: User preferences dictionary
            
        Returns:
            Dict containing recommendations
        """
        logger.info("Generating yacht recommendations")
        
        try:
            # Analyze preferences
            analyzed_prefs = self._analyze_preferences(preferences)
            
            # Generate recommendations
            recommendations = self._generate_recommendations(analyzed_prefs)
            
            return {
                "success": True,
                "preferences": analyzed_prefs,
                "recommendations": recommendations,
                "recommendation_count": len(recommendations),
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Recommendation error: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    def _validate_filters(self, filters: Dict) -> Dict:
        """Validate and clean search filters"""
        validated = {}
        
        for key, value in filters.items():
            if key in self.search_filters and value is not None:
                validated[key] = value
                
        return validated
    
    def _execute_search(self, query: str, filters: Dict) -> List[Dict]:
        """Execute the actual search (placeholder implementation)"""
        # This would connect to your yacht database/API
        sample_results = [
            {
                "id": "yacht_001",
                "name": "Celeste Explorer",
                "type": "motor_yacht",
                "length": 45.0,
                "location": "Monaco",
                "price_range": "luxury",
                "description": "Luxurious motor yacht perfect for Mediterranean adventures"
            },
            {
                "id": "yacht_002", 
                "name": "Ocean Dreamer",
                "type": "sailing_yacht",
                "length": 38.0,
                "location": "Caribbean",
                "price_range": "premium",
                "description": "Classic sailing yacht with modern amenities"
            }
        ]
        
        # Filter results based on query and filters
        filtered_results = []
        for yacht in sample_results:
            if self._matches_criteria(yacht, query, filters):
                filtered_results.append(yacht)
                
        return filtered_results
    
    def _matches_criteria(self, yacht: Dict, query: str, filters: Dict) -> bool:
        """Check if yacht matches search criteria"""
        # Simple text matching for query
        if query.lower() not in yacht.get('name', '').lower() and \
           query.lower() not in yacht.get('description', '').lower():
            return False
            
        # Check filters
        for filter_key, filter_value in filters.items():
            if filter_key in yacht and yacht[filter_key] != filter_value:
                return False
                
        return True
    
    def _analyze_preferences(self, preferences: Dict) -> Dict:
        """Analyze and categorize user preferences"""
        analyzed = {
            "yacht_type_preference": preferences.get('type', 'any'),
            "size_preference": preferences.get('size', 'medium'),
            "location_preference": preferences.get('location', 'any'),
            "budget_range": preferences.get('budget', 'flexible'),
            "experience_level": preferences.get('experience', 'intermediate')
        }
        
        return analyzed
    
    def _generate_recommendations(self, preferences: Dict) -> List[Dict]:
        """Generate yacht recommendations based on preferences"""
        # This would use ML/AI algorithms in a real implementation
        sample_recommendations = [
            {
                "yacht_id": "rec_001",
                "name": "Azure Princess",
                "type": "catamaran",
                "match_score": 0.95,
                "reasons": ["Perfect size match", "Preferred location", "Within budget"],
                "highlights": ["Spacious deck", "Modern navigation", "Experienced crew"]
            },
            {
                "yacht_id": "rec_002",
                "name": "Mystic Winds",
                "type": "sailing_yacht", 
                "match_score": 0.87,
                "reasons": ["Great for your experience level", "Scenic route options"],
                "highlights": ["Classic design", "Excellent reviews", "Flexible itinerary"]
            }
        ]
        
        return sample_recommendations
    
    def get_yacht_details(self, yacht_id: str) -> Dict:
        """Get detailed information about a specific yacht"""
        logger.info(f"Fetching details for yacht: {yacht_id}")
        
        # Placeholder implementation
        return {
            "success": True,
            "yacht_id": yacht_id,
            "details": {
                "name": "Sample Yacht",
                "type": "motor_yacht",
                "specifications": {
                    "length": 50.0,
                    "beam": 12.0,
                    "draft": 3.5,
                    "guests": 12,
                    "crew": 6
                },
                "amenities": ["WiFi", "Air Conditioning", "Water Sports Equipment"],
                "availability": "Available for booking"
            },
            "timestamp": datetime.now().isoformat()
        }

if __name__ == "__main__":
    search_engine = YachtSearchEngine()
    
    # Test search
    results = search_engine.search_yachts("luxury yacht", {"type": "motor_yacht"})
    print("Search Results:")
    print(json.dumps(results, indent=2))
    
    # Test recommendations
    preferences = {"type": "sailing", "size": "medium", "location": "Mediterranean"}
    recommendations = search_engine.get_yacht_recommendations(preferences)
    print("\nRecommendations:")
    print(json.dumps(recommendations, indent=2)) 