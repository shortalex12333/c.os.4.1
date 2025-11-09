#!/bin/bash

# Vercel Environment Variables Setup Script
# This script sets all required environment variables in Vercel
# Usage: ./setup-vercel-env.sh <VERCEL_TOKEN> [PROJECT_NAME]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if token is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Vercel token required${NC}"
    echo ""
    echo "Usage: $0 <VERCEL_TOKEN> [PROJECT_NAME]"
    echo ""
    echo "To get a token:"
    echo "1. Go to https://vercel.com/account/tokens"
    echo "2. Click 'Create Token'"
    echo "3. Copy the token and run:"
    echo "   $0 your_token_here"
    exit 1
fi

VERCEL_TOKEN="$1"
PROJECT_NAME="${2:-c-os-4-1}"

echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}Vercel Environment Variables Setup${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo "Project: $PROJECT_NAME"
echo "Setting up Supabase and webhook configuration..."
echo ""

# Export token for vercel CLI
export VERCEL_TOKEN="$VERCEL_TOKEN"

# Link to project (if not already linked)
echo -e "${YELLOW}Step 1: Linking to Vercel project...${NC}"
if [ ! -d ".vercel" ]; then
    vercel link --yes --token "$VERCEL_TOKEN" --project "$PROJECT_NAME" 2>&1 || {
        echo -e "${RED}Failed to link project. Make sure project name is correct.${NC}"
        echo "Available projects:"
        vercel list --token "$VERCEL_TOKEN" 2>&1 | grep -v "Vercel CLI" || true
        exit 1
    }
fi

# Function to set environment variable
set_env_var() {
    local name="$1"
    local value="$2"
    local envs="production,preview,development"

    echo -e "${YELLOW}Setting: ${name}${NC}"

    # Remove existing variable (ignore errors if doesn't exist)
    vercel env rm "$name" production --yes --token "$VERCEL_TOKEN" 2>/dev/null || true
    vercel env rm "$name" preview --yes --token "$VERCEL_TOKEN" 2>/dev/null || true
    vercel env rm "$name" development --yes --token "$VERCEL_TOKEN" 2>/dev/null || true

    # Add new variable to all environments
    echo "$value" | vercel env add "$name" production --token "$VERCEL_TOKEN" 2>&1 | grep -v "Vercel CLI" || true
    echo "$value" | vercel env add "$name" preview --token "$VERCEL_TOKEN" 2>&1 | grep -v "Vercel CLI" || true
    echo "$value" | vercel env add "$name" development --token "$VERCEL_TOKEN" 2>&1 | grep -v "Vercel CLI" || true

    echo -e "${GREEN}✓ ${name} set${NC}"
}

echo ""
echo -e "${YELLOW}Step 2: Setting environment variables...${NC}"
echo ""

# Supabase configuration
SUPABASE_URL="https://vivovcnaapmcfxxfhzxk.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpdm92Y25hYXBtY2Z4eGZoenhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NjQ5ODIsImV4cCI6MjA3MTQ0MDk4Mn0.eUICOqJRP_MyVMNJNlZu3Mc-1-jAG6nQE-Oy0k3Yr0E"
WEBHOOK_BASE_URL="https://api.celeste7.ai/webhook"

# Set all environment variables
set_env_var "VITE_SUPABASE_URL" "$SUPABASE_URL"
set_env_var "NEXT_PUBLIC_SUPABASE_URL" "$SUPABASE_URL"
set_env_var "VITE_SUPABASE_ANON_KEY" "$SUPABASE_ANON_KEY"
set_env_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$SUPABASE_ANON_KEY"
set_env_var "VITE_WEBHOOK_BASE_URL" "$WEBHOOK_BASE_URL"

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}✓ All environment variables set!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo "Variables set:"
echo "  - VITE_SUPABASE_URL"
echo "  - NEXT_PUBLIC_SUPABASE_URL"
echo "  - VITE_SUPABASE_ANON_KEY"
echo "  - NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "  - VITE_WEBHOOK_BASE_URL"
echo ""
echo -e "${YELLOW}Step 3: Triggering deployment...${NC}"
echo ""

# Trigger a new deployment
vercel deploy --prod --yes --token "$VERCEL_TOKEN" --force 2>&1 | tee /tmp/vercel-deploy.log | grep -E "(https://|Deployed|Building|Error)" || true

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}Setup Complete!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo "Next steps:"
echo "1. Wait for deployment to finish"
echo "2. Test your deployed site"
echo "3. Check browser console for Supabase connection logs"
echo ""
echo "To verify environment variables are set:"
echo "  vercel env ls --token $VERCEL_TOKEN"
echo ""
echo "To check deployment status:"
echo "  vercel list --token $VERCEL_TOKEN"
echo ""
