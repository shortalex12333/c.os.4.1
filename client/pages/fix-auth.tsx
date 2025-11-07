/**
 * Emergency Auth Fix Page
 * Use this to clear broken auth tokens
 */

import React from 'react';
import { clearAuthTokens } from '../utils/authHelpers';

export default function FixAuthPage() {
  const handleClearAuth = async () => {
    if (confirm('This will log you out and clear all auth tokens. Continue?')) {
      await clearAuthTokens();
      alert('Auth tokens cleared! Redirecting to login...');
      window.location.href = '/';
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '40px',
        maxWidth: '500px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <h1 style={{ marginTop: 0, color: '#dc2626' }}>🚨 Auth Token Error</h1>

        <p style={{ fontSize: '16px', lineHeight: '1.6' }}>
          You're seeing this because your browser has an <strong>invalid authentication token</strong>.
        </p>

        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <p style={{ margin: 0, fontSize: '14px' }}>
            <strong>Error:</strong> "User from sub claim in JWT does not exist"
          </p>
        </div>

        <h3>What Happened?</h3>
        <p style={{ fontSize: '14px', lineHeight: '1.6' }}>
          The database was reset, but your browser still has the old authentication token.
          The user that token belongs to no longer exists in the database.
        </p>

        <h3>How to Fix:</h3>
        <ol style={{ fontSize: '14px', lineHeight: '1.8' }}>
          <li>Click the button below to clear auth tokens</li>
          <li>You'll be logged out and redirected</li>
          <li>Sign up for a new account or log back in</li>
        </ol>

        <button
          onClick={handleClearAuth}
          style={{
            width: '100%',
            padding: '16px',
            fontSize: '16px',
            fontWeight: 'bold',
            background: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            marginTop: '20px'
          }}
        >
          🧹 Clear Auth Tokens & Sign Out
        </button>

        <div style={{
          marginTop: '24px',
          padding: '16px',
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '8px',
          fontSize: '13px'
        }}>
          <strong>✅ After clearing:</strong>
          <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
            <li>Create a new account</li>
            <li>Your chats will start fresh</li>
            <li>No more auth errors!</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
