// Supabase Client Configuration
import { createClient } from '@supabase/supabase-js';
import { CONFIG } from './config';

export const supabase = createClient(
  CONFIG.supabase.url,
  CONFIG.supabase.anonKey
);

// Database types
export interface UserAccount {
  id: string;
  yacht_id: string;
  email: string;
  display_name: string | null;
  status: string;
  last_login: string | null;
  login_count: number;
  created_at: string;
}

export interface FleetRegistry {
  yacht_id: string;
  yacht_id_hash: string;
  yacht_name: string | null;
  buyer_email: string | null;
  active: boolean;
  credentials_retrieved: boolean;
  registered_at: string;
  activated_at: string | null;
}

export interface UserSession {
  id: string;
  user_id: string;
  session_token: string;
  expires_at: string;
  last_activity: string;
  revoked: boolean;
}
