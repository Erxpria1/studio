#!/bin/bash

# MathCyber Tailscale Setup Script
# This script helps set up Tailscale for MathCyber application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== MathCyber Tailscale Setup ===${NC}"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    echo "Please install Docker first: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}Error: Docker Compose is not installed${NC}"
    echo "Please install Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

echo -e "${GREEN}✓${NC} Docker is installed"
echo -e "${GREEN}✓${NC} Docker Compose is installed"
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating .env file from .env.example...${NC}"

    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${GREEN}✓${NC} .env file created"
    else
        echo -e "${RED}Error: .env.example not found${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓${NC} .env file exists"
fi

echo ""

# Check if TAILSCALE_AUTH_KEY is set
if ! grep -q "TAILSCALE_AUTH_KEY=tskey-auth-" .env; then
    echo -e "${YELLOW}Warning: TAILSCALE_AUTH_KEY not set in .env file${NC}"
    echo ""
    echo "To get your Tailscale auth key:"
    echo "1. Go to https://login.tailscale.com/admin/settings/keys"
    echo "2. Click 'Generate auth key'"
    echo "3. Copy the key and paste it in .env file"
    echo ""
    read -p "Do you have your Tailscale auth key? (y/n): " -n 1 -r
    echo

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter your Tailscale auth key: " auth_key

        # Update .env file
        sed -i "s/TAILSCALE_AUTH_KEY=.*/TAILSCALE_AUTH_KEY=$auth_key/" .env
        echo -e "${GREEN}✓${NC} Auth key updated in .env file"
    else
        echo -e "${YELLOW}Please update TAILSCALE_AUTH_KEY in .env file and run this script again${NC}"
        exit 0
    fi
fi

echo ""
echo -e "${GREEN}=== Building and starting containers ===${NC}"
echo ""

# Build and start containers
docker-compose up -d --build

echo ""
echo -e "${GREEN}✓${NC} Containers started successfully"
echo ""

# Wait for Tailscale to initialize
echo "Waiting for Tailscale to initialize..."
sleep 5

# Check Tailscale status
echo ""
echo -e "${GREEN}=== Tailscale Status ===${NC}"
docker exec mathcyber-tailscale tailscale status || echo -e "${YELLOW}Tailscale is still initializing...${NC}"

echo ""
echo -e "${GREEN}=== Setup Complete! ===${NC}"
echo ""
echo "Your MathCyber application is now running with Tailscale!"
echo ""
echo "To access your application:"
echo "  - Get Tailscale IP: docker exec mathcyber-tailscale tailscale ip"
echo "  - Access via: http://<tailscale-ip>:9002"
echo "  - Local access: http://localhost:9002"
echo ""
echo "Useful commands:"
echo "  - View logs: docker-compose logs -f"
echo "  - Stop containers: docker-compose down"
echo "  - Check status: docker-compose ps"
echo ""
