# UI Study Case

Những lần UI XRU hẹo, vì sao, sửa ra sao. Ai dựng màn mới hoặc Backend mới thì đọc file này trước khi viết dòng đầu. Cập nhật: 23/10/2026.

## Bệnh chung

Kho bé thì mọi cách viết đều nhanh, test xanh. Kho lên nghìn, vạn món thì treo. Bệnh tái lại vì:

1. Người dựng nào cũng bắt đầu từ trang trắng, không biết XRU đã vấp gì.
2. Test chạy trên kho tí hon (vài món), chỉ chứng cơ chế, không chứng tốc độ.
3. Chậm ở đâu thì vá ngay ở đó (thường là UI): cache, tải sau. Hết đau tạm nhưng việc thừa vẫn còn, chỉ bị giấu. Kho lớn lên là lộ lại.

Gốc của cả họ: **làm việc nặng cho từng món, ở chỗ chỉ cần một bản tóm tắt.**

## Ca 1 — Label video: hàng chờ 2 giây (30/09)

- Triệu chứng: mỗi lần mở một video, trang đọc lại cả hàng chờ 322 video, mất hơn 2 giây.
- Gốc: lõi Label liệt kê hàng chờ bằng cách kiểm đầy đủ từng video (tính SHA-256 file gốc, soi mọi frame) chỉ để lấy tên và tiến độ. `claim-next` cũng kiểm cả kho trong lúc giữ khóa.
- Vá sai: Claude cho hàng chờ ở UI tải sau. Việc thừa vẫn còn, lại đẻ ra lỗi nháy màn hình. Phải gỡ.
- Sửa gốc: Label DIVISION ORDER 10. Sổ phiếu nhẹ được ghi khi có chuyện thật (thêm phiếu, đổi tiến độ, nhận/trả, publish); liệt kê chỉ đọc sổ, chia trang 100; kiểm SHA chỉ khi mở một phiếu. 0,013 giây; đo ở 5.000 phiếu vẫn khoảng 100 ms.
- Ca cũ hơn cùng họ: Gate từng vá bằng cache, kho lên khoảng 5.000 video thì lỗi quay lại; Order 19–21 mới sửa đường hash tận gốc.
- Gốc sâu hơn lúc đó: kho không có sổ xuất hàng, ai nhận hàng cũng phải mở từng thư mục để đếm. Nay đã có `eurasia_dirc.db`.

## Ca 2 — Gate ảnh: cuộn lưới giật (01/10)

- Triệu chứng: cuộn lưới 60 ảnh giật tung chảo.
- Gốc: lưới tải ảnh gốc (tới 2048px, khoảng 9,4MB một trang). Ô bé nhưng trình duyệt vẫn giải nén cả ảnh to.
- Sửa: Backend Gate trả ảnh nhỏ 480px qua `/thumb` cho lưới, trình duyệt được nhớ; xem lớn mới mở ảnh gốc. Trang còn khoảng 1,4MB.

## Ca 3 — Crawler: `/api/board` treo 10 phút (21/10)

- Triệu chứng: màn Crawler trắng số, 5055 kẹt 99% CPU suốt 10 phút.
- Gốc: `local_registrar/board_view.py` dựng lại tập `born | rejected` (12.126 món) bên trong vòng lặp 43 cụm × 2 loại × 27.113 link, khoảng 2,35 triệu lần. Kho 4 món, 60 link thì không ai thấy.
- Sửa: Crawler Order 131, dựng tập và gom số một lần trước vòng lặp. Còn 0,25 giây (đọc sổ 0,17 + dựng bảng 0,08).
- Audit 21/10 và trả nợ (Crawler Order 133, 22/10): bỏ import Tổng đài khỏi `local_registrar`, đọc gọn cột DIRC, gom `link_pages` bằng SQL, đóng kết nối, test lõi hết dính UI. Còn 0,1 giây. Vẫn bê 27k link + 12k món lên Python (cần đối chiếu hai sổ) nên còn tăng tuyến tính: ước khoảng 1 giây ở 120k món, chưa đo. Màn không còn đọc lại bảng mỗi lần quay lại cửa sổ: hỏi tem sổ (Crawler Order 134, khoảng 1ms) 5 giây một lần, tem đổi mới đọc bảng (Order UI 135, 23/10).

## Ca 4 — Gate: mọi request bê cả lane (audit 21/10)

- Gốc: mọi GET, kể cả `/api/health`, từng mẩu `/media` và từng `/thumb`, dựng snapshot cả lane (`SELECT *` mọi bảng rồi lọc Python). Đo kho giả: 10k món 0,25 giây, 100k món 2,6 giây mỗi request. Chi tiết clip trùng tính bậc hai. Thumbnail chạy ffmpeg mỗi lần, cấm trình duyệt nhớ, lỗi thì gửi nguyên video.
- Sửa: UI Backend (Order UI 46) health rẻ, thumbnail được nhớ, không gửi video thay ảnh nhỏ. Lõi (Order 47) phân trang và GROUP BY bằng SQL, tra một id cho `/media`, `/thumb`, `/api/assets`, giới hạn related 100.
- Đo lại 22/10 trên kho giả: 100k món còn health 1ms, chi tiết 1ms, hàng chờ 34ms, thống kê 72ms.

## Ca 5 — Gate video: tường mở chậm, đổi tab khựng (22/10)

