#!/bin/bash
# Quick script to check handover data in Supabase

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}   Handover Data Checker (Supabase)    ${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"

# Check if Supabase is running
if ! curl -s http://127.0.0.1:54321/auth/v1/health > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠${NC}  Supabase is not running!"
    echo "   Start with: supabase start"
    exit 1
fi

echo -e "${GREEN}✓${NC} Supabase is running"
echo ""

# Check if table exists
echo -e "${BLUE}Checking if feedback_handover table exists...${NC}"
TABLE_EXISTS=$(psql "$DB_URL" -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'feedback_handover');" 2>/dev/null || echo "false")

if [ "$TABLE_EXISTS" != "t" ]; then
    echo -e "${YELLOW}⚠${NC}  Table feedback_handover does not exist!"
    echo "   Run migrations: supabase db reset --local"
    exit 1
fi

echo -e "${GREEN}✓${NC} Table exists"
echo ""

# Count total handovers
echo -e "${BLUE}Total handovers saved:${NC}"
psql "$DB_URL" -c "SELECT COUNT(*) as total_handovers FROM feedback_handover;"
echo ""

# Show recent handovers (last 5)
echo -e "${BLUE}Recent handovers (last 5):${NC}"
psql "$DB_URL" -c "
  SELECT
    LEFT(session_id, 20) || '...' as session_id,
    LEFT(conversation_id, 15) || '...' as conv_id,
    LEFT(query_text, 30) || '...' as query,
    jsonb_array_length(handover_data) as field_count,
    TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as created
  FROM feedback_handover
  ORDER BY created_at DESC
  LIMIT 5;
"
echo ""

# Show full data for most recent handover
echo -e "${BLUE}Most recent handover (full data):${NC}"
RECENT_EXISTS=$(psql "$DB_URL" -tAc "SELECT EXISTS (SELECT 1 FROM feedback_handover LIMIT 1);" 2>/dev/null || echo "false")

if [ "$RECENT_EXISTS" = "t" ]; then
    psql "$DB_URL" -c "
      SELECT
        session_id,
        conversation_id,
        user_id,
        yacht_id,
        query_text,
        jsonb_pretty(handover_data) as handover_data,
        ai_intent,
        ai_confidence,
        created_at
      FROM feedback_handover
      ORDER BY created_at DESC
      LIMIT 1;
    "
else
    echo -e "${YELLOW}No handovers saved yet.${NC}"
    echo ""
    echo -e "${BLUE}To test:${NC}"
    echo "1. Start the app: npm run dev"
    echo "2. Open http://localhost:8082"
    echo "3. Ask the AI a question"
    echo "4. Click 'Add to Handover' on a solution"
    echo "5. Edit and save a field"
    echo "6. Run this script again!"
fi

echo ""
echo -e "${GREEN}✅ Check complete!${NC}"
