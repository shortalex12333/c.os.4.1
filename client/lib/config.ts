// CelesteOS Portal Configuration
// Update these values with your actual endpoints

export const CONFIG = {
  supabase: {
    url: 'https://vivovcnaapmcfxxfhzxk.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpdm92Y25hYXBtY2Z4eGZoenhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NjQ5ODIsImV4cCI6MjA3MTQ0MDk4Mn0.eUICOqJRP_MyVMNJNlZu3Mc-1-jAG6nQE-Oy0k3Yr0E'
  },
  n8n: {
    webhooks: {
      login: 'https://api.celeste7.ai/webhook/user-login',
      verify2FA: 'https://api.celeste7.ai/webhook/verify-2fa',
      downloadRequest: 'https://api.celeste7.ai/webhook/download-request'
    }
  }
} as const;
