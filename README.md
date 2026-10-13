# Xru_Launcher

Module UI rời của XRU: sảnh, Kit, các màn. Quyết định và việc: [UI.md](UI.md). Không import code land.

## Chạy

```bash
xru start                       # bật UI :5050 + 4 Backend (ảnh :5059, video :5058, Crawler :5055, Label :5057)
xru stop                        # tắt hết
xru backend image status        # READY khi API trả được dữ liệu; dùng cho máy, từng lane
python3 launcher.py --lan       # chỉ UI, mở cho mạng LAN
```

`xru start` / `xru stop` bật/tắt UI :5050 cùng bốn Backend. Gate ảnh mở tại `/gate/image/`, video tại `/gate/video/?view=grid` hoặc `view=watch`, Gate Dash tại `/gate/dash/`, Crawler tại `/crawler/dash` và `/crawler/sources`, Label tại `/label/video/`; Backend chạy riêng: `python -m gate_image.ui_backend_service.image_api` hoặc `python -m gate_video.ui_backend_service.video_api` trong Xru_Gate, `python -m ui_backend_service.source_api` trong Xru_Crawler, `python -m label_division_video.backend_service.label_api` trong Xru_Label. Hợp đồng ở `Xru_Gate/gate_image/ui_backend_service/API.md`, `Xru_Gate/gate_video/ui_backend_service/API.md`, `Xru_Crawler/ui_backend_service/API.md` và `Xru_Label/label_division_video/backend_service/API.md`. Bật/tắt/status từng Backend qua `xru backend image|video|crawler|label start|stop|status`.

Mặc định chạy localhost. `--lan` mở server UI cho LAN; để dùng Backend từ máy khác phải cấu hình host và `--ui-origin` của Backend tương ứng. UI có `--port`, `--image-backend`, `--video-backend`, `--crawler-backend`, `--label-backend` để thử với dữ liệu riêng.

## Thư mục

| Ngăn | Là gì |
|---|---|
| `launcher.py`, `index.html` | Server 5050, trang chủ |
| `kit/` | Thư viện gốc, xem tại `/kit/` |
| `home/` | Quả cầu, menu trang chủ |
| `gate/image/`, `gate/video/`, `gate/dash/`, `crawler/`, `label/video/` | Các màn chỉ gọi Backend qua HTTP |
| `assets/` | `gu/` ảnh gu PO, `sectors/` ảnh ô sector |
| `array/` | Màn Array (tra cứu, đọc bản chụp `data/array_snapshot.js`) |
| `data/`, `tools/` | Số chụp Array (tĩnh, có ngày chụp) |

## Kit

Kit không biết land nào có màn gì. Một món vào Kit khi đã có ở ít nhất 2 màn đã chốt.

| Cái gì | Ở đâu | Luật |
|---|---|---|
| Màu | `kit/profiles/*.css` | Chỉ khai báo màu ở đây. Mặc định Graphite. |
| Vai trò màu, chữ | `kit/tokens.css` | Trang chỉ gọi `--bg`, `--fg*`, `--accent`, `--warn`, `--hold`, `--idle`. Đỏ chỉ cho chỗ PO cần nhìn. Inter cho chữ, JetBrains Mono cho số. |
| Icon | `kit/icons/icons.svg` | `<symbol id="i-TÊN">`, nét 24×24. |
| Rail | `kit/rail/` | Chỉ vẽ; menu từ `window.XRU_RAILS`. Không iframe. |
| Đầu/chân trang | `kit/page/page.css` | `.page-head`, `.page-foot`. |
| Cột lọc | `kit/sidebar/` | Rộng `--side-w`; rail có `data-panel` thì có nút đóng/mở. |
| Cài đặt | `kit/account/` | Ngôn ngữ, profile, sáng/tối, font, màu nhấn, cỡ. |
| Hai thứ tiếng | `kit/i18n/i18n.js` | `data-i18n`, đủ `vi` + `en`, English mặc định. Chữ riêng của màn nạp bằng `XRU_I18N.add`. |

Thêm profile: chép `graphite.css`, đổi tên và `data-profile`; thêm `@import` trong `tokens.css`; thêm vào `PROFILES` trong `account/account.js`.

## Crawler

`/crawler/dash` và `/crawler/sources` gọi Backend :5055 qua `/api/board`. Mỗi dòng Nguồn là một cụm trong heart.db; cột ẢNH/VIDEO là số khai sinh từ clerk.db, không có làn hay Hạng. Dashboard hôm nay/7 ngày theo born_at, múi giờ Asia/Ho_Chi_Minh. Lọc nền tảng/tag/vấn đề, tìm/sort và xem chi tiết tại chỗ; note/tag/bật tắt chỉ đọc từ config cụm. Thiếu sổ báo chưa có số; không thay unknown bằng zero. Hợp đồng: Xru_Crawler/ui_backend_service/API.md.
