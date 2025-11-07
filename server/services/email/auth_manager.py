"""
Azure AD Authentication Manager using MSAL
Handles OAuth2 Authorization Code flow with PKCE for secure authentication
"""

import msal
import logging
import webbrowser
import threading
import time
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from typing import Optional, Dict, Any, Callable
from config import CLIENT_ID, TENANT_ID, AUTHORITY, SCOPES, REDIRECT_URI, LOCAL_SERVER_PORT, validate_config
from token_manager import TokenManager

logger = logging.getLogger(__name__)

class AuthCallbackHandler(BaseHTTPRequestHandler):
    """HTTP handler for OAuth callback"""
    
    def do_GET(self):
        """Handle GET request from OAuth redirect"""
        try:
            logger.info(f"Received callback request: {self.path}")
            # Parse the authorization code from callback URL
            parsed_url = urlparse(self.path)
            query_components = parse_qs(parsed_url.query)
            
            logger.info(f"Query components: {list(query_components.keys())}")
            
            if 'code' in query_components:
                auth_code = query_components['code'][0]
                
                # Store complete auth response for MSAL (fixes state mismatch)
                self.server.auth_response = {}
                for key, value in query_components.items():
                    if value:  # Only store non-empty values
                        self.server.auth_response[key] = value[0]
                
                self.server.auth_code = auth_code  # Keep for backward compatibility
                self.server.callback_received = True
                logger.info(f"Authorization code received: {auth_code[:20]}...")
                
                self.send_response(200)
                self.send_header('Content-type', 'text/html')
                self.send_header('Connection', 'close')
                self.end_headers()
                
                success_html = """
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Authentication Successful</title>
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                        .success { color: green; }
                    </style>
                </head>
                <body>
                    <h2 class="success">✅ Authentication Successful!</h2>
                    <p>You have successfully authenticated with Microsoft.</p>
                    <p>You can now close this window and return to the Email Reader application.</p>
                    <script>
                        setTimeout(function() { window.close(); }, 3000);
                    </script>
                </body>
                </html>
                """
                self.wfile.write(success_html.encode('utf-8'))
                
            elif 'error' in query_components:
                error = query_components.get('error', ['Unknown error'])[0]
                error_description = query_components.get('error_description', [''])[0]
                self.server.auth_error = f"{error}: {error_description}"
                self.server.callback_received = True
                logger.error(f"Authentication error: {error} - {error_description}")
                
                self.send_response(400)
                self.send_header('Content-type', 'text/html')
                self.send_header('Connection', 'close')
                self.end_headers()
                
                error_html = f"""
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Authentication Error</title>
                    <style>
                        body {{ font-family: Arial, sans-serif; text-align: center; padding: 50px; }}
                        .error {{ color: red; }}
                    </style>
                </head>
                <body>
                    <h2 class="error">❌ Authentication Error</h2>
                    <p><strong>Error:</strong> {error}</p>
                    <p><strong>Description:</strong> {error_description}</p>
                    <p>Please close this window and try again.</p>
                </body>
                </html>
                """
                self.wfile.write(error_html.encode('utf-8'))
            else:
                # No code or error - invalid callback
                self.server.auth_error = "Invalid callback - no authorization code received"
                self.server.callback_received = True
                logger.error("Invalid callback received - no code or error parameter")
                
                self.send_response(400)
                self.send_header('Content-type', 'text/html')
                self.send_header('Connection', 'close')
                self.end_headers()
                
                invalid_html = """
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Invalid Callback</title>
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                        .error { color: red; }
                    </style>
                </head>
                <body>
                    <h2 class="error">❌ Invalid Callback</h2>
                    <p>The callback from Microsoft was invalid.</p>
                    <p>Please close this window and try again.</p>
                </body>
                </html>
                """
                self.wfile.write(invalid_html.encode('utf-8'))
            
        except Exception as e:
            logger.error(f"Error handling OAuth callback: {str(e)}")
            self.server.auth_error = f"Callback handler error: {str(e)}"
            self.server.callback_received = True
            self.send_response(500)
            self.send_header('Content-type', 'text/html')
            self.send_header('Connection', 'close')
            self.end_headers()
            
            error_html = f"""
            <!DOCTYPE html>
            <html>
            <head><title>Server Error</title></head>
            <body>
                <h2>Server Error</h2>
                <p>An error occurred processing the authentication callback.</p>
                <p>Error: {str(e)}</p>
            </body>
            </html>
            """
            self.wfile.write(error_html.encode('utf-8'))
    
    def log_message(self, format, *args):
        """Suppress default HTTP server logging"""
        pass

