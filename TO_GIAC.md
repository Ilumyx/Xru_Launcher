# Tố giác

Hộp thư hai chiều giữa UI (Claude) và Sector Admin. UI ghi lỗi lõi thấy khi audit nhưng không được sửa (ngoài DMZ `ui_backend_service/`). Sector Admin làm xong thì ghi ngay dưới mục ("xong, Order N, dùng hàm X") hoặc xoá mục; Claude đọc file đầu mỗi phiên và kiểm hàng. PO chỉ cần báo "có hàng".

Luật DMZ: Sector Admin sửa lõi mà phải sửa kèm `ui_backend_service/` cho test xanh thì cứ sửa, để chung trong Order của mình; Claude soát lại qua `git log -- ui_backend_service/`. Cập nhật 23/10/2026. Đã xong: Gate Order 55 (tìm bằng SQL, xoá đường chụp cả lane, trần 250), Crawler Order 134 (tem sổ).

## Crawler

1. **`/api/board` còn tăng tuyến tính** (Ca 3 trong `UI_STUDY_CASE.md`). Bảng phải đối chiếu hai sổ nên bê link và món lên Python. Chưa gấp; khi kho tới vài chục nghìn món thì đo lại và tính gom bằng SQL.
2. **Ba lượt chạy mồ côi.** `read_stamp()` trả `running: 3`, `run_updated_at` dừng ở 19/10, nhưng không có tiến trình Crawler nào đang chạy và `/api/board` không hiện lượt nào "đang chạy". Có thể là lượt bị ngắt mà chưa đóng (state vẫn `running`). Màn chưa dùng `running` nên chưa ai thấy; cần đóng các lượt đó (`interrupted`) hoặc để lõi tự đóng lượt mồ côi khi khởi động.
