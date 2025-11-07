// 2FA Verification Form Component
import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

interface TwoFactorFormProps {
  email: string;
  onSubmit: (code: string) => Promise<void>;
  loading?: boolean;
  error?: string | null;
}

export function TwoFactorForm({ email, onSubmit, loading = false, error = null }: TwoFactorFormProps) {
  const [code, setCode] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(code);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Two-Factor Authentication</CardTitle>
        <CardDescription>
          We've sent a 6-digit code to <strong>{email}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Verification Code</Label>
            <Input
              id="code"
              type="text"
              inputMode="numeric"
              placeholder="123456"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              required
              disabled={loading}
              className="text-center text-2xl tracking-widest font-mono"
            />
            <p className="text-xs text-gray-500">
              Code expires in 10 minutes
            </p>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading || code.length !== 6}>
            {loading ? 'Verifying...' : 'Verify Code'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
