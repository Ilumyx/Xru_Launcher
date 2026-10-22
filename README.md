# Xru_Launcher

Module UI rời của XRU: sảnh, Kit, các màn. Quyết định và việc: [UI.md](UI.md). Không import code land.

## Chạy

```bash
xru start                       # bật UI :5050 + 4 Backend (ảnh :5059, video :5058, Crawler :5055, Label :5057)
xru stop                        # tắt hết
xru backend image status        # READY khi API trả được dữ liệu; dùng cho máy, từng lane
python3 launcher.py             # chỉ UI :5050
```

`xru start` / `xru stop` bật/tắt UI :5050 cùng bốn Backend. Gate ảnh mở tại `/gate/image/`, video tại `/gate/video/?view=grid` hoặc `view=watch`, Gate Dash tại `/gate/dash/`, Crawler tại `/crawler/dash.html` và `/crawler/sources.html`, Label tại `/label/video/`; Backend chạy riêng: `python -m ui_backend_service.image_api` hoặc `python -m ui_backend_service.video_api` trong Xru_Gate, `python -m ui_backend_service.source_api` trong Xru_Crawler, `python -m label_division_video.backend_service.label_api` trong Xru_Label. Hợp đồng ở `Xru_Gate/ui_backend_service/API.md` (ảnh + video), `Xru_Crawler/ui_backend_service/API.md` và `Xru_Label/label_division_video/backend_service/API.md`. Bật/tắt/status từng Backend qua `xru backend image|video|crawler|label start|stop|status`.

Dùng UI trên PC (chung mạng nhà): laptop đào hầm ngược `ssh -N -R 5050:127.0.0.1:5050 -R 5055:127.0.0.1:5055 -R 5057:127.0.0.1:5057 -R 5058:127.0.0.1:5058 -R 5059:127.0.0.1:5059 pc`, rồi PC mở `http://127.0.0.1:5050`. `ssh pc` gọi PC bằng tên `o.local` (mDNS), PC gọi laptop bằng `XruProryv.local`. Hầm đứt khi laptop ngủ hoặc mất mạng.

UI luôn nghe 127.0.0.1, máy khác vào qua hầm SSH ở trên (Backend chỉ nhận Origin `http://127.0.0.1:5050`). UI có `--port`, `--image-backend`, `--video-backend`, `--crawler-backend`, `--label-backend` để thử với dữ liệu riêng.

## Thư mục

| Ngăn | Là gì |
|---|---|
| `launcher.py`, `index.html` | Server 5050, trang chủ |
| `kit/` | Thư viện gốc, xem tại `/kit/` |
| `home/` | Quả cầu, menu trang chủ |
| `gate/image/`, `gate/video/`, `gate/dash/`, `crawler/`, `label/video/` | Các màn chỉ gọi Backend qua HTTP |
| `assets/` | `gu/` ảnh gu PO, `sectors/` ảnh mặc định của ô sector (ảnh PO tải lên ở trang chủ cất ngoài repo tại `${XDG_DATA_HOME:-~/.local/share}/xru/launcher/sectors/`, Launcher phục vụ bản đó trước; xoá thì hiện lại ảnh mặc định) |
| `array/` | Màn Array (tra cứu, đọc bản chụp `data/array_snapshot.js`) |
| `data/`, `tools/` | Số chụp Array (tĩnh, có ngày chụp) |

## Kit

Kit không biết land nào có màn gì. Một món vào Kit khi đã có ở ít nhất 2 màn đã chốt.

