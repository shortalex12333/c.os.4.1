"""
Centralized error handling and offline scenario management
Provides robust error handling for authentication and API failures
"""

import logging
import time
from typing import Optional, Callable, Any
from functools import wraps
import requests

logger = logging.getLogger(__name__)

class YachtEmailError(Exception):
    """Base exception for Yacht Email Reader application"""
    pass

class AuthenticationError(YachtEmailError):
    """Raised when authentication fails"""
    pass

class NetworkError(YachtEmailError):
    """Raised when network connectivity issues occur"""
    pass

class RateLimitError(YachtEmailError):
    """Raised when API rate limits are exceeded"""
    pass

class PermissionError(YachtEmailError):
    """Raised when insufficient permissions are encountered"""
    pass

class OfflineError(YachtEmailError):
    """Raised when operating in offline mode"""
    pass

class ErrorHandler:
    """Centralized error handling and recovery"""
    
    def __init__(self):
        self.offline_mode = False
        self.last_network_check = 0
        self.network_check_interval = 30  # seconds
        
    def handle_api_error(self, response: requests.Response) -> None:
        """
        Handle HTTP response errors from Graph API
        
        Args:
            response: requests.Response object
            
        Raises:
            Appropriate exception based on status code
        """
        status_code = response.status_code
        
        if status_code == 401:
            logger.error("Authentication failed - token expired or invalid")
            raise AuthenticationError("Authentication token expired or invalid. Please login again.")
        
        elif status_code == 403:
            logger.error("Access forbidden - insufficient permissions")
            raise PermissionError("Insufficient permissions to access this resource. Check app registration permissions.")
        
        elif status_code == 429:
            retry_after = response.headers.get('Retry-After', '60')
            logger.error(f"Rate limit exceeded - retry after {retry_after} seconds")
            raise RateLimitError(f"API rate limit exceeded. Please wait {retry_after} seconds before retrying.")
        
        elif status_code == 503:
            logger.error("Service unavailable")
            raise NetworkError("Microsoft Graph service is temporarily unavailable. Please try again later.")
        
        elif status_code >= 500:
            logger.error(f"Server error: {status_code}")
            raise NetworkError(f"Server error ({status_code}). Please try again later.")
        
        elif status_code >= 400:
            error_msg = f"Client error ({status_code}): {response.text}"
            logger.error(error_msg)
            raise YachtEmailError(error_msg)
        
        else:
            logger.error(f"Unexpected response: {status_code}")
            raise YachtEmailError(f"Unexpected response ({status_code})")
    
    def handle_network_error(self, error: requests.RequestException) -> None:
        """
        Handle network-related errors
        
        Args:
            error: Network exception
            
        Raises:
            NetworkError with appropriate message
        """
        logger.error(f"Network error: {str(error)}")
        
        if isinstance(error, requests.exceptions.ConnectTimeout):
            raise NetworkError("Connection timeout. Check your internet connection.")
        
        elif isinstance(error, requests.exceptions.ConnectionError):
            self.offline_mode = True
            raise NetworkError("Cannot connect to Microsoft Graph. Check your internet connection or try again later.")
        
        elif isinstance(error, requests.exceptions.ReadTimeout):
            raise NetworkError("Request timeout. The server is taking too long to respond.")
        
        else:
            raise NetworkError(f"Network error: {str(error)}")
    
    def check_network_connectivity(self) -> bool:
        """
        Check if network connectivity is available
        
        Returns:
            bool: True if network is available, False otherwise
        """
        current_time = time.time()
        
        # Avoid checking too frequently
        if current_time - self.last_network_check < self.network_check_interval:
            return not self.offline_mode
        
        self.last_network_check = current_time
        
        try:
            # Quick connectivity check to Microsoft's login endpoint
            response = requests.get(
                'https://login.microsoftonline.com/common/discovery/instance',
                timeout=5
            )
            
            if response.status_code == 200:
                self.offline_mode = False
                logger.info("Network connectivity confirmed")
                return True
            else:
                self.offline_mode = True
                logger.warning("Network connectivity check failed")
                return False
                
        except requests.RequestException as e:
            self.offline_mode = True
            logger.warning(f"Network connectivity check failed: {str(e)}")
            return False
    
    def is_offline(self) -> bool:
        """
        Check if application is in offline mode
        
        Returns:
            bool: True if offline, False otherwise
        """
        return self.offline_mode
    
    def set_offline_mode(self, offline: bool) -> None:
        """
        Manually set offline mode
        
        Args:
            offline: True to enable offline mode, False to disable
        """
        self.offline_mode = offline
        logger.info(f"Offline mode {'enabled' if offline else 'disabled'}")

