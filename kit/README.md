# XRU Kit

Thư viện UI gốc của XRU Federal. Xem tận mắt: mở `kit/index.html` qua Launcher (`python3 launcher.py` → http://127.0.0.1:5050/kit/).
Phiên bản: `kit/VERSION`. Kit **không biết land nào có màn gì**: menu, dữ liệu, bố cục riêng nằm ở trang dùng kit.

| Câu hỏi | Trả lời ở | Luật |
|---|---|---|
| Màu gì? | `profiles/<tên>.css` | Màu **chỉ** khai báo ở đây: thang xám `--m-0..15` + `--accent-rgb`, `--warn-rgb`, `--hold-rgb`. Mặc định Graphite. |
| Màu dùng vào việc gì? | `tokens.css` | Trang chỉ gọi vai trò: `--bg`, `--fg*`, `--accent`, `--warn`, `--hold`, `--idle`. Không viết mã màu trong trang. Đỏ chỉ cho chỗ cần PO nhìn. |
| Chữ, khoảng cách? | `tokens.css` | Inter cho chữ đọc, JetBrains Mono cho số/mã/nhãn. |
| Icon nào? | `icons/icons.svg` | Mọi icon một file, `<symbol id="i-TÊN">`, nét 24×24 không tô. |
| Rail ra sao? | `rail/` | Chỉ vẽ. Menu do trang đưa vào `window.XRU_RAILS`. Trong vỏ thì tự bỏ rail. |
| Đầu/chân trang? | `page/page.css` | `.page-head` (LỤC ĐỊA / LAND / MÀN) + `.page-foot` (phím tắt trái, nhãn phải). |
| Cột lọc trái? | `sidebar/` | Số đếm · tìm nhanh · lọc · sắp xếp · danh sách · phân trang. Rộng `--side-w`. Rail gắn `data-panel` để đóng/mở. |
| Cài đặt (avatar IL)? | `account/` | Ngôn ngữ, profile, sáng/tối, font, màu nhấn, cỡ. Lưu trong trình duyệt. |
| Chữ hai thứ tiếng? | `i18n/i18n.js` | `data-i18n="khóa"`, đủ `vi` + `en`. English mặc định. Dữ liệu (tên kênh, chú thích) giữ tiếng gốc. Chữ riêng của land: land tự giữ, nạp bằng `XRU_I18N.add({vi, en})`. |

## Thêm profile
Copy `profiles/graphite.css` → đổi tên + `data-profile`; thêm 1 dòng `@import` trong `tokens.css`; 1 dòng vào `PROFILES` trong `account/account.js`.

## Land chép kit về
Chép **nguyên thư mục `kit/`** vào land, rồi ghi một dòng ở README của land: `kit vN từ Xru_Launcher @<commit>`.
Không sửa kit trong land; cần sửa thì sửa ở Xru_Launcher rồi chép lại.

## Một món mới vào kit khi nào?
Khi nó đã có ở **ít nhất 2 màn đã chốt**. Một màn dùng thì để ở màn đó.
