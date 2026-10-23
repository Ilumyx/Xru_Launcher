# Tố giác

Hộp thư hai chiều giữa UI (Claude) và Sector Admin. UI ghi lỗi lõi thấy khi audit nhưng không được sửa (ngoài DMZ `ui_backend_service/`). Sector Admin làm xong thì ghi ngay dưới mục ("xong, Order N, dùng hàm X") hoặc xoá mục; Claude đọc file đầu mỗi phiên và kiểm hàng. PO chỉ cần báo "có hàng".

Luật DMZ: Sector Admin sửa lõi mà phải sửa kèm `ui_backend_service/` cho test xanh thì cứ sửa, để chung trong Order của mình; Claude soát lại qua `git log -- ui_backend_service/`. Cập nhật 23/10/2026. Đã xong: Gate Order 55 (tìm bằng SQL, xoá đường chụp cả lane, trần 250), Crawler Order 134 (tem sổ), Crawler Order 136 (lượt mồ côi: khoá tiến trình theo run, đóng sổ ở phía ghi; UI kiểm 23/10: `running` 3 → 0, cửa UI vẫn chỉ đọc).

## Crawler

1. **`/api/board` còn tăng tuyến tính** (Ca 3 trong `UI_STUDY_CASE.md`). Bảng phải đối chiếu hai sổ nên bê link và món lên Python. Chưa gấp; khi kho tới vài chục nghìn món thì đo lại và tính gom bằng SQL.

## Gate

1. **Sidebar lọc của màn video (PO 23/10).** Danh sách tiêu đề ở sidebar bị xoá (wall đã là chỗ chọn clip), thay bằng cây nguồn nền tảng → kênh và lọc theo trạm flag. Lõi `local_registrar/queue.py` cần:
   - **Đếm trước, lọc sau.** `sources` (và `reasons` bên dưới) đếm trên cả lane (`media_type` + `state`), không co lại theo `platform` / `source` / `reason` / `q` đang chọn. Hiện dòng lọc `platform` đứng trước `facet_sql` nên chọn Facebook thì Waralbum biến khỏi cây.
   - **Lọc theo trạm:** tham số `reason` (một tag, ví dụ `STATIC_BORDER`) khớp khi tag nằm trong `gate_flag_reason` tách theo `' + '`. Trả thêm `reasons: [{reason, total}]` cho lane. Cửa UI (`ui_backend_service/service.py`) chuyển `reason` xuống lõi; sửa luôn trong Order của Gate cho test xanh.
   - **Xoá legacy:** bảng tên tắt `FB` / `TG` / `DVIDS` / `REDDIT` / `ALL` trong `page()` và nhánh đọc ngược nhãn `"FB / tên"` trong `_source_sql`. UI chỉ gửi `platform=facebook` (rỗng là tất cả) và `source=facebook:MIKN`; UI không đọc `label` của `sources` nữa. Sort `source` UI cũng bỏ (đã có cây nguồn); CLI không dùng thì xoá luôn.
