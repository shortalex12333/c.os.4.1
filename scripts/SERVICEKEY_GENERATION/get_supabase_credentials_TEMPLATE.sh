#!/bin/bash

###############################################################################
# Supabase Credentials Generator - UNIVERSAL TEMPLATE
#
# Purpose: Extract and log all necessary credentials for ANY Supabase instance
# Use Case: Deploy to client yacht hardware, run this to get all keys
#
# SETUP INSTRUCTIONS FOR CLIENT DEPLOYMENTS:
# 1. Copy this file to client's yacht hardware
# 2. Update the CONFIGURATION section below with client-specific values
# 3. Make executable: chmod +x get_supabase_credentials.sh
# 4. Run: ./get_supabase_credentials.sh
# 5. Credentials will be saved to timestamped file
#
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

###############################################################################
# ╔═══════════════════════════════════════════════════════════════════════╗
# ║                          CONFIGURATION                                ║
# ║                   UPDATE THESE VALUES FOR EACH CLIENT                 ║
# ╚═══════════════════════════════════════════════════════════════════════╝
###############################################################################

# YACHT INFORMATION
YACHT_NAME="{{YACHT_NAME}}"                    # e.g., "M/Y EXCELLENCE"
YACHT_ID="{{YACHT_ID}}"                        # e.g., "yacht-001"
CLIENT_NAME="{{CLIENT_NAME}}"                  # e.g., "John Smith"
DEPLOYMENT_DATE="{{DEPLOYMENT_DATE}}"          # e.g., "2025-10-15"

# PROJECT CONFIGURATION
PROJECT_DIR="{{PROJECT_DIR}}"                  # e.g., "/home/celeste/yacht-system"
                                               # For macOS: /Users/username/project
                                               # For Linux: /home/username/project
                                               # For Windows: C:/yacht-system

# SUPABASE CONFIGURATION
SUPABASE_PROJECT_NAME="{{SUPABASE_PROJECT}}"   # e.g., "NEWSITE" or "yacht-db"

# OUTPUT CONFIGURATION
OUTPUT_DIR="${PROJECT_DIR}/credentials"        # Where to save credential files
BACKUP_TO_USB=false                            # Set to true to also save to USB

# USB BACKUP PATH (if BACKUP_TO_USB=true)
USB_BACKUP_PATH="/Volumes/USB_BACKUP"          # macOS/Linux USB path
# USB_BACKUP_PATH="E:/"                        # Windows USB path (uncomment for Windows)

###############################################################################
# ╔═══════════════════════════════════════════════════════════════════════╗
# ║                    DO NOT EDIT BELOW THIS LINE                        ║
# ║              (Unless you know what you're doing)                      ║
# ╚═══════════════════════════════════════════════════════════════════════╝
###############################################################################

# Validate configuration
if [[ "$YACHT_NAME" == "{{YACHT_NAME}}" ]] || [[ "$PROJECT_DIR" == "{{PROJECT_DIR}}" ]]; then
    echo -e "${RED}ERROR: Configuration not set!${NC}"
    echo -e "${YELLOW}Please edit this script and update the CONFIGURATION section.${NC}"
    echo -e "Required fields:"
    echo -e "  - YACHT_NAME"
    echo -e "  - YACHT_ID"
    echo -e "  - CLIENT_NAME"
    echo -e "  - PROJECT_DIR"
    echo -e "  - SUPABASE_PROJECT_NAME"
    exit 1
fi

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Generate filenames
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUTPUT_FILE="$OUTPUT_DIR/SUPABASE_CREDENTIALS_${YACHT_ID}_${TIMESTAMP}.txt"
ENV_FILE="$OUTPUT_DIR/.env.supabase.local"
JSON_FILE="$OUTPUT_DIR/credentials_${YACHT_ID}_${TIMESTAMP}.json"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   SUPABASE CREDENTIALS EXTRACTOR                           ║${NC}"
echo -e "${BLUE}║   Yacht Hardware Deployment Tool                           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Yacht:${NC} $YACHT_NAME ($YACHT_ID)"
echo -e "${YELLOW}Client:${NC} $CLIENT_NAME"
echo -e "${YELLOW}Date:${NC} $DEPLOYMENT_DATE"
echo ""

