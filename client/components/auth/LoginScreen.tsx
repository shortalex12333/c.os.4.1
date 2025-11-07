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
import supabaseAuthService from '../../services/supabaseAuthService';

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
      console.log('🔐 Attempting Supabase login for:', { email: username });

      // Use Supabase authentication service
      const result = await supabaseAuthService.login(username, password);

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Login failed');
      }

      // Map Supabase response to expected UserData format
      const userData: UserData = {
        username: result.data.email,
        email_address: result.data.email,
        display_name: result.data.userName,
        user_id: result.data.userId,
        is_first_login: false
      };

      console.log('🎉 Supabase login successful for user:', userData.username);
      onLoginSuccess(userData);

    } catch (error) {
      console.error('❌ Supabase login failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Login failed - please try again';
      setError(errorMessage);
      onLoginError(errorMessage);
    } finally {
      setIsLoading(false);
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
            {/* Email Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <User size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                <input
                  id="username"
                  type="email"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className="w-full bg-[#2a2a2a] border border-gray-700 rounded-lg pl-11 pr-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder="yacht@test.local"
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