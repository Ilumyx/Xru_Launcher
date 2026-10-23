# UI XRU

Sổ chung của Codex và Claude. Ba file: `UI.md` (quyết định, việc), `README.md` (chạy, thư mục, Kit) và `UI_STUDY_CASE.md` (ca hẹo và luật chặn), kèm bản đồ `XRU_MAP.webp`. Cập nhật: 21/10/2026.

## Ai làm gì

- PO chốt mục tiêu, mặt màn, thứ tự.
- Màn UI (5050): Codex hoặc Claude làm, Claude soát theo bản vẽ PO.
- UI Backend (`ui_backend_service/` trong mỗi Sector) là đất UI, Claude sở hữu (bản vẽ PO 21/10). Sector Admin vẫn được code như thường; Claude audit sau mỗi đợt và sửa thẳng (xem Audit UI Backend).
- Trước khi code: nói lại bản vẽ PO, PO gật mới làm. Quyết định mới ghi vào đây, sửa câu cũ, không nối thêm.

## Kiến trúc (bản vẽ PO, 21/10)

```
Liên Bang ─► Lục địa ─► Sector ─► Zone (1984)

Sector:  Local Registrar (cầm sổ) ─┬─ CLI/Ops (lõi)
                                   ├─ DIRC Embassy ─► DIRC
                                   └─ UI Backend ──HTTP──► UI (5050, ngoài mọi Sector)
```

- Bản đồ toàn cảnh (Liên Bang, Eurasia/DIRC, mặt cắt Gate, vùng DMZ): `XRU_MAP.webp`. Đọc trước khi sửa UI Backend của một Sector.
- UI Backend và UI thò ra ngoài lõi, sinh ra để bị rút bỏ. Rút `ui_backend_service/` thì CLI và lõi vẫn chạy 100%. UI sập kéo cả dây chuyền là tội của Sector đó.
- UI chỉ gọi Backend. Không import lõi, không đọc sổ, không gọi CLI.
- UI Backend chỉ đi qua Local Registrar / DIRC Embassy. Không mở SQL, không import ops/station/source. Trả JSON; ảnh/video trả file, video tua được.
- Tắt một Backend thì màn đó báo đang tắt.
- Số nào chưa có nguồn và nghĩa rõ thì không hiện. Không số tĩnh, không số gõ tay.

## Audit UI Backend (PO 21/10)

UI Backend là DMZ: Sector code, Launcher dùng. Đầu mỗi lượt audit, Claude chạy `git log -- ui_backend_service/` ở từng repo Sector để thấy mọi commit đụng DMZ từ lần soát trước (tên commit không quan trọng), rồi soát:

1. Rút phích: xoá `ui_backend_service/` ở bản sao, test lõi và CLI vẫn chạy.
2. Đúng cửa: chỉ gọi Local Registrar / DIRC Embassy; không SQL, không ops/CLI.
3. Không việc nặng mỗi request (luật trong `UI_STUDY_CASE.md`).
4. Đo trên kho thật: API màn chính dưới 1 giây.
5. `API.md` khớp dữ liệu trả thật.

Hỏng gọn trong `ui_backend_service/` thì Claude được sửa thẳng, commit `Order UI <số>` ở repo Sector. Hỏng phải đụng lõi, hoặc UI không rút ra được, thì ghi vào [TO_GIAC.md](TO_GIAC.md) kèm bằng chứng. File này là hộp thư hai chiều (PO 23/10): Sector Admin làm xong ghi ngay dưới mục ("xong, Order N, dùng hàm X") hoặc xoá mục; đầu mỗi phiên Claude tự đọc file và kiểm hàng, PO không phải chép tin qua lại.

| Cổng | Vai trò |
|---|---|
| 5050 | UI: sảnh, Kit, mọi màn |
| 5059 / 5058 | Backend Gate ảnh / video |
| 5055 | Backend Crawler |
| 5057 | Backend Label video |

## Thao tác trong một màn

