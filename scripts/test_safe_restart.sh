#!/bin/bash
# Test that Supabase data persists across restart
# Safe to run - does NOT wipe data

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}  Supabase Restart Test (Data Persistence) ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo ""

cd /Users/celeste7/Documents/NEWSITE

# Step 1: Check current data
echo -e "${BLUE}1️⃣  Checking current data...${NC}"
USER_COUNT_BEFORE=$(podman exec supabase_db_NEWSITE psql -U postgres -d postgres -tAc "SELECT COUNT(*) FROM auth.users;")
CHAT_COUNT_BEFORE=$(podman exec supabase_db_NEWSITE psql -U postgres -d postgres -tAc "SELECT COUNT(*) FROM chat_sessions;")

echo -e "   Users: ${GREEN}${USER_COUNT_BEFORE}${NC}"
echo -e "   Chats: ${GREEN}${CHAT_COUNT_BEFORE}${NC}"
echo ""

# Step 2: Stop Supabase
echo -e "${BLUE}2️⃣  Stopping Supabase...${NC}"
npx supabase stop
echo -e "   ${GREEN}✓${NC} Supabase stopped"
echo ""

# Step 3: Wait
echo -e "${BLUE}3️⃣  Waiting 5 seconds...${NC}"
sleep 5
echo ""

# Step 4: Restart Supabase
echo -e "${BLUE}4️⃣  Restarting Supabase...${NC}"
npx supabase start > /dev/null 2>&1
echo -e "   ${GREEN}✓${NC} Supabase restarted"
echo ""

# Step 5: Verify data
echo -e "${BLUE}5️⃣  Verifying data persisted...${NC}"
sleep 2  # Give DB time to initialize

USER_COUNT_AFTER=$(podman exec supabase_db_NEWSITE psql -U postgres -d postgres -tAc "SELECT COUNT(*) FROM auth.users;")
CHAT_COUNT_AFTER=$(podman exec supabase_db_NEWSITE psql -U postgres -d postgres -tAc "SELECT COUNT(*) FROM chat_sessions;")

echo -e "   Users: ${GREEN}${USER_COUNT_AFTER}${NC}"
echo -e "   Chats: ${GREEN}${CHAT_COUNT_AFTER}${NC}"
echo ""

# Step 6: Compare
echo -e "${BLUE}6️⃣  Results:${NC}"
if [ "$USER_COUNT_BEFORE" -eq "$USER_COUNT_AFTER" ] && [ "$CHAT_COUNT_BEFORE" -eq "$CHAT_COUNT_AFTER" ]; then
    echo -e "   ${GREEN}✅ SUCCESS!${NC} All data persisted across restart"
    echo -e "   ${GREEN}✅${NC} Before: $USER_COUNT_BEFORE users, $CHAT_COUNT_BEFORE chats"
    echo -e "   ${GREEN}✅${NC} After:  $USER_COUNT_AFTER users, $CHAT_COUNT_AFTER chats"
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════${NC}"
    echo -e "${GREEN}  ✅ SAFE TO SHUTDOWN HARDWARE            ${NC}"
    echo -e "${GREEN}  Your data will reload on next startup   ${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════${NC}"
else
    echo -e "   ${RED}❌ FAILED!${NC} Data counts don't match"
    echo -e "   ${RED}❌${NC} Before: $USER_COUNT_BEFORE users, $CHAT_COUNT_BEFORE chats"
    echo -e "   ${RED}❌${NC} After:  $USER_COUNT_AFTER users, $CHAT_COUNT_AFTER chats"
    echo ""
    echo -e "${RED}⚠️  DO NOT SHUTDOWN - Data may be at risk${NC}"
    echo -e "   Restore from backup: supabase/backups/pre_shutdown_20251002_123647/"
    exit 1
fi
