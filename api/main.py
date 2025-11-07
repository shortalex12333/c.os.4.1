# Celeste Yacht AI - FastAPI Backend Server
# Main server file with webhook endpoints

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
import json
import logging
from datetime import datetime

# Import our modules
from ingestion import YachtDataIngestion
from search import YachtSearchEngine

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Celeste Yacht AI API",
    description="AI-powered yacht search and recommendation system",
    version="1.1.0"
)

# Configure CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # React dev server
        "http://localhost:8080",  # Alternative dev port
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8080"
    ],
    allow_credentials=False,  # No auth for now
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
yacht_ingestion = YachtDataIngestion()
yacht_search = YachtSearchEngine()

# Pydantic models for request/response
class YachtChatRequest(BaseModel):
    message: str
    sessionId: Optional[str] = None
    timestamp: Optional[str] = None
    type: Optional[str] = "yacht_assistance"

class YachtSearchRequest(BaseModel):
    query: str
    filters: Optional[Dict] = {}
    timestamp: Optional[str] = None

class YachtRecommendationRequest(BaseModel):
    preferences: Dict = {}
    timestamp: Optional[str] = None

class DataIngestionRequest(BaseModel):
    data_source: str
    format_type: str = "json"

# Health check endpoint
@app.get("/")
async def root():
    """Root endpoint - health check"""
    return {
        "service": "Celeste Yacht AI",
        "version": "1.1.0",
        "status": "running",
        "timestamp": datetime.now().isoformat(),
        "endpoints": [
            "/yacht-chat",
            "/search-yachts", 
            "/yacht-recommendations",
            "/ingest-data",
            "/health"
        ]
    }

@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "services": {
            "yacht_search": "operational",
            "data_ingestion": "operational",
            "chat_ai": "operational"
        },
        "timestamp": datetime.now().isoformat()
    }

# Yacht Chat endpoint (webhook compatible)
@app.post("/yacht-chat")
async def yacht_chat(request: YachtChatRequest):
    """
    Process yacht-related chat messages
    Compatible with webhook service from frontend
    """
    try:
        logger.info(f"Processing yacht chat: {request.message}")
        
        # Basic AI response logic (placeholder)
        response = generate_yacht_ai_response(request.message)
        
        return {
            "success": True,
            "response": response,
            "sessionId": request.sessionId or f"yacht_session_{datetime.now().timestamp()}",
            "timestamp": datetime.now().isoformat(),
            "metadata": {
                "category": "yacht_assistance",
                "confidence": 0.95
            }
        }
        
    except Exception as e:
        logger.error(f"Yacht chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Yacht Search endpoint
@app.post("/search-yachts")
async def search_yachts(request: YachtSearchRequest):
    """Search for yachts based on query and filters"""
    try:
        logger.info(f"Yacht search request: {request.query}")
        
        result = yacht_search.search_yachts(request.query, request.filters)
        
        if result["success"]:
            return result
        else:
            raise HTTPException(status_code=400, detail=result.get("error", "Search failed"))
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Search error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Yacht Recommendations endpoint  
@app.post("/yacht-recommendations")
async def yacht_recommendations(request: YachtRecommendationRequest):
    """Get yacht recommendations based on preferences"""
    try:
        logger.info("Generating yacht recommendations")
        
        result = yacht_search.get_yacht_recommendations(request.preferences)
        
        if result["success"]:
            return result
        else:
            raise HTTPException(status_code=400, detail=result.get("error", "Recommendation failed"))
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Recommendation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Data Ingestion endpoint
@app.post("/ingest-data")
async def ingest_yacht_data(request: DataIngestionRequest):
    """Ingest yacht data from various sources"""
    try:
        logger.info(f"Data ingestion request: {request.data_source}")
        
        result = yacht_ingestion.ingest_yacht_data(
            request.data_source, 
            request.format_type
        )
        
        if result["success"]:
            return result
        else:
            raise HTTPException(status_code=400, detail=result.get("error", "Ingestion failed"))
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ingestion error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Get yacht details endpoint
@app.get("/yacht/{yacht_id}")
async def get_yacht_details(yacht_id: str):
    """Get detailed information about a specific yacht"""
    try:
        result = yacht_search.get_yacht_details(yacht_id)
        return result
        
    except Exception as e:
        logger.error(f"Yacht details error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Helper function for AI responses
def generate_yacht_ai_response(message: str) -> str:
    """
    Generate AI response for yacht-related queries
    This is a placeholder - in production you'd use a proper AI model
    """
    message_lower = message.lower()
    
    # Simple keyword-based responses
    if any(word in message_lower for word in ['hello', 'hi', 'hey']):
        return "Hello! I'm Celeste, your yacht AI assistant. I can help you find the perfect yacht, provide recommendations, and answer questions about yacht charters. What would you like to know?"
    
    elif any(word in message_lower for word in ['search', 'find', 'looking for']):
        return "I'd be happy to help you search for yachts! You can tell me about your preferences like yacht type (motor/sailing/catamaran), size, location, budget, or any specific features you're looking for."
    
    elif any(word in message_lower for word in ['recommend', 'suggestion', 'advice']):
        return "I can provide personalized yacht recommendations based on your preferences. Tell me about your ideal yacht experience - where would you like to sail, how many people, what's your experience level, and what's most important to you?"
    
    elif any(word in message_lower for word in ['price', 'cost', 'budget']):
        return "Yacht charter prices vary greatly depending on size, type, season, and location. I can help you find options within your budget range. What's your preferred price range, and where are you looking to charter?"
    
    elif any(word in message_lower for word in ['location', 'where', 'destination']):
        return "Popular yacht charter destinations include the Mediterranean (French Riviera, Italy, Greece), Caribbean (British Virgin Islands, St. Martin), and many others. Each offers unique experiences. Where are you interested in sailing?"
    
    elif any(word in message_lower for word in ['size', 'big', 'large', 'small']):
        return "Yacht sizes typically range from 30-40ft (intimate for couples) to 100ft+ (luxury superyachts for larger groups). The right size depends on your group size, budget, and desired amenities. How many people will be joining you?"
    
    else:
        return f"That's an interesting question about yachts! I'm here to help with yacht searches, recommendations, and charter information. Could you tell me more specifically what you'd like to know? I can help with yacht types, locations, pricing, or finding the perfect yacht for your needs."

# Error handlers
@app.exception_handler(404)
async def not_found_handler(request, exc):
    return {
        "error": "Endpoint not found",
        "available_endpoints": [
            "/yacht-chat",
            "/search-yachts", 
            "/yacht-recommendations",
            "/ingest-data",
            "/health"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    print("🛥️  Starting Celeste Yacht AI Server on http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True) 