- Triệu chứng: mở tường video hay đổi lane thấy ì, laptop gồng. Kho mới 316 video.
- Gốc: mỗi ô là một `<video poster>`, trình duyệt xin cả 100 ảnh bìa cùng lúc (poster không biết tải lười). Mỗi ảnh bìa Backend chạy ffprobe + ffmpeg lại từ đầu, không cất; 66 lượt ffmpeg chạy song song nên ảnh cuối tới sau 4,3 giây. Máy khác (PC qua hầm) hay lane mới là chạy lại hết.
- Sửa: Order UI 52 Gate cất ảnh nhỏ xuống đĩa (`~/.cache`, khoá cỡ + giờ sửa), tối đa 3 ffmpeg cùng lúc. Laucher Order 35.1: ô video là `<img loading=lazy>`, rê chuột mới dựng video, rời chuột thì gỡ.
- Đo lại: 100 ảnh bìa lần đầu 11 giây (chỉ một lần mỗi clip), từ lần sau 0,3 giây; tường hiện đủ ô đang nhìn sau 0,32 giây; đổi lane dưới 0,13 giây.
- Bài học: ảnh nhỏ dựng một lần, cất lại; lưới chỉ tải ô đang nhìn thấy; phần tử nặng (video) chỉ dựng khi người dùng chạm tới.

## Ca 6 — Gate: bấm quyết vẫn khựng, lần thứ ba (23/10)

- Triệu chứng: bấm Accept liên tục thấy delay. Đo: ghi 18ms, đọc lại 6ms, lõi không chậm.
- Gốc (luật 3 lần: 22/10 quay lại cửa sổ vẽ lại cả màn, 23/10 tường dựng lại 100 ảnh, 23/10 quyết xong chờ lõi rồi đọc lại cả trang): màn coi mỗi thay đổi là "đọc lại cả trang, vẽ lại cả trang", và khoá nút chờ lõi trả lời. Vá từng chỗ thì chỗ khác vẫn vẽ lại.
- Sửa (Laucher Order 39.3–39.4): tường giữ ô theo id, chỉ dời chỗ. Quyết là đi tiếp ngay: món rời trang tại chỗ, lệnh ghi xếp hàng gửi ngầm từng lệnh một, gửi hết mới đọc lại lặng lẽ (không khoá nút, không chọn lại món đang xem). Ghi lỗi thì đọc lại về đúng món đó, nháp giữ, báo lỗi.
- Đo lại: ba lần bấm A cách nhau 40ms, mỗi lần màn đi tiếp trong 18–31ms; lõi khớp số (76 → 73).
- Bài học: màn giữ trang trong tay và sửa tại chỗ; phần lặp vẽ theo id; đọc lại lõi để đối số chứ không để chờ.

## Ca kèm — Label video: việc nặng trước mọi request (19/10)

- Backend Label gọi `sync_foundry_release` trước mọi request, kể cả từng mẩu video và từng thumbnail. Video phát là hàng chục request mẩu, mỗi mẩu đều kéo theo đồng bộ sổ.
- Chưa sửa: Foundry và Label sẽ xây lại theo kiến trúc 3 tầng.

## Ca khác họ — Gate video: tua khựng (19/10)

- Không phải do kho lớn mà do file: video Facebook VP9 thưa keyframe (60 giây mới có một, có con chỉ một keyframe). Tua phải giải mã lại từ keyframe gần nhất, 1–2,5 giây mỗi lần.
- Sửa: Crawler Order 128 chuẩn hóa video thưa keyframe lúc tải (H.264, keyframe 2 giây, moov đầu file) và chữa lại kho. Việc nặng cả kho: hỏi PO chạy máy nào trước.

## Luật cho mọi Backend và màn mới

1. Đếm, gom, lọc ở `local_registrar` bằng SQL (`COUNT`, `GROUP BY`, `JOIN`). Backend chỉ ghép số, gắn nhãn. Không bê cả kho lên Python để đếm.
2. Liệt kê chỉ đọc sổ nhẹ. Kiểm nặng (SHA, mở file, soi frame) chỉ khi mở một món.
3. Thứ không đổi thì dựng một lần trước vòng lặp.
4. Request đọc không kèm việc nặng (đồng bộ sổ, quét kho). Việc đó chạy ở CLI hoặc khi sổ đổi.
5. Danh sách luôn chia trang, lọc và sort ở Backend trước khi chia. Lưới ô nhỏ dùng Kit `wall` (ảnh nhỏ đúng cỡ ô, chụp một lần rồi cất, tải lười, có trần mỗi trang); không ảnh gốc, không thẻ `<video>` dựng sẵn, không tự viết lưới riêng.
6. Thao tác tại chỗ, không tải lại cả trang. Không đọc lại khi cửa sổ được bấm vào (chỉ khi Backend từng mất). Poll 5 giây chỉ gọi API rẻ; lượt trước chưa xong thì không gọi lượt mới.
7. Không vá chậm bằng cache hay tải sau ở UI. Gốc ở lõi thì nói ngay "cần Order", chịu chậm thật còn hơn nhanh giả.
8. Có test tốc độ trên kho giả lớn (từ 100k món): API màn chính dưới 1 giây.
9. Soát một màn: đo thời gian API trên kho thật rồi mới báo đạt.
10. Thao tác của người duyệt không chờ lõi: màn đổi tại chỗ ngay, lệnh ghi gửi ngầm theo hàng, lỗi thì quay lại và báo. Phần lặp (ô, dòng) vẽ theo id; đọc lại lõi chỉ để đối số, không xoá dựng lại.