# Check if Supabase is running
echo -e "${YELLOW}[1/6] Checking Supabase status...${NC}"
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
echo -e "${YELLOW}[2/6] Extracting credentials...${NC}"

STATUS_OUTPUT=$(npx supabase status)

API_URL=$(echo "$STATUS_OUTPUT" | grep "API URL:" | awk '{print $3}')
DB_URL=$(echo "$STATUS_OUTPUT" | grep "DB URL:" | awk '{print $3}')
STUDIO_URL=$(echo "$STATUS_OUTPUT" | grep "Studio URL:" | awk '{print $3}')
ANON_KEY=$(echo "$STATUS_OUTPUT" | grep "anon key:" | awk '{print $3}')
SERVICE_ROLE_KEY=$(echo "$STATUS_OUTPUT" | grep "service_role key:" | awk '{print $3}')
JWT_SECRET=$(echo "$STATUS_OUTPUT" | grep "JWT secret:" | awk '{print $3}')

# Parse DB connection details
DB_HOST=$(echo "$DB_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo "$DB_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo "$DB_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
DB_USER=$(echo "$DB_URL" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo "$DB_URL" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')

echo -e "${GREEN}✓ Credentials extracted${NC}"
echo ""

# Validate extraction
echo -e "${YELLOW}[3/6] Validating credentials...${NC}"

if [ -z "$API_URL" ] || [ -z "$ANON_KEY" ] || [ -z "$SERVICE_ROLE_KEY" ]; then
    echo -e "${RED}ERROR: Failed to extract all credentials!${NC}"
    exit 1
fi

echo -e "${GREEN}✓ All credentials valid${NC}"
echo ""

# Create human-readable file
echo -e "${YELLOW}[4/6] Creating credential files...${NC}"

cat > "$OUTPUT_FILE" << EOF
================================================================================
SUPABASE CREDENTIALS - $YACHT_NAME
================================================================================

Yacht Information:
  Name: $YACHT_NAME
  ID: $YACHT_ID
  Client: $CLIENT_NAME
  Deployment Date: $DEPLOYMENT_DATE
  Generated: $(date)

================================================================================
CONNECTION DETAILS
================================================================================

API URL:     $API_URL
Database:    $DB_URL
Studio URL:  $STUDIO_URL

Database Connection:
  Host:     $DB_HOST
  Port:     $DB_PORT
  Database: $DB_NAME
  Username: $DB_USER
  Password: $DB_PASS

================================================================================
AUTHENTICATION KEYS
================================================================================

ANON KEY (Public - Read Only):
$ANON_KEY

SERVICE ROLE KEY (Private - Full Access):
$SERVICE_ROLE_KEY

JWT SECRET:
$JWT_SECRET

================================================================================
N8N CONFIGURATION
================================================================================

For READ operations (GET requests):
  Headers:
    apikey: $ANON_KEY
    Authorization: Bearer $ANON_KEY

For WRITE operations (POST/PUT/DELETE):
  Headers:
    apikey: $SERVICE_ROLE_KEY
    Authorization: Bearer $SERVICE_ROLE_KEY

================================================================================
SECURITY NOTES
================================================================================

✓ ANON_KEY: Safe for reading data, use in workflows
✗ SERVICE_ROLE_KEY: NEVER expose in frontend, backend only
⚠️  Keep this file secure and do not commit to version control

================================================================================
EOF

# Create .env file
cat > "$ENV_FILE" << EOF
# Supabase Credentials - $YACHT_NAME ($YACHT_ID)
# Generated: $(date)
# Client: $CLIENT_NAME

NEXT_PUBLIC_SUPABASE_URL=$API_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY
SUPABASE_JWT_SECRET=$JWT_SECRET
DATABASE_URL=$DB_URL
POSTGRES_HOST=$DB_HOST
POSTGRES_PORT=$DB_PORT
POSTGRES_DB=$DB_NAME
POSTGRES_USER=$DB_USER
POSTGRES_PASSWORD=$DB_PASS

# Yacht Information
YACHT_NAME=$YACHT_NAME
YACHT_ID=$YACHT_ID
CLIENT_NAME=$CLIENT_NAME
DEPLOYMENT_DATE=$DEPLOYMENT_DATE
EOF

# Create JSON file (machine-readable)
cat > "$JSON_FILE" << EOF
{
  "yacht": {
    "name": "$YACHT_NAME",
    "id": "$YACHT_ID",
    "client": "$CLIENT_NAME",
    "deployment_date": "$DEPLOYMENT_DATE"
  },
  "supabase": {
    "api_url": "$API_URL",
    "studio_url": "$STUDIO_URL",
    "anon_key": "$ANON_KEY",
    "service_role_key": "$SERVICE_ROLE_KEY",
    "jwt_secret": "$JWT_SECRET"
  },
  "database": {
    "url": "$DB_URL",
    "host": "$DB_HOST",
    "port": "$DB_PORT",
    "name": "$DB_NAME",
    "username": "$DB_USER",
    "password": "$DB_PASS"
  },
  "generated_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

echo -e "${GREEN}✓ Files created${NC}"
echo ""

# Set restrictive permissions
echo -e "${YELLOW}[5/6] Securing files...${NC}"
chmod 600 "$OUTPUT_FILE"
chmod 600 "$ENV_FILE"
chmod 600 "$JSON_FILE"
echo -e "${GREEN}✓ File permissions set (600 - owner only)${NC}"
echo ""

# Backup to USB if enabled
if [ "$BACKUP_TO_USB" = true ]; then
    echo -e "${YELLOW}[6/6] Backing up to USB...${NC}"
    if [ -d "$USB_BACKUP_PATH" ]; then
        USB_DEST="$USB_BACKUP_PATH/yacht_credentials_$YACHT_ID"
        mkdir -p "$USB_DEST"
        cp "$OUTPUT_FILE" "$USB_DEST/"
        cp "$ENV_FILE" "$USB_DEST/"
        cp "$JSON_FILE" "$USB_DEST/"
        echo -e "${GREEN}✓ Backed up to: $USB_DEST${NC}"
    else
        echo -e "${YELLOW}⚠️  USB path not found: $USB_BACKUP_PATH${NC}"
        echo -e "   Skipping USB backup"
    fi
else
    echo -e "${YELLOW}[6/6] USB backup disabled${NC}"
fi
echo ""

# Display summary
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ CREDENTIALS EXTRACTED SUCCESSFULLY${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}Files created:${NC}"
echo -e "  1. $OUTPUT_FILE"
echo -e "  2. $ENV_FILE"
echo -e "  3. $JSON_FILE"
echo ""
echo -e "${BLUE}────────────────────────────────────────────────────────────${NC}"
echo -e "${YELLOW}Quick Reference:${NC}"
echo ""
echo -e "${GREEN}ANON KEY (Read-Only):${NC}"
echo "$ANON_KEY"
echo ""
echo -e "${RED}SERVICE ROLE KEY (Full Access):${NC}"
echo "$SERVICE_ROLE_KEY"
echo ""
echo -e "${BLUE}────────────────────────────────────────────────────────────${NC}"
echo ""
echo -e "${YELLOW}API URL:${NC} $API_URL"
echo -e "${YELLOW}Studio:${NC} $STUDIO_URL"
echo ""
echo -e "${RED}⚠️  SECURITY REMINDER:${NC}"
echo -e "   - Keep these files secure"
echo -e "   - Do NOT commit to git"
echo -e "   - Only share with authorized personnel"
echo -e "   - SERVICE_ROLE_KEY = full database access"
echo ""
echo -e "${GREEN}Deployment complete for $YACHT_NAME!${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
