#!/bin/bash

# CelesteOS Quick Start Script
# Simple bash script for quick launching

echo "🚀 CelesteOS Quick Start"
echo "========================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 is required but not installed${NC}"
    exit 1
fi

# Function to check port
check_port() {
    lsof -i :$1 > /dev/null 2>&1
    return $?
}

# Function to print status
print_status() {
    if [ $2 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $1"
    else
        echo -e "${RED}✗${NC} $1"
    fi
}

# Pre-flight checks
echo -e "\n${YELLOW}Pre-flight checks...${NC}"

# Check critical ports
echo "Checking ports..."
if check_port 8082; then
    echo -e "${YELLOW}⚠ Port 8082 is in use (Vite)${NC}"
fi

if check_port 54321; then
    echo -e "${YELLOW}⚠ Port 54321 is in use (Supabase)${NC}"
fi

# Check if Podman is installed
if command -v podman &> /dev/null; then
    echo -e "${GREEN}✓${NC} Podman is installed"
else
    echo -e "${RED}✗${NC} Podman is not installed"
    echo "Install with: brew install podman"
    exit 1
fi

# Check if Supabase CLI is installed
if command -v supabase &> /dev/null; then
    echo -e "${GREEN}✓${NC} Supabase CLI is installed"
else
    echo -e "${RED}✗${NC} Supabase CLI is not installed"
    echo "Install with: brew install supabase"
    exit 1
fi

# Main menu
echo -e "\n${YELLOW}What would you like to do?${NC}"
echo "1) Start all services"
echo "2) Stop all services"
echo "3) Check service status"
echo "4) Restart all services"
echo "5) Start without Supabase (quick mode)"
echo "6) Exit"

read -p "Enter choice [1-6]: " choice

case $choice in
    1)
        echo -e "\n${GREEN}Starting all services...${NC}"
        python3 launch_celesteos.py start
        ;;
    2)
        echo -e "\n${YELLOW}Stopping all services...${NC}"
        python3 launch_celesteos.py stop
        ;;
    3)
        echo -e "\n${YELLOW}Checking service status...${NC}"
        python3 launch_celesteos.py status
        ;;
    4)
        echo -e "\n${YELLOW}Restarting all services...${NC}"
        python3 launch_celesteos.py restart
        ;;
    5)
        echo -e "\n${GREEN}Quick start (without Supabase)...${NC}"

        # Start Vite
        echo "Starting Vite dev server..."
        npm run dev &
        VITE_PID=$!
        sleep 5

        # Start Caddy
        echo "Starting Caddy HTTP proxy..."
        caddy run --config dev-proxy/Caddyfile-single-label &
        CADDY_PID=$!
        sleep 3

        # Start mDNS
        echo "Starting mDNS discovery..."
        python3 infra/mdns/advertise-mdns.py 80 &
        MDNS_PID=$!

        echo -e "\n${GREEN}Services started!${NC}"
        echo "Access at:"
        echo "  • http://localhost:8082"
        echo "  • http://celesteos.local:8082 (Apple devices)"
        echo "  • http://192.168.1.44:8082 (All devices)"

        echo -e "\n${YELLOW}Press Ctrl+C to stop all services${NC}"

        # Wait and cleanup on exit
        trap "kill $VITE_PID $CADDY_PID $MDNS_PID 2>/dev/null; exit" SIGINT SIGTERM
        wait
        ;;
    6)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo -e "${RED}Invalid option${NC}"
        exit 1
        ;;
esac