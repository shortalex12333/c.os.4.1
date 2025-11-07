"""
Microsoft Graph API Client for Email Operations
Handles all Graph API interactions for reading emails and mailbox data
"""

import requests
import json
import logging
import time
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from dateutil import parser as date_parser
from config import GRAPH_BASE_URL, MESSAGES_ENDPOINT, FOLDERS_ENDPOINT, USER_ENDPOINT
from auth_manager import AuthManager

logger = logging.getLogger(__name__)

class GraphClient:
    """Client for Microsoft Graph API operations"""
    
    def __init__(self, auth_manager: AuthManager):
        self.auth_manager = auth_manager
        self.session = requests.Session()
        
    def _get_headers(self) -> Dict[str, str]:
        """Get HTTP headers with current access token"""
        access_token = self.auth_manager.get_access_token()
        if not access_token:
            raise Exception("No valid access token available")
        
        return {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    
    def _make_request(self, method: str, url: str, max_retries: int = 3, **kwargs) -> Dict[str, Any]:
        """
        Make authenticated request to Graph API with proper rate limiting
        
        Args:
            method: HTTP method (GET, POST, etc.)
            url: Full URL for the request
            max_retries: Maximum number of retry attempts for rate limiting
            **kwargs: Additional arguments for requests
            
        Returns:
            Dict containing response data
            
        Raises:
            Exception: If request fails or authentication issues
        """
        last_exception = None
        
        for attempt in range(max_retries + 1):
            try:
                headers = self._get_headers()
                response = self.session.request(method, url, headers=headers, **kwargs)
                
                if response.status_code == 401:
                    raise Exception("Authentication failed - token may be expired")
                elif response.status_code == 403:
                    raise Exception("Access forbidden - insufficient permissions")
                elif response.status_code == 429:
                    # Microsoft Graph rate limiting - respect Retry-After header
                    retry_after = int(response.headers.get('Retry-After', 60))
                    if attempt < max_retries:
                        logger.warning(f"Rate limit hit, waiting {retry_after} seconds (attempt {attempt + 1}/{max_retries})")
                        time.sleep(retry_after)
                        continue
                    else:
                        raise Exception(f"Rate limit exceeded after {max_retries} retries - please wait before retrying")
                elif response.status_code == 503:
                    # Service unavailable - exponential backoff
                    if attempt < max_retries:
                        wait_time = min(2 ** attempt, 60)  # Max 60 seconds
                        logger.warning(f"Service unavailable, waiting {wait_time} seconds (attempt {attempt + 1}/{max_retries})")
                        time.sleep(wait_time)
                        continue
                    else:
                        raise Exception("Microsoft Graph service temporarily unavailable")
                elif not response.ok:
                    error_msg = f"Graph API request failed: {response.status_code} - {response.text}"
                    raise Exception(error_msg)
                
                return response.json()
                
            except requests.exceptions.RequestException as e:
                last_exception = e
                if attempt < max_retries:
                    wait_time = min(2 ** attempt, 30)  # Exponential backoff up to 30 seconds
                    logger.warning(f"Network error, retrying in {wait_time} seconds: {str(e)}")
                    time.sleep(wait_time)
                    continue
                else:
                    logger.error(f"Network error in Graph API request after {max_retries} retries: {str(e)}")
                    raise Exception(f"Network error: {str(e)}")
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse Graph API response: {str(e)}")
                raise Exception("Invalid response from Graph API")
        
        # This should never be reached, but just in case
        if last_exception:
            raise Exception(f"Request failed after {max_retries} retries: {str(last_exception)}")
    
    def get_user_profile(self) -> Dict[str, Any]:
        """
        Get current user's profile information
        
        Returns:
            Dict containing user profile data
        """
        try:
            logger.info("Fetching user profile")
            response = self._make_request('GET', USER_ENDPOINT)
            
            user_info = {
                'displayName': response.get('displayName', 'Unknown User'),
                'mail': response.get('mail', response.get('userPrincipalName', 'Unknown Email')),
                'id': response.get('id', ''),
                'jobTitle': response.get('jobTitle', ''),
                'officeLocation': response.get('officeLocation', '')
            }
            
            logger.info(f"User profile retrieved for: {user_info['displayName']}")
            return user_info
            
        except Exception as e:
            logger.error(f"Failed to get user profile: {str(e)}")
            if "401" in str(e):
                raise Exception("Authentication expired. Please login again.")
            else:
                raise Exception(f"Failed to get user profile: {str(e)}")
    
    def get_mailbox_folders(self) -> List[Dict[str, Any]]:
        """
        Get list of mailbox folders
        
        Returns:
            List of folder information dictionaries
        """
        try:
            logger.info("Fetching mailbox folders")
            response = self._make_request('GET', FOLDERS_ENDPOINT)
            
            folders = []
            for folder in response.get('value', []):
                folder_info = {
                    'id': folder.get('id', ''),
                    'displayName': folder.get('displayName', ''),
                    'totalItemCount': folder.get('totalItemCount', 0),
                    'unreadItemCount': folder.get('unreadItemCount', 0),
                    'parentFolderId': folder.get('parentFolderId', '')
                }
                folders.append(folder_info)
            
            logger.info(f"Retrieved {len(folders)} mailbox folders")
            return folders
            
        except Exception as e:
            logger.error(f"Failed to get mailbox folders: {str(e)}")
            raise
    
    def search_emails(self, 
                     search_query: str = None,
                     folder_id: str = None,
                     max_results: int = 50,
                     days_back: int = None) -> List[Dict[str, Any]]:
        """
        Search for emails with various filters
        
        Args:
            search_query: Search term for email content/subject
            folder_id: Specific folder to search in
            max_results: Maximum number of results to return
            days_back: Number of days to look back
            
        Returns:
            List of email dictionaries
        """
        try:
            # Build the API endpoint
            if folder_id:
                endpoint = f"{FOLDERS_ENDPOINT}/{folder_id}/messages"
            else:
                endpoint = MESSAGES_ENDPOINT
            
            # Build query parameters
            params = {
                '$top': min(max_results, 999),  # Graph API max is 999
                '$select': 'id,subject,from,receivedDateTime,bodyPreview,isRead,hasAttachments,importance',
                '$orderby': 'receivedDateTime desc'
            }
            
            # Add search filter if provided
            filters = []
            
            if search_query:
                # Sanitize and use Graph search syntax for better results
                sanitized_query = search_query.replace('"', '').strip()
                if sanitized_query:
                    params['$search'] = f'"{sanitized_query}"'
            
            if days_back and days_back > 0:
                # Filter by date range
                cutoff_date = (datetime.now() - timedelta(days=days_back)).isoformat() + 'Z'
                filters.append(f"receivedDateTime ge {cutoff_date}")
            
            if filters:
                params['$filter'] = ' and '.join(filters)
            
            logger.info(f"Searching emails with params: {params}")
            
            # Make the request
            response = self._make_request('GET', endpoint, params=params)
            
            # Process results
            emails = []
            for message in response.get('value', []):
                email_info = {
                    'id': message.get('id', ''),
                    'subject': message.get('subject', '(No Subject)'),
                    'from': self._extract_email_address(message.get('from', {})),
                    'receivedDateTime': self._format_datetime(message.get('receivedDateTime')),
                    'bodyPreview': message.get('bodyPreview', ''),
                    'isRead': message.get('isRead', False),
                    'hasAttachments': message.get('hasAttachments', False),
                    'importance': message.get('importance', 'normal')
                }
                emails.append(email_info)
            
            logger.info(f"Found {len(emails)} emails matching search criteria")
            return emails
            
        except Exception as e:
            logger.error(f"Failed to search emails: {str(e)}")
            # Provide more user-friendly error messages
            if "401" in str(e):
                raise Exception("Authentication expired. Please login again.")
            elif "403" in str(e):
                raise Exception("Access denied. Check your permissions.")
            elif "429" in str(e):
                raise Exception("Too many requests. Please wait and try again.")
            else:
                raise Exception(f"Email search failed: {str(e)}")
    
    def get_email_details(self, message_id: str) -> Dict[str, Any]:
        """
        Get detailed information for a specific email
        
        Args:
            message_id: ID of the email message
            
        Returns:
            Dict containing detailed email information
        """
        try:
            endpoint = f"{MESSAGES_ENDPOINT}/{message_id}"
            params = {
                '$select': 'id,subject,from,toRecipients,ccRecipients,receivedDateTime,sentDateTime,body,bodyPreview,isRead,hasAttachments,importance,categories'
            }
            
            logger.info(f"Fetching email details for message: {message_id}")
            response = self._make_request('GET', endpoint, params=params)
            
            email_details = {
                'id': response.get('id', ''),
                'subject': response.get('subject', '(No Subject)'),
                'from': self._extract_email_address(response.get('from', {})),
                'to': [self._extract_email_address(recipient) for recipient in response.get('toRecipients', [])],
                'cc': [self._extract_email_address(recipient) for recipient in response.get('ccRecipients', [])],
                'receivedDateTime': self._format_datetime(response.get('receivedDateTime')),
                'sentDateTime': self._format_datetime(response.get('sentDateTime')),
                'body': self._extract_body_content(response.get('body', {})),
                'bodyPreview': response.get('bodyPreview', ''),
                'isRead': response.get('isRead', False),
                'hasAttachments': response.get('hasAttachments', False),
                'importance': response.get('importance', 'normal'),
                'categories': response.get('categories', [])
            }
            
            logger.info(f"Retrieved email details: {email_details['subject']}")
            return email_details
            
        except Exception as e:
            logger.error(f"Failed to get email details: {str(e)}")
            if "401" in str(e):
                raise Exception("Authentication expired. Please login again.")
            elif "404" in str(e):
                raise Exception("Email not found or may have been deleted.")
            else:
                raise Exception(f"Failed to get email details: {str(e)}")
    
    def mark_as_read(self, message_id: str) -> bool:
        """
        Mark an email as read
        
        Args:
            message_id: ID of the email message
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            endpoint = f"{MESSAGES_ENDPOINT}/{message_id}"
            data = {'isRead': True}
            
            logger.info(f"Marking email as read: {message_id}")
            self._make_request('PATCH', endpoint, json=data)
            
            logger.info("Email marked as read successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to mark email as read: {str(e)}")
            return False
    
    def _extract_email_address(self, email_obj: Dict[str, Any]) -> str:
        """Extract email address from Graph API email object"""
        if not email_obj:
            return "Unknown"
        
        email_addr = email_obj.get('emailAddress', {})
        name = email_addr.get('name', '')
        address = email_addr.get('address', '')
        
        if name and address:
            return f"{name} <{address}>"
        elif address:
            return address
        elif name:
            return name
        else:
            return "Unknown"
    
    def _extract_body_content(self, body_obj: Dict[str, Any]) -> str:
        """Extract body content from Graph API body object"""
        if not body_obj:
            return ""
        
        content = body_obj.get('content', '')
        content_type = body_obj.get('contentType', 'text')
        
        # For HTML content, we might want to strip HTML tags for display
        # For now, return as-is since we're showing in a text widget
        return content
    
    def _format_datetime(self, datetime_str: str) -> str:
        """Format ISO datetime string for display"""
        if not datetime_str:
            return "Unknown"
        
        try:
            dt = date_parser.parse(datetime_str)
            return dt.strftime("%Y-%m-%d %H:%M:%S")
        except Exception:
            return datetime_str
    
    def test_connection(self) -> bool:
        """
        Test connection to Graph API
        
        Returns:
            bool: True if connection successful, False otherwise
        """
        try:
            self.get_user_profile()
            logger.info("Graph API connection test successful")
            return True
        except Exception as e:
            logger.error(f"Graph API connection test failed: {str(e)}")
            return False