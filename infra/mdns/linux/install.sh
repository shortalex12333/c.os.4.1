#!/bin/bash

# Linux mDNS Installation Script (Avahi)
# Sets up automatic mDNS advertisement for celesteos.local

set -e

echo "🚀 Installing mDNS service for celesteos.local on Linux"
echo "======================================================"
echo ""

# Check if running on Linux
if [[ "$(uname)" != "Linux" ]]; then
    echo "❌ This script is for Linux only"
    exit 1
fi

# Check for root/sudo
if [[ $EUID -ne 0 ]]; then
   echo "❌ This script must be run with sudo"
   exit 1
fi

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"

# Install avahi-daemon if not present
echo "📦 Checking for avahi-daemon..."
if ! command -v avahi-daemon &> /dev/null; then
    echo "Installing avahi-daemon..."
    if command -v apt-get &> /dev/null; then
        apt-get update && apt-get install -y avahi-daemon avahi-utils
    elif command -v yum &> /dev/null; then
        yum install -y avahi avahi-tools
    elif command -v dnf &> /dev/null; then
        dnf install -y avahi avahi-tools
    else
        echo "❌ Could not install avahi-daemon. Please install manually."
        exit 1
    fi
fi
echo "✓ avahi-daemon installed"

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip3 install zeroconf || {
    echo "⚠️  Failed to install zeroconf, will use avahi directly"
}

# Copy mDNS advertisement script
echo "📝 Installing mDNS scripts..."
mkdir -p /opt/celesteos/infra/mdns
cp "${PROJECT_ROOT}/infra/mdns/advertise-mdns.py" /opt/celesteos/infra/mdns/
chmod +x /opt/celesteos/infra/mdns/advertise-mdns.py

# Install Avahi service configuration
echo "📝 Installing Avahi service configuration..."
cp "${SCRIPT_DIR}/avahi-service.xml" /etc/avahi/services/celesteos.service

# Install systemd service
echo "📝 Installing systemd service..."
cp "${SCRIPT_DIR}/celesteos-mdns.service" /etc/systemd/system/
systemctl daemon-reload

# Enable and start services
echo "🚀 Starting services..."
systemctl enable avahi-daemon
systemctl start avahi-daemon
systemctl enable celesteos-mdns
systemctl start celesteos-mdns

# Verify services are running
sleep 2
if systemctl is-active --quiet celesteos-mdns; then
    echo "✅ mDNS service installed and running!"
    echo ""
    echo "📋 Service Status:"
    systemctl status celesteos-mdns --no-pager | head -10
else
    echo "⚠️  Service may not have started correctly"
    echo "Check logs with: journalctl -u celesteos-mdns -n 50"
fi

echo ""
echo "🎯 Next Steps:"
echo "1. Ensure Caddy/nginx is running with celesteos.local config"
echo "2. Test from another device: ping celesteos.local"
echo "3. Browse to: http://celesteos.local"
echo ""
echo "📝 To check service logs:"
echo "   journalctl -u celesteos-mdns -f"
echo ""
echo "🔧 To stop the service:"
echo "   systemctl stop celesteos-mdns"
echo ""
echo "✨ Installation complete!"