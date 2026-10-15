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
| 5057 | Backend Label video |

## Thao tác trong một màn

- Chọn ảnh/clip/dòng, lọc, sắp xếp, phân trang và quyết định cập nhật tại chỗ. Đọc/ghi qua API rồi cập nhật DOM; không tải lại cả trang bằng `form.submit()`, POST form hoặc đổi `location.href`. Link đi sang màn khác vẫn là điều hướng bình thường.
- Giữ ghi chú chưa lưu khi đổi mục rồi quay lại. Không tự mất vị trí làm việc sau khi lưu; mục đã rời hàng chờ thì chọn mục còn hiển thị. Backend lỗi thì giữ draft, báo chưa xác nhận lưu; không tự báo thành công hay sửa số bằng tay.
- Khi chuyển lane, kiểm một chuỗi chọn → ghi note → đổi mục/quay lại → lọc/sort → phân trang → quyết định. Kiểm không phát sinh tải lại document, draft/vị trí còn đúng và dữ liệu đã lưu khớp Backend. Đây là yêu cầu chung cho UI mới, không chỉ bản vá Gate ảnh.

## Thứ tự

Gate ảnh → Gate video + Crawler → Gate Dash → Label. Đã chuyển xong cả năm lane (07/10).

Mỗi lane: Backend → màn trên 5050 → Codex kiểm chuỗi thao tác → xoá ui_screen và server UI cũ của lane trong cùng đợt. Không giữ hai bản. PO không thử tay từng lane (07/10); PO chỉ xem phần phức tạp.

Lane 1 — Gate ảnh: Backend `Xru_Gate/gate_image/ui_backend_service/` đọc/ghi qua clerk; màn `gate/image/` trên 5050 chỉ gọi HTTP. Đã xoá `gate_image/ui_*`. Claude soát 07/10: đạt (API = CLI = 548, không SQL thẳng, không tải lại trang).

Gate video: Backend `Xru_Gate/gate_video/ui_backend_service/`, màn `gate/video/` trên 5050. Đã chuyển SQL về clerk; hàng chờ/count/facet cùng snapshot, lọc/sort trước phân trang. Draft note/Noise/Watermark giữ theo clip; thao tác tại chỗ. Chân trang ghi đúng phím; phím quyết định dùng được sau bấm button/link. Quay lại cửa sổ khi Backend đang đọc bình thường không vẽ lại inspector/player, giữ con trỏ và thời điểm video. Đã tự kiểm chuỗi trên fixture, xoá `gate_video/ui_*` và server màn cũ.

Crawler (Order 111): Backend `Xru_Crawler/ui_backend_service/` chỉ đọc sổ Crawler, `dirc.db`, config cụm và sticker PO ở `XRU_Data/eurasia/crawler/ui/` (`labels.json` + `shots/`); màn `crawler/` trên 5050 chỉ gọi HTTP, UI chỉ đọc, không sửa config. Tag trong `labels.json` là sticker để PO nhìn, không phải dữ liệu gốc. Màn Nguồn (15/10) theo `design/ORDER_crawler_sources.md` + `design/crawler_sources.html`, code riêng `sources.html/js/css`: một nguồn một dòng, chia nhóm Cần nhìn / Đang cào / Ổn / Chưa cào; mỗi dòng một badge theo thứ tự KẸT → ĐANG CÀO → WAITING → CHƯA CÀO → CŨ → THIẾU SCOUT → OK; ô ảnh/video `[hạng] plan │ scout │ download`; nước và icon khí tài suy từ tag; chỉ xám/đỏ/xanh. Sắp xếp vẫn như thường (menu + bấm đầu cột), trong từng nhóm. Bấm dòng mở sidebar phải chi tiết, được đè lên bảng (bảy câu từng loại, ngưỡng cũ, ghi chú, ảnh chụp PO, link nguồn); Esc đóng. Dashboard hôm nay/7 ngày dùng born_at (Asia/Ho_Chi_Minh). Chỉ báo lỗi khi có lỗi thật; thiếu sổ trả unknown/null, zero thật vẫn là zero.

Gate Dash: màn `gate/dash/` trên 5050 đọc `/api/stats` từ Backend ảnh 5059 và video 5058, không gọi CLI. Giữ số và nghĩa cũ; NONE = chưa có kết luận máy, không phải sạch. Lane không trả dữ liệu thì báo đang tắt/chưa có số; lane còn lại vẫn đọc được. Đã đối chiếu số tổng/trạng thái/nguồn với hai API và kiểm tắt từng Backend rồi phục hồi. Đã xoá màn, test và server Dash cũ.

Label video (Claude làm theo yêu cầu PO 07/10): Backend `Xru_Label/label_division_video/backend_service/` gọi use case `label_division_review`; màn `label/video/` trên 5050 cùng khung Gate (hàng chờ kit | sân khấu frame/video + timeline + bảng nhãn | hồ sơ). Lọc Tất cả/Thiếu/Đủ trên toàn hàng chờ (số đếm từ cùng catalog). Lưu một ô chỉ gửi ô đó, ô đang gõ khác giữ nguyên; thêm/xoá nhân vật tại chỗ; trang hàng chờ và mục đang mở giữ trên URL. Đã kiểm chuỗi trên fixture và đọc dữ liệu thật (322 = CLI, phát/tua video); xoá `video_po_review_ui/` và lệnh `start-apps`.

## Còn mở

Không còn mục mở từ đợt chuyển.

## Commit

- Repo Launcher: `Laucher Order <số>: …`, nối tiếp số cũ. Fix lặt vặt sau một Order thì gom vào số đó: `26.1`, `26.2`… (PO 15/10).
- Repo land: `Order UI <số>: …`, nối tiếp số Order cao nhất của repo đó.
- Báo commit, phép kiểm, phần chưa kiểm. Không push khi PO chưa bảo.

Crawler Order 118: UI và CLI board dùng cùng bảng số từ phòng Lỗi & số liệu của Crawler. Từng ô ảnh/video hiện đã sinh/tổng (nguồn không tự khai: đã thấy+), số chờ/đáy, scout cuối/thêm/độ lệch tổng, run cuối và hôm nay/7 ngày, [E] theo loại, giờ nghỉ/chờ. Sidebar mỗi loại hiện đủ 7 câu cùng thời gian bắt đầu/kết thúc. Tổng/giờ cũ chưa có bằng chứng giữ chưa biết; không lấy giờ nâng cấp làm lịch sử. CLI chỉ còn scout/run/board/orders.
