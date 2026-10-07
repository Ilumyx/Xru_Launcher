# UI XRU

Cập nhật: 07/10/2026. Sổ chung của Codex và Claude cho Launcher và UI. PO chốt kiến trúc theo bản vẽ của PO ngày 07/10.

File này giữ quyết định và việc đang làm để phiên sau nối tiếp được. Không chép lại implementation; đường dẫn bên dưới là nơi kiểm code hiện tại. Cập nhật mục cũ khi quyết định đổi, không nối thêm luật sau mỗi lỗi.

## Vận hành

- Ilumyx chốt mục tiêu sử dụng, mặt màn và ưu tiên.
- Codex làm code: Backend của land, module UI rời, Launcher, tích hợp TUI. Codex tự chuyển ý định thành việc kỹ thuật và kiểm kết quả; đúng hình và test xanh chưa đủ để báo xong.
- Claude soát theo bản vẽ PO và sổ này, không sửa code song song với Codex.
- Hai bên chỉ đọc sổ này làm nguồn quyết định. Thảo luận xong thì ghi vào đây; không giữ quyết định trong đầu phiên.
- Mỗi Order dùng branch/worktree riêng, nói rõ file nào được sửa. Mỗi service đang vận hành chỉ một phiên sửa tại một lúc; bản thử dùng cổng và dữ liệu riêng.
- Làm trọn từng lane theo thứ tự đã chốt. Không thiết kế lại mọi màn cùng lúc.

## Kiến trúc đích

```
Lõi land ──► CLI ──► LLM / agent
   │
   └──► Backend service (của land/lane) ──HTTP──► UI (module rời, ngoài mọi land)
```

- Lõi có hai cửa độc lập: CLI cho LLM, Backend service cho UI. Lõi không phụ thuộc cửa nào.
- Chiều phụ thuộc: CLI → lõi; Backend → lõi; UI → API Backend.
- UI thuộc module rời ngoài mọi land. UI chỉ giao tiếp với Backend qua API; không import lõi, không truy cập sổ, không gọi CLI.
- Backend và nghiệp vụ thuộc land/lane sở hữu. Backend gọi clerk của chính land để đọc/ghi; không tự SQL vào sổ, không làm bản nghiệp vụ khác.
- Backend trả JSON cho nghiệp vụ; media/thumbnail trả file, video hỗ trợ tua (Range). Không trả HTML.
- Hợp đồng API do chủ land giữ: mỗi trường ghi nguồn và nghĩa. Trường chưa có nghĩa xác nhận thì không đưa lên màn.
- Gỡ module UI và Launcher thì lõi, CLI, Backend và dữ liệu vẫn vận hành. Tắt một Backend thì màn của land đó báo đang tắt, màn khác chạy bình thường.
- Giữ đặc tính đọc hiện có khi chuyển: đọc theo trang, count và danh sách cùng một lần đọc, không tải BLOB cho lưới.

### Cổng

| Cổng | Vai trò |
|---|---|
| 5050 | Module UI: sảnh, Kit, mọi màn (Gate ảnh/video/Dash, Label, Crawler) |
| 5059 | Backend Gate ảnh |
| 5058 | Backend Gate video |
| 5056 | Bỏ. Gate Dash về 5050, gọi hai Backend Gate |
| 5057, 5055 | Hiện là server UI của Label, Crawler; thành Backend khi tới lượt lane đó |

TUI bật/tắt UI và từng Backend riêng; báo READY bằng kiểm HTTP trả dữ liệu, không chỉ thấy cổng mở. Tắt UI không tắt Backend.

### Thứ tự chuyển

Mỗi lane: chốt nghĩa dữ liệu → clerk có hàm đọc/ghi cần thiết → Backend service → màn trong module UI → PO dùng thật → xoá đường cũ của lane (ui_screen, server UI cũ, SQL trực tiếp).

1. Gate ảnh
2. Gate video
3. Gate Dash (sau khi hai Backend Gate có API số liệu)
4. Label video
5. Crawler

Màn cũ chạy tiếp cho tới khi màn mới được PO dùng thật; xong thì xoá ngay, không giữ hai bản.

## Mặt màn

- Mockup PO đã duyệt chỉ chốt hình dáng: bố cục, chữ, vị trí, màu và rail/logo. Logic/JS, nút và phím trong mockup không phải đặc tả chức năng. Số giả thay bằng dữ liệu thật.
- Chức năng lấy từ yêu cầu PO đã chốt và nghiệp vụ đang có. Không tự thêm hành vi; chỗ chưa rõ thì hỏi PO.
- Chỗ mockup có mà dữ liệu thật chưa có: để trống và báo rõ, không tự chế. Không có số tĩnh, số gõ tay hay bản chụp gắn nhãn số thật.
- Giữ các chức năng đã có, trừ khi PO yêu cầu thay đổi.
- PO yêu cầu bỏ phím J chuyển ảnh ở Gate ảnh ngày 07/10.
- Rail Launcher giữ Search ở vị trí chính, Kit là mục phụ riêng bên dưới. Mở Kit vẫn giữ Search; trang Search cũng có đường sang Kit.
- Launcher là sảnh: quả cầu, sector, Search và Kit. Không iframe. Mỗi màn tự giữ phím và bố cục. Logo/ESC về sảnh; ESC đóng menu hoặc phần xem đang mở trước khi rời màn.
- Kit (`kit/`) là nguồn chung cho khung UI, màu/phông và rail. Trong module UI, mọi màn dùng Kit trực tiếp, không chép.
- Rail có `data-panel` thì Kit tạo nút đóng/mở danh sách. Một trạng thái bố cục chung do Kit quản lý, nhớ khi tải lại/chuyển màn.

