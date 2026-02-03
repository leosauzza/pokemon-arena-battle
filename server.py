#!/usr/bin/env python3
"""
Simple HTTP server for Pokemon Arena Battle
Usage: python3 server.py [port]
Default port: 8123
"""

import http.server
import socketserver
import webbrowser
import sys
import os

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8123
HOST = "localhost"

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers for ES modules
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
        self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
        super().end_headers()
    
    def log_message(self, format, *args):
        # Custom log format
        print(f"[{self.log_date_time_string()}] {args[0]}")

os.chdir(os.path.dirname(os.path.abspath(__file__)))

print(f"🎮 Pokemon Arena Battle - Web Server")
print(f"=====================================")
print(f"📁 Serving: {os.getcwd()}")
print(f"🌐 URL: http://{HOST}:{PORT}")
print(f"⏹️  Press Ctrl+C to stop")
print()

with socketserver.TCPServer((HOST, PORT), Handler) as httpd:
    print(f"✅ Server running at http://{HOST}:{PORT}/")
    
    # Try to open browser
    try:
        webbrowser.open(f"http://{HOST}:{PORT}/")
        print("🌐 Browser opened automatically")
    except:
        pass
    
    print()
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\n👋 Server stopped")
        httpd.shutdown()
