#!/bin/bash

# Classroom Seater Stop Script
# This script safely stops the Classroom Seater application and related services

set -e  # Exit on any error

echo "🛑 Stopping Classroom Seater Application..."
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

# Function to kill process by port
kill_process_on_port() {
    local port=$1
    local process_info=$(lsof -ti:$port)
    
    if [ ! -z "$process_info" ]; then
        print_status "Stopping process on port $port..."
        kill -TERM $process_info 2>/dev/null || true
        
        # Wait a moment for graceful shutdown
        sleep 2
        
        # Force kill if still running
        if lsof -ti:$port >/dev/null 2>&1; then
            print_warning "Process still running on port $port, force killing..."
            kill -KILL $(lsof -ti:$port) 2>/dev/null || true
        fi
        
        print_success "Process on port $port stopped"
    else
        print_status "No process found on port $port"
    fi
}

# Function to stop PostgreSQL service
stop_postgresql() {
    print_status "Checking PostgreSQL service status..."
    
    if brew services list | grep -q "postgresql@16.*started"; then
        print_status "Stopping PostgreSQL service..."
        brew services stop postgresql@16
        print_success "PostgreSQL service stopped"
    else
        print_status "PostgreSQL service is not running"
    fi
}

# Step 1: Find and stop the Node.js application
print_status "Looking for Classroom Seater application processes..."

# Check common ports for the application
PORTS_TO_CHECK=(3000 3001 3002 3003 3004 3005 5000 5001 5002 5003 5004 5005)

for port in "${PORTS_TO_CHECK[@]}"; do
    if lsof -ti:$port >/dev/null 2>&1; then
        # Check if it's our Node.js application
        process_info=$(lsof -ti:$port)
        if [ ! -z "$process_info" ]; then
            # Get the command name to verify it's our app
            cmd=$(ps -p $process_info -o comm= 2>/dev/null || echo "")
            if [[ "$cmd" == *"node"* ]] || [[ "$cmd" == *"tsx"* ]]; then
                print_status "Found Node.js application on port $port"
                kill_process_on_port $port
                break
            fi
        fi
    fi
done

# Step 2: Kill any remaining Node.js processes related to our app
print_status "Checking for any remaining Node.js processes..."

# Kill processes that might be related to our app
node_processes=$(ps aux | grep -E "(npm|node|tsx)" | grep -v grep | grep -E "(dev|start)" | awk '{print $2}' || true)

if [ ! -z "$node_processes" ]; then
    print_status "Found Node.js development processes, stopping them..."
    echo "$node_processes" | while read pid; do
        if [ ! -z "$pid" ]; then
            print_status "Stopping process $pid..."
            kill -TERM $pid 2>/dev/null || true
        fi
    done
    
    # Wait a moment for graceful shutdown
    sleep 2
    
    # Force kill any remaining processes
    remaining_processes=$(ps aux | grep -E "(npm|node|tsx)" | grep -v grep | grep -E "(dev|start)" | awk '{print $2}' || true)
    if [ ! -z "$remaining_processes" ]; then
        print_warning "Force killing remaining processes..."
        echo "$remaining_processes" | while read pid; do
            if [ ! -z "$pid" ]; then
                kill -KILL $pid 2>/dev/null || true
            fi
        done
    fi
else
    print_status "No Node.js development processes found"
fi

# Step 3: Stop PostgreSQL (optional - commented out by default)
# Uncomment the next line if you want to stop PostgreSQL when stopping the app
# stop_postgresql

# Step 4: Clean up any temporary files
print_status "Cleaning up temporary files..."
rm -f .env.local 2>/dev/null || true
rm -f .env.development.local 2>/dev/null || true

# Step 5: Final status check
print_status "Performing final status check..."

# Check if any processes are still running on our ports
still_running=false
for port in "${PORTS_TO_CHECK[@]}"; do
    if lsof -ti:$port >/dev/null 2>&1; then
        process_info=$(lsof -ti:$port)
        cmd=$(ps -p $process_info -o comm= 2>/dev/null || echo "")
        if [[ "$cmd" == *"node"* ]] || [[ "$cmd" == *"tsx"* ]]; then
            print_warning "Process still running on port $port: $cmd (PID: $process_info)"
            still_running=true
        fi
    fi
done

if [ "$still_running" = false ]; then
    print_success "All Classroom Seater processes stopped successfully"
else
    print_warning "Some processes may still be running. You can manually kill them if needed."
fi

echo ""
echo "✅ Classroom Seater application stopped"
echo ""
echo "To start the application again, run:"
echo "  ./start.sh"
echo ""
echo "Note: PostgreSQL service is still running. To stop it, run:"
echo "  brew services stop postgresql@16"
