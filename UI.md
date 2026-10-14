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

Crawler (Order 111): Backend `Xru_Crawler/ui_backend_service/` chỉ đọc `heart.db`, `clerk.db`, config cụm và `labels.json`; màn `crawler/` trên 5050 chỉ gọi HTTP. Hiện đủ các cụm trong config kể cả chưa chạy, cộng các cụm đã có số liệu; tên là `name` trong `labels.json`, không hiển thị link. Bảng hàng gọn, tên 20px; ô ảnh/video không viền hoặc chữ bật/tắt, bật sáng/tắt tối. Số là đã sinh/tổng từng loại, ví dụ 40/12400; tổng chưa biết hiện —, không lấy số đã dò một phần làm tổng toàn nguồn. DVIDS/War Album dùng tổng riêng theo loại đã hỏi nguồn và ghi trong sổ; cột cuối là ngày cào gần nhất lấy từ last_born_at. Bỏ chip tag trên bảng và sidebar; tag quốc gia thành cờ cạnh tên, mỗi nền tảng một màu, nguồn tắt tối cả dòng, vạch tiến độ dưới số; tìm theo tên/nền tảng. ID máy tự giải quyết, PO không điền. Cùng page ảnh/video một dòng; không làn, không tier; cột ẢNH/VIDEO đếm món đã sinh, bỏ lọc Thiếu ảnh/Thiếu video. Bật/tắt từ config, note từ `labels.json`; link đã tìm/chờ, lỗi gần nhất và lần sinh gần nhất theo cụm. Dashboard hôm nay/7 ngày dùng born_at (Asia/Ho_Chi_Minh), không dùng giờ quét hoặc ngày đăng nguồn. Chỉ báo Hỏng khi có lỗi thật; trùng SHA/Ctrl+C/bảo chờ không làm cụm hỏng. Link đã bị từ chối trùng không còn tính chờ. Thiếu sổ trả unknown/null, zero thật vẫn là zero. Lọc/sort/tìm/chi tiết cập nhật tại chỗ; sort theo nguồn và theo ngày cào (menu hoặc bấm đầu cột Platform/Ngày, bấm lần nữa đảo chiều); UI chỉ đọc, không sửa config.

Gate Dash: màn `gate/dash/` trên 5050 đọc `/api/stats` từ Backend ảnh 5059 và video 5058, không gọi CLI. Giữ số và nghĩa cũ; NONE = chưa có kết luận máy, không phải sạch. Lane không trả dữ liệu thì báo đang tắt/chưa có số; lane còn lại vẫn đọc được. Đã đối chiếu số tổng/trạng thái/nguồn với hai API và kiểm tắt từng Backend rồi phục hồi. Đã xoá màn, test và server Dash cũ.

Label video (Claude làm theo yêu cầu PO 07/10): Backend `Xru_Label/label_division_video/backend_service/` gọi use case `label_division_review`; màn `label/video/` trên 5050 cùng khung Gate (hàng chờ kit | sân khấu frame/video + timeline + bảng nhãn | hồ sơ). Lọc Tất cả/Thiếu/Đủ trên toàn hàng chờ (số đếm từ cùng catalog). Lưu một ô chỉ gửi ô đó, ô đang gõ khác giữ nguyên; thêm/xoá nhân vật tại chỗ; trang hàng chờ và mục đang mở giữ trên URL. Đã kiểm chuỗi trên fixture và đọc dữ liệu thật (322 = CLI, phát/tua video); xoá `video_po_review_ui/` và lệnh `start-apps`.

## Còn mở

Không còn mục mở từ đợt chuyển.

## Commit

- Repo Launcher: `Laucher Order <số>: …`, nối tiếp số cũ.
- Repo land: `Order UI <số>: …`, nối tiếp số Order cao nhất của repo đó.
- Báo commit, phép kiểm, phần chưa kiểm. Không push khi PO chưa bảo.
