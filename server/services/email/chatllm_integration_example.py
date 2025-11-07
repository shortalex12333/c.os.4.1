#!/usr/bin/env python3
"""
Example: How to integrate email authentication into your ChatLLM system
"""

import requests
import json
from typing import Dict, Any, Optional

class EmailChatLLMIntegration:
    """Integration between your ChatLLM and the email authentication system"""
    
    def __init__(self):
        self.email_api_base = "http://localhost:8001"
        self.auth_registration_base = "http://localhost:8002"  # For new user authentication
    
    def handle_user_email_request(self, user_id: str, user_message: str) -> Dict[str, Any]:
        """
        Handle when a user wants to search their emails in ChatLLM
        
        Args:
            user_id: Unique identifier for the user (from your ChatLLM session)
            user_message: "Search my emails for yacht contracts"
        
        Returns:
            Dictionary with response for ChatLLM
        """
        
        # Step 1: Check if user has connected their email
        if not self.is_user_authenticated(user_id):
            return {
                "status": "auth_required",
                "message": "Please connect your email account first to search emails.",
                "action_url": f"{self.auth_registration_base}/register?user_id={user_id}",
                "instructions": "Click the link above to connect your Microsoft email account."
            }
        
        # Step 2: User is authenticated, perform email search
        search_query = self.extract_search_query(user_message)
        emails = self.search_user_emails(user_id, search_query)
        
        return {
            "status": "success", 
            "emails": emails,
            "message": f"Found {len(emails)} emails matching '{search_query}'"
        }
    
    def is_user_authenticated(self, user_id: str) -> bool:
        """Check if user has valid authentication stored"""
        try:
            response = requests.get(f"{self.email_api_base}/api/users")
            users = response.json().get("users", [])
            
            # Check if user_id exists in our registered users
            return any(user.get("user_id") == user_id for user in users)
            
        except Exception as e:
            print(f"Error checking authentication: {e}")
            return False
    
    def search_user_emails(self, user_id: str, search_query: str) -> list:
        """Search emails for authenticated user"""
        try:
            payload = {
                "query": search_query,
                "filters": {
                    "date_filter": "receivedDateTime ge 2024-01-01T00:00:00.000Z",
                    "sender_filter": "",
                    "has_attachments": False
                },
                "order_by": "receivedDateTime desc",
                "top": 10,
                "select_fields": ["id", "subject", "from", "receivedDateTime", "bodyPreview"],
                "user_context": {
                    "user_id": user_id,
                    "yacht_id": f"yacht_{user_id}",
                    "session_id": f"session_{user_id}"
                }
            }
            
            response = requests.post(
                f"{self.email_api_base}/api/email/search",
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                result = response.json()
                return result.get("emails", [])
            else:
                print(f"Email search failed: {response.status_code} - {response.text}")
                return []
                
        except Exception as e:
            print(f"Error searching emails: {e}")
            return []
    
    def extract_search_query(self, user_message: str) -> str:
        """Extract search terms from natural language"""
        # Simple extraction - in production, use NLP
        keywords = ["search", "find", "emails", "for", "about", "regarding", "my"]
        words = user_message.lower().split()
        
        # Remove common words and extract search terms
        search_terms = [word for word in words if word not in keywords]
        return " ".join(search_terms[:3])  # Take first 3 meaningful terms
    
    def register_new_user_completion(self, user_id: str, bearer_token: str, 
                                   user_email: str, expires_in: int) -> bool:
        """
        Called when user completes email authentication
        This would typically be called by your auth callback webhook
        """
        try:
            payload = {
                "user_id": user_id,
                "user_email": user_email, 
                "access_token": bearer_token,
                "expires_in": expires_in
            }
            
            response = requests.post(
                f"{self.email_api_base}/api/auth/register",
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            
            return response.status_code == 200
            
        except Exception as e:
            print(f"Error registering user: {e}")
            return False


# Example usage in your ChatLLM system
if __name__ == "__main__":
    # Initialize integration
    email_integration = EmailChatLLMIntegration()
    
    # Simulate user requests
    test_cases = [
        {"user_id": "user123", "message": "Search my emails for yacht contracts"},
        {"user_id": "user456", "message": "Find emails about meetings last week"},  
        {"user_id": "user789", "message": "Look for emails from john@company.com"}
    ]
    
    for case in test_cases:
        print(f"\\n🔍 User {case['user_id']}: {case['message']}")
        result = email_integration.handle_user_email_request(
            case["user_id"], 
            case["message"]
        )
        print(f"✅ Response: {json.dumps(result, indent=2)}")