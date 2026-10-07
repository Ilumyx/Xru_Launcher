# UI XRU

Cập nhật: 07/10/2026. Ilumyx giao Codex phụ trách Launcher và UI liên quan.

File này giữ quyết định và việc đang làm để phiên sau nối tiếp được. Không chép lại implementation; đường dẫn bên dưới là nơi kiểm code hiện tại. Cập nhật mục cũ khi quyết định đổi, không nối thêm luật sau mỗi lỗi.

## Trách nhiệm

- Ilumyx chốt mục tiêu sử dụng, mặt màn và ưu tiên. Codex tự chuyển ý định thành việc kỹ thuật, thực hiện và kiểm kết quả.
- Codex chịu trách nhiệm từ mặt màn, tương tác, dữ liệu hiển thị đến chuỗi thao tác PO dùng thật; đúng hình và test xanh chưa đủ để báo xong.
- Phạm vi: Launcher và UI của các land liên quan, gồm Crawler, Gate, Label; phần bật/tắt UI trong `Xru_TUI` thuộc công việc tích hợp này.
- Một người phụ trách chung không thay ownership: UI nằm trong land/feature của nó và tuân theo ranh giới độc lập bên dưới. Nếu cần đổi boundary hoặc contract, bàn với Ilumyx trước.
- Làm trọn từng màn theo ưu tiên đã chốt. Giao phụ trách không phải cho phép tự thiết kế lại tất cả màn cùng lúc.

## Quyết định đã chốt

### Lõi và CLI độc lập với UI

- XRU hướng tới vận hành bằng AI qua CLI. UI là một cách sử dụng song song dành cho PO; nghiệp vụ không được đòi hỏi mở UI hoặc Launcher mới chạy được.
- UI là lớp mỏng: trình bày dữ liệu và gọi nghiệp vụ có sẵn của chính land. UI được import các hàm đọc/ghi của lõi trong cùng land; không cần dựng API riêng hay gọi subprocess chỉ để tránh import. Quy tắc nghiệp vụ, kiểm tra và ghi dữ liệu vẫn thuộc lõi, không làm một bản nghiệp vụ khác trong UI.
- Chiều phụ thuộc là UI → lõi. Lõi/CLI không import hoặc phụ thuộc UI. Giữa các land vẫn không cross-import.
- Gỡ UI và Launcher ra thì lõi, CLI và dữ liệu vẫn vận hành bình thường. Khi kiểm ranh giới này, chạy nghiệp vụ qua CLI với UI vắng mặt.

### Mặt màn

- Mockup PO đã duyệt chỉ chốt hình dáng: bố cục, chữ, vị trí, màu và rail/logo. Mockup được dựng để diễn đạt mặt màn; logic/JS, nút và phím trong đó không phải đặc tả chức năng. Số giả thay bằng dữ liệu thật.
- Chức năng lấy từ yêu cầu PO đã chốt và nghiệp vụ đang có. Không tự thêm hành vi hoặc chép logic chỉ vì mockup có; chỗ chưa rõ thì làm rõ với PO.
- Chỗ mockup có mà dữ liệu thật chưa có: để trống và báo rõ, không tự chế.
- Giữ các chức năng đã có, trừ khi PO yêu cầu thay đổi.
- PO yêu cầu bỏ phím J chuyển ảnh ở Gate ảnh ngày 07/10.
- Rail Launcher giữ Search ở vị trí chính, Kit là mục phụ riêng bên dưới. Mở Kit vẫn giữ Search; trang Search cũng có đường sang Kit. Menu minh họa trong Kit không thay rail điều hướng này.
- Màn có cột danh sách giữ nút đóng/mở danh sách trên rail, cả khi mở trực tiếp lẫn nằm trong vỏ Launcher. Cả ba màn Gate hiện tại (ảnh, video, Dash) đều có nút này. Vỏ gửi thao tác đóng/mở cho UI của land; land tự đổi bố cục, không đụng nghiệp vụ.
- Thử nghiệm template đã được revert; không áp lại Order template cũ. Gate ảnh và Gate video hiện dùng khung từ `Xru_Launcher/kit` trên ổ đĩa, không tải khung qua server `:5050`.

### Nhịp làm việc

- UI phục vụ một phiên làm việc liên tục. Chọn mục, lọc, sắp xếp, duyệt và sửa trong cùng màn chỉ đổi phần liên quan; giữ vị trí làm việc, lựa chọn còn hợp lệ và nội dung chưa lưu.
- Lọc/sắp xếp phải đúng trên toàn bộ hàng chờ, kể cả khi màn chia trang; không chỉ xử lý các món đang có trong trình duyệt rồi coi đó là toàn bộ dữ liệu.
- Máy chủ xác nhận lưu thành công rồi màn mới báo đã lưu và cập nhật kết quả. Khi thất bại, giữ việc đang làm và báo rõ để thử lại.
- Chuyển sang nhà/màn khác có thể mở trang mới. Không cấm thẻ link/form; kiểm hành vi thực tế của thao tác.
- Không hứa thời gian xử lý “0ms”. Giữ khung ổn định trong lúc chờ dữ liệu hoặc media.

### Kiểm và bàn giao

