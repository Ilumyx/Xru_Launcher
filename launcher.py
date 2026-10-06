"""Xru_Launcher — sảnh chỉ đường tới các cổng của land.

Bật: python3 Xru_Launcher/launcher.py (thêm --lan để mở LAN).
Tắt: python3 Xru_Launcher/launcher.py stop.
"""

from __future__ import annotations

import os
import signal
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

HERE = Path(__file__).resolve().parent
PORT = 5050
LOGS = HERE / "logs"

def stop_launcher() -> None:
    """Tắt server sảnh theo PID của chính nó."""
    pid_file = LOGS / "launcher.pid"
    if pid_file.exists():
        try:
            os.kill(int(pid_file.read_text()), signal.SIGTERM)
        except (ProcessLookupError, ValueError):
            pass
        pid_file.unlink(missing_ok=True)


class Handler(SimpleHTTPRequestHandler):
    """Sảnh và nhà Tài khoản; không điều khiển process hoặc nhúng land."""

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()

    def log_message(self, *args) -> None:  # yên lặng
        pass

    def _send(self, code: int, body: str, ctype: str = "text/html; charset=utf-8") -> None:
        data = body.encode()
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def _sector_image(self, land: str, data: bytes) -> None:
        """Lưu (hoặc xoá, nếu rỗng) ảnh card sector do trang chủ gửi lên. Chỉ nhận JPEG."""
        path = sector_file(land)
        if path is None or (data and not data.startswith(b"\xff\xd8")):
            return self._send(400, "")
        SECTORS.mkdir(parents=True, exist_ok=True)
        if data:
            path.write_bytes(data)
        else:
            path.unlink(missing_ok=True)
        self.send_response(204)
        self.end_headers()

    def do_GET(self) -> None:
        # Link cũ trong land hoặc bookmark chỉ chuyển sang cổng của land.
        portal = {
            "/crawler/sources": "http://127.0.0.1:5055/",
            "/crawler/dash": "http://127.0.0.1:5055/dash.html",
            "/gate/image": "http://127.0.0.1:5059/",
            "/gate/video": "http://127.0.0.1:5058/",
            "/label/video": "http://127.0.0.1:5057/",
        }.get(urlparse(self.path).path)
        if portal:
            self.send_response(302)
            self.send_header("Location", portal)
            self.end_headers()
            return
        super().do_GET()

    def do_POST(self) -> None:
        url = urlparse(self.path)
        length = int(self.headers.get("Content-Length") or 0)
        if url.path == "/sector-image":
            return self._sector_image(parse_qs(url.query).get("land", [""])[0], self.rfile.read(length))
        return self._send(404, "")


SECTORS = HERE / "assets" / "sectors"


def sector_file(land: str) -> Path | None:
    """Ảnh card sector trên trang chủ: assets/sectors/<tên>.jpg. Tên lạ thì từ chối."""
    name = land.strip().lower()
    return SECTORS / f"{name}.jpg" if name and all(c.isalnum() or c in "-_ " for c in name) else None


def main() -> None:
    if sys.argv[1:2] == ["stop"]:
        return stop_launcher()
    host = "0.0.0.0" if "--lan" in sys.argv else "127.0.0.1"
    LOGS.mkdir(exist_ok=True)
    (LOGS / "launcher.pid").write_text(str(os.getpid()))
    print(f"Xru_Launcher: http://127.0.0.1:{PORT}", flush=True)
    try:
        ThreadingHTTPServer((host, PORT), partial(Handler, directory=str(HERE))).serve_forever()
    finally:
        (LOGS / "launcher.pid").unlink(missing_ok=True)


if __name__ == "__main__":
    main()
