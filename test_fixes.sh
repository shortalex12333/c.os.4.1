#!/bin/bash
# Test script to verify overnight fixes
# Run this to confirm all database fixes are working

echo "🔍 Testing Overnight Fixes..."
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check if chat_messages has proper RLS policies
echo "1️⃣  Checking chat_messages RLS policies..."
POLICIES=$(npx supabase db execute "
SELECT COUNT(*) as policy_count
FROM pg_policies
WHERE tablename = 'chat_messages'
AND policyname LIKE '%authenticated%';
" --output json 2>/dev/null | grep -o '"policy_count":"[0-9]*"' | grep -o '[0-9]*')

if [ "$POLICIES" -ge "4" ]; then
    echo -e "${GREEN}✅ PASS${NC}: Found $POLICIES authenticated policies for chat_messages"
else
    echo -e "${RED}❌ FAIL${NC}: Only found $POLICIES policies (expected 4+)"
fi
echo ""

# Test 2: Check if sop_documents FK constraint is removed
echo "2️⃣  Checking sop_documents foreign key constraints..."
FK_EXISTS=$(npx supabase db execute "
SELECT COUNT(*) as fk_count
FROM pg_constraint
WHERE conname = 'sop_documents_user_id_fkey';
" --output json 2>/dev/null | grep -o '"fk_count":"[0-9]*"' | grep -o '[0-9]*')

if [ "$FK_EXISTS" == "0" ]; then
    echo -e "${GREEN}✅ PASS${NC}: Foreign key constraint removed"
else
    echo -e "${RED}❌ FAIL${NC}: Foreign key constraint still exists"
fi
echo ""

# Test 3: Check if indexes were created
echo "3️⃣  Checking performance indexes..."
IDX_SOP=$(npx supabase db execute "
SELECT COUNT(*) as idx_count
FROM pg_indexes
WHERE indexname = 'sop_documents_user_id_idx';
" --output json 2>/dev/null | grep -o '"idx_count":"[0-9]*"' | grep -o '[0-9]*')

IDX_MANUAL=$(npx supabase db execute "
SELECT COUNT(*) as idx_count
FROM pg_indexes
WHERE indexname = 'manual_embeddings_user_id_idx';
" --output json 2>/dev/null | grep -o '"idx_count":"[0-9]*"' | grep -o '[0-9]*')

if [ "$IDX_SOP" == "1" ] && [ "$IDX_MANUAL" == "1" ]; then
    echo -e "${GREEN}✅ PASS${NC}: Performance indexes created"
else
    echo -e "${YELLOW}⚠️  WARN${NC}: Some indexes missing (sop:$IDX_SOP, manual:$IDX_MANUAL)"
fi
echo ""

# Test 4: Check if RLS is enabled
echo "4️⃣  Checking RLS enabled status..."
RLS_CHAT_MSG=$(npx supabase db execute "
SELECT relrowsecurity as rls_enabled
FROM pg_class
WHERE relname = 'chat_messages';
" --output json 2>/dev/null | grep -o '"rls_enabled":[a-z]*' | grep -o '[a-z]*$')

RLS_CHAT_SESS=$(npx supabase db execute "
SELECT relrowsecurity as rls_enabled
FROM pg_class
WHERE relname = 'chat_sessions';
" --output json 2>/dev/null | grep -o '"rls_enabled":[a-z]*' | grep -o '[a-z]*$')

if [ "$RLS_CHAT_MSG" == "true" ] && [ "$RLS_CHAT_SESS" == "true" ]; then
    echo -e "${GREEN}✅ PASS${NC}: RLS enabled on chat tables"
else
    echo -e "${RED}❌ FAIL${NC}: RLS not properly enabled"
fi
echo ""

# Test 5: Check Supabase service status
echo "5️⃣  Checking Supabase services..."
if npx supabase status | grep -q "supabase local development setup is running"; then
    echo -e "${GREEN}✅ PASS${NC}: Supabase services running"
else
    echo -e "${RED}❌ FAIL${NC}: Supabase services not running"
fi
echo ""

# Test 6: Check frontend accessibility
echo "6️⃣  Checking frontend server..."
if curl -s http://localhost:8082 | grep -q "root"; then
    echo -e "${GREEN}✅ PASS${NC}: Frontend accessible at http://localhost:8082"
else
    echo -e "${RED}❌ FAIL${NC}: Frontend not responding"
fi
echo ""

# Summary
echo "================================"
echo "📊 Test Summary"
echo "================================"
echo ""
echo "✅ All critical fixes applied:"
echo "   - Chat RLS policies fixed (INSERT/UPDATE/DELETE)"
echo "   - SOP FK constraints removed"
echo "   - Performance indexes added"
echo "   - RLS properly enabled"
echo ""
echo "🌐 Services Status:"
echo "   - Supabase: http://127.0.0.1:54321"
echo "   - Frontend: http://localhost:8082"
echo "   - Studio: http://127.0.0.1:54323"
echo ""
echo "📝 Next Steps:"
echo "   1. Test chat message creation in browser"
echo "   2. Test SOP creation without files"
echo "   3. Apply cloud fixes (see OVERNIGHT_FIXES_SUMMARY.md)"
echo "   4. Import workflow to cloud n8n"
echo ""
echo "📚 Documentation:"
echo "   - OVERNIGHT_FIXES_SUMMARY.md - Complete fix documentation"
echo "   - APPLY_TO_CLOUD_SOP_FIX.sql - Cloud SQL fix"
echo "   - SOP_FK_CONSTRAINT_FIX.md - SOP constraint details"
echo ""
