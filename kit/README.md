# XRU Kit

Thư viện UI gốc của XRU Federal. Xem tận mắt: mở `kit/index.html` qua Launcher (`python3 launcher.py` → http://127.0.0.1:5050/kit/).
Phiên bản: `kit/VERSION`. Kit **không biết land nào có màn gì**: menu, dữ liệu, bố cục riêng nằm ở trang dùng kit.

| Câu hỏi | Trả lời ở | Luật |
|---|---|---|
| Màu gì? | `profiles/<tên>.css` | Màu **chỉ** khai báo ở đây: thang xám `--m-0..15` + `--accent-rgb`, `--warn-rgb`, `--hold-rgb`. Mặc định Graphite. |
| Màu dùng vào việc gì? | `tokens.css` | Trang chỉ gọi vai trò: `--bg`, `--fg*`, `--accent`, `--warn`, `--hold`, `--idle`. Không viết mã màu trong trang. Đỏ chỉ cho chỗ cần PO nhìn. |
| Chữ, khoảng cách? | `tokens.css` | Inter cho chữ đọc, JetBrains Mono cho số/mã/nhãn. |
| Icon nào? | `icons/icons.svg` | Mọi icon một file, `<symbol id="i-TÊN">`, nét 24×24 không tô. |
| Rail ra sao? | `rail/` | Chỉ vẽ. Menu do trang đưa vào `window.XRU_RAILS`. Mỗi màn giữ rail của nó; không lồng màn trong iframe. |
| Đầu/chân trang? | `page/page.css` | `.page-head` (LỤC ĐỊA / LAND / MÀN) + `.page-foot` (phím tắt trái, nhãn phải). |
| Cột lọc trái? | `sidebar/` | Số đếm · tìm nhanh · lọc · sắp xếp · danh sách · phân trang. Rộng `--side-w`. Rail gắn `data-panel` để đóng/mở. |
| Cài đặt (avatar IL)? | `account/` | Ngôn ngữ, profile, sáng/tối, font, màu nhấn, cỡ. Lưu trong trình duyệt. |
| Chữ hai thứ tiếng? | `i18n/i18n.js` | `data-i18n="khóa"`, đủ `vi` + `en`. English mặc định. Dữ liệu (tên kênh, chú thích) giữ tiếng gốc. Chữ riêng của land: land tự giữ, nạp bằng `XRU_I18N.add({vi, en})`. |

## Thêm profile
Copy `profiles/graphite.css` → đổi tên + `data-profile`; thêm 1 dòng `@import` trong `tokens.css`; 1 dòng vào `PROFILES` trong `account/account.js`.

## Màn dùng Kit
Server của land đọc `Xru_Launcher/kit` trên ổ đĩa và phục vụ asset bằng route của chính server đó. Không chép Kit, không tải CSS/JS từ :5050.

UI Jinja dùng `{% extends "kit/base_workstation.html" %}`. Khung chung giữ asset, rail và sidebar; trang đưa menu, tiêu đề, nội dung, CSS/JS riêng qua các block. Xem màn thật trong Gate ảnh/video và Label. Trang tĩnh như Crawler vẫn dùng trực tiếp các component; không cần thêm engine template.

`data-panel` tạo nút đóng/mở. Kit đổi `html.sidebar-hidden`, CSS thu cột `.side` theo `--side-w`. Màn có layout riêng như Label ánh xạ cùng class vào cột của mình. LocalStorage lưu tại từng cổng; cookie cùng host giữ lựa chọn khi chuyển giữa các cổng. Logo/ESC theo `home` của menu; phần đang mở hoặc ô nhập được xử lý ESC trước.

## Một món mới vào kit khi nào?
Khi nó đã có ở **ít nhất 2 màn đã chốt**. Một màn dùng thì để ở màn đó.
