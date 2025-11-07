#!/bin/bash

###############################################################################
# Supabase Credentials Generator for Client Deployments
#
# Purpose: Extract and log all necessary credentials for local Supabase instance
# Use Case: When deploying to client yacht hardware, run this to get all keys
#
# Usage: ./get_supabase_credentials.sh
# Output: Creates credentials file and displays on screen
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/Users/celeste7/Documents/NEWSITE"  # PLACEHOLDER: Change to actual project path
OUTPUT_FILE="$PROJECT_DIR/SUPABASE_CREDENTIALS_$(date +%Y%m%d_%H%M%S).txt"
SECURE_OUTPUT_FILE="$PROJECT_DIR/.env.supabase.local"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   SUPABASE CREDENTIALS EXTRACTOR                           ║${NC}"
echo -e "${BLUE}║   For Client Yacht Hardware Deployments                    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if Supabase is running
echo -e "${YELLOW}[1/5] Checking Supabase status...${NC}"
cd "$PROJECT_DIR" || exit 1

if ! npx supabase status > /dev/null 2>&1; then
    echo -e "${RED}ERROR: Supabase is not running!${NC}"
    echo -e "${YELLOW}Starting Supabase...${NC}"
    npx supabase start
    sleep 5
fi

echo -e "${GREEN}✓ Supabase is running${NC}"
echo ""

# Extract credentials
echo -e "${YELLOW}[2/5] Extracting credentials...${NC}"

# Get full status output
STATUS_OUTPUT=$(npx supabase status)

# Parse individual values
API_URL=$(echo "$STATUS_OUTPUT" | grep "API URL:" | awk '{print $3}')
DB_URL=$(echo "$STATUS_OUTPUT" | grep "DB URL:" | awk '{print $3}')
STUDIO_URL=$(echo "$STATUS_OUTPUT" | grep "Studio URL:" | awk '{print $3}')
ANON_KEY=$(echo "$STATUS_OUTPUT" | grep "anon key:" | awk '{print $3}')
SERVICE_ROLE_KEY=$(echo "$STATUS_OUTPUT" | grep "service_role key:" | awk '{print $3}')
JWT_SECRET=$(echo "$STATUS_OUTPUT" | grep "JWT secret:" | awk '{print $3}')

echo -e "${GREEN}✓ Credentials extracted${NC}"
echo ""

# Validate extraction
echo -e "${YELLOW}[3/5] Validating credentials...${NC}"

if [ -z "$API_URL" ] || [ -z "$ANON_KEY" ] || [ -z "$SERVICE_ROLE_KEY" ]; then
    echo -e "${RED}ERROR: Failed to extract all credentials!${NC}"
    echo "Debug output:"
    echo "$STATUS_OUTPUT"
    exit 1
fi

echo -e "${GREEN}✓ All credentials valid${NC}"
echo ""

# Create output files
echo -e "${YELLOW}[4/5] Creating credential files...${NC}"

# Human-readable file with explanations
cat > "$OUTPUT_FILE" << EOF
================================================================================
SUPABASE LOCAL CREDENTIALS
Generated: $(date)
Yacht Hardware Deployment
================================================================================

⚠️  SECURITY WARNING:
- These credentials provide FULL ACCESS to the local database
- SERVICE_ROLE_KEY bypasses all Row Level Security policies
- Keep this file SECURE and do not commit to version control
- Only share with authorized personnel

================================================================================
CONNECTION DETAILS
================================================================================

API URL (REST endpoint):
$API_URL

Database URL (Direct PostgreSQL):
$DB_URL

Studio URL (Web UI):
$STUDIO_URL

================================================================================
AUTHENTICATION KEYS
================================================================================

ANON KEY (Public, Read-Only):
────────────────────────────────────────────────────────────────────────────
$ANON_KEY
────────────────────────────────────────────────────────────────────────────

Use this key for:
  ✓ Reading data from tables
  ✓ n8n workflows (GET requests)
  ✓ Public-facing endpoints
  ✓ Safe to use in multiple places

Cannot be used for:
  ✗ Writing data (INSERT, UPDATE, DELETE)
  ✗ Admin operations
  ✗ Bypassing security policies


SERVICE ROLE KEY (Private, Full Access):
────────────────────────────────────────────────────────────────────────────
$SERVICE_ROLE_KEY
────────────────────────────────────────────────────────────────────────────

Use this key for:
  ✓ Writing data (INSERT, UPDATE, DELETE)
  ✓ Admin operations
  ✓ Bypassing Row Level Security
  ✓ Backend services only

⚠️  CRITICAL: Never expose this in frontend code or public APIs!


JWT SECRET (Token Signing):
────────────────────────────────────────────────────────────────────────────
$JWT_SECRET
────────────────────────────────────────────────────────────────────────────

