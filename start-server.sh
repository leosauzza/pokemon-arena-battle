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
    echo "   Trying to find the process..."
    
    # Try to find and show the process
    if command -v lsof &> /dev/null; then
        echo "   Process using port $PORT:"
        lsof -Pi :$PORT -sTCP:LISTEN
    fi
    
    echo ""
    read -p "Do you want to kill the process and continue? (y/n): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Kill process on port
        if command -v lsof &> /dev/null; then
            kill -9 $(lsof -Pi :$PORT -sTCP:LISTEN -t) 2>/dev/null
        fi
        sleep 1
    else
        echo "Exiting..."
        exit 1
    fi
fi

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "📁 Serving directory: $SCRIPT_DIR"
echo "🌐 URL: http://$HOST:$PORT"
echo ""

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

# Try different server options
start_server() {
    
    # Option 1: Python 3
    if command -v python3 &> /dev/null; then
        echo "✅ Using Python 3 HTTP server"
        echo "   Press Ctrl+C to stop the server"
        echo ""
        open_browser "http://$HOST:$PORT" &
        python3 -m http.server $PORT --bind $HOST
        return 0
    fi
    
    # Option 2: Python 2
    if command -v python &> /dev/null; then
        echo "✅ Using Python HTTP server"
        echo "   Press Ctrl+C to stop the server"
        echo ""
        open_browser "http://$HOST:$PORT" &
        python -m SimpleHTTPServer $PORT
        return 0
    fi
    
    # Option 3: Node.js http-server
    if command -v npx &> /dev/null; then
        echo "📦 Installing/Using Node.js http-server..."
        echo "   Press Ctrl+C to stop the server"
        echo ""
        open_browser "http://$HOST:$PORT" &
        npx http-server -p $PORT -a $HOST -c-1
        return 0
    fi
    
    # Option 4: PHP built-in server
    if command -v php &> /dev/null; then
        echo "✅ Using PHP built-in server"
        echo "   Press Ctrl+C to stop the server"
        echo ""
        open_browser "http://$HOST:$PORT" &
        php -S $HOST:$PORT
        return 0
    fi
    
    # Option 5: Ruby
    if command -v ruby &> /dev/null; then
        echo "✅ Using Ruby WEBrick server"
        echo "   Press Ctrl+C to stop the server"
        echo ""
        open_browser "http://$HOST:$PORT" &
        ruby -run -e httpd . -p $PORT --bind-address=$HOST
        return 0
    fi
    
    # No server found
    return 1
}

# Try to start server
if ! start_server; then
    echo "❌ Error: No suitable web server found!"
    echo ""
    echo "Please install one of the following:"
    echo "  • Python 3 (recommended): https://www.python.org/"
    echo "  • Node.js: https://nodejs.org/"
    echo "  • PHP: https://www.php.net/"
    echo ""
    echo "Or manually start any HTTP server on port $PORT"
    exit 1
fi