- Sắp xếp (PO 22/10): chỉ ở ô `<select>` trong sidebar, mỗi màn khai lựa chọn riêng; nhãn và mọi lựa chọn qua `data-i18n`, không viết cứng chữ, không bấm đầu cột để sắp. Màn có tường (Gate ảnh, Gate video, PO 23/10): nguồn/sắp xếp/trạm là nhóm lọc bấm thẳng có số đếm, nằm trên danh sách (vẫn chọn được món từ danh sách); tiêu đề nhóm bấm để gập, gập rồi vẫn ghi lựa chọn đang bật (Kit `kit/sidebar/Filters.js`).
- Chọn ảnh/clip/dòng, lọc, sắp xếp, phân trang và quyết định cập nhật tại chỗ. Đọc/ghi qua API rồi cập nhật DOM; không tải lại cả trang bằng `form.submit()`, POST form hoặc đổi `location.href`. Link đi sang màn khác vẫn là điều hướng bình thường.
- Giữ ghi chú chưa lưu khi đổi mục rồi quay lại. Không tự mất vị trí làm việc sau khi lưu; mục đã rời hàng chờ thì chọn mục còn hiển thị. Backend lỗi thì giữ draft, báo chưa xác nhận lưu; không tự báo thành công hay sửa số bằng tay.
- Khi chuyển lane, kiểm một chuỗi chọn → ghi note → đổi mục/quay lại → lọc/sort → phân trang → quyết định. Kiểm không phát sinh tải lại document, draft/vị trí còn đúng và dữ liệu đã lưu khớp Backend. Đây là yêu cầu chung cho UI mới, không chỉ bản vá Gate ảnh.

## Thứ tự

Gate ảnh → Gate video + Crawler → Gate Dash → Label. Đã chuyển xong cả năm lane (07/10).

Mỗi lane: Backend → màn trên 5050 → Codex kiểm chuỗi thao tác → xoá ui_screen và server UI cũ của lane trong cùng đợt. Không giữ hai bản. PO không thử tay từng lane (07/10); PO chỉ xem phần phức tạp.

Lane 1 — Gate ảnh: Backend `Xru_Gate/gate_image/ui_backend_service/` đọc/ghi qua clerk; màn `gate/image/` trên 5050 chỉ gọi HTTP. Đã xoá `gate_image/ui_*`. Claude soát 07/10: đạt (API = CLI = 548, không SQL thẳng, không tải lại trang). Tường ảnh dùng Kit `wall`: trang 250 ảnh (3 lượt đọc song song vì lõi trả tối đa 100), nút `‹ ›` ở chân sidebar và "Trang sau" cuối tường, số trang trên URL; quay lại cửa sổ không vẽ lại tường.

Gate video: Backend `Xru_Gate/gate_video/ui_backend_service/`, màn `gate/video/` trên 5050. Nền Preact (Laucher Order 40–41, PO 23/10; Gate ảnh dùng cùng khuôn): màn là hàm của một sổ tay (`kit/store/store.js`), Preact chỉ sửa chỗ đổi; tường, nhóm lọc là component Kit (`kit/wall/Wall.js`, `kit/sidebar/Filters.js`), thư viện chép ở `kit/vendor/preact/`. Bản viết tay `XRU_WALL` / `XRU_FILTERS` đã xoá. Đã chuyển SQL về clerk; hàng chờ/count/facet cùng snapshot, lọc/sort trước phân trang. Draft note/Noise/Watermark giữ theo clip; thao tác tại chỗ. Chân trang ghi đúng phím; phím quyết định dùng được sau bấm button/link. Quay lại cửa sổ khi Backend đang đọc bình thường không vẽ lại inspector/player, giữ con trỏ và thời điểm video. Đã tự kiểm chuỗi trên fixture, xoá `gate_video/ui_*` và server màn cũ. Tường video dùng Kit `wall`: hiện trọn khung (`contain`, PO 23/10: viền/template ở mép là bằng chứng QA, phủ kín ô sẽ cắt mất), trang 100 clip, ảnh bìa 240/480px Gate chụp sẵn lúc intake (Gate Order 57, video ở 10% clip), cửa UI chỉ đọc file, rê chuột 300ms mới phát không tiếng. Sidebar (PO 23/10, Gate ảnh dùng chung trừ trạm): trạm flag (lane MACHINE FLAG) · nguồn dạng cây nền tảng → kênh · sắp xếp (hai sort "PO quyết định" chỉ ở lane đã quyết, bỏ sort nguồn). Ô tường ghi trạm đã flag clip (`gate_flag_reason`). Thanh tua ở cột phải to ra 10px cho dễ bấm. Gõ đúng mã `xru-…` vào ô tìm thì màn hỏi lõi món đang ở lane nào, bỏ bộ lọc và mở đúng trang chứa nó (cả Gate ảnh); mã của màn kia (ID video dán ở màn ảnh và ngược lại) thì tự mở sang màn đó; không thấy ở đâu thì trả danh sách về như cũ và báo. Quyết một clip (PO 23/10, đo: ghi 18ms + đọc lại 6ms) thì tường giữ ô cũ theo id, chỉ dời chỗ và đánh số lại, không dựng lại 100 ảnh. Quyết là đi tiếp ngay, lệnh ghi gửi ngầm theo hàng, gửi hết mới đọc lại lặng lẽ (Ca 6 trong `UI_STUDY_CASE.md`; Gate ảnh dùng cùng cách). Lõi đếm nguồn và trạm trên cả lane rồi mới lọc, tham số `reason` (Gate Order 56, UI kiểm 23/10: YAMNET 23, STATIC_BORDER 204, cây giữ đủ khi lọc).

