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
| 5055 | Backend Crawler |
| 5057 | UI Label cũ, thành Backend khi tới lượt |
| 5056 | Bỏ khi Gate Dash về 5050 |

## Thao tác trong một màn

- Chọn ảnh/clip/dòng, lọc, sắp xếp, phân trang và quyết định cập nhật tại chỗ. Đọc/ghi qua API rồi cập nhật DOM; không tải lại cả trang bằng `form.submit()`, POST form hoặc đổi `location.href`. Link đi sang màn khác vẫn là điều hướng bình thường.
- Giữ ghi chú chưa lưu khi đổi mục rồi quay lại. Không tự mất vị trí làm việc sau khi lưu; mục đã rời hàng chờ thì chọn mục còn hiển thị. Backend lỗi thì giữ draft, báo chưa xác nhận lưu; không tự báo thành công hay sửa số bằng tay.
- Khi chuyển lane, kiểm một chuỗi chọn → ghi note → đổi mục/quay lại → lọc/sort → phân trang → quyết định. Kiểm không phát sinh tải lại document, draft/vị trí còn đúng và dữ liệu đã lưu khớp Backend. Đây là yêu cầu chung cho UI mới, không chỉ bản vá Gate ảnh.

## Thứ tự

Gate ảnh (xong) → Gate video + Crawler (xong đợt chuyển) → Gate Dash → Label.

Mỗi lane: Backend → màn trên 5050 → Codex kiểm chuỗi thao tác → xoá ui_screen và server UI cũ của lane trong cùng đợt. Không giữ hai bản. PO không thử tay từng lane (07/10); PO chỉ xem phần phức tạp.

Lane 1 — Gate ảnh: Backend `Xru_Gate/gate_image/backend_service/` đọc/ghi qua clerk; màn `gate/image/` trên 5050 chỉ gọi HTTP. Đã xoá `gate_image/ui_*`. Claude soát 07/10: đạt (API = CLI = 548, không SQL thẳng, không tải lại trang).

Gate video: Backend `Xru_Gate/gate_video/backend_service/`, màn `gate/video/` trên 5050. Đã chuyển SQL về clerk; hàng chờ/count/facet cùng snapshot, lọc/sort trước phân trang. Draft note/Noise/Watermark giữ theo clip; thao tác tại chỗ. Chân trang ghi đúng phím; phím quyết định dùng được sau bấm button/link. Quay lại cửa sổ khi Backend đang đọc bình thường không vẽ lại inspector/player, giữ con trỏ và thời điểm video. Đã tự kiểm chuỗi trên fixture, xoá `gate_video/ui_*` và server màn cũ.

Crawler: Backend `Xru_Crawler/backend_service/` gọi reader trong `crawler_image/records/` và `crawler_video/records/`; màn `crawler/` trên 5050. Lane lỗi trả unknown/null, UI báo thiếu dữ liệu; zero thật vẫn là zero. Đã tự kiểm dash, lọc/tìm nguồn, đọc note/chi tiết và phục hồi lane lỗi; xoá `Xru_Crawler/ui_screen/` và server màn cũ. Crawler vẫn chỉ đọc, không thêm chức năng sửa nguồn.

## Còn mở (sửa khi chuyển lane, không vá màn cũ)

- Gate Dash: đang gọi CLI `stats`. NONE = máy chưa kết luận, không phải sạch.
- Label: thêm/xoá protagonist còn redirect; lưu dòng xoá draft ô khác; chọn video trang 2 nhảy về trang 1.

## Commit

- Repo Launcher: `Laucher Order <số>: …`, nối tiếp số cũ.
- Repo land: `Order UI <số>: …`, nối tiếp số Order cao nhất của repo đó.
- Báo commit, phép kiểm, phần chưa kiểm. Không push khi PO chưa bảo.
