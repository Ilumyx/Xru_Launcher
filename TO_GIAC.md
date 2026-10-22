# Tố giác

Lỗi lõi mà UI thấy khi audit nhưng không được sửa (ngoài DMZ `ui_backend_service/`). PO ném từng mục cho Sector Admin của nhà đó; làm xong thì Sector Admin xoá mục khỏi file này. Cập nhật 22/10/2026.

## Gate

Từ audit UI đầu trắng 22/10. Đất UI đã dọn phần của mình (Order UI 52–54).

1. **Ô tìm quét cả sổ DIRC bằng Python mỗi lần gõ.**
   - Chỗ: `dirc_embassy/embassy.py` `search_residency_ids` đăng ký hàm Python `cf()` rồi `LIKE` trên mọi dòng `residency` của loại đó. `local_registrar/queue.py` (~dòng 121–126) nhận tập id khớp rồi nhét hết vào một `IN (?,?,…)`.
   - Đo (kho giả 100k dòng): riêng phần quét khoảng 0,1 giây mỗi phím gõ. Từ phổ biến khớp cả 100k id, tất cả đi vào một câu SQL. SQLite máy này nhận được nên chưa sập, nhưng tăng tuyến tính.
   - Cần: cột tìm đã chuẩn hoá (casefold) hoặc bảng FTS5 trong DIRC, và `JOIN` thay cho danh sách id. Hàng chờ Gate nối với kết quả tìm ngay trong SQL.
2. **Đường "chụp cả lane" cũ vẫn còn.**
   - Chỗ: `local_registrar/queue.py` `snapshot()`, `items()`, `_page_from_snapshot`, `_detail_from_snapshot`, nhánh `isinstance(root_or_snapshot, dict)` trong `page`, `detail` và `local_registrar/stats.py` `summarize`.
   - Đây là đường gây Ca 4 (`Xru_Launcher/UI_STUDY_CASE.md`). Order 47 đã chuyển mọi endpoint sang SQL. Ngoài test, không còn ai gọi (UI Backend đã bỏ import ở Order UI 54).
   - Cần: xoá hẳn, sửa test theo. Test `ui_backend_service/tests/test_http.py` có chặn `queue.snapshot`; xoá xong thì bỏ luôn dòng chặn đó.
3. **Trần `limit` hàng chờ là 100.**
   - Chỗ: `local_registrar/queue.py` `page()` kiểm `1<=limit<=100`.
   - PO chốt tường ảnh 250 ảnh một trang, nên UI phải đọc 3 lượt song song rồi ghép. Ba lượt không cùng một snapshot, nên lúc đang có quyết định có thể lệch một món.
   - Cần: nâng trần lên 250 (đủ cho tường ảnh), hoặc cho `limit` theo loại. Nâng xong báo UI để đổi về một lượt.

## Crawler

1. **Màn Crawler không biết khi nào sổ đổi.**
   - Hiện tại: `/api/board` dựng lại cả bảng (đọc 27k link + 12k món, khoảng 0,1 giây hôm nay, ước khoảng 1 giây ở 120k món). Màn chỉ đọc lúc mở trang, nên số "ĐANG CÀO" đứng im.
   - Cần: một "tem sổ" rẻ trong `local_registrar`, ví dụ `MAX(rowid)` của bảng sinh + `MAX(updated_at)` của bảng lượt chạy, hoặc một bộ đếm tăng mỗi lần ghi. UI Backend sẽ mở `GET /api/stamp` đọc tem đó. Màn hỏi tem 5 giây một lần, tem đổi mới đọc lại bảng.
   - Chỉ cần hàm đọc tem trong lõi; endpoint và màn là việc của UI.
2. **`/api/board` còn tăng tuyến tính** (Ca 3 trong `UI_STUDY_CASE.md`). Bảng phải đối chiếu hai sổ nên bê link và món lên Python. Chưa gấp; khi kho tới vài chục nghìn món thì đo lại và tính gom bằng SQL.
