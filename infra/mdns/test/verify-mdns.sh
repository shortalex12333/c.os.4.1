#!/bin/bash

# mDNS Verification Script
# Tests that celesteos.local is properly advertised and accessible

echo "🔍 mDNS Service Verification"
echo "============================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test functions
test_dns_sd() {
    echo "1. Testing dns-sd discovery (macOS)..."
    if command -v dns-sd &> /dev/null; then
        timeout 5 dns-sd -B _http._tcp local. 2>/dev/null | grep -i celesteos && {
            echo -e "${GREEN}✓ Service found via dns-sd${NC}"
            return 0
        } || {
            echo -e "${YELLOW}⚠ Service not found via dns-sd${NC}"
            return 1
        }
    else
        echo "  dns-sd not available (not on macOS)"
        return 2
    fi
}

test_avahi() {
    echo "2. Testing avahi discovery (Linux)..."
    if command -v avahi-browse &> /dev/null; then
        timeout 5 avahi-browse -a -t 2>/dev/null | grep -i celesteos && {
            echo -e "${GREEN}✓ Service found via avahi${NC}"
            return 0
        } || {
            echo -e "${YELLOW}⚠ Service not found via avahi${NC}"
            return 1
        }
    else
        echo "  avahi-browse not available (not on Linux/avahi not installed)"
        return 2
    fi
}

test_ping() {
    echo "3. Testing hostname resolution..."
    ping -c 1 -W 2 celesteos.local &>/dev/null && {
        IP=$(ping -c 1 celesteos.local 2>/dev/null | grep -oE '([0-9]{1,3}\.){3}[0-9]{1,3}' | head -1)
        echo -e "${GREEN}✓ celesteos.local resolves to $IP${NC}"
        return 0
    } || {
        echo -e "${RED}✗ celesteos.local does not resolve${NC}"
        return 1
    }
}

test_http() {
    echo "4. Testing HTTP access..."
    if curl -s -I --connect-timeout 3 http://celesteos.local 2>/dev/null | grep -q "200 OK"; then
        echo -e "${GREEN}✓ HTTP server responds at celesteos.local${NC}"
        return 0
    else
        echo -e "${RED}✗ HTTP server not accessible at celesteos.local${NC}"
        return 1
    fi
}

test_port_80() {
    echo "5. Testing port 80 accessibility..."
    if nc -z celesteos.local 80 2>/dev/null; then
        echo -e "${GREEN}✓ Port 80 is open on celesteos.local${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠ Port 80 not accessible (Caddy may not be running)${NC}"
        return 1
    fi
}

# Run tests
echo "Running mDNS tests..."
echo ""

TESTS_PASSED=0
TESTS_FAILED=0
TESTS_SKIPPED=0

test_dns_sd
case $? in
    0) ((TESTS_PASSED++));;
    1) ((TESTS_FAILED++));;
    2) ((TESTS_SKIPPED++));;
esac

test_avahi
case $? in
    0) ((TESTS_PASSED++));;
    1) ((TESTS_FAILED++));;
    2) ((TESTS_SKIPPED++));;
esac

test_ping && ((TESTS_PASSED++)) || ((TESTS_FAILED++))
test_http && ((TESTS_PASSED++)) || ((TESTS_FAILED++))
test_port_80 && ((TESTS_PASSED++)) || ((TESTS_FAILED++))

# Summary
echo ""
echo "============================="
echo "Test Summary:"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo -e "${YELLOW}Skipped: $TESTS_SKIPPED${NC}"
echo ""

if [[ $TESTS_FAILED -gt 0 ]]; then
    echo "🔧 Troubleshooting:"
    echo ""
    if ! ping -c 1 -W 2 celesteos.local &>/dev/null; then
        echo "• mDNS service may not be running"
        echo "  macOS: launchctl list | grep celesteos"
        echo "  Linux: systemctl status celesteos-mdns"
    fi

    if ! nc -z celesteos.local 80 2>/dev/null; then
        echo "• Caddy/nginx may not be running on port 80"
        echo "  Check: lsof -i :80"
    fi

    echo ""
    echo "• Check mDNS logs:"
    echo "  macOS: tail /tmp/celesteos-mdns.log"
    echo "  Linux: journalctl -u celesteos-mdns"
else
    echo "✅ All tests passed! celesteos.local is fully operational."
fi