#!/bin/bash

# Classroom Seater Restart Script
# This script stops and then starts the Classroom Seater application

set -e  # Exit on any error

echo "🔄 Restarting Classroom Seater Application..."
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the ClassroomSeater project root directory"
    exit 1
fi

# Check if stop.sh and start.sh exist
if [ ! -f "stop.sh" ]; then
    print_error "stop.sh script not found"
    exit 1
fi

if [ ! -f "start.sh" ]; then
    print_error "start.sh script not found"
    exit 1
fi

# Step 1: Stop the application
print_status "Stopping the application..."
./stop.sh

# Wait a moment to ensure everything is stopped
sleep 2

echo ""
print_status "Application stopped. Starting up again..."
echo ""

# Step 2: Start the application
./start.sh

print_success "Restart complete!"
