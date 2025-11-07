# CelesteOS-Modern Integration Guide

## 🎯 Objective
Integrate Microsoft email authentication into your existing CelesteOS-Modern project at **celeste7.ai** without disrupting the engineer's localhost→celesteos URL rewriting work.

## 📋 Step-by-Step Integration Plan

### Step 1: Azure AD Production Update
**⚠️ Do this FIRST before any code changes**

1. **Go to Azure Portal** → Azure Active Directory → App registrations
2. **Find your app**: "Email Reader for Microsoft Outlook"
3. **Update Authentication section**:
   ```
   REMOVE: http://localhost:8002
   ADD:    https://celeste7.ai/auth/microsoft/callback
   ADD:    https://www.celeste7.ai/auth/microsoft/callback
   ```

### Step 2: Coordinate with Your Engineer
**Create a clear integration boundary**

Send this to your engineer:
```
Hi! I'm adding Microsoft email authentication to CelesteOS-Modern.

New API endpoints I'll add:
- /auth/microsoft/* (authentication flows)
- /api/email/* (email search API)

These won't conflict with your localhost→celesteos work.

Can we coordinate on:
1. Where to add the "Connect Email" button in the ChatLLM interface?
2. How to integrate with the existing user system?
3. Deployment strategy for the new services?
```

### Step 3: Add Backend Services to CelesteOS-Modern

**Option A: Microservices (Recommended)**
```bash
# In your CelesteOS-Modern project
mkdir services/email-auth
cp -r /path/to/yacht-email-reader/* services/email-auth/
```

**Option B: Integrated Services**
Add the email services directly to your existing backend.

### Step 4: Frontend Integration Points

**Add to your ChatLLM interface:**

```html
<!-- Email Integration Status Check -->
<div id="email-status" class="email-integration">
  <div v-if="!user.emailConnected" class="connect-email">
    <p>🚢 Connect your Microsoft email to search emails with AI</p>
    <button @click="connectEmail()" class="btn-primary">
      📧 Connect Microsoft Account
    </button>
  </div>
  
  <div v-if="user.emailConnected" class="email-search">
    <input v-model="emailQuery" placeholder="Search your emails..." />
    <button @click="searchEmails()" class="btn-search">🔍 Search</button>
  </div>
</div>
```

**JavaScript integration:**
```javascript
// Add to your existing CelesteOS-Modern frontend
export class EmailIntegration {
  constructor(userId) {
    this.userId = userId;
    this.baseUrl = 'https://celeste7.ai';
  }

  // Check if user has email connected
  async checkEmailStatus() {
    const response = await fetch(`${this.baseUrl}/api/email/user/${this.userId}/status`);
    return await response.json();
  }

  // Connect email account
  connectEmail() {
    const returnUrl = encodeURIComponent(window.location.href + '?email_connected=true');
    window.location.href = `${this.baseUrl}/auth/microsoft/register?user_id=${this.userId}&return_url=${returnUrl}`;
  }

  // Search emails
  async searchEmails(query) {
    const response = await fetch(`${this.baseUrl}/api/email/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: this.userId,
        query: query,
        limit: 10
      })
    });
    return await response.json();
  }
}
```

### Step 5: Docker Configuration for Production

**Create `docker-compose.yml` for email services:**

```yaml
version: '3.8'
services:
  celesteos-main:
    # Your existing CelesteOS-Modern service
    build: .
    ports:
      - "80:3000"
    environment:
      - EMAIL_API_URL=http://email-api:8001
    depends_on:
      - email-api

  email-api:
    build: ./services/email-auth
    ports:
      - "8001:8001"
    environment:
      - AZURE_TENANT_ID=${AZURE_TENANT_ID}
      - AZURE_CLIENT_ID=${AZURE_CLIENT_ID}
      - DATABASE_URL=${EMAIL_DB_URL}
    volumes:
      - email_tokens:/app/tokens

  email-registration:
    build: ./services/email-auth
    command: python user_registration_server.py
    ports:
      - "8003:8003"
    environment:
      - AZURE_TENANT_ID=${AZURE_TENANT_ID}
      - AZURE_CLIENT_ID=${AZURE_CLIENT_ID}

volumes:
  email_tokens:
```

### Step 6: Environment Variables

**Add to your production environment:**
```bash
# Microsoft Authentication
AZURE_TENANT_ID=d44c2402-b515-4d6d-a392-5cfc88ae53bb
AZURE_CLIENT_ID=a744caeb-9896-4dbf-8b85-d5e07dba935c
EMAIL_TOKEN_ENCRYPTION_KEY=your-secure-encryption-key-here
SESSION_SECRET_KEY=your-session-secret-here

# Database (if using separate DB for email tokens)
EMAIL_DB_URL=postgresql://user:pass@localhost:5432/celesteos_email

# Service URLs
EMAIL_API_URL=https://celeste7.ai/api/email
EMAIL_AUTH_URL=https://celeste7.ai/auth/microsoft
```

## 🚀 Deployment Strategy

### Phase 1: Staging Test
1. Deploy to `staging.celeste7.ai` first
2. Test complete authentication flow
3. Verify integration with existing CelesteOS-Modern features

### Phase 2: Production Deployment
1. Deploy email services alongside existing CelesteOS-Modern
2. Add reverse proxy rules for new endpoints
3. Update DNS and SSL certificates if needed

### Nginx Configuration Example:
```nginx
server {
    server_name celeste7.ai www.celeste7.ai;
    
    # Existing CelesteOS-Modern routes
    location / {
        proxy_pass http://celesteos-main:3000;
    }
    
    # New email authentication routes
    location /auth/microsoft/ {
        proxy_pass http://email-registration:8003;
    }
    
    location /api/email/ {
        proxy_pass http://email-api:8001;
    }
}
```

## 🧪 Testing Plan

### 1. Development Testing
- [x] Test authentication on localhost (already working!)
- [ ] Test with celeste7.ai staging environment
- [ ] Verify Azure AD redirects correctly

### 2. Integration Testing
- [ ] Test "Connect Email" button in CelesteOS-Modern
- [ ] Verify user authentication persists across sessions
- [ ] Test email search integration in ChatLLM

### 3. Production Testing
- [ ] Deploy to production celeste7.ai
- [ ] Test with real users
- [ ] Monitor performance and error rates

## 🔒 Security Checklist

- [ ] All URLs use HTTPS in production
- [ ] Azure AD configured for production domain
- [ ] Environment variables secured
- [ ] Token encryption enabled
- [ ] Rate limiting implemented
- [ ] Audit logging enabled

## 📊 Success Metrics

**Technical:**
- ✅ Zero downtime during deployment
- ✅ <2 second authentication flow
- ✅ 99%+ uptime for email services

**User Experience:**
- ✅ Seamless integration with existing ChatLLM
- ✅ One-click email account connection
- ✅ Fast email search results

## 🚨 Rollback Plan

If anything goes wrong:
1. **Remove new routes** from nginx/reverse proxy
2. **Disable email features** in frontend
3. **Keep existing CelesteOS-Modern** functioning normally
4. **Debug issues** in staging environment

## 💡 Next Steps

1. **Share this plan** with your engineer
2. **Update Azure AD** redirect URIs
3. **Create staging environment** for testing
4. **Plan deployment timeline** with your team
5. **Set up monitoring** for new services

Want me to help with any specific step? I can create the exact configuration files you need!