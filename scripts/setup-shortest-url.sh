#!/bin/bash

# Setup script for shortest possible URL (http://celesteos)
# This script helps configure single-label hostname access

echo "🚀 Setting up shortest URL access for celesteos"
echo "================================================"
echo ""

# Get LAN IP
LAN_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')
echo "✓ Detected LAN IP: $LAN_IP"
echo ""

# Create hosts entry
HOSTS_ENTRY="$LAN_IP   celesteos"

echo "📝 To enable http://celesteos:8082, add this to /etc/hosts:"
echo ""
echo "   $HOSTS_ENTRY"
echo ""
echo "Run this command:"
echo "   echo '$HOSTS_ENTRY' | sudo tee -a /etc/hosts"
echo ""

# Check if already exists
if grep -q "celesteos" /etc/hosts 2>/dev/null; then
    echo "⚠️  Note: 'celesteos' already exists in /etc/hosts:"
    grep "celesteos" /etc/hosts
    echo ""
fi

echo "📋 After adding the hosts entry, you can access the site at:"
echo "   • http://celesteos:8082 (with port)"
echo "   • http://celesteos (port 80, requires reverse proxy)"
echo ""

echo "🔧 For port-free access (http://celesteos), choose one:"
echo ""
echo "Option 1 - Using nginx:"
echo "   sudo nginx -c $(pwd)/dev-proxy/nginx-single-label.conf"
echo ""
echo "Option 2 - Using Caddy:"
echo "   caddy run --config $(pwd)/dev-proxy/Caddyfile-single-label"
echo ""

echo "✅ Testing URLs (after hosts file update):"
echo "   curl -I http://celesteos:8082"
echo "   ping celesteos"
echo ""