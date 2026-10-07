# Xru_Launcher

Phạm vi phụ trách, quyết định của PO và việc UI đang chờ: [UI.md](UI.md).

Land Launcher của XRU Federal (trước là Xru_UI, bản nháp UI). Đang chuyển từ mockup sang đồ thật:
vỏ + trang chủ + thư viện UI gốc (`kit/`). Không import code của land nào.
Màn của land do land tự phục vụ; Launcher nhúng vào vỏ. Thứ tự làm thật: Launcher → Crawler → Gate → Label.

## Run

```bash
python3 launcher.py          # http://127.0.0.1:5050   (--lan: mở cho cả mạng LAN, xem trên điện thoại)
python3 launcher.py stop     # tắt vỏ + mọi app land do vỏ bật
```

- `/` trang chủ (index.html). `/<land>/<module>` = vỏ: rail + ô giữa nhúng app của land (Crawler :5055, Gate :5059/:5058, Label :5057).
  App đang tắt thì ô giữa có nút Start (gọi lệnh của land qua `uv run`, nhật ký ở `logs/`).
- Thêm module: sửa `APPS` / `LANDS` trong `launcher.py`. Vỏ không import code land nào.

## Thư mục

| Ngăn | Là gì |
|---|---|
| `launcher.py`, `index.html` | Launcher thật: server :5050, trang chủ |
| `kit/` | **Thư viện gốc** (màu, icon, rail, đầu trang, sidebar, cài đặt, song ngữ). Mục lục: `kit/README.md`, xem tận mắt: `/kit/` |
| `home/` | Riêng trang chủ: quả cầu (`home/globe/`), dữ liệu lục địa (`launcher.js`), menu rail trang chủ |
| `shell/` | Riêng vỏ: ô giữa nhúng app của land, nút Start |
| `assets/` | Ảnh: `gu/` (ảnh gu của PO), `sectors/` (ảnh ô sector trang chủ, lưu qua nút ✎) |
| `mockups/` | Bản nháp Gate / Array. Tới lượt land nào thì chuyển về land đó. Gate Dash ở đây chạy số thật. (Crawler đã về land: `Xru_Crawler/ui_screen/`.) |
| `data/`, `tools/` | Số chụp (Gate, Array) + tool chụp |

## Array snapshot

`data/array_snapshot.js` is a real, read-only snapshot of Array query results.
Regenerate (PC Array must be up; key is read from `XRU_Data/federal_keys/ai/xru_array.json`, never written here):

```bash
python3 tools/array_snapshot.py
```

## Gate snapshot

`data/gate_snapshot.js` = số thật của Gate, chụp bằng lệnh đọc `stats` của Gate (gọi CLI, không import code Gate):

```bash
python3 tools/gate_snapshot.py
```

## Cần từ lõi

- **Gate** (`stats`): `by_source[].machine.by_outcome` + `findings`; `machine_vs_po` theo loại cờ và theo nguồn (`right`, `false_flag`, `miss`); ngày thêm nguồn.

## Rules

- Luật màu, icon, rail, đầu trang, sidebar, song ngữ: `kit/README.md`.
- Launcher không import code land. Rút Launcher ra thì land vẫn chạy (BA chốt (a): mỗi land tự phục vụ màn của nó, Launcher nhúng/trỏ sang).
- Placeholders are CSS dot patterns (`.ph-1..6`), no image assets.
