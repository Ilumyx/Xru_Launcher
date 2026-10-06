"""Chụp số thật của Gate (video + ảnh) vào data/gate_snapshot.js cho Gate Dash.

Chỉ gọi lệnh đọc `stats` của Gate qua CLI (không import code Gate, không ghi gì vào Gate):
    python3 tools/gate_snapshot.py
"""
import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path

GATE = Path(__file__).resolve().parents[2] / 'Xru_Gate'
OUT = Path(__file__).resolve().parent.parent / 'data' / 'gate_snapshot.js'


def stats(cli: str) -> dict:
    out = subprocess.run(['uv', 'run', cli, 'stats'], cwd=GATE, capture_output=True, text=True, timeout=300, check=True)
    return json.loads(out.stdout)


snap = {'taken_at': datetime.now(timezone.utc).isoformat(timespec='seconds'),
        'video': stats('xru-video-gate'), 'image': stats('xru-image-gate')}
for lane in ('video', 'image'):
    snap[lane].pop('db_path', None)  # đường dẫn máy, không cần cho UI
    print(f"{lane}: {snap[lane]['total']} hồ sơ, {len(snap[lane]['by_source'])} nguồn")
OUT.write_text('// Sinh bởi tools/gate_snapshot.py — số thật, chỉ đọc. Đừng sửa tay.\nwindow.GATE_SNAPSHOT = '
               + json.dumps(snap, ensure_ascii=False) + ';\n', encoding='utf-8')
print('→', OUT)
