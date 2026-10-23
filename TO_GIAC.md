# Tố giác

Hộp thư hai chiều giữa UI (Claude) và Sector Admin. UI ghi lỗi lõi thấy khi audit nhưng không được sửa (ngoài DMZ `ui_backend_service/`). Sector Admin làm xong thì ghi ngay dưới mục ("xong, Order N, dùng hàm X") hoặc xoá mục; Claude đọc file đầu mỗi phiên và kiểm hàng. PO chỉ cần báo "có hàng".

Luật DMZ: Sector Admin sửa lõi mà phải sửa kèm `ui_backend_service/` cho test xanh thì cứ sửa, để chung trong Order của mình; Claude soát lại qua `git log -- ui_backend_service/`. Cập nhật 23/10/2026. Đã xong: Gate Order 55 (tìm bằng SQL, xoá đường chụp cả lane, trần 250), Crawler Order 134 (tem sổ), Crawler Order 136 (lượt mồ côi: khoá tiến trình theo run, đóng sổ ở phía ghi; UI kiểm 23/10: `running` 3 → 0, cửa UI vẫn chỉ đọc), Gate Order 56 (đếm nguồn/trạm trên cả lane rồi mới lọc, tham số `reason`, xoá tên tắt nguồn cũ và sort `source`; UI kiểm 23/10: 99 + 11 test xanh, lọc YAMNET còn 23, cây giữ đủ).

## Crawler

1. **`/api/board` còn tăng tuyến tính** (Ca 3 trong `UI_STUDY_CASE.md`). Bảng phải đối chiếu hai sổ nên bê link và món lên Python. Chưa gấp; khi kho tới vài chục nghìn món thì đo lại và tính gom bằng SQL.


## Gate

1. **Ảnh bìa chụp lúc nhận hàng, không chụp lúc có người xem (PO 23/10).** Hiện cửa UI (`ui_backend_service/service.py`, route `/thumb`) chạy ffmpeg khi màn xin ảnh lần đầu rồi cất vào `~/.cache/xru/gate_<image|video>_thumbs/`, nên clip mới mở lần đầu còn chậm (Ca 5 và Luật gốc trong `UI_STUDY_CASE.md`). Ý PO: lúc intake kéo hàng về, Gate xin chút CPU chụp sẵn ảnh bìa 240px và 480px (video lấy khung ở 10% thời lượng) và cất vào kho dữ liệu Gate, chỗ do Gate chọn. Cửa UI chỉ đọc file có sẵn. Intake không cần biết UI: ảnh bìa là đồ của món, như sổ. Kho cũ thì cần một lệnh chụp bù. Gate làm xong thì sửa route `/thumb` trong Order của mình cho đọc chỗ mới và xoá đường ffmpeg cùng cache cũ; UI soát lại.
