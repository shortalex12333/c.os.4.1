-- Supabase Schema for Microsoft Email Integration
-- Run this in your Supabase SQL editor

-- Create user_email_tokens table
CREATE TABLE user_email_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    email_address TEXT NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    token_type TEXT DEFAULT 'Bearer' NOT NULL,
    scopes TEXT[] DEFAULT ARRAY['Mail.Read', 'User.Read'] NOT NULL,
    display_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_user_email_tokens_user_id ON user_email_tokens(user_id);
CREATE INDEX idx_user_email_tokens_expires_at ON user_email_tokens(expires_at);
CREATE INDEX idx_user_email_tokens_email ON user_email_tokens(email_address);

-- Create RLS policies for security
ALTER TABLE user_email_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own tokens
CREATE POLICY "Users can access their own email tokens" ON user_email_tokens
    FOR ALL USING (auth.jwt() ->> 'sub' = user_id);

-- Policy: Service role can access all tokens (for backend operations)
CREATE POLICY "Service role can access all email tokens" ON user_email_tokens
    FOR ALL USING (auth.role() = 'service_role');

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_user_email_tokens_updated_at
    BEFORE UPDATE ON user_email_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create a view for webhook data (without sensitive tokens)
CREATE VIEW user_email_status AS
SELECT 
    user_id,
    email_address,
    CASE 
        WHEN expires_at > NOW() THEN true 
        ELSE false 
    END as email_connected,
    expires_at,
    display_name,
    created_at,
    updated_at
FROM user_email_tokens;

-- Grant permissions to authenticated users
GRANT SELECT ON user_email_status TO authenticated;
GRANT ALL ON user_email_tokens TO service_role;