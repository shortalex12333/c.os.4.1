// Portal Login Page
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../../components/portal/LoginForm';
import { TwoFactorForm } from '../../components/portal/TwoFactorForm';
import { useAuth } from '../../hooks/useAuth';
import { useSession } from '../../hooks/useSession';
import { n8nAPI } from '../../lib/n8n';

export default function PortalLogin() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const { setSession } = useSession();

  const [step, setStep] = useState<'login' | '2fa'>('login');
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Email + Password Login
  const handleLogin = async (loginEmail: string, password: string) => {
    setLoading(true);
    setError(null);
    setEmail(loginEmail);

    try {
      // Authenticate with Supabase
      const { data, error: authError } = await signIn(loginEmail, password);

      if (authError || !data.user) {
        setError(authError?.message || 'Login failed');
        setLoading(false);
        return;
      }

      setUserId(data.user.id);

      // Trigger n8n to generate and send 2FA code
      const n8nResponse = await n8nAPI.login(data.user.id, loginEmail);

      if (n8nResponse.status !== 'awaiting_2fa') {
        setError(n8nResponse.message || 'Failed to send 2FA code');
        setLoading(false);
        return;
      }

      // Move to 2FA step
      setStep('2fa');
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  // Step 2: Verify 2FA Code
  const handleVerify2FA = async (code: string) => {
    setLoading(true);
    setError(null);

    try {
      // Verify 2FA code via n8n
      const response = await n8nAPI.verify2FA(userId, code);

      if (response.status !== 'success' || !response.session_token) {
        setError(response.message || 'Invalid or expired code');
        setLoading(false);
        return;
      }

      // Store session
      setSession(response.session_token, userId);

      // Redirect to dashboard
      navigate('/portal/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      {step === 'login' ? (
        <LoginForm
          onSubmit={handleLogin}
          loading={loading}
          error={error}
        />
      ) : (
        <TwoFactorForm
          email={email}
          onSubmit={handleVerify2FA}
          loading={loading}
          error={error}
        />
      )}
    </div>
  );
}
