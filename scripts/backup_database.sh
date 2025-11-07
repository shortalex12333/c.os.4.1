#!/bin/bash
# Automated Supabase Database Backup Script
# Backs up local Supabase database to /supabase/backups/

set -e  # Exit on error

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
BASE_DIR="/Users/celeste7/Documents/NEWSITE"
BACKUP_BASE_DIR="$BASE_DIR/supabase/backups"
DATE=$(date +%Y%m%d)
TIME=$(date +%H%M%S)
BACKUP_DIR="$BACKUP_BASE_DIR/$DATE"

echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}   CelesteOS Database Backup Script    ${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

# Create backup directory
mkdir -p "$BACKUP_DIR"
echo -e "${GREEN}✓${NC} Backup directory: $BACKUP_DIR"

# Check if Supabase is running
if ! curl -s http://127.0.0.1:54321/auth/v1/health > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠${NC}  Warning: Supabase may not be running"
    echo "   Starting Supabase..."
    cd "$BASE_DIR"
    supabase start
    sleep 5
fi

cd "$BASE_DIR"

echo ""
echo -e "${BLUE}Backing up database schema...${NC}"
supabase db dump --local -f "$BACKUP_DIR/schema_$TIME.sql"
SCHEMA_SIZE=$(du -h "$BACKUP_DIR/schema_$TIME.sql" | cut -f1)
echo -e "${GREEN}✓${NC} Schema backup complete ($SCHEMA_SIZE)"

echo ""
echo -e "${BLUE}Backing up database data...${NC}"
supabase db dump --local --data-only -f "$BACKUP_DIR/data_$TIME.sql"
DATA_SIZE=$(du -h "$BACKUP_DIR/data_$TIME.sql" | cut -f1)
echo -e "${GREEN}✓${NC} Data backup complete ($DATA_SIZE)"

echo ""
echo -e "${BLUE}Creating combined backup...${NC}"
cat "$BACKUP_DIR/schema_$TIME.sql" "$BACKUP_DIR/data_$TIME.sql" > "$BACKUP_DIR/backup_COMPLETE_$DATE.sql"
COMPLETE_SIZE=$(du -h "$BACKUP_DIR/backup_COMPLETE_$DATE.sql" | cut -f1)
echo -e "${GREEN}✓${NC} Combined backup complete ($COMPLETE_SIZE)"

# Count tables and data rows
TABLE_COUNT=$(grep -c "CREATE TABLE" "$BACKUP_DIR/schema_$TIME.sql" || echo "0")
DATA_ROWS=$(grep -cE "INSERT INTO|COPY" "$BACKUP_DIR/data_$TIME.sql" || echo "0")

echo ""
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Backup Complete!${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""
echo "📊 Backup Summary:"
echo "   • Date: $(date '+%B %d, %Y at %I:%M %p')"
echo "   • Location: $BACKUP_DIR"
echo "   • Tables: $TABLE_COUNT"
echo "   • Data rows: $DATA_ROWS"
echo "   • Total size: $COMPLETE_SIZE"
echo ""
echo "📁 Backup Files:"
echo "   • schema_$TIME.sql ($SCHEMA_SIZE)"
echo "   • data_$TIME.sql ($DATA_SIZE)"
echo "   • backup_COMPLETE_$DATE.sql ($COMPLETE_SIZE) ← Use this for full restore"
echo ""
echo -e "${YELLOW}💡 To restore:${NC}"
echo "   psql postgresql://postgres:postgres@127.0.0.1:54322/postgres \\"
echo "     -f $BACKUP_DIR/backup_COMPLETE_$DATE.sql"
echo ""

# Optional: Keep only last N days of backups
KEEP_DAYS=30
echo -e "${BLUE}Cleaning up old backups (keeping last $KEEP_DAYS days)...${NC}"
find "$BACKUP_BASE_DIR" -type d -mtime +$KEEP_DAYS -exec rm -rf {} + 2>/dev/null || true
echo -e "${GREEN}✓${NC} Cleanup complete"

echo ""
echo -e "${GREEN}✅ Database backup saved successfully!${NC}"
