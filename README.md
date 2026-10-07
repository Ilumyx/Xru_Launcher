# Xru_Launcher

Module UI rời của XRU: sảnh, Kit, các màn. Quyết định và việc: [UI.md](UI.md). Không import code land.

## Chạy

```bash
python3 launcher.py             # http://127.0.0.1:5050  (--lan: mở cho mạng LAN)
python3 launcher.py stop        # chỉ tắt UI, giữ Backend và CLI
xru backend image start        # Backend Gate ảnh :5059
xru backend video start        # Backend Gate video :5058
xru backend crawler start      # Backend Crawler :5055
xru backend image stop
xru backend image status       # READY khi API trả được dữ liệu
```

`xru start` / `xru stop` chỉ bật/tắt UI :5050. Gate ảnh mở tại `/gate/image/`, video tại `/gate/video/?view=grid` hoặc `view=watch`, Gate Dash tại `/gate/dash/`, Crawler tại `/crawler/dash` và `/crawler/sources`; Backend chạy riêng: `python -m gate_image.backend_service.image_api` hoặc `python -m gate_video.backend_service.video_api` trong Xru_Gate, `python -m backend_service.source_api` trong Xru_Crawler. Hợp đồng ở `Xru_Gate/gate_image/backend_service/API.md`, `Xru_Gate/gate_video/backend_service/API.md` và `Xru_Crawler/backend_service/API.md`. Bật/tắt/status từng Backend qua `xru backend image|video|crawler start|stop|status`.

Label chưa chuyển: `python3 launcher.py start-apps` bật các server màn cũ; `stop-apps` tắt chúng và UI. Màn/server cũ của Gate ảnh, video, Dash và Crawler đã xoá. Ba Backend mới không nằm trong `start-apps` / `stop-apps`.

Mặc định chạy localhost. `--lan` mở server UI cho LAN; để dùng Backend từ máy khác phải cấu hình host và `--ui-origin` của Backend tương ứng. UI có `--port`, `--image-backend`, `--video-backend`, `--crawler-backend` để thử với dữ liệu riêng.

## Thư mục

| Ngăn | Là gì |
|---|---|
| `launcher.py`, `index.html` | Server 5050, trang chủ |
| `kit/` | Thư viện gốc, xem tại `/kit/` |
| `home/` | Quả cầu, menu trang chủ |
| `gate/image/`, `gate/video/`, `gate/dash/`, `crawler/` | Các màn chỉ gọi Backend qua HTTP |
| `assets/` | `gu/` ảnh gu PO, `sectors/` ảnh ô sector |
| `mockups/` | Bản nháp chưa làm thật |
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
