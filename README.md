# Xru_Launcher

Module UI rời của XRU: sảnh, Kit, các màn. Quyết định và việc: [UI.md](UI.md). Không import code land.

## Chạy

```bash
python3 launcher.py             # http://127.0.0.1:5050  (--lan: mở cho mạng LAN)
python3 launcher.py start-apps  # bật các server của land
python3 launcher.py stop        # tắt hết
```

`xru start` / `xru stop` trong TUI làm việc tương tự.

## Thư mục

| Ngăn | Là gì |
|---|---|
| `launcher.py`, `index.html` | Server 5050, trang chủ |
| `kit/` | Thư viện gốc, xem tại `/kit/` |
| `home/` | Quả cầu, menu trang chủ |
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