## Nhịp làm việc

- UI phục vụ một phiên làm việc liên tục. Chọn mục, lọc, sắp xếp, duyệt và sửa trong cùng màn chỉ đổi phần liên quan; giữ vị trí làm việc, lựa chọn còn hợp lệ và nội dung chưa lưu.
- Lọc/sắp xếp đúng trên toàn bộ hàng chờ (Backend làm), không chỉ trên các món đang có trong trình duyệt.
- Backend xác nhận lưu thành công rồi màn mới báo đã lưu và cập nhật kết quả. Thất bại thì giữ việc đang làm và báo rõ để thử lại.
- Không hứa thời gian xử lý “0ms”. Giữ khung ổn định trong lúc chờ dữ liệu hoặc media.

## Kiểm và bàn giao

- Thử một chuỗi thao tác như PO dùng thật, gồm giữ ghi chú/vị trí, quyết định, lọc/sắp xếp và chuyển mục; không chỉ thử từng nút riêng.
- Kiểm kết quả lưu và số liệu trên màn cùng nhau: số trên màn phải bằng số Backend/CLI trả về cùng lúc.
- Kiểm rút phích: tắt UI, CLI và Backend vẫn chạy; tắt Backend, màn báo đang tắt.
- Ảnh bàn giao phải chụp đúng trang, mở từng ảnh kiểm trước khi gửi.
- Khi có commit: báo commit, phép kiểm và phần chưa verify. Chưa push nếu PO chưa yêu cầu.
- Commit trong repo Launcher dùng `Laucher Order <số>: <nội dung>`, nối tiếp số có sẵn (sau `Laucher Order 10` là `Laucher Order 11`).
- Khi sửa UI/Backend trong repo land khác, dùng `Order UI <số>: <nội dung>`, nối tiếp số Order cao nhất của chính repo đó (cả Order gốc và Order UI).

## Hiện trạng cần chuyển (07/10)

Hiện trạng chưa đạt đích; không coi là kiến trúc đúng.

- Gate ảnh, Gate video, Label, Crawler: màn (`ui_screen` / `*_ui`) còn nằm trong land, chạy chung process với phần đọc/ghi và import thẳng lõi.
- SELECT trực tiếp vào sổ, không qua clerk (chỉ đọc, chưa thấy ghi vòng): `gate_image/ui_backend/image_review_rows_reader.py`, `image_review_page_reader.py`; `gate_video/ui_backend/video_review_detail_reader.py`, `video_review_page_reader.py`; `gate_video/ui_screen/video_review_page_routes.py`. Video đọc count rồi danh sách không chung một lần đọc.
- Ghi quyết định đã đi qua writer của clerk (`ui_clerk_desk/*_action_routes.py`).
- Gate Dash (`Xru_Gate/ui_dashboard/`, :5056) gọi CLI `stats` bằng subprocess; chưa đạt đích. Số và nghĩa trường do chủ Gate giữ. NONE là chưa có kết luận máy, không phải đã soi sạch.
- Kit được server của từng land đọc từ ổ đĩa `Xru_Launcher/kit`; hết khi màn về module UI.
- Lõi không import UI (kiểm 07/10, 285 file). Điểm này giữ nguyên.

Việc tương tác còn mở theo audit 07/10 (`Xru_Code/.codex/evidence/ui-audit-20261007/audit.md`), sửa khi chuyển lane tương ứng, không vá trên màn cũ:

| Phần | Còn mở |
|---|---|
| Gate ảnh | Lọc chỉ một trang; phím điều hướng chọn món bị ẩn; inspector/nút quyết định còn bật khi không có kết quả. |
| Gate video | Mất note/noise chưa lưu khi đổi clip rồi quay lại; lọc/sort tải cả trang. |
| Label | Lưu toàn dòng có thể xoá draft ô khác; chọn video trang hai làm sidebar về trang một; thêm/xoá protagonist còn redirect. |
| Crawler | Dashboard giấu lane_errors thành 0, donut thành 1; cần hiện lỗi/thiếu dữ liệu đúng. |

## Chỗ bắt đầu đọc code

Đường dẫn tính từ `Xru_Code/`, trừ TUI nằm cạnh `Xru_Code/`.

- Launcher / module UI: `Xru_Launcher/launcher.py`, `home/`, `kit/`, `mockups/`.
- Gate ảnh: `Xru_Gate/gate_image/ui_screen/`, `ui_backend/`, `ui_clerk_desk/`.
- Gate video: `Xru_Gate/gate_video/ui_screen/`, `ui_backend/`, `ui_clerk_desk/`.
- Gate Dash: `Xru_Gate/ui_dashboard/`.
- Label video: `Xru_Label/label_division_video/video_po_review_ui/`.
- Crawler: `Xru_Crawler/ui_screen/`.
- Bật/tắt: `../Xru_TUI/lib/xru/federal.sh`.
