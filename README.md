# Xru_Launcher

Phạm vi phụ trách, quyết định của PO và việc UI đang chờ: [UI.md](UI.md).

Land Launcher của XRU Federal (trước là Xru_UI, bản nháp UI). Đang chuyển từ mockup sang đồ thật:
trang chủ + thư viện UI gốc (`kit/`). Không import code của land nào.
Màn của land do land tự phục vụ; sảnh mở link trực tiếp. Thứ tự làm thật: Launcher → Crawler → Gate → Label.

## Run

```bash
python3 launcher.py          # http://127.0.0.1:5050   (--lan: mở cho cả mạng LAN, xem trên điện thoại)
python3 launcher.py start-apps  # bật Crawler, Gate ảnh/video/Dash, Label
python3 launcher.py stop     # tắt sảnh + các app đã bật
```

- `/` trang chủ. Các ô sector mở thẳng Crawler :5055, Gate :5059/:5058/:5056, Label :5057. Link cũ `/<land>/<module>` chỉ chuyển hướng.
- `xru start` bật sảnh và các màn; `xru stop` tắt toàn bộ. Server UI đọc Kit trên ổ đĩa nên tắt riêng server :5050 không làm mất khung của màn đang chạy.
- `APPS` giữ lệnh khởi động UI cho TUI, không import code land. Server sảnh không có nút Start hay endpoint bật app.

## Thư mục

| Ngăn | Là gì |
|---|---|
| `launcher.py`, `index.html` | Launcher thật: server :5050, trang chủ |
| `kit/` | **Thư viện gốc** (màu, icon, rail, đầu trang, sidebar, cài đặt, song ngữ). Mục lục: `kit/README.md`, xem tận mắt: `/kit/` |
| `home/` | Riêng trang chủ: quả cầu (`home/globe/`), dữ liệu lục địa (`launcher.js`), menu rail trang chủ |
| `assets/` | Ảnh: `gu/` (ảnh gu của PO), `sectors/` (ảnh ô sector trang chủ, lưu qua nút ✎) |
| `mockups/` | Bản nháp Gate / Array. Tới lượt land nào thì chuyển về land đó. Gate Dash đã về `Xru_Gate/ui_dashboard/`. (Crawler đã về land: `Xru_Crawler/ui_screen/`.) |
| `data/`, `tools/` | Số chụp Array + tool chụp |

## Array snapshot

`data/array_snapshot.js` is a real, read-only snapshot of Array query results.
Regenerate (PC Array must be up; key is read from `XRU_Data/federal_keys/ai/xru_array.json`, never written here):

```bash
python3 tools/array_snapshot.py
```

## Gate Dash

Gate phục vụ Dash tại :5056 (`Xru_Gate/ui_dashboard/`), đọc số qua CLI `stats` của hai làn. Màn tự đọc lại mỗi 15 giây khi đang mở. Link cũ `/gate/dash` và `/mockups/gate_dash.html` chuyển sang server Gate.

## Rules

- Luật màu, icon, rail, đầu trang, sidebar, song ngữ: `kit/README.md`.
- Launcher không import code land. Rút Launcher ra thì land vẫn chạy (BA chốt (a): mỗi land tự phục vụ màn của nó, Launcher trỏ sang).
- Placeholders are CSS dot patterns (`.ph-1..6`), no image assets.
