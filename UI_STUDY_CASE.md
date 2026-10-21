# UI Study Case

Những lần UI XRU hẹo, vì sao, sửa ra sao. Ai dựng màn mới hoặc Backend mới thì đọc file này trước khi viết dòng đầu. Cập nhật: 21/10/2026.

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
- Còn nợ: mỗi lần UI hỏi, Backend vẫn bê cả 12k món lên Python để đếm tay. Lên 100k món sẽ ì lại. Gốc là để SQL đếm.

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
5. Danh sách luôn chia trang, lọc và sort ở Backend trước khi chia. Lưới dùng ảnh nhỏ, không ảnh gốc.
6. Thao tác tại chỗ, không tải lại cả trang. Poll 5 giây chỉ gọi API rẻ; lượt trước chưa xong thì không gọi lượt mới.
7. Không vá chậm bằng cache hay tải sau ở UI. Gốc ở lõi thì nói ngay "cần Order", chịu chậm thật còn hơn nhanh giả.
8. Có test tốc độ trên kho giả lớn (từ 100k món): API màn chính dưới 1 giây.
9. Soát một màn: đo thời gian API trên kho thật rồi mới báo đạt.
