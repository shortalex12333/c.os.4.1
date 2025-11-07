// Portal Dashboard Page
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { YachtInfo } from '../../components/portal/YachtInfo';
import { useSession } from '../../hooks/useSession';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { n8nAPI } from '../../lib/n8n';
import type { UserAccount, FleetRegistry } from '../../lib/supabase';

export default function PortalDashboard() {
  const navigate = useNavigate();
  const { session, clearSession } = useSession();
  const { signOut } = useAuth();

  const [user, setUser] = useState<UserAccount | null>(null);
  const [yacht, setYacht] = useState<FleetRegistry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadLoading, setDownloadLoading] = useState(false);

  useEffect(() => {
    if (!session) {
      navigate('/portal/login');
      return;
    }

    loadData();
  }, [session, navigate]);

  const loadData = async () => {
    if (!session) return;

    try {
      // Get user account
      const { data: userData, error: userError } = await supabase
        .from('user_accounts')
        .select('*')
        .eq('id', session.userId)
        .single();

      if (userError || !userData) {
        setError('Failed to load user data');
        setLoading(false);
        return;
      }

      setUser(userData);

      // Get yacht info
      const { data: yachtData, error: yachtError } = await supabase
        .from('fleet_registry')
        .select('*')
        .eq('yacht_id', userData.yacht_id)
        .single();

      if (yachtError || !yachtData) {
        setError('Failed to load yacht data');
        setLoading(false);
        return;
      }

      setYacht(yachtData);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!session) return;

    setDownloadLoading(true);
    try {
      const response = await n8nAPI.requestDownload(session.sessionToken);

      if (response.status === 'success' && response.download_token) {
        navigate(`/portal/download?token=${response.download_token}`);
      } else {
        setError(response.message || 'Failed to generate download link');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download request failed');
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    clearSession();
    navigate('/portal/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            Loading...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center text-red-600">
            {error}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user || !yacht) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6 py-8">
        {/* Header */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>CelesteOS Portal</CardTitle>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </CardHeader>
        </Card>

        {/* Yacht Information */}
        <YachtInfo user={user} yacht={yacht} />

        {/* Download Section */}
        <Card>
          <CardHeader>
            <CardTitle>Download Installer</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Download the CelesteOS installer customized for your yacht.
            </p>
            <Button
              onClick={handleDownload}
              disabled={downloadLoading}
              className="w-full"
            >
              {downloadLoading ? 'Generating Link...' : 'Download Installer'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