- Thử một chuỗi thao tác như PO dùng thật, gồm giữ ghi chú/vị trí, quyết định, lọc/sắp xếp và chuyển mục; không chỉ thử từng nút riêng.
- Kiểm kết quả lưu và số liệu trên màn cùng nhau. Test xanh là bằng chứng, không thay việc kiểm màn thật.
- Ảnh bàn giao phải chụp đúng trang, mở từng ảnh kiểm trước khi gửi.
- Khi công việc có commit: báo commit, phép kiểm và phần chưa verify. Chưa push nếu PO chưa yêu cầu.
- Commit trong repo Launcher dùng `Laucher Order <số>: <nội dung>` theo tiền tố PO chốt. Nối tiếp số có sẵn, gồm lịch sử `UI Order` và `Launcher Order`; không đánh lại lịch sử. Sau `Launcher Order 4` là `Laucher Order 5`.
- Khi sửa UI trong repo land khác, dùng `Order UI <số>: <nội dung>` để phân biệt với Order gốc của land. Tra Git của chính repo đó và nối tiếp số Order cao nhất (cả Order gốc và Order UI), không bắt đầu một dãy UI riêng. Ví dụ Gate đang có `Order 32` thì commit UI tiếp theo là `Order UI 33`. Quy ước này áp dụng từ giờ, không đổi tên các commit cũ.

## Việc đang chờ

Đây là hiện trạng kiểm code ngày 07/10, không phải danh sách màn đã nghiệm thu.

UI Gate ảnh, Gate video, Label và Crawler đang gọi hàm nghiệp vụ trong chính land của chúng. Điều này phù hợp chiều phụ thuộc UI → lõi; không phải việc cần tách hay lý do đổi kiến trúc.

Kiểm ngày 07/10: 0 import trực tiếp từ lõi/CLI sang UI trong 285 file Python ngoài UI/tests của 5 vùng nghiệp vụ (Gate ảnh/video, Label video, Crawler ảnh/video). Khi chặn import các package UI, 3 lệnh `stats` của Gate ảnh/video và Label cùng 2 lệnh `--help` của Crawler source stats vẫn chạy. Đây là bằng chứng cho phạm vi đã thử, chưa phải kiểm toàn bộ nghiệp vụ khi gỡ thư mục UI thật.

| Phần | Hiện trạng / việc tiếp theo |
|---|---|
| Gate ảnh | Đã bỏ phím J theo yêu cầu PO. Lỗi audit về lọc chỉ một trang, phím điều hướng chọn món bị ẩn và inspector/nút quyết định còn bật khi không có kết quả vẫn cần sửa. Ưu tiên lọc/sort toàn hàng chờ và chọn đúng tập đang hiện. Link Watch còn dẫn mockup. |
| Gate video | Audit tái hiện mất note/noise chưa lưu khi đổi clip rồi quay lại. Lọc/sort còn tải cả trang. Quyết định đã dùng fetch. |
| Label | Phản hồi lưu toàn dòng có thể xóa draft ở ô khác (đã tái hiện bằng hàm thật/phản hồi mô phỏng). Chọn video từ trang hai làm sidebar về trang một (đã kiểm browser). Thêm/xóa protagonist còn redirect. |
| Crawler | Màn thật mở được. Fixture đọc lỗi cho thấy dashboard giấu lane_errors thành số 0, donut thành 1. Cần hiển thị lỗi/thiếu dữ liệu đúng. |
| Launcher / TUI | TUI start/stop đã sửa (`30caa7b`, `74bfe40`). Đã sửa avatar IL mất click sau khi rail vẽ lại; TUI cập nhật trạng thái dịch vụ ngay sau bật/tắt, mô tả rõ Bật chỉ bật Launcher và trả lỗi khi khởi động thất bại. Audit còn chờ: launcher.py stop có thể bỏ sót process chạy trực tiếp không phải trưởng group. |

Audit 07/10: 100/100 test UI Gate + Label qua; các lỗi tương tác trên vẫn tồn tại. Báo cáo, phạm vi verify và ảnh ở `Xru_Code/.codex/evidence/ui-audit-20261007/audit.md`. Audit không sửa code UI/lõi hoặc ghi quyết định/nhãn vào dữ liệu PO.

Bug report avatar/TUI 07/10: avatar mở được sau 4 lần rail vẽ lại; bảng cài đặt mở lại được. Test TUI tương tác với tiến trình mô phỏng xác nhận header DOWN → READY trước khi tiếp tục, khởi động lỗi trả exit 1. Launcher thật :5050 đang READY; Gate/Label đang tắt, được bật khi mở module trong Launcher. Evidence: `Xru_Code/.codex/evidence/avatar-tui-20261007/`.

Bug report nút đóng/mở danh sách 07/10: vỏ Launcher thiếu nút khi ẩn rail riêng của Gate. Đã khôi phục trên rail của vỏ cho cả ảnh, video và Dash, gọi hành vi UI của màn qua thông điệp giữa hai trang. Đã thử browser đóng/mở cả ba màn qua Launcher; Gate ảnh cũng đã thử trực tiếp :5059. Không tải lại màn. Kiểm thông điệp sai nguồn/origin/type không được xử lý. Gate video bật tạm để kiểm đã tắt lại. Evidence: `Xru_Code/.codex/evidence/sidebar-toggle-20261007/`.

## Chỗ bắt đầu đọc code

Các đường dẫn tính từ `Xru_Code/`, trừ TUI nằm cạnh `Xru_Code/`.

- Launcher: `Xru_Launcher/launcher.py`, `home/`, `shell/`, `kit/`, `mockups/`.
- Gate ảnh: `Xru_Gate/gate_image/ui_screen/`, HTTP quyết định ở `Xru_Gate/gate_image/ui_clerk_desk/`.
- Gate video: `Xru_Gate/gate_video/ui_screen/`.
- Label video: `Xru_Label/label_division_video/video_po_review_ui/`.
- Crawler: `Xru_Crawler/ui_screen/`.
- Lệnh bật/tắt UI: `../Xru_TUI/lib/xru/federal.sh`.
