#!/usr/bin/env python3
"""
V.6 Content OS — Simple HTTP Server
Run this if you want to use real API calls (required to avoid CORS when loading local JS modules).

Usage:
    python server.py
    Then open: http://localhost:8080

Requirements: Python 3.6+, no external dependencies.
"""
import http.server
import socketserver
import os
import webbrowser
import threading

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # CORS headers so browser can load all local modules
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

    def log_message(self, format, *args):
        print(f"[V6 Server] {self.address_string()} — {format % args}")


def open_browser():
    import time
    time.sleep(0.8)
    webbrowser.open(f'http://localhost:{PORT}/layer0-brain.html')


if __name__ == '__main__':
    print(f"╔══════════════════════════════════════╗")
    print(f"║  V.6 Content OS — Dev Server         ║")
    print(f"║  http://localhost:{PORT}/layer0-brain.html  ║")
    print(f"╚══════════════════════════════════════╝")
    print(f"   Serving from: {DIRECTORY}")
    print(f"   Press Ctrl+C to stop\n")

    # Open browser automatically
    threading.Thread(target=open_browser, daemon=True).start()

    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n[V6 Server] Stopped.")
