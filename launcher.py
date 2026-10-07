"""Sảnh XRU: trang chủ, Kit và link sang màn độc lập của mỗi land.
python3 launcher.py          # sảnh :5050
python3 launcher.py start-apps  # bật các màn cho lệnh xru start
python3 launcher.py stop        # tắt sảnh và các màn đã bật
Không import code của land. Chỉ dùng thư viện chuẩn Python.
"""

from __future__ import annotations

import os
import shutil
import signal
import socket
import subprocess
import sys
import time
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

HERE = Path(__file__).resolve().parent
XRU_CODE = HERE.parent
PORT = 5050
LOGS = HERE / "logs"

# Lệnh bật UI cho TUI: khóa → (thư mục land, lệnh, cổng). Không import land.
APPS = {
    "crawler-sources": ("Xru_Crawler", ["python", "-m", "ui_screen.source_board_app"], 5055),
    "gate-dashboard": ("Xru_Gate", ["python", "-m", "ui_dashboard.dashboard_web_app"], 5056),
    "gate-image": ("Xru_Gate", ["python", "-m", "gate_image.ui_screen.image_review_web_app"], 5059),
    "gate-video": ("Xru_Gate", ["python", "-m", "gate_video.ui_screen.video_review_web_app"], 5058),
    "label-video": ("Xru_Label", ["python", "-m", "label_division_video.video_po_review_ui.video_review_web_app"], 5057),
}

# Giữ link cũ dưới dạng chuyển hướng; không tạo vỏ hay nhúng màn.
DESTINATIONS = {
    '/crawler': 'http://127.0.0.1:5055/dash.html',
    '/crawler/dash': 'http://127.0.0.1:5055/dash.html',
    '/crawler/sources': 'http://127.0.0.1:5055/',
    '/gate': 'http://127.0.0.1:5059/',
    '/gate/image': 'http://127.0.0.1:5059/',
    '/gate/video': 'http://127.0.0.1:5058/',
    '/gate/dash': 'http://127.0.0.1:5056/',
    '/mockups/gate_dash.html': 'http://127.0.0.1:5056/',
    '/label': 'http://127.0.0.1:5057/',
    '/label/video': 'http://127.0.0.1:5057/',
}

def is_up(port: int) -> bool:
    with socket.socket() as s:
        s.settimeout(0.2)
        return s.connect_ex(("127.0.0.1", port)) == 0


def start(key: str) -> None:
    """Bật app bằng CLI của land; process sống độc lập với sảnh."""
    if key not in APPS or is_up(APPS[key][2]):
        return
    land, cmd, _ = APPS[key]
    LOGS.mkdir(exist_ok=True)
    log = open(LOGS / f"{key}.log", "ab")
    proc = subprocess.Popen([shutil.which("uv") or "uv", "run", *cmd], cwd=XRU_CODE / land,
                            stdin=subprocess.DEVNULL, stdout=log, stderr=log, start_new_session=True)
    log.close()
    (LOGS / f"{key}.pid").write_text(str(proc.pid))


def start_apps() -> bool:
    """Bật các màn song song, rồi chỉ báo thành công khi mọi cổng trả lời."""
    for key in APPS:
        start(key)
    deadline = time.monotonic() + 20
    while time.monotonic() < deadline:
        if all(is_up(port) for _, _, port in APPS.values()):
            return True
        time.sleep(0.2)
    for key, (_, _, port) in APPS.items():
        if not is_up(port):
            print(f"Không bật được {key} :{port}. Log: {LOGS / (key + '.log')}", file=sys.stderr)
    return False


def stop_all() -> None:
    """Tắt group của app, rồi PID riêng của sảnh (kể cả chạy trực tiếp)."""
    for key in APPS:
        pid_file = LOGS / f"{key}.pid"
        if not pid_file.exists():
            continue
        try:
            os.killpg(int(pid_file.read_text()), signal.SIGTERM)
        except (ProcessLookupError, ValueError, PermissionError):
            pass
        pid_file.unlink(missing_ok=True)
    pid_file = LOGS / "launcher.pid"
    if pid_file.exists():
        try:
            os.kill(int(pid_file.read_text()), signal.SIGTERM)
        except (ProcessLookupError, ValueError, PermissionError):
            pass
        pid_file.unlink(missing_ok=True)


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
        path = urlparse(self.path).path
        destination = DESTINATIONS.get(path.rstrip('/'))
        if destination:
            self.send_response(302)
            self.send_header('Location', destination)
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


def main() -> None:
    if sys.argv[1:2] == ["stop"]:
        return stop_all()
    if sys.argv[1:2] == ["start-apps"]:
        sys.exit(0 if start_apps() else 1)
    host = "0.0.0.0" if "--lan" in sys.argv else "127.0.0.1"
    LOGS.mkdir(exist_ok=True)
    (LOGS / "launcher.pid").write_text(str(os.getpid()))
    print(f"Xru_Launcher: http://127.0.0.1:{PORT}", flush=True)
    ThreadingHTTPServer((host, PORT), partial(Handler, directory=str(HERE))).serve_forever()


if __name__ == "__main__":
    main()
