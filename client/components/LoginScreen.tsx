import React, { useState } from 'react';
import { 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  AlertCircle,
  Ship,
  LogIn
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (userData: UserData) => void;
  onLoginError: (error: string) => void;
}

export interface UserData {
  username: string;
  email_address: string;
  display_name: string;
  user_id: string;
  is_first_login: boolean;
}

export default function LoginScreen({ onLoginSuccess, onLoginError }: LoginScreenProps) {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTestingRefresh, setIsTestingRefresh] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(''); // Clear error when user starts typing
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { username, password } = formData;
    
    // Validation
    if (!username.trim() || !password.trim()) {
      setError('Username and password are required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('🔐 Attempting login for:', { username });
      
      // Send login webhook to n8n
      const loginPayload = {
        action: 'user_login',
        username: username.trim(),
        password: password,
        timestamp: new Date().toISOString(),
        source: 'celesteos_modern',
        client_info: {
          user_agent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language
        }
      };

      console.log('📤 Sending login webhook via Express proxy:', {
        url: `${window.location.origin}/webhook/user-auth/`,
        payload: { ...loginPayload, password: '***HIDDEN***' }
      });

      const response = await fetch(`${window.location.origin}/webhook/user-auth/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginPayload)
      });

      console.log('📥 Login webhook response status:', response.status);

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Login webhook success:', result);

      // Handle n8n response format (array with single object)
      const authResult = Array.isArray(result) ? result[0] : result;
      
      // Validate n8n response structure
      if (authResult.authenticated !== true || authResult.status !== 'authorized') {
        throw new Error('Authentication failed');
      }

      if (!authResult.userId || !authResult.email) {
        throw new Error('Invalid response: missing user data');
      }

      // Prepare user data for app (map n8n format to expected format)
      const userData: UserData = {
        username: authResult.email, // Use email as username
        email_address: authResult.email,
        display_name: authResult.email.split('@')[0], // Use email prefix as display name
        user_id: authResult.userId,
        is_first_login: false // You can add this field to n8n response if needed
      };

      console.log('🎉 Login successful for user:', userData.username);
      onLoginSuccess(userData);

    } catch (error) {
      console.error('❌ Login failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Login failed - please try again';
      setError(errorMessage);
      onLoginError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTokenRefreshTest = async () => {
    try {
      setIsTestingRefresh(true);
      setError('');

      const email = formData.username.trim();
      const hasEmail = email.includes('@');
      const userId = `user_${hasEmail ? email.replace(/[^a-zA-Z0-9]/g, '_') : 'anonymous'}`;
      const sessionId = `session_${userId}`;
      const conversationId = `conversation_${Date.now()}`;

      const payload = {
        event: 'token_refresh_test',
        timestamp: new Date().toISOString(),
        source: 'celesteos_modern_frontend',
        user: {
          user_id: userId,
          email_address: hasEmail ? email : '',
          display_name: hasEmail ? email.split('@')[0] : 'Unknown'
        },
        session: {
          session_id: sessionId,
          conversation_id: conversationId
        },
        client_info: {
          user_agent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language
        },
        // Optional callback used by some workflows to confirm completion
        webhookUrl: `${window.location.origin}/webhook/token-refresh-complete`,
        executionMode: 'production'
      };

      console.log('🔄 Testing token refresh webhook:', {
        url: `${window.location.origin}/webhook/token-refresh-trigger`,
        payload
      });

      // TEMPORARY: Webhook not configured - disabled to prevent 404 spam
      console.warn('token-refresh-trigger webhook disabled - needs n8n configuration');
      const data = { success: false, error: 'Webhook not configured in n8n' };

      /*
      const res = await fetch(`${window.location.origin}/webhook/token-refresh-trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const text = await res.text();
      let data: any = text;
      try { data = JSON.parse(text); } catch {}
      */
      // if (!res.ok) {
      //   throw new Error(`Token refresh test failed: ${res.status} ${res.statusText}`);
      // }
      console.log('✅ Token refresh webhook response:', data);
    } catch (err) {
      console.error('❌ Token refresh test error:', err);
      setError(err instanceof Error ? err.message : 'Token refresh test failed');
    } finally {
      setIsTestingRefresh(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Ship size={40} className="text-blue-400 mr-3" />
            <h1 className="text-3xl font-bold text-white">CelesteOS</h1>
          </div>
          <p className="text-gray-400">Marine Intelligence Platform</p>
        </div>

        {/* Login Form */}
        <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                Username
              </label>
              <div className="relative">
                <User size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                <input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className="w-full bg-[#2a2a2a] border border-gray-700 rounded-lg pl-11 pr-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder="Enter your username"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full bg-[#2a2a2a] border border-gray-700 rounded-lg pl-11 pr-12 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>


            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-700/50 rounded-lg">
                <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
                <span className="text-red-400 text-sm">{error}</span>
              </div>
            )}

            {/* Login Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-400 text-white font-medium py-3 rounded-lg transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  <span>Authenticating...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <LogIn size={16} />
                  <span>Sign In</span>
                </div>
              )}
            </Button>
          </form>

          {/* Utilities */}
          <div className="mt-4 space-y-3">
            <Button
              type="button"
              onClick={handleTokenRefreshTest}
              disabled={isTestingRefresh}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white"
            >
              {isTestingRefresh ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  <span>Testing token refresh…</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <RefreshCcw size={16} />
                  <span>Test Token Refresh Webhook</span>
                </div>
              )}
            </Button>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-800">
            <p className="text-center text-xs text-gray-500">
              CelesteOS Marine Intelligence Platform
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}