Crawler (Order 121): Backend `Xru_Crawler/ui_backend_service/` đọc qua `local_registrar/` và `dirc_embassy/` từ sổ Crawler và `eurasia/eurasia_dirc/eurasia_dirc.db` v2, config cụm và sticker PO ở `XRU_Data/eurasia/crawler/ui/` (`labels.json` + `shots/`); màn `crawler/` trên 5050 chỉ gọi HTTP, UI chỉ đọc, không sửa config. `xru_embassy/` giữ riêng sổ Liên Bang v6 với `citizen(xru_id,xru_subject,xru_continent,xru_sector,xru_registry_date)`; UI không mở sổ này. Tag trong `labels.json` là sticker để PO nhìn, không phải dữ liệu gốc. Màn Nguồn (15/10) theo `design/ORDER_crawler_sources.md` + `design/crawler_sources.html`, code riêng `sources.html/js/css`: một nguồn một dòng, chia nhóm Ổn / Đang cào / Chưa cào / Cần nhìn (PO 22/10: Ổn trên cùng, Cần nhìn dưới cùng; dải tổng cùng thứ tự); mỗi dòng một badge theo thứ tự KẸT → ĐANG CÀO → WAITING → CHƯA CÀO → CŨ → THIẾU SCOUT → OK; ô ảnh/video `[hạng] plan │ scout │ download`; nước và icon khí tài suy từ tag; chỉ xám/đỏ/xanh. Sắp xếp bằng menu ở sidebar, trong từng nhóm. Bấm dòng mở sidebar phải chi tiết, được đè lên bảng (bảy câu từng loại, ngưỡng cũ, ghi chú, ảnh chụp PO, link nguồn); đóng bằng bấm lại đúng dòng đó hoặc gập cột phải. Dashboard hôm nay/7 ngày dùng born_at (Asia/Ho_Chi_Minh); biểu đồ có thêm đường Kho = tổng đã thu tính tới cuối từng ngày (tổng hiện có trừ phần sinh sau ngày đó), tắt được. Sidebar kéo mép để giãn bằng tay kéo của Kit, chung bề ngang với mọi màn. Chỉ báo lỗi khi có lỗi thật; thiếu sổ trả unknown/null, zero thật vẫn là zero.

Gate Dash: màn `gate/dash/` trên 5050 đọc `/api/stats` từ Backend ảnh 5059 và video 5058, không gọi CLI. Giữ số và nghĩa cũ; NONE = chưa có kết luận máy, không phải sạch. Lane không trả dữ liệu thì báo đang tắt/chưa có số; lane còn lại vẫn đọc được. Đã đối chiếu số tổng/trạng thái/nguồn với hai API và kiểm tắt từng Backend rồi phục hồi. Đã xoá màn, test và server Dash cũ.

