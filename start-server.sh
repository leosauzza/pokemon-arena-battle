#!/bin/bash

# ==========================================
# Pokemon Arena Battle - Web Server Launcher
# ==========================================

PORT=8123
HOST="localhost"

echo "🎮 Pokemon Arena Battle - Web Server"
echo "====================================="
echo ""

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    elif netstat -tuln 2>/dev/null | grep -q ":$PORT "; then
        return 0
    elif ss -tuln 2>/dev/null | grep -q ":$PORT "; then
        return 0
    fi
    return 1
}

# Check if port is already in use
if check_port; then
    echo "⚠️  Port $PORT is already in use!"
    echo "   The server might already be running."
    echo ""
    read -p "Do you want to stop it and start fresh? (y/n): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Kill process on port
        if command -v lsof &> /dev/null; then
            kill -9 $(lsof -Pi :$PORT -sTCP:LISTEN -t) 2>/dev/null
        fi
        # Also try to stop docker container if running
        docker compose down 2>/dev/null || docker-compose down 2>/dev/null
        sleep 1
    else
        echo "Exiting..."
        exit 1
    fi
fi

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Function to open browser
open_browser() {
    local url=$1
    sleep 2
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        open "$url"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if command -v xdg-open &> /dev/null; then
            xdg-open "$url"
        elif command -v gnome-open &> /dev/null; then
            gnome-open "$url"
        fi
    elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
        # Windows
        start "$url"
    fi
}

# Option 1: Docker (preferred)
if command -v docker &> /dev/null; then
    echo "🐳 Using Docker (recommended)"
    echo "   Building and starting container..."
    echo ""
    
    # Use 'docker compose' (v2) if available, fall back to 'docker-compose' (v1)
    if docker compose up --build -d 2>/dev/null; then
        echo ""
        echo "✅ Server running at http://$HOST:$PORT"
        echo "   Container: pokemon-arena-battle"
        echo ""
        echo "   Commands:"
        echo "     Stop:  docker compose down"
        echo "     Logs:  docker compose logs -f"
        echo ""
        open_browser "http://$HOST:$PORT"
        exit 0
    elif docker-compose up --build -d 2>/dev/null; then
        echo ""
        echo "✅ Server running at http://$HOST:$PORT"
        echo "   Container: pokemon-arena-battle"
        echo ""
        echo "   Commands:"
        echo "     Stop:  docker-compose down"
        echo "     Logs:  docker-compose logs -f"
        echo ""
        open_browser "http://$HOST:$PORT"
        exit 0
    else
        echo "❌ Docker failed, falling back to Python..."
        echo ""
    fi
fi

# Option 2: Python server.py (fallback)
if command -v python3 &> /dev/null; then
    echo "🐍 Using Python 3 (Docker not available)"
    echo "   Run 'docker-compose up -d' for containerized version"
    echo ""
    echo "📁 Serving directory: $SCRIPT_DIR"
    echo "🌐 URL: http://$HOST:$PORT"
    echo "   Press Ctrl+C to stop the server"
    echo ""
    
    open_browser "http://$HOST:$PORT" &
    python3 server.py
    exit 0
fi

# No server found
echo "❌ Error: Neither Docker nor Python 3 is available!"
echo ""
echo "Please install one of the following:"
echo "  • Docker (recommended): https://docs.docker.com/get-docker/"
echo "  • Python 3: https://www.python.org/"
echo ""
exit 1
