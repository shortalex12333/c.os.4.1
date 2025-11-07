// OAuth Callback Server for Microsoft Authentication
// Handles the OAuth callback on localhost:8080

interface CallbackServerConfig {
  port: number;
  callbackPath: string;
}

class CallbackServer {
  private config: CallbackServerConfig;
  private server: any = null;

  constructor() {
    this.config = {
      port: 8080,
      callbackPath: '/auth/callback'
    };
  }

  // Start callback server to handle OAuth redirect
  async startServer(): Promise<{ url: string; server: any }> {
    return new Promise((resolve, reject) => {
      // Create a simple HTTP server using fetch API simulation
      // Since we're in browser, we'll use a different approach
      
      // For browser-based OAuth flow, we'll use popup window approach
      const callbackUrl = `http://localhost:${this.config.port}${this.config.callbackPath}`;
      
      // Return the callback URL for Microsoft OAuth
      resolve({
        url: callbackUrl,
        server: null // No actual server needed in browser
      });
    });
  }

  // Handle OAuth callback in popup window
  handlePopupCallback(): Promise<{ code: string; state: string }> {
    return new Promise((resolve, reject) => {
      // Listen for message from popup window
      const messageHandler = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'OAUTH_CALLBACK') {
          window.removeEventListener('message', messageHandler);
          
          if (event.data.error) {
            reject(new Error(event.data.error));
          } else {
            resolve({
              code: event.data.code,
              state: event.data.state
            });
          }
        }
      };
      
      window.addEventListener('message', messageHandler);
      
      // Timeout after 5 minutes
      setTimeout(() => {
        window.removeEventListener('message', messageHandler);
        reject(new Error('OAuth callback timeout'));
      }, 5 * 60 * 1000);
    });
  }

  // Create callback HTML page content
  getCallbackPageContent(): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>CelesteOS Email Authentication</title>
    <meta charset="utf-8">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #212121;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
        }
        .container {
            text-align: center;
            padding: 2rem;
        }
        .loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid #333;
            border-radius: 50%;
            border-top-color: #3b82f6;
            animation: spin 1s ease-in-out infinite;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        .success {
            color: #10b981;
        }
        .error {
            color: #ef4444;
        }
    </style>
</head>
<body>
    <div class="container">
        <div id="status">
            <div class="loading"></div>
            <p>Connecting your email to CelesteOS...</p>
        </div>
    </div>
    
    <script>
        // Extract OAuth callback parameters
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');
        
        const statusDiv = document.getElementById('status');
        
        if (error) {
            statusDiv.innerHTML = \`
                <div class="error">
                    <h2>Authentication Failed</h2>
                    <p>\${errorDescription || error}</p>
                    <p>This window will close in 3 seconds...</p>
                </div>
            \`;
            
            // Send error to parent window
            if (window.opener) {
                window.opener.postMessage({
                    type: 'OAUTH_CALLBACK',
                    error: errorDescription || error
                }, window.location.origin);
            }
            
            setTimeout(() => window.close(), 3000);
            
        } else if (code && state) {
            statusDiv.innerHTML = \`
                <div class="success">
                    <h2>✅ Authentication Successful!</h2>
                    <p>Your email has been connected to CelesteOS.</p>
                    <p>This window will close automatically...</p>
                </div>
            \`;
            
            // Send success data to parent window
            if (window.opener) {
                window.opener.postMessage({
                    type: 'OAUTH_CALLBACK',
                    code: code,
                    state: state
                }, window.location.origin);
            }
            
            setTimeout(() => window.close(), 2000);
            
        } else {
            statusDiv.innerHTML = \`
                <div class="error">
                    <h2>Invalid Callback</h2>
                    <p>Missing required authentication parameters.</p>
                    <p>This window will close in 3 seconds...</p>
                </div>
            \`;
            
            setTimeout(() => window.close(), 3000);
        }
    </script>
</body>
</html>`;
  }
}

// Create singleton instance
const callbackServer = new CallbackServer();

export default callbackServer;
export { CallbackServer };