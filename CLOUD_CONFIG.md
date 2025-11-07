# Cloud Configuration - CelesteOS v4.1

## 🌐 Service URLs

### Supabase (Cloud)
```
URL: https://vivovcnaapmcfxxfhzxk.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpdm92Y25hYXBtY2Z4eGZoenhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NjQ5ODIsImV4cCI6MjA3MTQ0MDk4Mn0.eUICOqJRP_MyVMNJNlZu3Mc-1-jAG6nQE-Oy0k3Yr0E
```

### n8n Webhooks (Cloud)
```
Base URL: https://api.celeste7.ai/webhook/
Endpoints:
  - /webhook/text-chat
  - /webhook/email-search
  - /webhook/ask-ai-sol
```

### Microsoft OAuth
```
Client ID: 41f6dc82-8127-4330-97e0-c6b26e6aa967
Tenant: common
Redirect URI: https://celeste7.ai/auth/microsoft/callback
```

## 📝 Files to Update

Replace localhost URLs with cloud URLs in:

1. `server/routes/webhookRoutes.ts` - Line 64
2. `server/routes/emailRoutes.ts` - Lines 122-123
3. `client/config/webhookConfig.ts` - Base URL
4. `server/services/emailSupabaseIntegration.ts` - Supabase URL

---

Use this as quick reference during deployment.
