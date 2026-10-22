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

UI Backend là DMZ: Sector code, Launcher dùng. Sau mỗi đợt Sector đổi UI Backend, Claude soát:

1. Rút phích: xoá `ui_backend_service/` ở bản sao, test lõi và CLI vẫn chạy.
2. Đúng cửa: chỉ gọi Local Registrar / DIRC Embassy; không SQL, không ops/CLI.
3. Không việc nặng mỗi request (luật trong `UI_STUDY_CASE.md`).
4. Đo trên kho thật: API màn chính dưới 1 giây.
5. `API.md` khớp dữ liệu trả thật.

Hỏng gọn trong `ui_backend_service/` thì Claude được sửa thẳng, commit `Order UI <số>` ở repo Sector. Hỏng phải đụng lõi, hoặc UI không rút ra được, thì tố giác Sector Admin cho PO kèm bằng chứng để ra Order.

| Cổng | Vai trò |
|---|---|
| 5050 | UI: sảnh, Kit, mọi màn |
| 5059 / 5058 | Backend Gate ảnh / video |
| 5055 | Backend Crawler |
| 5057 | Backend Label video |

## Thao tác trong một màn

- Chọn ảnh/clip/dòng, lọc, sắp xếp, phân trang và quyết định cập nhật tại chỗ. Đọc/ghi qua API rồi cập nhật DOM; không tải lại cả trang bằng `form.submit()`, POST form hoặc đổi `location.href`. Link đi sang màn khác vẫn là điều hướng bình thường.
- Giữ ghi chú chưa lưu khi đổi mục rồi quay lại. Không tự mất vị trí làm việc sau khi lưu; mục đã rời hàng chờ thì chọn mục còn hiển thị. Backend lỗi thì giữ draft, báo chưa xác nhận lưu; không tự báo thành công hay sửa số bằng tay.
- Khi chuyển lane, kiểm một chuỗi chọn → ghi note → đổi mục/quay lại → lọc/sort → phân trang → quyết định. Kiểm không phát sinh tải lại document, draft/vị trí còn đúng và dữ liệu đã lưu khớp Backend. Đây là yêu cầu chung cho UI mới, không chỉ bản vá Gate ảnh.

## Thứ tự

Gate ảnh → Gate video + Crawler → Gate Dash → Label. Đã chuyển xong cả năm lane (07/10).

Mỗi lane: Backend → màn trên 5050 → Codex kiểm chuỗi thao tác → xoá ui_screen và server UI cũ của lane trong cùng đợt. Không giữ hai bản. PO không thử tay từng lane (07/10); PO chỉ xem phần phức tạp.

Lane 1 — Gate ảnh: Backend `Xru_Gate/gate_image/ui_backend_service/` đọc/ghi qua clerk; màn `gate/image/` trên 5050 chỉ gọi HTTP. Đã xoá `gate_image/ui_*`. Claude soát 07/10: đạt (API = CLI = 548, không SQL thẳng, không tải lại trang). Tường ảnh dùng Kit `wall`: trang 250 ảnh (3 lượt đọc song song vì lõi trả tối đa 100), nút `‹ ›` ở chân sidebar và "Trang sau" cuối tường, số trang trên URL; quay lại cửa sổ không vẽ lại tường.

Gate video: Backend `Xru_Gate/gate_video/ui_backend_service/`, màn `gate/video/` trên 5050. Đã chuyển SQL về clerk; hàng chờ/count/facet cùng snapshot, lọc/sort trước phân trang. Draft note/Noise/Watermark giữ theo clip; thao tác tại chỗ. Chân trang ghi đúng phím; phím quyết định dùng được sau bấm button/link. Quay lại cửa sổ khi Backend đang đọc bình thường không vẽ lại inspector/player, giữ con trỏ và thời điểm video. Đã tự kiểm chuỗi trên fixture, xoá `gate_video/ui_*` và server màn cũ. Tường video dùng Kit `wall`: trang 100 clip, ảnh bìa 240px chụp ở 10% clip và cất đĩa (Order UI 52–53), rê chuột 300ms mới phát không tiếng.

