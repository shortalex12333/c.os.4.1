# CelesteOS Test Credentials

## Supabase Local Development Users

### Test User
- **Email**: test@celesteos.com
- **Password**: TestPassword123

### Admin User
- **Email**: admin@celesteos.com
- **Password**: AdminPassword123

## Access URLs

### Application
- Local: http://localhost:8082
- HTTPS: https://celesteos.local

### Supabase Services
- Studio (Web UI): http://localhost:54323
- API Gateway: http://localhost:54321
- Email Testing (Inbucket): http://localhost:54324

## Notes
- These are LOCAL development credentials only
- Supabase must be running (`supabase start`)
- Users were created on: September 24, 2025
- Authentication errors usually mean Supabase isn't running

## Troubleshooting Login Issues

If login fails with "Invalid credentials":
1. Check Supabase is running: `supabase status`
2. Verify auth endpoint: `curl http://127.0.0.1:54321/auth/v1/health`
3. Create new user if needed (see commands below)

## Create New User (if needed)
```bash
curl -X POST 'http://127.0.0.1:54321/auth/v1/signup' \
  -H 'Content-Type: application/json' \
  -H 'apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
  -d '{"email":"your.email@example.com","password":"YourPassword123"}'
```