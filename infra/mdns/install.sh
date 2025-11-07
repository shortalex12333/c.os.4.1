#!/bin/bash

# Universal mDNS Installation Script
# Automatically detects OS and installs appropriate mDNS service

set -e

echo "🚀 CelesteOS mDNS Installer"
echo "==========================="
echo ""

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Detect OS
OS="unknown"
if [[ "$(uname)" == "Darwin" ]]; then
    OS="macos"
    echo "✓ Detected macOS"
elif [[ "$(uname)" == "Linux" ]]; then
    OS="linux"
    echo "✓ Detected Linux"
else
    echo "❌ Unsupported operating system: $(uname)"
    exit 1
fi

# Run appropriate installer
if [[ "$OS" == "macos" ]]; then
    echo "→ Running macOS installer..."
    echo ""
    bash "${SCRIPT_DIR}/macos/install.sh"
elif [[ "$OS" == "linux" ]]; then
    echo "→ Running Linux installer..."
    echo ""
    if [[ $EUID -ne 0 ]]; then
        echo "❌ Linux installation requires sudo"
        echo "Please run: sudo ${SCRIPT_DIR}/linux/install.sh"
        exit 1
    fi
    bash "${SCRIPT_DIR}/linux/install.sh"
fi

echo ""
echo "🎉 Installation complete!"
echo ""
echo "📝 To verify mDNS is working:"
echo "   ${SCRIPT_DIR}/test/verify-mdns.sh"