================================================================================
USAGE EXAMPLES
================================================================================

── n8n HTTP Request (Read Data) ───────────────────────────────────────────

Method: GET
URL: $API_URL/rest/v1/users_yacht

Headers:
  Content-Type: application/json
  apikey: $ANON_KEY
  Authorization: Bearer $ANON_KEY


── n8n HTTP Request (Write Data) ──────────────────────────────────────────

Method: POST
URL: $API_URL/rest/v1/users_yacht

Headers:
  Content-Type: application/json
  apikey: $SERVICE_ROLE_KEY
  Authorization: Bearer $SERVICE_ROLE_KEY

Body:
{
  "user_id": "uuid-here",
  "yacht_id": "yacht-001",
  "email": "user@example.com"
}


── cURL Command (Test Connection) ─────────────────────────────────────────

curl -X GET "$API_URL/rest/v1/users_yacht" \\
  -H "apikey: $ANON_KEY" \\
  -H "Authorization: Bearer $ANON_KEY"


── PostgreSQL Direct Connection ───────────────────────────────────────────

psql "$DB_URL"

Or separately:
  Host: 127.0.0.1
  Port: 54322
  Database: postgres
  Username: postgres
  Password: postgres

================================================================================
ENVIRONMENT VARIABLES (.env format)
================================================================================

NEXT_PUBLIC_SUPABASE_URL=$API_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY
SUPABASE_JWT_SECRET=$JWT_SECRET
DATABASE_URL=$DB_URL

================================================================================
SECURITY CHECKLIST
================================================================================

Before deployment:
  [ ] Credentials stored in secure location (not in git)
  [ ] .env files added to .gitignore
  [ ] Service role key only used in backend
  [ ] Network access restricted (localhost only or VPN)
  [ ] Backup of credentials in encrypted storage
  [ ] Team members briefed on security protocols

For production (cloud):
  [ ] Generate NEW keys (don't use local keys)
  [ ] Enable Row Level Security on ALL tables
  [ ] Set up API rate limiting
  [ ] Configure IP whitelisting if applicable
  [ ] Enable audit logging
  [ ] Set up monitoring/alerts

================================================================================
END OF CREDENTIALS FILE
Generated: $(date)
================================================================================
EOF

# Machine-readable .env file
cat > "$SECURE_OUTPUT_FILE" << EOF
# Supabase Local Credentials
# Generated: $(date)
# ⚠️  DO NOT COMMIT TO GIT ⚠️

# API Configuration
NEXT_PUBLIC_SUPABASE_URL=$API_URL
SUPABASE_DB_URL=$DB_URL
SUPABASE_STUDIO_URL=$STUDIO_URL

# Authentication Keys
NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY
SUPABASE_JWT_SECRET=$JWT_SECRET

# Database Direct Access
DATABASE_URL=$DB_URL
POSTGRES_HOST=127.0.0.1
POSTGRES_PORT=54322
POSTGRES_DB=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
EOF

echo -e "${GREEN}✓ Credential files created${NC}"
echo ""

# Display credentials
echo -e "${YELLOW}[5/5] Displaying credentials...${NC}"
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ CREDENTIALS READY${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}Files created:${NC}"
echo -e "  1. ${GREEN}$OUTPUT_FILE${NC}"
echo -e "     (Human-readable with explanations)"
echo ""
echo -e "  2. ${GREEN}$SECURE_OUTPUT_FILE${NC}"
echo -e "     (Machine-readable .env format)"
echo ""
echo -e "${BLUE}────────────────────────────────────────────────────────────${NC}"
echo -e "${YELLOW}Quick Copy (ANON KEY):${NC}"
echo -e "${GREEN}$ANON_KEY${NC}"
echo ""
echo -e "${YELLOW}Quick Copy (SERVICE_ROLE KEY):${NC}"
echo -e "${RED}$SERVICE_ROLE_KEY${NC}"
echo ""
echo -e "${BLUE}────────────────────────────────────────────────────────────${NC}"
echo ""
echo -e "${YELLOW}API URL:${NC} $API_URL"
echo -e "${YELLOW}Studio:${NC} $STUDIO_URL"
echo ""
echo -e "${GREEN}✓ All credentials extracted successfully!${NC}"
echo ""
echo -e "${RED}⚠️  SECURITY REMINDER:${NC}"
echo -e "   Keep these credentials secure!"
echo -e "   Do NOT commit to git or share publicly!"
echo ""

# Set restrictive permissions
chmod 600 "$OUTPUT_FILE"
chmod 600 "$SECURE_OUTPUT_FILE"

echo -e "${GREEN}✓ File permissions set to 600 (owner read/write only)${NC}"
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
