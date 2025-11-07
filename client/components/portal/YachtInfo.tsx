// Yacht Information Display Component
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import type { FleetRegistry, UserAccount } from '../../lib/supabase';

interface YachtInfoProps {
  user: UserAccount;
  yacht: FleetRegistry;
}

export function YachtInfo({ user, yacht }: YachtInfoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Yacht Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="text-sm text-gray-500">Yacht ID</div>
          <div className="font-mono text-lg">{yacht.yacht_id}</div>
        </div>

        <Separator />

        <div>
          <div className="text-sm text-gray-500">Yacht Name</div>
          <div className="text-lg">{yacht.yacht_name || 'Not set'}</div>
        </div>

        <Separator />

        <div>
          <div className="text-sm text-gray-500">Status</div>
          <div className="mt-1">
            {yacht.active ? (
              <Badge variant="default" className="bg-green-600">ACTIVE</Badge>
            ) : (
              <Badge variant="secondary" className="bg-yellow-600">PENDING</Badge>
            )}
          </div>
        </div>

        <Separator />

        <div>
          <div className="text-sm text-gray-500">Owner Email</div>
          <div>{user.email}</div>
        </div>

        <Separator />

        <div>
          <div className="text-sm text-gray-500">Registration Date</div>
          <div>{new Date(yacht.registered_at).toLocaleDateString()}</div>
        </div>

        {yacht.activated_at && (
          <>
            <Separator />
            <div>
              <div className="text-sm text-gray-500">Activation Date</div>
              <div>{new Date(yacht.activated_at).toLocaleDateString()}</div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
