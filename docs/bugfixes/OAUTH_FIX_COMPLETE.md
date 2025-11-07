# ✅ NEWSITE Email Connector - OAuth Fixed

## What Was Breaking

**Error:** `AADSTS700005: Authorization Code intended for different tenant`

**Root Cause:** Port and redirect URI mismatches across 3 different components

### The Mismatch

| Component | Expected Port | Expected Redirect | Status |
|-----------|--------------|-------------------|--------|
| **Frontend (SettingsGlass)** | 8003 | `/auth/start` | ✅ Fixed |
| **Registration Server** | 8003 | Used to redirect to 8002 | ❌ WRONG |
| **OAuth Callback Server** | 8082 | `/auth/microsoft/callback` | ✅ Running |
| **Microsoft App Config** | 8082 | `/auth/microsoft/callback` | ✅ Correct |

## Changes Made

### 1. Updated `/NEWSITE/server/services/email/config.py`

**Before:**
```python
REDIRECT_URI = "http://localhost:8002"
LOCAL_SERVER_PORT = 8002
```

**After:**
```python
REDIRECT_URI = "http://localhost:8082/auth/microsoft/callback"
LOCAL_SERVER_PORT = 8082
```

### 2. Started Required Services

| Service | Port | Purpose | Process |
|---------|------|---------|---------|
| Registration Server | 8003 | `/auth/start` endpoint | dff13d |
| OAuth Callback Server | 8082 | Handles Microsoft redirects | 33c692 |
| Email RAG API | 5156 | Email search pipeline | 183270 |

## Current Architecture

```
User clicks "Connect Email" in Settings
           ↓
Frontend calls: http://localhost:8003/auth/start
           ↓
Registration server generates MSAL auth URL with redirect=8082
           ↓
User authorizes on Microsoft
           ↓
Microsoft redirects to: http://localhost:8082/auth/microsoft/callback
           ↓
OAuth Callback Server receives code
           ↓
Exchanges code for tokens (using correct tenant ID)
           ↓
Stores tokens in Supabase `user_microsoft_tokens`
           ↓
Success page shown to user
```

## Testing the Fix

### Step 1: Verify Services Running
```bash
lsof -ti:8003  # Registration server
lsof -ti:8082  # OAuth callback
lsof -ti:5156  # Email RAG API
```

### Step 2: Test Email Connection Flow

1. Open NEWSITE frontend
2. Go to Settings > Email Connector
3. Click "Connect Email" button
4. Should open Microsoft OAuth
5. After authorization, should redirect to port 8082 ✅
6. Tokens should be stored in Supabase
7. No more tenant mismatch error

### Step 3: Verify Token Stored
```bash
curl -s "http://127.0.0.1:54321/rest/v1/user_microsoft_tokens?select=user_id,created_at" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
```

## Microsoft App Configuration (Azure Portal)

**App Name:** CelesteOS
**Client ID:** 41f6dc82-8127-4330-97e0-c6b26e6aa967
**Client Secret:** <your-azure-client-secret>
**Tenant ID:** 073af86c-74f3-422b-ad5c-a35d41fce4be

**Redirect URIs (configured in Azure):**
- ✅ http://localhost:8082/auth/microsoft/callback
- ✅ https://api.celeste7.ai/rest/oauth2-credential/callback
- ✅ https://api.celeste7.ai/rest/oauth2-credential/spa-callback

## Troubleshooting

### If you get "Connection Refused" on port 8003:
```bash
# Restart registration server
cd /Users/celeste7/Documents/NEWSITE/server/services/email
AZURE_TENANT_ID="073af86c-74f3-422b-ad5c-a35d41fce4be" \
AZURE_CLIENT_ID="41f6dc82-8127-4330-97e0-c6b26e6aa967" \
python3 user_registration_server.py &
```

### If you get tenant mismatch error:
- Check that `config.py` has `REDIRECT_URI = "http://localhost:8082/auth/microsoft/callback"`
- Verify port 8082 OAuth server is running: `lsof -ti:8082`
- Check Microsoft App in Azure Portal has matching redirect URI

### If tokens not saving to Supabase:
- Verify Supabase is running: `curl http://127.0.0.1:54321`
- Check `user_microsoft_tokens` table exists
- Check OAuth callback server logs for errors

## Files Modified

1. `/Users/celeste7/Documents/NEWSITE/server/services/email/config.py` - Updated redirect URI to 8082
2. `/Users/celeste7/Documents/ATLAS_EMAIL_FILTRATION/oauth_callback_server.py` - Created callback handler

## Next Steps

Once users connect their email:
1. ✅ Token stored in `user_microsoft_tokens`
2. ✅ RAG pipeline at port 5156 can fetch and use token
3. ✅ Token auto-refreshes when <5 mins from expiry
4. ✅ Email search works via n8n or direct API calls

## Production Deployment Notes

For production (celeste7.ai):
1. Update `config.py` to use `https://api.celeste7.ai/auth/microsoft/callback`
2. Ensure Azure redirect URIs include production URL
3. Use environment variables for secrets (not hardcoded)
4. Run services behind reverse proxy with SSL
5. Use gunicorn/uwsgi instead of Flask dev server
