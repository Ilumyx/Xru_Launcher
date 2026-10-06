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
| `gate_dash.html` | Gate stats (old simple layout) |
| `array_search.html` | Array, Google-style: home box → results with tabs, knowledge panel |
| `crawler_dash.html` | Crawler mockup: overview, illustrative numbers |
| `crawler_dash_activity.html` | Crawler dashboard sketch: recent activity |
| `crawler_sources.html` | Crawler mockup sources: image + video, filters and source details |
| `gate_mockup.html` | Redirect stub to the gate pages |

Shared: `profiles/*.css` (màu từng profile), `css/tokens.css` (màu dùng vào việc gì, zoom, page-swap), `css/rail.css` + `js/rail.js` (rail: một bản cho mọi trang, sửa menu ở `RAILS` trong `js/rail.js`), `css/account.css` + `js/account.js` (font/accent/zoom settings).

## Array snapshot

`data/array_snapshot.js` is a real, read-only snapshot of Array query results.
Regenerate (PC Array must be up; key is read from `XRU_Data/federal_keys/ai/xru_array.json`, never written here):

```bash
python3 tools/array_snapshot.py
```

## Rules

- Màu chỉ khai báo trong `profiles/<tên>.css`. Mặc định: **Graphite** (đơn sắc xám ấm, nhấn trắng ngà). Có thêm: Cyan XRU.
- Trang chỉ gọi màu theo vai trò: `--accent` (nhấn), `--warn` (cảnh báo/chờ duyệt), `--hold` (tạm giữ), `--idle`, thang `--m-0..15`. Không viết mã màu trong trang.
- Độ mờ: `rgba(var(--accent-rgb), .2)`, không pha màu bằng mã cứng.
- Thêm profile: copy `profiles/graphite.css` → đổi tên + `data-profile`, thêm 1 dòng `@import` trong `css/tokens.css`, 1 dòng vào `PROFILES` trong `js/account.js`.
- Avoid `color-mix()`; use the rgba tokens.
- Placeholders are CSS dot patterns (`.ph-1..6`), no image assets.
