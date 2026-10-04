#!/usr/bin/env python3
"""Run: python serve.py        -> mở cho cả mạng LAN (máy khác / điện thoại test được)
        python serve.py --local -> chỉ máy này

Vẽ ghi chú: dùng extension Chrome XRU Anno (Eurasia_Goverment/Tools/xru-anno-extension).
"""
import socket
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

PORT = 5051


class NoCacheHandler(SimpleHTTPRequestHandler):
    """Always serve the latest files: browser must not reuse stale CSS/JS/HTML."""

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        super().end_headers()


def lan_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('192.168.1.1', 80))  # no packet is sent; just picks the LAN interface
        return s.getsockname()[0]
    except OSError:
        return '127.0.0.1'
    finally:
        s.close()


if __name__ == '__main__':
    local_only = '--local' in sys.argv
    host = '127.0.0.1' if local_only else '0.0.0.0'
    root = Path(__file__).resolve().parent
    print(f'UI Mockup (máy này): http://localhost:{PORT}/launcher_mockup.html', flush=True)
    if not local_only:
        print(f'UI Mockup (mạng LAN): http://{lan_ip()}:{PORT}/launcher_mockup.html', flush=True)
    ThreadingHTTPServer((host, PORT), partial(NoCacheHandler, directory=str(root))).serve_forever()
