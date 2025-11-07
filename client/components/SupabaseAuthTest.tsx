/**
 * Supabase Authentication Test Component
 * Simple component to test login/signup functionality
 */

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function SupabaseAuthTest() {
  const { user, isLoading, login, signup, logout } = useAuth();
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('testpassword123');
  const [displayName, setDisplayName] = useState('Test User');
  const [isSignup, setIsSignup] = useState(false);
  const [message, setMessage] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    try {
      let result;
      if (isSignup) {
        result = await signup(displayName, email, password);
      } else {
        result = await login(email, password);
      }

      if (result.success) {
        setMessage(`${isSignup ? 'Signup' : 'Login'} successful!`);
      } else {
        setMessage(`Error: ${result.error}`);
      }
    } catch (error) {
      setMessage(`Error: ${error}`);
    }
  };

  const handleLogout = async () => {
    await logout();
    setMessage('Logged out successfully');
  };

  if (isLoading) {
    return <div className="p-4">Loading authentication...</div>;
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-center">
        Supabase Auth Test
      </h2>

      {user ? (
        <div className="space-y-4">
          <div className="bg-green-100 p-4 rounded">
            <h3 className="font-semibold text-green-800">Authenticated!</h3>
            <p className="text-sm text-green-700">
              <strong>User ID:</strong> {user.userId}
            </p>
            <p className="text-sm text-green-700">
              <strong>Email:</strong> {user.email}
            </p>
            <p className="text-sm text-green-700">
              <strong>Display Name:</strong> {user.userName}
            </p>
            <p className="text-sm text-green-700">
              <strong>Session ID:</strong> {user.sessionId}
            </p>
            {user.token && (
              <p className="text-sm text-green-700 break-all">
                <strong>Token:</strong> {user.token.substring(0, 50)}...
              </p>
            )}
          </div>
          
          <button
            onClick={handleLogout}
            className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      ) : (
        <form onSubmit={handleAuth} className="space-y-4">
          <div className="flex space-x-2 mb-4">
            <button
              type="button"
              onClick={() => setIsSignup(false)}
              className={`flex-1 py-2 px-4 rounded ${
                !isSignup 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setIsSignup(true)}
              className={`flex-1 py-2 px-4 rounded ${
                isSignup 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Signup
            </button>
          </div>

          {isSignup && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
          >
            {isSignup ? 'Sign Up' : 'Log In'}
          </button>
        </form>
      )}

      {message && (
        <div className={`mt-4 p-3 rounded ${
          message.includes('successful') 
            ? 'bg-green-100 text-green-700' 
            : 'bg-red-100 text-red-700'
        }`}>
          {message}
        </div>
      )}

      <div className="mt-6 text-xs text-gray-500 space-y-1">
        <p><strong>Supabase URL:</strong> http://127.0.0.1:54321</p>
        <p><strong>Auth Status:</strong> {user ? 'Authenticated' : 'Not Authenticated'}</p>
        <p><strong>Test Credentials:</strong></p>
        <p>Email: test@example.com</p>
        <p>Password: testpassword123</p>
      </div>
    </div>
  );
}