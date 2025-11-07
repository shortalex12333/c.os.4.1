#!/usr/bin/env python3
"""
Test the callback server to debug authentication issues
"""

import sys
import os
import time
import webbrowser
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

class TestCallbackHandler(BaseHTTPRequestHandler):
    """Test HTTP handler for OAuth callback"""
    
    def do_GET(self):
        """Handle GET request from OAuth redirect"""
        print(f"🔗 Received callback request: {self.path}")
        
        try:
            # Parse the authorization code from callback URL
            parsed_url = urlparse(self.path)
            query_components = parse_qs(parsed_url.query)
            
            print(f"📋 Query components: {list(query_components.keys())}")
            
            if 'code' in query_components:
                auth_code = query_components['code'][0]
                print(f"✅ Authorization code received: {auth_code[:50]}...")
                
                self.send_response(200)
                self.send_header('Content-type', 'text/html')
                self.send_header('Connection', 'close')
                self.end_headers()
                
                success_html = """
                <!DOCTYPE html>
                <html>
                <head>
                    <title>TEST - Authentication Successful</title>
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                        .success { color: green; font-size: 24px; }
                    </style>
                </head>
                <body>
                    <h1 class="success">✅ TEST CALLBACK SUCCESSFUL!</h1>
                    <p>The callback server is working correctly.</p>
                    <p>Authorization code received and processed.</p>
                    <p>You can close this window.</p>
                </body>
                </html>
                """
                self.wfile.write(success_html.encode('utf-8'))
                
                # Mark as received
                self.server.callback_received = True
                self.server.auth_code = auth_code
                
            else:
                print("❌ No authorization code in callback")
                self.send_response(400)
                self.send_header('Content-type', 'text/html')
                self.end_headers()
                self.wfile.write(b"<h1>No authorization code received</h1>")
                
        except Exception as e:
            print(f"❌ Error handling callback: {str(e)}")
            self.send_response(500)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(f"<h1>Server Error: {str(e)}</h1>".encode())
    
    def log_message(self, format, *args):
        """Custom logging"""
        print(f"🌐 HTTP: {format % args}")

def test_callback_server():
    """Test the callback server independently"""
    print("🧪 Testing Callback Server")
    print("=" * 40)
    
    PORT = 8001
    
    try:
        # Start test server
        server = HTTPServer(('localhost', PORT), TestCallbackHandler)
        server.callback_received = False
        server.auth_code = None
        
        # Start in background thread
        server_thread = threading.Thread(target=server.serve_forever)
        server_thread.daemon = True
        server_thread.start()
        
        print(f"✅ Test server started on http://localhost:{PORT}")
        print(f"🔗 Test URL: http://localhost:{PORT}/?code=test123&state=teststate")
        
        # Open test URL
        test_url = f"http://localhost:{PORT}/?code=test123&state=teststate"
        print(f"🌐 Opening test URL in browser...")
        webbrowser.open(test_url)
        
        # Wait for callback
        print("⏳ Waiting for callback (10 seconds)...")
        start_time = time.time()
        while time.time() - start_time < 10:
            if server.callback_received:
                print("✅ Callback received successfully!")
                print(f"📋 Authorization code: {server.auth_code}")
                break
            time.sleep(0.1)
        else:
            print("❌ Callback timeout - no response received")
        
        # Cleanup
        server.shutdown()
        server.server_close()
        print("🔧 Test server stopped")
        
    except Exception as e:
        print(f"❌ Test failed: {str(e)}")

if __name__ == "__main__":
    test_callback_server()