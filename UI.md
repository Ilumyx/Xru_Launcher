# UI XRU

Cập nhật: 07/10/2026. Ilumyx giao Codex phụ trách Launcher và UI liên quan.

File này giữ quyết định và việc đang làm để phiên sau nối tiếp được. Không chép lại implementation; đường dẫn bên dưới là nơi kiểm code hiện tại. Cập nhật mục cũ khi quyết định đổi, không nối thêm luật sau mỗi lỗi.

## Trách nhiệm

- Ilumyx chốt mục tiêu sử dụng, mặt màn và ưu tiên. Codex tự chuyển ý định thành việc kỹ thuật, thực hiện và kiểm kết quả.
- Codex chịu trách nhiệm từ mặt màn, tương tác, dữ liệu hiển thị đến chuỗi thao tác PO dùng thật; đúng hình và test xanh chưa đủ để báo xong.
- Phạm vi: Launcher và UI của các land liên quan, gồm Crawler, Gate, Label; phần bật/tắt UI trong `Xru_TUI` thuộc công việc tích hợp này.
- Một người phụ trách chung không thay ownership: UI nằm trong land/feature của nó. UI là lớp mỏng, không sửa lõi hoặc đổi contract chỉ để dựng mặt. Nếu cần đổi boundary, bàn với Ilumyx trước.
- Làm trọn từng màn theo ưu tiên đã chốt. Giao phụ trách không phải cho phép tự thiết kế lại tất cả màn cùng lúc.

## Quyết định đã chốt

### Mặt màn

- Dùng mockup PO đã duyệt làm chuẩn cho bố cục, chữ, vị trí, màu và rail/logo. Số giả thay bằng dữ liệu thật.
- Chỗ mockup có mà dữ liệu thật chưa có: để trống và báo rõ, không tự chế.
- Giữ các chức năng đã có, trừ khi PO yêu cầu thay đổi.
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

## Việc đang chờ

Đây là hiện trạng kiểm code ngày 07/10, không phải danh sách màn đã nghiệm thu.

| Phần | Hiện trạng / việc tiếp theo |
|---|---|
| Gate ảnh | `9d288d1` đã thêm cập nhật tại chỗ. Cần xử lý việc lọc chỉ trong trang đã tải, kiểm sắp xếp/phân trang và giữ nhịp sau quyết định; chưa verify trọn chuỗi thao tác của bản này. |
| Gate video | Quyết định và chọn video đã có cập nhật tại chỗ. Lọc/sắp xếp còn gửi form tải trang; đổi video thay vùng player/inspector và có nhánh tải lại trang. Cần hoàn thiện nhịp làm việc. |
| Label | Sửa ô nhãn đã lưu tại chỗ. Chọn video trong hàng chờ, thêm/xóa protagonist còn đi sang trang hoặc POST rồi redirect. Cần hoàn thiện nhịp làm việc. |
| Crawler | Chưa rà lại tương tác trong đợt này. Không tự đổi mặt hay chức năng khi sửa Gate/Label. |
| Launcher / TUI | `Xru_TUI` đã trỏ đúng Launcher (`30caa7b`); `xru stop` đã xử lý cả server UI bật trực tiếp (`74bfe40`). Đã thử bật/tắt Launcher và hai Gate, kiểm các cổng đóng. |

## Chỗ bắt đầu đọc code

Các đường dẫn tính từ `Xru_Code/`, trừ TUI nằm cạnh `Xru_Code/`.

- Launcher: `Xru_Launcher/launcher.py`, `home/`, `shell/`, `kit/`, `mockups/`.
- Gate ảnh: `Xru_Gate/gate_image/ui_screen/`, HTTP quyết định ở `Xru_Gate/gate_image/ui_clerk_desk/`.
- Gate video: `Xru_Gate/gate_video/ui_screen/`.
- Label video: `Xru_Label/label_division_video/video_po_review_ui/`.
- Crawler: `Xru_Crawler/ui_screen/`.
- Lệnh bật/tắt UI: `../Xru_TUI/lib/xru/federal.sh`.
