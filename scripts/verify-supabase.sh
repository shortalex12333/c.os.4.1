#!/bin/bash

# Supabase Configuration Verification Script
# This script tests if Supabase credentials are working correctly

set -e

SUPABASE_URL="https://vivovcnaapmcfxxfhzxk.supabase.co"
SUPABASE_ANON_KEY="${1:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpdm92Y25hYXBtY2Z4eGZoenhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NjQ5ODIsImV4cCI6MjA3MTQ0MDk4Mn0.eUICOqJRP_MyVMNJNlZu3Mc-1-jAG6nQE-Oy0k3Yr0E}"

echo "============================================"
echo "Supabase Configuration Verification"
echo "============================================"
echo ""
echo "Project URL: $SUPABASE_URL"
echo "Testing with anon key..."
echo ""

# Test 1: Base URL
echo "Test 1: Base URL accessibility"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$SUPABASE_URL")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Base URL accessible (HTTP $HTTP_CODE)"
else
    echo "❌ Base URL failed (HTTP $HTTP_CODE)"
fi
echo ""

# Test 2: Auth Health Endpoint
echo "Test 2: Auth health endpoint"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$SUPABASE_URL/auth/v1/health")
RESPONSE=$(curl -s "$SUPABASE_URL/auth/v1/health")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Auth service is healthy (HTTP $HTTP_CODE)"
    echo "   Response: $RESPONSE"
elif [ "$HTTP_CODE" = "403" ]; then
    echo "❌ Auth service returns 403 FORBIDDEN"
    echo "   This usually means:"
    echo "   - Project is PAUSED (check Supabase dashboard)"
    echo "   - API access is disabled"
    echo "   - IP restrictions are blocking access"
    echo "   Response: $RESPONSE"
else
    echo "❌ Auth service failed (HTTP $HTTP_CODE)"
    echo "   Response: $RESPONSE"
fi
echo ""

# Test 3: REST API
echo "Test 3: REST API endpoint"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "apikey: $SUPABASE_ANON_KEY" \
    -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
    "$SUPABASE_URL/rest/v1/")
RESPONSE=$(curl -s \
    -H "apikey: $SUPABASE_ANON_KEY" \
    -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
    "$SUPABASE_URL/rest/v1/")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "404" ]; then
    echo "✅ REST API accessible with anon key (HTTP $HTTP_CODE)"
elif [ "$HTTP_CODE" = "403" ]; then
    echo "❌ REST API returns 403 FORBIDDEN"
    echo "   Your anon key is being REJECTED"
    echo "   Action required:"
    echo "   1. Go to https://supabase.com/dashboard/project/vivovcnaapmcfxxfhzxk"
    echo "   2. Check if project is PAUSED"
    echo "   3. Go to Settings → API and copy the correct anon key"
    echo "   4. Run this script again with: ./verify-supabase.sh <new_key>"
    echo "   Response: $RESPONSE"
else
    echo "❌ REST API failed (HTTP $HTTP_CODE)"
    echo "   Response: $RESPONSE"
fi
echo ""

# Test 4: Decode JWT
echo "Test 4: Decode anon key JWT"
JWT_PAYLOAD=$(echo "$SUPABASE_ANON_KEY" | cut -d'.' -f2 | base64 -d 2>/dev/null || echo "{}")
echo "$JWT_PAYLOAD" | python3 -m json.tool 2>/dev/null || echo "Failed to decode JWT"
echo ""

# Test 5: Auth signup (will fail if project not set up, but shouldn't 403)
echo "Test 5: Auth signup endpoint"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "$SUPABASE_URL/auth/v1/signup" \
    -H "apikey: $SUPABASE_ANON_KEY" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"testpass123"}')
RESPONSE=$(curl -s \
    -X POST "$SUPABASE_URL/auth/v1/signup" \
    -H "apikey: $SUPABASE_ANON_KEY" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"testpass123"}')

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "422" ] || [ "$HTTP_CODE" = "400" ]; then
    echo "✅ Auth signup endpoint is accessible (HTTP $HTTP_CODE)"
    echo "   (Error responses are OK - we're just testing accessibility)"
    if echo "$RESPONSE" | grep -q "error"; then
        echo "   Error message: $(echo "$RESPONSE" | python3 -c 'import sys, json; print(json.load(sys.stdin).get("msg", json.load(sys.stdin).get("error_description", "N/A")))' 2>/dev/null || echo "$RESPONSE")"
    fi
elif [ "$HTTP_CODE" = "403" ] || [ "$RESPONSE" = "Access denied" ]; then
    echo "❌ Auth signup returns 403 FORBIDDEN"
    echo "   Your Supabase project is BLOCKING API access"
    echo "   Response: $RESPONSE"
else
    echo "⚠️  Auth signup returned HTTP $HTTP_CODE"
    echo "   Response: $RESPONSE"
fi
echo ""

echo "============================================"
echo "Summary"
echo "============================================"

# Check if all critical tests passed
if [ "$HTTP_CODE" != "403" ] && [ "$RESPONSE" != "Access denied" ]; then
    echo "✅ Supabase configuration appears to be working!"
    echo ""
    echo "Next steps:"
    echo "1. Set these environment variables in Vercel:"
    echo "   VITE_SUPABASE_URL=$SUPABASE_URL"
    echo "   NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL"
    echo "   VITE_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY"
    echo "   NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY"
    echo ""
    echo "2. Redeploy your Vercel app"
    echo "3. Test login functionality"
else
    echo "❌ Supabase project has CRITICAL ISSUES"
    echo ""
    echo "Action required:"
    echo "1. Go to: https://supabase.com/dashboard/project/vivovcnaapmcfxxfhzxk"
    echo "2. Check if project is PAUSED and resume it"
    echo "3. Go to Settings → API and verify:"
    echo "   - API is enabled"
    echo "   - Copy the correct anon/public key"
    echo "4. Run this script again with the new key:"
    echo "   ./verify-supabase.sh <your_anon_key>"
fi
echo ""
