# UI XRU

Sổ chung của Codex và Claude. Chỉ hai file: `UI.md` (quyết định, việc) và `README.md` (chạy, thư mục, Kit). Cập nhật: 07/10/2026.

## Ai làm gì

- PO chốt mục tiêu, mặt màn, thứ tự.
- Codex làm code. Claude soát theo bản vẽ PO, không sửa code song song.
- Trước khi code: nói lại bản vẽ PO, PO gật mới làm. Quyết định mới ghi vào đây, sửa câu cũ, không nối thêm.

## Kiến trúc (bản vẽ PO, 07/10)

```
Lõi land ──► CLI ──► LLM
   └──────► Backend ──HTTP──► UI (module rời, ngoài mọi land)
```

- UI chỉ gọi Backend. Không import lõi, không đọc sổ, không gọi CLI.
- Backend thuộc land, đọc/ghi qua clerk. Trả JSON; ảnh/video trả file, video tua được.
- Gỡ UI thì lõi, CLI, Backend vẫn chạy. Tắt một Backend thì màn đó báo đang tắt.
- Số nào chưa có nguồn và nghĩa rõ thì không hiện. Không số tĩnh, không số gõ tay.

| Cổng | Vai trò |
|---|---|
| 5050 | UI: sảnh, Kit, mọi màn |
| 5059 / 5058 | Backend Gate ảnh / video |
| 5057 / 5055 | Hiện là UI Label / Crawler, thành Backend khi tới lượt |
| 5056 | Bỏ khi Gate Dash về 5050 |

## Thứ tự

Gate ảnh → Gate video → Gate Dash → Label → Crawler.

Mỗi lane: Backend → màn trên 5050 → PO dùng thật → xoá ui_screen và server UI cũ của lane. Không giữ hai bản.

Lane 1 — Gate ảnh: Backend `Xru_Gate/gate_image/backend_service/` đọc/ghi qua clerk; màn `gate/image/` trên 5050 chỉ gọi HTTP. Đã kiểm trên dữ liệu thử và đọc dữ liệu thật. PO yêu cầu clean ngay, bỏ bước chờ dùng thật cho lần chuyển này: đã xoá các ngăn `gate_image/ui_*`, server và khai báo màn cũ; chưa chuyển Gate video/Dash.

## Còn mở (sửa khi chuyển lane, không vá màn cũ)

- Gate ảnh: lọc trước phân trang tại Backend; phím chọn trong kết quả hiện tại; hết kết quả thì xoá inspector, khoá quyết định. Đã kiểm bằng fixture và trình duyệt; PO chưa nghiệm thu thao tác trên dữ liệu thật.
- Gate video: mất note chưa lưu khi đổi clip; SQL thẳng vào sổ, count và danh sách đọc tách nhau.
- Gate Dash: đang gọi CLI `stats`. NONE = máy chưa kết luận, không phải sạch.
- Label: lưu dòng xoá draft ô khác; chọn video trang 2 nhảy về trang 1.
- Crawler: lỗi lane hiện thành 0.

## Commit

- Repo Launcher: `Laucher Order <số>: …`, nối tiếp số cũ.
- Repo land: `Order UI <số>: …`, nối tiếp số Order cao nhất của repo đó.
- Báo commit, phép kiểm, phần chưa kiểm. Không push khi PO chưa bảo.
