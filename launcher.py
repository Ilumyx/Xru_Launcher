"""Xru_Launcher — vỏ chung của XRU Federal. Một địa chỉ: http://127.0.0.1:5050

- Trang chủ: index.html (quả cầu, lục địa, sector).
- /<land>/<module>: vỏ = rail + ô giữa. Module có server riêng là app của land (process riêng, cổng riêng),
  vỏ nhúng nó vào ô giữa. App đang tắt thì ô giữa có nút "Bật lại"; rail vẫn sống.
- Vỏ không import code của land nào: chỉ gọi lệnh của land (uv run ...) và nhúng trang của land.
  Xoá cả thư mục này thì các land vẫn chạy (unplug test).

Bật:  python3 Xru_Launcher/launcher.py           →  http://127.0.0.1:5050   (--lan: mở cho cả mạng LAN)
Tắt:  python3 Xru_Launcher/launcher.py stop      (tắt vỏ và mọi app land do vỏ bật)
Chỉ dùng thư viện chuẩn của Python.
"""

from __future__ import annotations

import html
import json
import os
import shutil
import signal
import socket
import subprocess
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

HERE = Path(__file__).resolve().parent
XRU_CODE = HERE.parent
PORT = 5050
LOGS = HERE / "logs"

# App của land: khóa → (thư mục land, lệnh của land, cổng). Vỏ chỉ bật bằng lệnh này, không import.
APPS = {
    "crawler-sources": ("Xru_Crawler", ["python", "-m", "ui_screen.source_board_app"], 5055),
    "gate-image": ("Xru_Gate", ["python", "-m", "gate_image.ui_screen.image_review_web_app"], 5059),
    "gate-video": ("Xru_Gate", ["python", "-m", "gate_video.ui_screen.video_review_web_app"], 5058),
    "label-video": ("Xru_Label", ["python", "-m", "label_division_video.video_po_review_ui.video_review_web_app"], 5057),
}

# Land → module trên rail: (đường dẫn, khóa chữ trong js/i18n.js, icon trong js/rail.js, nguồn).
# Nguồn = khóa trong APPS (app của land), hoặc "/đường/trang.html" (trang của Launcher, ví dụ Gate Dash đọc số chụp).
LANDS = {
    "crawler": ("Crawler", (
        ("sources", "rail_added_sources", "table", "crawler-sources"),
    )),
    "gate": ("Gate", (
        ("image", "gate_img", "image", "gate-image"),
        ("video", "gate_vid", "video", "gate-video"),
        ("dash", "gate_dash", "stats", "/mockups/gate_dash.html"),
    )),
    "label": ("Label", (
        ("video", "label_video", "video", "label-video"),
    )),
}


def is_up(port: int) -> bool:
    with socket.socket() as s:
        s.settimeout(0.2)
        return s.connect_ex(("127.0.0.1", port)) == 0


def status() -> dict[str, bool]:
    return {key: is_up(port) for key, (_, _, port) in APPS.items()}


def start(key: str) -> None:
    """Bật một app bằng lệnh của land; tách khỏi vỏ để vỏ tắt thì app vẫn sống."""
    if key not in APPS or is_up(APPS[key][2]):
        return
    land, cmd, _ = APPS[key]
    LOGS.mkdir(exist_ok=True)
    log = open(LOGS / f"{key}.log", "ab")
    proc = subprocess.Popen([shutil.which("uv") or "uv", "run", *cmd], cwd=XRU_CODE / land,
                            stdin=subprocess.DEVNULL, stdout=log, stderr=log, start_new_session=True)
    (LOGS / f"{key}.pid").write_text(str(proc.pid))


def stop_all() -> None:
    """Tắt mọi app do vỏ bật (theo file pid), rồi tắt vỏ."""
    for pid_file in LOGS.glob("*.pid"):
        try:
            os.killpg(int(pid_file.read_text()), signal.SIGTERM)
        except (ProcessLookupError, ValueError, PermissionError):
            pass
        pid_file.unlink(missing_ok=True)
    pid = LOGS / "launcher.pid"
    if pid.exists():
        try:
            os.kill(int(pid.read_text()), signal.SIGTERM)
        except (ProcessLookupError, ValueError):
            pass
        pid.unlink(missing_ok=True)


