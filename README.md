# Xru_UI

Carbon-side UI mockups for XRU Federal (Launcher, Gate, Array blind test, Crawler).
Static HTML/CSS/JS only — view logic, no Silicon logic, no backend calls.

## Run

```bash
python3 serve.py            # http://0.0.0.0:5051  (LAN visible, no-cache)
python3 serve.py --local    # localhost only
```

Entry: `launcher_mockup.html`.

## Pages

| Page | What |
|---|---|
| `launcher_mockup.html` | Federal launcher, globe chọn 4 lục địa, `/` or `Ctrl+K` → Array |
| `gate_image.html` | Gate image review: list · gallery · inspector, notched inspector resize |
| `gate_video.html` | Gate video review, grid variant |
| `gate_video_watch.html` | Gate video review, big-player variant (trial, keep one of the two) |
| `gate_dash.html` | Gate Dash, **số thật** (`data/gate_snapshot.js`): sidebar nguồn (tất cả → nền tảng → kênh), phễu theo phạm vi, máy chấm điểm |
| `array_search.html` | Array, Google-style: home box → results with tabs, knowledge panel |
| `crawler_dash.html` | Crawler mockup: overview, illustrative numbers |
| `crawler_dash_activity.html` | Crawler dashboard sketch: recent activity |
| `crawler_sources.html` | Crawler mockup sources: image + video, filters and source details |
| `gate_mockup.html` | Redirect stub to the gate pages |

Shared: `profiles/*.css` (màu từng profile), `css/tokens.css` (màu dùng vào việc gì, zoom, page-swap), `css/sidebar.css` + `js/sidebar.js` (sidebar lọc cột trái: số đếm · tìm nhanh · nguồn · sắp xếp · danh sách · phân trang; rộng `--side-w`), `css/page.css` (đầu trang `.page-head` + chân trang `.page-foot`, một kiểu cho mọi màn), `css/rail.css` + `js/rail.js` (rail: một bản cho mọi trang, sửa menu ở `RAILS` trong `js/rail.js`), `css/account.css` + `js/account.js` (font/accent/zoom settings).

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

## Rules

- Màu chỉ khai báo trong `profiles/<tên>.css`. Mặc định: **Graphite** (đơn sắc xám ấm, nhấn trắng ngà). Có thêm: Cyan XRU.
- Trang chỉ gọi màu theo vai trò: `--accent` (nhấn), `--warn` (cảnh báo/chờ duyệt), `--hold` (tạm giữ), `--idle`, thang `--m-0..15`. Không viết mã màu trong trang.
- Độ mờ: `rgba(var(--accent-rgb), .2)`, không pha màu bằng mã cứng.
- Thêm profile: copy `profiles/graphite.css` → đổi tên + `data-profile`, thêm 1 dòng `@import` trong `css/tokens.css`, 1 dòng vào `PROFILES` trong `js/account.js`.
- Chữ hiển thị: viết bản tiếng Việt trong HTML + gắn `data-i18n="khóa"` (thuộc tính: `data-i18n-attr="placeholder:khóa"`); thêm khóa vào cả `vi` và `en` trong `js/i18n.js`. Chữ vẽ bằng JS: `XRU_I18N.t('khóa')` và vẽ lại khi có sự kiện `xru-lang-applied`. Mặc định: English.
- Avoid `color-mix()`; use the rgba tokens.
- Placeholders are CSS dot patterns (`.ph-1..6`), no image assets.