Crawler (Order 121): Backend `Xru_Crawler/ui_backend_service/` đọc qua `local_registrar/` và `dirc_embassy/` từ sổ Crawler và `eurasia/eurasia_dirc/eurasia_dirc.db` v2, config cụm và sticker PO ở `XRU_Data/eurasia/crawler/ui/` (`labels.json` + `shots/`); màn `crawler/` trên 5050 chỉ gọi HTTP, UI chỉ đọc, không sửa config. `xru_embassy/` giữ riêng sổ Liên Bang v6 với `citizen(xru_id,xru_subject,xru_continent,xru_sector,xru_registry_date)`; UI không mở sổ này. Tag trong `labels.json` là sticker để PO nhìn, không phải dữ liệu gốc. Màn Nguồn (15/10) theo `design/ORDER_crawler_sources.md` + `design/crawler_sources.html`, code riêng `sources.html/js/css`: một nguồn một dòng, chia nhóm Ổn / Đang cào / Chưa cào / Cần nhìn (PO 22/10: Ổn trên cùng, Cần nhìn dưới cùng; dải tổng cùng thứ tự); mỗi dòng một badge theo thứ tự KẸT → ĐANG CÀO → WAITING → CHƯA CÀO → CŨ → THIẾU SCOUT → OK; ô ảnh/video `[hạng] plan │ scout │ download`; nước và icon khí tài suy từ tag; chỉ xám/đỏ/xanh. Sắp xếp vẫn như thường (menu + bấm đầu cột), trong từng nhóm. Bấm dòng mở sidebar phải chi tiết, được đè lên bảng (bảy câu từng loại, ngưỡng cũ, ghi chú, ảnh chụp PO, link nguồn); Esc đóng. Dashboard hôm nay/7 ngày dùng born_at (Asia/Ho_Chi_Minh); biểu đồ có thêm đường Kho = tổng đã thu tính tới cuối từng ngày (tổng hiện có trừ phần sinh sau ngày đó), tắt được. Sidebar kéo mép để giãn bằng tay kéo của Kit, chung bề ngang với mọi màn. Chỉ báo lỗi khi có lỗi thật; thiếu sổ trả unknown/null, zero thật vẫn là zero.

Gate Dash: màn `gate/dash/` trên 5050 đọc `/api/stats` từ Backend ảnh 5059 và video 5058, không gọi CLI. Giữ số và nghĩa cũ; NONE = chưa có kết luận máy, không phải sạch. Lane không trả dữ liệu thì báo đang tắt/chưa có số; lane còn lại vẫn đọc được. Đã đối chiếu số tổng/trạng thái/nguồn với hai API và kiểm tắt từng Backend rồi phục hồi. Đã xoá màn, test và server Dash cũ.

Label video (Claude làm theo yêu cầu PO 07/10): Backend `Xru_Label/label_division_video/backend_service/` gọi use case `label_division_review`; màn `label/video/` trên 5050 cùng khung Gate (hàng chờ kit | sân khấu frame/video + timeline + bảng nhãn | hồ sơ). Lọc Tất cả/Thiếu/Đủ trên toàn hàng chờ (số đếm từ cùng catalog). Lưu một ô chỉ gửi ô đó, ô đang gõ khác giữ nguyên; thêm/xoá nhân vật tại chỗ; trang hàng chờ và mục đang mở giữ trên URL. Đã kiểm chuỗi trên fixture và đọc dữ liệu thật (322 = CLI, phát/tua video); xoá `video_po_review_ui/` và lệnh `start-apps`.

## Ca học

Những lần UI hẹo (kho lớn là treo, cuộn giật, tua khựng), gốc và luật chặn tái phát: xem `UI_STUDY_CASE.md`. Dựng màn hoặc Backend mới thì đọc file đó trước.

## Phím tắt

PO 22/10: không phím chuyển màn, không ESC về sảnh (bấm rail là xong). Chỉ giữ phím làm việc trong màn: Gate ảnh A/D, mũi tên chọn ô, Enter xem lớn; Gate video 1–4 tick Noise/Watermark/Event/Caution, A/D/S/P/R, Space, mũi tên tua; Label Space/F/V/J/K. Thêm phím mới phải hỏi PO.

## Còn mở

