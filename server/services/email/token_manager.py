"""
Secure token storage using macOS Keychain
Handles access and refresh token persistence with encryption
"""

import keyring
import json
import logging
import time
from typing import Optional, Dict, Any
from config import KEYCHAIN_SERVICE, APP_NAME

logger = logging.getLogger(__name__)

class TokenManager:
    """Manages secure storage and retrieval of OAuth tokens using macOS Keychain"""
    
    def __init__(self, username: str = "default_user"):
        self.username = username
        self.service_name = KEYCHAIN_SERVICE
        self.cache_key = f"{username}_cache"
        
    def store_tokens(self, token_response: Dict[str, Any]) -> bool:
        """
        Store access and refresh tokens securely in macOS Keychain
        
        Args:
            token_response: Dictionary containing tokens from MSAL
            
        Returns:
            bool: True if storage successful, False otherwise
        """
        try:
            # Extract relevant token data with timestamp
            current_time = int(time.time())
            expires_in = token_response.get('expires_in', 3600)
            
            token_data = {
                'access_token': token_response.get('access_token'),
                'refresh_token': token_response.get('refresh_token'),
                'expires_in': expires_in,
                'expires_at': current_time + expires_in,
                'scope': token_response.get('scope'),
                'token_type': token_response.get('token_type', 'Bearer'),
                'stored_at': current_time
            }
            
            # Store as JSON string in keychain
            token_json = json.dumps(token_data)
            keyring.set_password(self.service_name, self.username, token_json)
            
            logger.info("Tokens stored successfully in macOS Keychain")
            return True
            
        except Exception as e:
            logger.error(f"Failed to store tokens: {str(e)}")
            return False
    
    def get_tokens(self) -> Optional[Dict[str, Any]]:
        """
        Retrieve tokens from macOS Keychain
        
        Returns:
            Dict containing token data or None if not found
        """
        try:
            token_json = keyring.get_password(self.service_name, self.username)
            
            if token_json:
                token_data = json.loads(token_json)
                logger.info("Tokens retrieved successfully from macOS Keychain")
                return token_data
            else:
                logger.info("No tokens found in macOS Keychain")
                return None
                
        except Exception as e:
            logger.error(f"Failed to retrieve tokens: {str(e)}")
            return None
    
    def clear_tokens(self) -> bool:
        """
        Remove stored tokens from macOS Keychain
        
        Returns:
            bool: True if deletion successful, False otherwise
        """
        try:
            # Clear both tokens and cache
            success = True
            try:
                keyring.delete_password(self.service_name, self.username)
            except keyring.errors.PasswordDeleteError:
                pass  # Already deleted
            
            try:
                keyring.delete_password(self.service_name, self.cache_key)
            except keyring.errors.PasswordDeleteError:
                pass  # Already deleted
                
            logger.info("Tokens and cache cleared from macOS Keychain")
            return True
            
        except keyring.errors.PasswordDeleteError:
            logger.info("No tokens found to delete")
            return True
            
        except Exception as e:
            logger.error(f"Failed to clear tokens: {str(e)}")
            return False
    
    def has_tokens(self) -> bool:
        """
        Check if valid tokens exist in keychain
        
        Returns:
            bool: True if valid tokens exist, False otherwise
        """
        tokens = self.get_tokens()
        return tokens is not None and self.is_token_valid(tokens)
    
    def is_token_valid(self, token_data: Dict[str, Any]) -> bool:
        """
        Check if token is still valid (not expired)
        
        Args:
            token_data: Token data dictionary
            
        Returns:
            bool: True if token is valid, False otherwise
        """
        if not token_data or 'expires_at' not in token_data:
            return False
        
        # Add 5 minute buffer for token expiration
        current_time = int(time.time())
        expires_at = token_data.get('expires_at', 0)
        return (expires_at - 300) > current_time
    
    def store_cache(self, cache_data: str) -> bool:
        """
        Store MSAL cache data
        
        Args:
            cache_data: Serialized cache data
            
        Returns:
            bool: True if storage successful, False otherwise
        """
        try:
            keyring.set_password(self.service_name, self.cache_key, cache_data)
            logger.info("Cache stored successfully")
            return True
        except Exception as e:
            logger.error(f"Failed to store cache: {str(e)}")
            return False
    
    def get_cache(self) -> Optional[str]:
        """
        Retrieve MSAL cache data
        
        Returns:
            str: Cache data or None if not found
        """
        try:
            cache_data = keyring.get_password(self.service_name, self.cache_key)
            if cache_data:
                logger.info("Cache retrieved successfully")
            return cache_data
        except Exception as e:
            logger.error(f"Failed to retrieve cache: {str(e)}")
            return None