def retry_on_error(max_retries: int = 3, 
                   delay: float = 1.0, 
                   backoff: float = 2.0,
                   exceptions: tuple = (NetworkError, RateLimitError)):
    """
    Decorator to retry function calls on specific errors
    
    Args:
        max_retries: Maximum number of retry attempts
        delay: Initial delay between retries in seconds
        backoff: Multiplier for delay after each retry
        exceptions: Tuple of exceptions to retry on
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            last_exception = None
            current_delay = delay
            
            for attempt in range(max_retries + 1):
                try:
                    return func(*args, **kwargs)
                
                except exceptions as e:
                    last_exception = e
                    
                    if attempt < max_retries:
                        logger.warning(f"Attempt {attempt + 1} failed: {str(e)}. Retrying in {current_delay} seconds...")
                        time.sleep(current_delay)
                        current_delay *= backoff
                    else:
                        logger.error(f"All {max_retries} retry attempts failed")
                        break
                
                except Exception as e:
                    # Don't retry on unexpected exceptions
                    logger.error(f"Unexpected error in {func.__name__}: {str(e)}")
                    raise
            
            # Re-raise the last exception if all retries failed
            if last_exception:
                raise last_exception
        
        return wrapper
    return decorator

def safe_api_call(func: Callable, 
                  error_handler: ErrorHandler, 
                  default_return: Any = None) -> Any:
    """
    Safely execute an API call with comprehensive error handling
    
    Args:
        func: Function to execute
        error_handler: ErrorHandler instance
        default_return: Value to return on error
        
    Returns:
        Function result or default_return on error
    """
    try:
        # Check network connectivity first
        if not error_handler.check_network_connectivity():
            logger.warning("Network unavailable - operation cannot be completed")
            raise OfflineError("Network connectivity required for this operation")
        
        return func()
        
    except requests.exceptions.RequestException as e:
        error_handler.handle_network_error(e)
        
    except (AuthenticationError, PermissionError, RateLimitError, NetworkError, OfflineError):
        # Re-raise known errors
        raise
        
    except Exception as e:
        logger.error(f"Unexpected error in API call: {str(e)}")
        raise YachtEmailError(f"Unexpected error: {str(e)}")
    
    return default_return

class OfflineDataManager:
    """Manages cached data for offline operation"""
    
    def __init__(self):
        self.cached_user_info = None
        self.cached_emails = []
        self.last_sync_time = None
    
    def cache_user_info(self, user_info: dict) -> None:
        """Cache user profile information"""
        self.cached_user_info = user_info
        logger.info("User info cached for offline use")
    
    def cache_emails(self, emails: list) -> None:
        """Cache email data for offline browsing"""
        self.cached_emails = emails
        self.last_sync_time = time.time()
        logger.info(f"Cached {len(emails)} emails for offline use")
    
    def get_cached_user_info(self) -> Optional[dict]:
        """Get cached user information"""
        return self.cached_user_info
    
    def get_cached_emails(self) -> list:
        """Get cached email data"""
        return self.cached_emails
    
    def has_cached_data(self) -> bool:
        """Check if cached data is available"""
        return bool(self.cached_emails or self.cached_user_info)
    
    def clear_cache(self) -> None:
        """Clear all cached data"""
        self.cached_user_info = None
        self.cached_emails = []
        self.last_sync_time = None
        logger.info("Offline cache cleared")

# Global error handler and offline data manager instances
error_handler = ErrorHandler()
offline_data_manager = OfflineDataManager()