- Audit đầu trắng 22/10, vòng 1 xong (Order 36). Vòng 2 (ống Kit): Launcher trả file `no-store` nên đổi màn tải lại ~18 file, qua hầm SSH chậm → `no-cache` + ETag, bỏ `DESTINATIONS` 302 và `?v=`; mọi chữ màn qua i18n (`*_text.js`), Crawler đang viết cứng tiếng Việt; rail dựng lại khi đổi ngôn ngữ thì mất link lọc Crawler → màn đưa query qua `XRU_RAILS`, không vá `a.href`. Vòng 3: số Crawler không tự cập nhật (cần lõi Crawler thêm tem sổ, tố giác); bảng Nguồn tràn ngang ở laptop (2 cột 236px cứng); breadcrumb video/Dash trỏ `http://127.0.0.1:5050/`; Label kẹt "Loading…"; `/sector-image` ghi vào `assets/` đang theo git.
- Tố giác Gate (22/10): ô tìm quét cả DIRC bằng Python mỗi phím gõ rồi nhét hàng nghìn id vào `IN (...)` → cần FTS5/cột tìm trong DIRC; `snapshot()`, `_page_from_snapshot`, `_detail_from_snapshot`, nhánh dict `stats.py` là đường cả lane cũ (Ca 4), chỉ test gọi → xoá; `limit` hàng chờ trần 100 nên trang 250 ảnh phải đọc 3 lượt → nâng trần 250. API.md ghi sort chỉ oldest/newest nhưng Backend nhận 7 giá trị.
- Ô sắp xếp (22/10): Gate theo i18n ("Sort"), Crawler viết cứng tiếng Việt, Crawler Nguồn còn bấm đầu cột. Đề xuất một chuẩn Kit: sidebar, cùng nhãn i18n, mỗi màn khai lựa chọn riêng, bỏ bấm đầu cột. Chờ PO chốt.
- Cờ `--lan` của `launcher.py` (22/10): chỉ mở trang, Backend vẫn nghe 127.0.0.1 và chặn Origin nên trang trống số. Đề xuất xoá vì đã có hầm SSH; chờ PO gật.
- Label video: Backend trả 400 mọi request vì `sync_foundry_release` mở đường DB Foundry cũ. Không vá; chờ Foundry/Label xây lại theo 3 tầng.
- Bản đồ UI (22/10): PO muốn UI có bản đồ như kiến trúc. Gom câu PO đã nói thành `UI_MAP.md` (mỗi màn một dòng mục đích, ngân sách thông tin ô/cột phải, hình mẫu, luật cứng) khi PO có hứng.
- Array (Babel, 22/10): `array/` là mockup Blind test đọc bản chụp tĩnh 04/10 (`data/array_snapshot.js`, sinh bằng `tools/array_snapshot.py`). Giữ làm bản vẽ tới khi Babel có `ui_backend_service/`; lúc nối thật thì màn gọi HTTP và xoá bản chụp cùng tool. Atlas chưa có repo trên laptop.

## Commit

- Repo Launcher: `Laucher Order <số>: …`, nối tiếp số cũ. Fix lặt vặt sau một Order thì gom vào số đó: `26.1`, `26.2`… (PO 15/10).
- Repo Sector: `Order UI <số>: …` khi commit chỉ đụng vùng DMZ (`ui_backend_service/`), dù Launcher hay Sector sửa; nối tiếp số Order cao nhất của repo đó (Crawler `Order UI 132`, Gate `Order UI 46`). Commit đụng ngoài DMZ thì tách riêng.
- Báo commit, phép kiểm, phần chưa kiểm. Không push khi PO chưa bảo.

Crawler Order 118: UI và CLI board dùng cùng bảng số từ phòng Lỗi & số liệu của Crawler. Từng ô ảnh/video hiện đã sinh/tổng (nguồn không tự khai: đã thấy+), số chờ/đáy, scout cuối/thêm/độ lệch tổng, run cuối và hôm nay/7 ngày, [E] theo loại, giờ nghỉ/chờ. Sidebar mỗi loại hiện đủ 7 câu cùng thời gian bắt đầu/kết thúc. Tổng/giờ cũ chưa có bằng chứng giữ chưa biết; không lấy giờ nâng cấp làm lịch sử. CLI chỉ còn scout/run/board/orders.