| Cái gì | Ở đâu | Luật |
|---|---|---|
| Màu | `kit/profiles/*.css` | Chỉ khai báo màu ở đây. Mặc định Graphite. |
| Vai trò màu, chữ | `kit/tokens.css` | Trang chỉ gọi `--bg`, `--fg*`, `--accent`, `--warn`, `--hold`, `--idle`. Đỏ chỉ cho chỗ PO cần nhìn. Inter cho chữ, JetBrains Mono cho số. |
| Icon | `kit/icons/icons.svg` | `<symbol id="i-TÊN">`, nét 24×24. |
| Đầu/chân trang | `kit/page/page.css` | `.page-head`, `.page-foot`. |
| Rail | `kit/rail/` | Chỉ vẽ; menu từ `window.XRU_RAILS`, mỗi land một file (`gate/rail_menu.js`, `crawler/rail_menu.js`). Vẽ lại khi đổi ngôn ngữ hoặc khi màn sửa href trong `XRU_RAILS` rồi phát `xru-rail-changed` (link mang bộ lọc). Không iframe. |
| Bộ xương | `kit/frame/` | `.ws` > `.side` + `.ws-main` + `.ws-insp` (tuỳ có, `[hidden]` khi chưa chọn gì). Hai cột bên kéo giãn ở mép trong (trái 200–480, phải 280–720), bấm đúp về mặc định (260 / 360), một bề ngang chung mọi màn, nhớ bằng cookie. Cột trái đóng/mở ở rail (`data-panel`), cột phải gập ở nút góc trên phải. Màn chỉ lo nội dung trong cột, không tự dựng khung hay tay kéo. |
| Cột lọc | `kit/sidebar/` | Nội dung cột trái: số đếm, tìm, lọc, sắp xếp, danh sách, phân trang. |
| Tường | `kit/wall/` | Lưới ô nhỏ chung (Gate ảnh, Gate video): `XRU_WALL({grid, pager, next, size, thumb(item, width), media?, end?, onSelect, onPage})`. Màn tự đọc Backend; tường vẽ một trang, ảnh nhỏ tải lười (srcset 240/480 cho màn nét cao), lật trang, rê chuột 300ms mới phát video. Màn không tự viết lưới. |
| Cài đặt | `kit/account/` | Ngôn ngữ, profile, sáng/tối, font, màu nhấn, cỡ. `--ui-zoom` = cỡ PO chọn × (rộng màn / 1920), từ 1 đến 2: màn 2K/4K giữ bố cục như laptop. Chiều cao viết `calc(100vh / var(--ui-zoom))`. |
| Hai thứ tiếng | `kit/i18n/i18n.js` | `data-i18n`, đủ `vi` + `en`, English mặc định. Chữ riêng của màn nạp bằng `XRU_I18N.add` (`gate/dash/dashboard_text.js`, `crawler/crawler_text.js`, `label/video/label_text.js`). |

Thêm profile: chép `graphite.css`, đổi tên và `data-profile`; thêm `@import` trong `tokens.css`; thêm vào `PROFILES` trong `account/account.js`.

## Crawler

Sổ Crawler do `local_registrar/` giữ; số khai sinh lấy qua `dirc_embassy/` từ `eurasia/eurasia_dirc/eurasia_dirc.db` v2. Đăng tịch thuộc riêng `xru_embassy/`, nối Liên Bang v6: `citizen(xru_id,xru_subject,xru_continent,xru_sector,xru_registry_date)`. Launcher chỉ gọi API, không mở các sổ này.

`/crawler/dash.html` và `/crawler/sources.html` gọi Backend :5055 qua `/api/board`. Mỗi dòng Nguồn là một cụm từ config hoặc đã có số liệu. Hiện mọi cụm trong config dù chưa chạy, bằng tên PO đặt trong `labels.json` (ví dụ U.S. Central Command); không hiện link; máy tự nối ID Facebook, PO không điền ID. Ảnh/video cùng page chung một dòng. Trùng SHA/Ctrl+C/bảo chờ không báo Hỏng; link bị từ chối trùng đã ra khỏi chờ. cột ẢNH/VIDEO là số khai sinh từ eurasia/eurasia_dirc/eurasia_dirc.db, không có làn hay Hạng. Dashboard hôm nay/7 ngày theo born_at, múi giờ Asia/Ho_Chi_Minh. Bảng hàng gọn, tên lớn; số ảnh/video không viền hoặc chữ bật/tắt, bật sáng/tắt tối. Công tắc `config.json → clusters → enabled → image/video` độc lập: loại bị tắt tối riêng ô, cả hai tắt tối cả dòng. Số là đã sinh/tổng từng loại, ví dụ 40/12400; tổng chưa biết hiện —, không lấy số đã dò một phần làm tổng toàn nguồn. DVIDS/War Album dùng tổng riêng theo loại đã hỏi nguồn và ghi trong sổ; cột cuối là ngày cào gần nhất lấy từ last_born_at. Bỏ chip tag khỏi bảng/sidebar; tag quốc gia hiện thành cờ cạnh tên, mỗi nền tảng một màu (vạch trước tên + chữ Platform), nguồn tắt thì cả dòng tối, dưới số có vạch tiến độ đã sinh/tổng. Lọc nền tảng/vấn đề, tìm/sort và xem chi tiết tại chỗ; bật/tắt đọc từ config, note đọc từ `labels.json`. Thiếu sổ báo chưa có số; không thay unknown bằng zero. Hợp đồng: Xru_Crawler/ui_backend_service/API.md.

Crawler Order 118: UI và CLI board dùng cùng bảng số từ phòng Lỗi & số liệu của Crawler. Từng ô ảnh/video hiện đã sinh/tổng (nguồn không tự khai: đã thấy+), số chờ/đáy, scout cuối/thêm/độ lệch tổng, run cuối và hôm nay/7 ngày, [E] theo loại, giờ nghỉ/chờ. Sidebar mỗi loại hiện đủ 7 câu cùng thời gian bắt đầu/kết thúc. Tổng/giờ cũ chưa có bằng chứng giữ chưa biết; không lấy giờ nâng cấp làm lịch sử. CLI chỉ còn scout/run/board/orders.