class AuthManager:
    """Manages Azure AD authentication using MSAL"""
    
    def __init__(self, username: str = "default_user"):
        self.username = username
        self.token_manager = TokenManager(username)
        
        # Validate configuration before initializing MSAL
        try:
            validate_config()
        except ValueError as e:
            logger.error(f"Configuration error: {str(e)}")
            raise
        
        # Initialize MSAL PublicClientApplication with cache
        self.cache = msal.SerializableTokenCache()
        self.app = msal.PublicClientApplication(
            client_id=CLIENT_ID,
            authority=AUTHORITY,
            token_cache=self.cache
        )
        
        self.callback_server = None
        self.auth_code = None
        self.auth_error = None
    
    def is_authenticated(self) -> bool:
        """
        Check if user is currently authenticated with valid tokens
        
        Returns:
            bool: True if authenticated, False otherwise
        """
        return self.token_manager.has_tokens()
    
    def login(self, callback: Optional[Callable[[bool, str], None]] = None) -> bool:
        """
        Perform interactive login using Authorization Code flow with PKCE
        
        Args:
            callback: Optional callback function called with (success, message)
            
        Returns:
            bool: True if authentication successful, False otherwise
        """
        try:
            logger.info("Starting Azure AD authentication flow")
            
            # Check if we already have valid tokens
            existing_tokens = self.token_manager.get_tokens()
            if existing_tokens:
                # Try to use existing tokens or refresh them
                accounts = self.app.get_accounts()
                account = accounts[0] if accounts else None
                
                result = self.app.acquire_token_silent(
                    scopes=SCOPES,
                    account=account
                )
                
                if result and 'access_token' in result:
                    logger.info("Using existing valid tokens")
                    if callback:
                        callback(True, "Already authenticated")
                    return True
            
            # Start local HTTP server for OAuth callback
            if not self._start_callback_server():
                error_msg = "Failed to start local callback server"
                logger.error(error_msg)
                if callback:
                    callback(False, error_msg)
                return False
            
            # Generate authorization URL with PKCE
            flow = self.app.initiate_auth_code_flow(
                scopes=SCOPES,
                redirect_uri=REDIRECT_URI
            )
            
            if 'auth_uri' not in flow:
                error_msg = "Failed to create authorization URL"
                logger.error(error_msg)
                self._stop_callback_server()
                if callback:
                    callback(False, error_msg)
                return False
            
            # Open browser for user authentication
            logger.info(f"Opening browser for authentication: {flow['auth_uri']}")
            webbrowser.open(flow['auth_uri'])
            
            # Wait for callback with timeout
            logger.info(f"Waiting for callback on http://localhost:{LOCAL_SERVER_PORT}/")
            if not self._wait_for_callback(timeout=300):  # 5 minutes timeout
                error_msg = "Authentication timed out or failed - no callback received"
                logger.error(error_msg)
                logger.error(f"Expected callback URL: http://localhost:{LOCAL_SERVER_PORT}/?code=...")
                self._stop_callback_server()
                if callback:
                    callback(False, error_msg)
                return False
            
            # Exchange authorization code for tokens
            if hasattr(self.callback_server, 'auth_error') and self.callback_server.auth_error:
                error_msg = f"Authentication error: {self.callback_server.auth_error}"
                logger.error(error_msg)
                self._stop_callback_server()
                if callback:
                    callback(False, error_msg)
                return False
            
            if not hasattr(self.callback_server, 'auth_code') or not self.callback_server.auth_code:
                error_msg = "No authorization code received"
                logger.error(error_msg)
                self._stop_callback_server()
                if callback:
                    callback(False, error_msg)
                return False
            
            logger.info(f"Processing authorization code: {self.callback_server.auth_code[:20]}...")
            
            # Complete the flow with the full authorization response (fixes state mismatch)
            auth_response = getattr(self.callback_server, 'auth_response', {'code': self.callback_server.auth_code})
            logger.info(f"Using auth response keys: {list(auth_response.keys())}")
            
            result = self.app.acquire_token_by_auth_code_flow(
                auth_code_flow=flow,
                auth_response=auth_response
            )
            
            # Also save cache state
            if hasattr(self.cache, 'serialize') and self.cache.has_state_changed:
                cache_data = self.cache.serialize()
                if cache_data:
                    self.token_manager.store_cache(cache_data)
            
            self._stop_callback_server()
            
            if 'access_token' in result:
                # Store tokens securely
                if self.token_manager.store_tokens(result):
                    logger.info("Authentication successful")
                    if callback:
                        callback(True, "Authentication successful")
                    return True
                else:
                    error_msg = "Failed to store authentication tokens"
                    logger.error(error_msg)
                    if callback:
                        callback(False, error_msg)
                    return False
            else:
                error_msg = f"Authentication failed: {result.get('error_description', 'Unknown error')}"
                logger.error(error_msg)
                if callback:
                    callback(False, error_msg)
                return False
                
        except Exception as e:
            error_msg = f"Authentication error: {str(e)}"
            logger.error(error_msg)
            self._stop_callback_server()
            if callback:
                callback(False, error_msg)
            return False
    
    def logout(self) -> bool:
        """
        Logout user and clear stored tokens
        
        Returns:
            bool: True if logout successful, False otherwise
        """
        try:
            logger.info("Logging out user")
            return self.token_manager.clear_tokens()
        except Exception as e:
            logger.error(f"Logout error: {str(e)}")
            return False
    
    def get_access_token(self) -> Optional[str]:
        """
        Get current access token, refreshing if necessary
        
        Returns:
            str: Valid access token or None if unavailable
        """
        try:
            # First load any existing tokens into cache
            stored_tokens = self.token_manager.get_tokens()
            if stored_tokens and self.token_manager.is_token_valid(stored_tokens):
                # Try to get fresh token silently
                accounts = self.app.get_accounts()
                if accounts:
                    result = self.app.acquire_token_silent(
                        scopes=SCOPES,
                        account=accounts[0]
                    )
                    
                    if result and 'access_token' in result:
                        # Store updated tokens
                        self.token_manager.store_tokens(result)
                        return result['access_token']
                
                # If silent acquisition failed but token is still valid, use it
                if self.token_manager.is_token_valid(stored_tokens):
                    return stored_tokens.get('access_token')
            
            logger.warning("No valid tokens available, user needs to re-authenticate")
            return None
                
        except Exception as e:
            logger.error(f"Error getting access token: {str(e)}")
            return None
    
    def _start_callback_server(self) -> bool:
        """Start local HTTP server for OAuth callback"""
        try:
            # Check if port is already in use
            import socket
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            result = sock.connect_ex(('localhost', LOCAL_SERVER_PORT))
            sock.close()
            
            if result == 0:
                logger.warning(f"Port {LOCAL_SERVER_PORT} is already in use, attempting to use it anyway")
            
            self.callback_server = HTTPServer(('localhost', LOCAL_SERVER_PORT), AuthCallbackHandler)
            self.callback_server.auth_code = None
            self.callback_server.auth_error = None  
            self.callback_server.auth_response = None  # Store complete OAuth response
            self.callback_server.callback_received = False
            
            # Start server in separate thread
            self.server_thread = threading.Thread(target=self.callback_server.serve_forever)
            self.server_thread.daemon = True
            self.server_thread.start()
            
            # Give server time to start
            time.sleep(0.5)
            
            logger.info(f"Callback server started on port {LOCAL_SERVER_PORT}")
            logger.info(f"Server will handle requests at http://localhost:{LOCAL_SERVER_PORT}/")
            return True
            
        except Exception as e:
            logger.error(f"Failed to start callback server: {str(e)}")
            return False
    
    def _stop_callback_server(self):
        """Stop local HTTP server"""
        if self.callback_server:
            try:
                self.callback_server.shutdown()
                self.callback_server.server_close()
                self.callback_server = None
                logger.info("Callback server stopped")
            except Exception as e:
                logger.error(f"Error stopping callback server: {str(e)}")
    
    def _wait_for_callback(self, timeout: int = 300) -> bool:
        """Wait for OAuth callback with timeout"""
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            if self.callback_server and hasattr(self.callback_server, 'callback_received') and self.callback_server.callback_received:
                logger.info("Callback received successfully")
                return True
            time.sleep(0.5)
        
        logger.error(f"Callback timeout after {timeout} seconds")
        return False