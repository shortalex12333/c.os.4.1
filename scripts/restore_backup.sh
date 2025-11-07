#!/bin/bash
# Restore Supabase backup from October 2, 2025

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}   Supabase Backup Restore Script       ${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

BACKUP_DIR="/Users/celeste7/Documents/NEWSITE/supabase/backups/20251002"
BACKUP_FILE="$BACKUP_DIR/backup_COMPLETE_20251002.sql"

if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}❌ Backup file not found: $BACKUP_FILE${NC}"
    exit 1
fi

echo -e "${YELLOW}⚠️  WARNING: This will restore the database to the backup from Oct 2, 2025 11:00am${NC}"
echo -e "${YELLOW}⚠️  Any data created AFTER that time will be LOST${NC}"
echo ""
read -p "Are you sure you want to continue? (yes/no): " -r
echo
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Restore cancelled."
    exit 0
fi

echo -e "${BLUE}Checking if Supabase is running...${NC}"
if ! curl -s http://127.0.0.1:54321/auth/v1/health > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Supabase is not running${NC}"
    echo "Starting Supabase..."
    npx supabase start
fi

echo -e "${GREEN}✓${NC} Supabase is running"
echo ""

DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"

echo -e "${BLUE}Restoring backup...${NC}"
psql "$DB_URL" < "$BACKUP_FILE"

echo ""
echo -e "${GREEN}✅ Backup restored successfully!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Clear your browser's auth tokens:"
echo "   - Visit http://localhost:8082/fix-auth"
echo "   - Or run: localStorage.clear() in browser console"
echo ""
echo "2. Sign up for a new account"
echo "3. Start using the app!"
