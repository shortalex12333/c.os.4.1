#!/bin/bash

# macOS mDNS Installation Script
# Sets up automatic mDNS advertisement for celesteos.local

set -e

echo "🚀 Installing mDNS service for celesteos.local on macOS"
echo "======================================================"
echo ""

# Check if running on macOS
if [[ "$(uname)" != "Darwin" ]]; then
    echo "❌ This script is for macOS only"
    exit 1
fi

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"

# Check for Python 3
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed"
    echo "Install with: brew install python3"
    exit 1
fi

# Install zeroconf if not present
echo "📦 Checking Python dependencies..."
if ! python3 -c "import zeroconf" 2>/dev/null; then
    echo "Installing zeroconf library..."
    pip3 install --user zeroconf || {
        echo "⚠️  Failed to install zeroconf, will use native dns-sd instead"
    }
else
    echo "✓ zeroconf library already installed"
fi

# Update plist file with correct paths
PLIST_FILE="${SCRIPT_DIR}/com.celesteos.mdns.plist"
PLIST_DEST="$HOME/Library/LaunchAgents/com.celesteos.mdns.plist"

# Create LaunchAgents directory if it doesn't exist
mkdir -p "$HOME/Library/LaunchAgents"

# Copy and update the plist file
echo "📝 Installing LaunchAgent..."
cp "$PLIST_FILE" "$PLIST_DEST"

# Replace placeholder paths with actual paths
sed -i '' "s|/Users/celeste7/Documents/NEWSITE|${PROJECT_ROOT}|g" "$PLIST_DEST"
sed -i '' "s|<string>celeste7</string>|<string>$(whoami)</string>|g" "$PLIST_DEST"

# Unload existing service if it exists
if launchctl list | grep -q "com.celesteos.mdns"; then
    echo "🔄 Stopping existing service..."
    launchctl unload "$PLIST_DEST" 2>/dev/null || true
fi

# Load the new service
echo "🚀 Starting mDNS service..."
launchctl load "$PLIST_DEST"

# Verify service is running
sleep 2
if launchctl list | grep -q "com.celesteos.mdns"; then
    echo "✅ mDNS service installed and running!"
    echo ""
    echo "📋 Service Status:"
    launchctl list | grep "com.celesteos.mdns"
else
    echo "⚠️  Service may not have started correctly"
    echo "Check logs at: /tmp/celesteos-mdns.error.log"
fi

echo ""
echo "🎯 Next Steps:"
echo "1. Ensure Caddy is running with celesteos.local config"
echo "2. Test from another device: ping celesteos.local"
echo "3. Browse to: http://celesteos.local"
echo ""
echo "📝 To check service logs:"
echo "   tail -f /tmp/celesteos-mdns.log"
echo ""
echo "🔧 To stop the service:"
echo "   launchctl unload ~/Library/LaunchAgents/com.celesteos.mdns.plist"
echo ""
echo "✨ Installation complete!"