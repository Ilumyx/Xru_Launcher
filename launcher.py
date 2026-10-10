"""UI XRU: sảnh, Kit, Gate ảnh/video/Dash, Crawler và Label. Mọi màn chỉ gọi Backend qua HTTP.
python3 launcher.py          # sảnh :5050
python3 launcher.py stop     # chỉ tắt UI :5050, giữ Backend
Không import code của land. Chỉ dùng thư viện chuẩn Python.
"""

from __future__ import annotations

import os
import json
import signal
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse, unquote

HERE = Path(__file__).resolve().parent
PORT = 5050
IMAGE_BACKEND = "http://127.0.0.1:5059"
VIDEO_BACKEND = "http://127.0.0.1:5058"
CRAWLER_BACKEND = "http://127.0.0.1:5055"
LABEL_BACKEND = "http://127.0.0.1:5057"
LOGS = HERE / "logs"


def label_enabled() -> bool:
    try:
        return json.loads((HERE / 'ui_availability.json').read_text()).get('label') is True
    except (OSError, ValueError):
        return False

# Giữ link cũ dưới dạng chuyển hướng; không tạo vỏ hay nhúng màn.
DESTINATIONS = {
    '/crawler': '/crawler/dash.html',
    '/crawler/dash': '/crawler/dash.html',
    '/crawler/sources': '/crawler/sources.html',
    '/gate': '/gate/image/',
    '/gate/image': '/gate/image/index.html',
    '/gate/video': '/gate/video/index.html',
    '/gate/dash': '/gate/dash/index.html',
    '/mockups/gate_dash.html': '/gate/dash/',
    '/label': '/label/video/index.html',
    '/label/video': '/label/video/index.html',
}

class Handler(SimpleHTTPRequestHandler):
    """File tĩnh của sảnh + chuyển hướng link cũ. Không cache để luôn thấy bản mới."""

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
        path = unquote(urlparse(self.path).path)
        if (path.rstrip('/') == '/label' or path.startswith('/label/')) and not label_enabled():
            self.send_response(302)
            self.send_header('Location', '/')
            self.end_headers()
            return
        if path == '/ui-config':
            return self._send(200, json.dumps({'image_backend': IMAGE_BACKEND, 'video_backend': VIDEO_BACKEND, 'crawler_backend': CRAWLER_BACKEND, 'label_backend': LABEL_BACKEND}), 'application/json')
        destination = DESTINATIONS.get(path.rstrip('/'))
        if destination:
            self.send_response(302)
            query = urlparse(self.path).query
            self.send_header('Location', destination + ('?' + query if query else ''))
            self.end_headers()
            return
        return super().do_GET()

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


def stop_ui() -> None:
    pid_file = LOGS / 'launcher.pid'
    if pid_file.exists():
        try:
            os.kill(int(pid_file.read_text()), signal.SIGTERM)
        except ProcessLookupError:
            pass
        pid_file.unlink(missing_ok=True)


def main() -> None:
    global PORT, IMAGE_BACKEND, VIDEO_BACKEND, CRAWLER_BACKEND, LABEL_BACKEND
    if sys.argv[1:2] == ["stop"]:
        return stop_ui()
    if '--port' in sys.argv:
        PORT = int(sys.argv[sys.argv.index('--port') + 1])
    if '--image-backend' in sys.argv:
        IMAGE_BACKEND = sys.argv[sys.argv.index('--image-backend') + 1].rstrip('/')
    if '--video-backend' in sys.argv:
        VIDEO_BACKEND = sys.argv[sys.argv.index('--video-backend')+1].rstrip('/')
    if '--label-backend' in sys.argv:
        LABEL_BACKEND = sys.argv[sys.argv.index('--label-backend')+1].rstrip('/')
    if '--crawler-backend' in sys.argv:
        CRAWLER_BACKEND = sys.argv[sys.argv.index('--crawler-backend')+1].rstrip('/')
    host = "0.0.0.0" if "--lan" in sys.argv else "127.0.0.1"
    LOGS.mkdir(exist_ok=True)
    if PORT == 5050:
        (LOGS / "launcher.pid").write_text(str(os.getpid()))
    print(f"Xru_Launcher: http://127.0.0.1:{PORT}", flush=True)
    ThreadingHTTPServer((host, PORT), partial(Handler, directory=str(HERE))).serve_forever()


if __name__ == "__main__":
    main()
