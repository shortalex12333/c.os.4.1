import React, { useState } from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useAuth } from '../contexts/AuthContext';
// Use local logo instead of figma:asset
const brainLogo = '/Logo.png';

interface LoginProps {
  onLogin: (username: string, password: string) => void;
  isMobile?: boolean;
}

export function Login({ onLogin, isMobile = false }: LoginProps) {
  const { login, signup } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() && password.trim()) {
      setIsLoading(true);
      setError('');
      
      try {
        let response;
        if (isSignup) {
          // Signup flow with Supabase
          const displayName = username.split('@')[0]; // Use email prefix as display name
          response = await signup(displayName, username.trim(), password.trim());
        } else {
          // Login flow with Supabase
          response = await login(username.trim(), password.trim());
        }
        
        if (response.success) {
          // Call the onLogin callback for any additional UI logic
          onLogin(username.trim(), password.trim());
        } else {
          setError(response.error || (isSignup ? 'Signup failed' : 'Invalid email or password'));
        }
      } catch (err: any) {
        setError(err.message || 'Authentication error');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="login-container">
      {/* Center the login form */}
      <div className="login-form-wrapper">
          {/* Login Card with Maximum Strength Glassmorphism */}
          <div 
            className="glass-overlay rounded-lg transition-all duration-300"
            style={{
              background: 'rgba(255, 255, 255, 0.10)',
              backdropFilter: 'blur(32px) saturate(1.3)',
              WebkitBackdropFilter: 'blur(32px) saturate(1.3)',
              border: '1px solid rgba(255, 255, 255, 0.20)',
              boxShadow: '0 16px 64px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(0, 0, 0, 0.08), inset 0 2px 0 rgba(255, 255, 255, 0.25), inset 0 -1px 0 rgba(255, 255, 255, 0.12)',
              padding: isMobile ? '32px 24px' : '40px 32px'
            }}
          >
            {/* Header with Logo and Title */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-6">
                <ImageWithFallback
                  src={brainLogo}
                  alt="CelesteOS Brain Logo"
                  width={48}
                  height={48}
                  className="transition-all duration-300"
                  style={{
                    width: '48px',
                    height: '48px',
                    objectFit: 'contain'
                  }}
                />
              </div>
              
              <h1 
                className="mb-3"
                style={{
                  fontSize: isMobile ? '24px' : '28px',
                  lineHeight: isMobile ? '30px' : '34px',
                  letterSpacing: isMobile ? '0.2px' : '0.38px',
                  fontWeight: '400',
                  color: '#181818',
                  fontFamily: 'Eloquia Display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}
              >
                {/* "Celeste" in dark gray */}
                <span 
                  style={{ 
                    color: '#181818',
                    fontWeight: 'inherit'
                  }}
                >
                  Celeste
                </span>
                {/* "OS" with blue gradient */}
                <span 
                  style={{ 
                    background: 'linear-gradient(115deg, #43a6d8 0%, #81c8e4 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontWeight: 'inherit',
                    display: 'inline-block'
                  }}
                >
                  OS
                </span>
              </h1>
              
              <p 
                style={{
                  fontSize: isMobile ? '14px' : '16px',
                  lineHeight: isMobile ? '20px' : '24px',
                  letterSpacing: isMobile ? '-0.1px' : '-0.32px',
                  fontWeight: '400',
                  color: '#95979E',
                  fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}
              >
                {isSignup ? 'Create your account' : 'Sign in to your account'}
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div 
                className="mb-4 p-3 rounded-md text-center"
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  color: '#dc2626',
                  fontSize: '14px',
                  fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}
              >
                {error}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username Field */}
              <div>
                <label 
                  htmlFor="username"
                  className="block mb-2"
                  style={{
                    fontSize: '14px',
                    lineHeight: '20px',
                    fontWeight: '500',
                    color: '#374151',
                    fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                  }}
                >
                  User
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full rounded-md transition-all duration-200 outline-none"
                  style={{
                    padding: '12px 16px',
                    fontSize: '16px',
                    lineHeight: '24px',
                    fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    background: 'rgba(255, 255, 255, 0.80)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.30)',
                    color: '#181818'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'rgba(67, 166, 216, 0.5)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(67, 166, 216, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.30)';
                    e.target.style.boxShadow = 'none';
                  }}
                  placeholder="Enter your email"
                />
              </div>

              {/* Password Field */}
              <div>
                <label 
                  htmlFor="password"
                  className="block mb-2"
                  style={{
                    fontSize: '14px',
                    lineHeight: '20px',
                    fontWeight: '500',
                    color: '#374151',
                    fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                  }}
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-md transition-all duration-200 outline-none"
                  style={{
                    padding: '12px 16px',
                    fontSize: '16px',
                    lineHeight: '24px',
                    fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    background: 'rgba(255, 255, 255, 0.80)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.30)',
                    color: '#181818'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'rgba(67, 166, 216, 0.5)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(67, 166, 216, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.30)';
                    e.target.style.boxShadow = 'none';
                  }}
                  placeholder="Enter your password"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !username.trim() || !password.trim()}
                className="w-full rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  padding: '14px 24px',
                  fontSize: '16px',
                  lineHeight: '24px',
                  fontWeight: '500',
                  fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  background: 'linear-gradient(115deg, #61afd9 0%, #81c8e4 100%)',
                  color: '#ffffff',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(67, 166, 216, 0.3)',
                  transform: isLoading ? 'scale(0.98)' : 'scale(1)'
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.background = 'linear-gradient(115deg, #5299c4 0%, #74b8d7 100%)';
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.background = 'linear-gradient(115deg, #61afd9 0%, #81c8e4 100%)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }
                }}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div 
                      className="animate-spin rounded-full border-2 border-white border-t-transparent mr-2"
                      style={{ width: '16px', height: '16px' }}
                    />
                    Signing in...
                  </div>
                ) : (
                  isSignup ? 'Sign Up' : 'Sign In'
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-8 text-center">
              <p 
                style={{
                  fontSize: '13px',
                  lineHeight: '18px',
                  color: '#95979E',
                  fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  marginBottom: '12px'
                }}
              >
                The World's First Super Yacht AI<br />
                Powered by our latest model, OS.3.1.
              </p>
              
              {/* Signup/Login toggle */}
              <button
                type="button"
                onClick={() => {
                  setIsSignup(!isSignup);
                  setError('');
                }}
                style={{
                  fontSize: '14px',
                  color: '#43a6d8',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  textDecoration: 'underline'
                }}
              >
                {isSignup ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </button>
            </div>
          </div>
      </div>
    </div>
  );
}