def module_url(source: str) -> str:
    return f"http://127.0.0.1:{APPS[source][2]}/" if source in APPS else source


def shell_page(land: str, mod: str) -> str | None:
    """Vỏ: rail (js/rail.js, menu lấy từ LANDS) + ô giữa nhúng module."""
    if land not in LANDS:
        return None
    name, mods = LANDS[land]
    current = next((m for m in mods if m[0] == mod), mods[0])
    rail = {
        "label": name, "home": f"/?continent=eurasia", "homeTip": "rail_esc_launcher",
        "groups": [[{"key": m[0], "href": f"/{land}/{m[0]}", "icon": m[2], "tip": m[1]} for m in mods]],
    }
    view = {"land": land, "mod": current[0], "key": current[3] if current[3] in APPS else None,
            "url": module_url(current[3]), "title": current[1]}
    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(name)} — XRU</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/kit/tokens.css"><link rel="stylesheet" href="/kit/rail/rail.css"><link rel="stylesheet" href="/shell/shell.css">
<link rel="stylesheet" href="/kit/account/account.css"><script src="/kit/i18n/i18n.js"></script><script src="/kit/account/account.js"></script>
</head><body>
<div class="shell">
  <script>window.XRU_RAILS = {{"live": {json.dumps(rail)}}}; window.XRU_VIEW = {json.dumps(view)};</script>
  <nav class="rail" data-rail="live" data-active="{html.escape(current[0])}"></nav><script src="/kit/rail/rail.js"></script>
  <main class="sh-stage">
    <iframe id="sh-frame" title="{html.escape(name)}" allow="fullscreen; autoplay" hidden></iframe>
    <section class="sh-down" id="sh-down" hidden>
      <span class="sh-dot"></span>
      <h1 data-i18n="sh_down_title">Module đang tắt</h1>
      <p><span data-i18n="sh_down_text">App của land không trả lời. Rail và các module khác vẫn chạy.</span> <code id="sh-port"></code></p>
      <button class="sh-btn" id="sh-start" data-i18n="sh_start">Bật lại</button>
      <p class="sh-log"><span data-i18n="sh_log">Nhật ký</span>: <code id="sh-log"></code></p>
    </section>
  </main>
</div>
<script src="/shell/shell.js"></script>
</body></html>"""


class Handler(SimpleHTTPRequestHandler):
    """File tĩnh của Xru_Launcher + vài đường của vỏ. Không cache để luôn thấy bản mới."""

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
        if path == "/status":
            return self._send(200, json.dumps(status()), "application/json")
        parts = [p for p in path.split("/") if p]
        if parts and parts[0] in LANDS and (len(parts) == 1 or "." not in parts[-1]):
            page = shell_page(parts[0], parts[1] if len(parts) > 1 else "")
            return self._send(200, page)
        return super().do_GET()

    def do_POST(self) -> None:
        url = urlparse(self.path)
        length = int(self.headers.get("Content-Length") or 0)
        if url.path == "/sector-image":
            return self._sector_image(parse_qs(url.query).get("land", [""])[0], self.rfile.read(length))
        if url.path != "/start":
            return self._send(404, "")
        key = parse_qs(self.rfile.read(length).decode()).get("app", [""])[0]
        start(key)
        self.send_response(204)
        self.end_headers()


SECTORS = HERE / "assets" / "sectors"


def sector_file(land: str) -> Path | None:
    """Ảnh card sector trên trang chủ: assets/sectors/<tên>.jpg. Tên lạ thì từ chối."""
    name = land.strip().lower()
    return SECTORS / f"{name}.jpg" if name and all(c.isalnum() or c in "-_ " for c in name) else None


def main() -> None:
    if sys.argv[1:2] == ["stop"]:
        return stop_all()
    host = "0.0.0.0" if "--lan" in sys.argv else "127.0.0.1"
    LOGS.mkdir(exist_ok=True)
    (LOGS / "launcher.pid").write_text(str(os.getpid()))
    print(f"Xru_Launcher: http://127.0.0.1:{PORT}", flush=True)
    ThreadingHTTPServer((host, PORT), partial(Handler, directory=str(HERE))).serve_forever()


if __name__ == "__main__":
    main()
