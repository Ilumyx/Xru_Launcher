"""UI XRU: sảnh, Kit, Gate ảnh/video/Dash, Crawler và Label. Mọi màn chỉ gọi Backend qua HTTP.
python3 launcher.py          # sảnh :5050 (luôn nghe 127.0.0.1; PC vào qua hầm SSH, xem README)
python3 launcher.py stop     # tắt UI :5050 (Backend tắt bằng xru stop)
Ảnh card sector: assets/sectors/<tên>.jpg là bản mặc định theo git; ảnh PO tải lên cất ở
${XDG_DATA_HOME:-~/.local/share}/xru/launcher/sectors/ và được phục vụ trước, nên đổi ảnh không làm bẩn repo.
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
from urllib.parse import parse_qs, unquote, urlparse

HERE = Path(__file__).resolve().parent
PORT = 5050
IMAGE_BACKEND = "http://127.0.0.1:5059"
VIDEO_BACKEND = "http://127.0.0.1:5058"
CRAWLER_BACKEND = "http://127.0.0.1:5055"
LABEL_BACKEND = "http://127.0.0.1:5057"
LOGS = HERE / "logs"

class Handler(SimpleHTTPRequestHandler):
    """File tĩnh của sảnh. no-cache: trình duyệt giữ file nhưng mỗi lần hỏi lại; file không đổi thì stdlib trả 304
    (Last-Modified / If-Modified-Since) nên đổi màn không tải lại ~18 file, sửa file là thấy bản mới ngay."""

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store" if urlparse(self.path).path == "/ui-config" else "no-cache")
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

    def translate_path(self, path: str) -> str:
        """Ảnh card có bản PO tải lên thì phục vụ bản đó; không thì rơi về bản mặc định trong repo."""
        url = urlparse(path).path
        if url.startswith(SECTOR_URL) and url.endswith(".jpg"):
            mine = sector_file(unquote(url[len(SECTOR_URL):-4]))
            if mine is not None and mine.is_file():
                return str(mine)
        return super().translate_path(path)

    def _sector_image(self, land: str, data: bytes) -> None:
        """Lưu (hoặc xoá, nếu rỗng) ảnh card sector do trang chủ gửi lên. Chỉ nhận JPEG. Ghi ngoài repo; xoá thì bản mặc định hiện lại."""
        path = sector_file(land)
        if path is None or (data and not data.startswith(b"\xff\xd8")):
            return self._send(400, "")
        USER_SECTORS.mkdir(parents=True, exist_ok=True)
        if data:
            path.write_bytes(data)
        else:
            path.unlink(missing_ok=True)
        self.send_response(204)
        self.end_headers()

    def do_GET(self) -> None:
        path = urlparse(self.path).path
        if path == '/ui-config':
            return self._send(200, json.dumps({'image_backend': IMAGE_BACKEND, 'video_backend': VIDEO_BACKEND, 'crawler_backend': CRAWLER_BACKEND, 'label_backend': LABEL_BACKEND}), 'application/json')
        return super().do_GET()

    def do_POST(self) -> None:
        url = urlparse(self.path)
        length = int(self.headers.get("Content-Length") or 0)
        if url.path == "/sector-image":
            return self._sector_image(parse_qs(url.query).get("land", [""])[0], self.rfile.read(length))
        return self._send(404, "")


SECTOR_URL = "/assets/sectors/"
USER_SECTORS = Path(os.environ.get("XDG_DATA_HOME") or Path.home() / ".local" / "share") / "xru" / "launcher" / "sectors"


def sector_file(land: str) -> Path | None:
    """Ảnh card sector PO tải lên: <thư mục dữ liệu>/xru/launcher/sectors/<tên>.jpg. Tên lạ thì từ chối."""
    name = land.strip().lower()
    return USER_SECTORS / f"{name}.jpg" if name and all(c.isalnum() or c in "-_ " for c in name) else None


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
    LOGS.mkdir(exist_ok=True)
    if PORT == 5050:
        (LOGS / "launcher.pid").write_text(str(os.getpid()))
    print(f"Xru_Launcher: http://127.0.0.1:{PORT}", flush=True)
    ThreadingHTTPServer(("127.0.0.1", PORT), partial(Handler, directory=str(HERE))).serve_forever()


if __name__ == "__main__":
    main()
