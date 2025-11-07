// Portal Download Page
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { useSession } from '../../hooks/useSession';
import { supabase } from '../../lib/supabase';

interface DownloadLink {
  download_token: string;
  download_url: string;
  package_name: string;
  package_size_bytes: number;
  expires_at: string;
  downloaded: boolean;
}

export default function PortalDownload() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { session } = useSession();

  const [downloadLink, setDownloadLink] = useState<DownloadLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const downloadToken = searchParams.get('token');

  useEffect(() => {
    if (!session) {
      navigate('/portal/login');
      return;
    }

    if (!downloadToken) {
      setError('No download token provided');
      setLoading(false);
      return;
    }

    loadDownloadLink();
  }, [session, downloadToken, navigate]);

  const loadDownloadLink = async () => {
    if (!downloadToken) return;

    try {
      const { data, error: dbError } = await supabase
        .from('download_links')
        .select('*')
        .eq('download_token', downloadToken)
        .single();

      if (dbError || !data) {
        setError('Download link not found or expired');
        setLoading(false);
        return;
      }

      // Check if expired
      const expiresAt = new Date(data.expires_at);
      if (expiresAt <= new Date()) {
        setError('Download link has expired');
        setLoading(false);
        return;
      }

      setDownloadLink(data);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load download link');
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            Loading download information...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <Button onClick={() => navigate('/portal/dashboard')}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!downloadLink) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Download Ready</CardTitle>
          <CardDescription>
            Your customized CelesteOS installer is ready
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 border rounded p-4 space-y-2">
            <div>
              <span className="text-sm text-gray-500">Package:</span>
              <div className="font-mono text-sm">{downloadLink.package_name}</div>
            </div>
            <div>
              <span className="text-sm text-gray-500">Size:</span>
              <div className="text-sm">{formatFileSize(downloadLink.package_size_bytes)}</div>
            </div>
            <div>
              <span className="text-sm text-gray-500">Expires:</span>
              <div className="text-sm">{new Date(downloadLink.expires_at).toLocaleString()}</div>
            </div>
          </div>

          <div className="space-y-2">
            <Button
              className="w-full"
              onClick={() => window.location.href = downloadLink.download_url}
            >
              Download Installer
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/portal/dashboard')}
            >
              Back to Dashboard
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Note: Download link is for one-time use and expires in 7 days
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