Label video (Claude làm theo yêu cầu PO 07/10): Backend `Xru_Label/label_division_video/backend_service/` gọi use case `label_division_review`; màn `label/video/` trên 5050 cùng khung Gate (hàng chờ kit | sân khấu frame/video + timeline + bảng nhãn | hồ sơ). Lọc Tất cả/Thiếu/Đủ trên toàn hàng chờ (số đếm từ cùng catalog). Lưu một ô chỉ gửi ô đó, ô đang gõ khác giữ nguyên; thêm/xoá nhân vật tại chỗ; trang hàng chờ và mục đang mở giữ trên URL. Đã kiểm chuỗi trên fixture và đọc dữ liệu thật (322 = CLI, phát/tua video); xoá `video_po_review_ui/` và lệnh `start-apps`.

## Ca học

Những lần UI hẹo (kho lớn là treo, cuộn giật, tua khựng), gốc và luật chặn tái phát: xem `UI_STUDY_CASE.md`. Dựng màn hoặc Backend mới thì đọc file đó trước.

## Phím tắt

PO 22/10: không phím chuyển màn, không ESC về sảnh (bấm rail là xong). Chỉ giữ phím làm việc trong màn: Gate ảnh A/D, mũi tên chọn ô, Enter xem lớn; Gate video 1–4 tick Noise/Watermark/Event/Caution, A/D/S/P/R, Space, mũi tên tua; Label Space/F/V/J/K. Thêm phím mới phải hỏi PO.

## Còn mở

- Audit đầu trắng 22/10: ba vòng xong (Laucher Order 36–38). Sector Admin đã trả phần lõi 23/10: Gate Order 55 (tìm bằng SQL, xoá đường chụp cả lane, trần `limit` 250 → tường ảnh đọc một lượt), Crawler Order 134 (tem sổ → `GET /api/stamp`, màn Crawler hỏi tem 5 giây một lần, tem đổi mới đọc lại bảng). Còn lại ở [TO_GIAC.md](TO_GIAC.md).
- Label video: Backend trả 400 mọi request vì `sync_foundry_release` mở đường DB Foundry cũ. Không vá; chờ Foundry/Label xây lại theo 3 tầng.
- Bản đồ UI (22/10): PO muốn UI có bản đồ như kiến trúc. Gom câu PO đã nói thành `UI_MAP.md` (mỗi màn một dòng mục đích, ngân sách thông tin ô/cột phải, hình mẫu, luật cứng) khi PO có hứng.
- Array (Babel, 22/10): `array/` là mockup Blind test đọc bản chụp tĩnh 04/10 (`data/array_snapshot.js`, sinh bằng `tools/array_snapshot.py`). Giữ làm bản vẽ tới khi Babel có `ui_backend_service/`; lúc nối thật thì màn gọi HTTP và xoá bản chụp cùng tool. Atlas chưa có repo trên laptop.

## Commit

- Repo Launcher: `Laucher Order <số>: …`, nối tiếp số cũ. Fix lặt vặt sau một Order thì gom vào số đó: `26.1`, `26.2`… (PO 15/10).
- Repo Sector: commit của Claude trong DMZ (`ui_backend_service/`) đặt tên `Order UI <số>: …`, nối tiếp số Order cao nhất của repo đó, để nhìn log biết đất UI. Sector Admin sửa lõi mà phải sửa kèm DMZ (cho test xanh) thì cứ để chung trong Order của họ, không cần tách hay đặt tên riêng (PO 23/10); Claude thấy qua `git log -- ui_backend_service/` và soát ở lượt audit sau.
- Báo commit, phép kiểm, phần chưa kiểm. Không push khi PO chưa bảo.

Crawler Order 118: UI và CLI board dùng cùng bảng số từ phòng Lỗi & số liệu của Crawler. Từng ô ảnh/video hiện đã sinh/tổng (nguồn không tự khai: đã thấy+), số chờ/đáy, scout cuối/thêm/độ lệch tổng, run cuối và hôm nay/7 ngày, [E] theo loại, giờ nghỉ/chờ. Sidebar mỗi loại hiện đủ 7 câu cùng thời gian bắt đầu/kết thúc. Tổng/giờ cũ chưa có bằng chứng giữ chưa biết; không lấy giờ nâng cấp làm lịch sử. CLI chỉ còn scout/run/board/orders.
