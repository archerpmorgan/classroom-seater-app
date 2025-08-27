#!/bin/bash

# Classroom Seater Startup Script
# This script sets up and starts the Classroom Seater application

set -e  # Exit on any error

echo "🚀 Starting Classroom Seater Application..."
echo "=========================================="

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

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the ClassroomSeater project root directory"
    exit 1
fi

# Step 1: Check if Node.js is installed
print_status "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Installing via Homebrew..."
    if ! command -v brew &> /dev/null; then
        print_error "Homebrew is not installed. Please install Homebrew first: https://brew.sh/"
        exit 1
    fi
    brew install node
    print_success "Node.js installed successfully"
else
    print_success "Node.js is already installed ($(node --version))"
fi

# Step 2: Check if PostgreSQL is installed and running
print_status "Checking PostgreSQL installation..."

# Function to get PostgreSQL PATH
get_postgresql_path() {
    local pg_path="/usr/local/opt/postgresql@16/bin"
    if [ -d "$pg_path" ]; then
        echo "$pg_path"
    else
        # Try alternative paths
        local alt_paths=(
            "/opt/homebrew/opt/postgresql@16/bin"
            "/usr/local/bin"
            "/opt/homebrew/bin"
        )
        for path in "${alt_paths[@]}"; do
            if [ -d "$path" ] && [ -f "$path/psql" ]; then
                echo "$path"
                return 0
            fi
        done
        echo ""
    fi
}

# Check if psql is available in PATH
if ! command -v psql &> /dev/null; then
    # Try to find PostgreSQL installation
    pg_path=$(get_postgresql_path)
    
    if [ -z "$pg_path" ]; then
        print_error "PostgreSQL is not installed. Installing via Homebrew..."
        brew install postgresql@16
        pg_path=$(get_postgresql_path)
    fi
    
    if [ -n "$pg_path" ]; then
        # Add PostgreSQL to current PATH
        export PATH="$pg_path:$PATH"
        
        # Add to shell config if not already there
        if ! grep -q "postgresql@16/bin" ~/.zshrc; then
            echo "export PATH=\"$pg_path:\$PATH\"" >> ~/.zshrc
        fi
        
        print_success "PostgreSQL found at $pg_path and added to PATH"
    else
        print_error "Failed to find PostgreSQL installation"
        exit 1
    fi
else
    print_success "PostgreSQL is already installed and available"
fi

# Step 3: Start PostgreSQL service
print_status "Starting PostgreSQL service..."
if brew services list | grep -q "postgresql@16.*started"; then
    print_success "PostgreSQL is already running"
else
    brew services start postgresql@16
    print_success "PostgreSQL started successfully"
fi

# Step 4: Create database if it doesn't exist
print_status "Setting up database..."

# Get the full path to PostgreSQL commands
pg_path=$(get_postgresql_path)
if [ -n "$pg_path" ]; then
    PSQL_CMD="$pg_path/psql"
    CREATEDB_CMD="$pg_path/createdb"
else
    PSQL_CMD="psql"
    CREATEDB_CMD="createdb"
fi

# Check if database exists
if ! $PSQL_CMD -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw classroom_seater; then
    print_status "Creating database 'classroom_seater'..."
    if $CREATEDB_CMD classroom_seater 2>/dev/null; then
        print_success "Database 'classroom_seater' created"
    else
        print_error "Failed to create database. Please check PostgreSQL installation."
        exit 1
    fi
else
    print_success "Database 'classroom_seater' already exists"
fi

# Step 5: Install dependencies if node_modules doesn't exist
print_status "Checking dependencies..."
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm install
    print_success "Dependencies installed successfully"
else
    print_success "Dependencies already installed"
fi

# Step 6: Set up database schema
print_status "Setting up database schema..."
export DATABASE_URL="postgresql://localhost:5432/classroom_seater"
npm run db:push
print_success "Database schema updated"

# Step 7: Find available port
print_status "Finding available port..."
PORT=3000
while lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; do
    print_warning "Port $PORT is in use, trying next port..."
    PORT=$((PORT + 1))
done
print_success "Using port $PORT"

# Step 8: Start the application
print_status "Starting the application..."
echo ""
echo "🌐 Application will be available at: http://localhost:$PORT"
echo "📊 API endpoints available at: http://localhost:$PORT/api/*"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Set environment variables and start the server
export DATABASE_URL="postgresql://localhost:5432/classroom_seater"
export PORT=$PORT

print_success "Starting server in background..."
nohup npm run dev > server.log 2>&1 &
SERVER_PID=$!

# Wait a moment for the server to start
sleep 3

# Check if server started successfully
if curl -s http://localhost:$PORT/api/students >/dev/null 2>&1; then
    print_success "Server started successfully!"
    echo ""
    echo "🌐 Application is running at: http://localhost:$PORT"
    echo "📊 API endpoints available at: http://localhost:$PORT/api/*"
    echo "📝 Server logs: tail -f server.log"
    echo ""
    echo "To stop the server, run: ./stop.sh"
    echo ""
else
    print_warning "Server may still be starting up..."
    echo "Check server.log for details: tail -f server.log"
fi
