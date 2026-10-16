# Order UI — Crawler / Nguồn theo bản vẽ mới

Bản vẽ: `crawler_sources.html` (cùng folder). Mở bằng trình duyệt để xem. Đây là ảnh tĩnh để nhìn, **không phải code để chép**: số liệu là giả, nút không chạy. Code thật vẫn theo luật `UI.md` (chỉ gọi Backend `/api/board`, cập nhật tại chỗ, không số tĩnh, chưa biết thì không ghi 0).

Số nội bộ lấy qua `local_registrar/`; số đã sinh qua `dirc_embassy/` từ `eurasia/eurasia_dirc/eurasia_dirc.db` v2. `xru_embassy/` độc quyền đăng tịch Liên Bang v6 với `citizen(xru_id,xru_subject,xru_continent,xru_sector,xru_registry_date)`; màn chỉ nhận JSON từ Backend.

## Mục đích màn

Nhìn một lượt biết **nguồn nào cần PO nhìn**. Mọi thứ khác là phụ.

## Khung

- Rail 64px bên trái: logo về sảnh · nút đóng/mở sidebar · vạch · Dashboard · Nguồn (đang sáng) · avatar IL ở đáy.
- Sidebar 240px: số nguồn to · ô tìm · LỌC NHANH (Cần nhìn, Kẹt, Cũ, Thiếu scout, Waiting) · NỀN TẢNG (mỗi nền tảng một dòng + số) · chú giải ở đáy (chấm scout, hạng → ngưỡng cũ).
- Vùng chính: breadcrumb `EURASIA / CRAWLER / NGUỒN` · dải 4 số tổng (CẦN NHÌN, ĐANG CÀO, ỔN, CHƯA CÀO) · bảng.

## Bảng

**Một nguồn = một dòng, cao 36px.** Cột theo thứ tự:

| Cột | Rộng | Nội dung |
|---|---|---|
| Loại | 26px | icon khí tài (mặt đất / trên không / hải quân), suy từ tag binh chủng |
| Cụm | 240px cố định | tên, cắt `…` nếu dài |
| Nước | 40px | mã 2 chữ (US, UA, PL…), mono xám |
| Nền | 52px | mã ngắn (FB, TG, WAR, DVIDS…), mono xám |
| Ảnh | phần còn lại | ô media (dưới) |
| Video | phần còn lại | ô media, có vạch dọc mảnh ngăn với cột Ảnh |
| Cào | 52px | ngày tương đối: `0n`, `9n` |
| Trạng thái | 116px | badge chữ |

**Ô media (ảnh / video), đọc trái → phải:**

`[hạng]  plan │ scout │ download`

- **Hạng**: ô vuông 20×18, chữ A–D/F (`labels.json → media.<loại>.tier`). Chưa chấm = khung nét đứt trống. Rê chuột hiện ghi chú hạng. Màu chỉ thang xám: A trắng, B/C/D nhạt dần, F gạch ngang mờ.
- **plan** = tổng nguồn tự khai (ops_plan). Nguồn không khai (FB…) → `—` mờ. Màu xám vì chỉ tham khảo.
- **scout** = số link đã gom (found). Chuyển đỏ khi dòng đang THIẾU SCOUT.
- **download** = số đã tải thật (images / videos ở eurasia_dirc.db). Sáng nhất.
- Ba số căn phải, mỗi số 52px, ngăn bằng vạch dọc 1px. **Không có chữ chú thích** trong ô.
- Chưa cào: ba khung đều `—` mờ, vẫn giữ chỗ để cột không xô.
- Số chờ (pending) **không lên dòng**, chỉ hiện khi mở dòng.

**Mở dòng** (bấm vào dòng): một dải bên dưới, chữ mono 12, hiện:
- hạng ảnh / video, ngưỡng cũ đang áp, ngày cào cuối, có lỗi không
- mỗi loại: scout cuối · số mới · Δ tổng · run cuối · hôm nay · 7 ngày · chờ
- ghi chú hạng của PO

## Nhóm và trạng thái

Bảng chia nhóm theo trạng thái, không theo nền tảng. Thứ tự:

1. **CẦN NHÌN** (mở sẵn): KẸT → WAITING → CŨ → THIẾU SCOUT
2. **ĐANG CÀO** (mở sẵn)
3. **ỔN** (gập sẵn)
4. **CHƯA CÀO** (gập sẵn)

Bấm tiêu đề nhóm để gập/mở. Đang lọc hoặc đang tìm thì mọi nhóm tự mở. Trong nhóm: nguồn hạng cao xếp trước, rồi theo tên.

| Badge | Khi nào |
|---|---|
| KẸT | lần sinh cuối có lỗi thật `[E]` |
| WAITING | nguồn đang chờ PO ưu tiên |
| CŨ | ngày cào cuối vượt ngưỡng theo hạng |
| THIẾU SCOUT | có loại media đang bật mà chưa dò |
| ĐANG CÀO | đang chạy batch |
| OK | chạy đều |
| CHƯA CÀO | chưa chạy lần nào |

**Ngưỡng CŨ theo hạng của từng loại:** A 3n · B 7n · C 14n · D 30n · F không tính · chưa chấm 7n. Nguồn có cả ảnh lẫn video thì lấy ngưỡng chặt hơn. Khi CŨ, số ngày ở cột Cào cũng chuyển đỏ (tô cả nguyên nhân).

## Màu — chỉ 4 màu

| Thang | Dùng cho |
|---|---|
| Đen → trắng `#0b0b0b · #141413 · #1c1c1b · #2a2a28 · #44443f · #6f6f6a · #8c8c87 · #b5b4ae · #ecebe6` | nền, vạch, chữ — thang chính |
| Đỏ: nền `#d93a2b`, chữ `#ff6450`, viền `#5a1a15` | mọi thứ cần nhìn. KẸT = nền đỏ đặc chữ trắng; CŨ / WAITING / THIẾU SCOUT = chữ đỏ, viền đỏ tối |
| Xanh: chữ `#4fc27a`, viền `#1f4a2e` | ĐANG CÀO (badge + chấm nhấp nháy), số ĐANG CÀO ở dải tổng |

Không vàng, không cam, không màu riêng cho từng nền tảng. Không đổ bóng, không gradient; ranh giới là vạch mảnh.

## Chữ

- Barlow cho tên và chữ thường; JetBrains Mono cho mọi số, mã, nhãn.
- Nhãn cột / nhóm: mono 11, viết HOA, giãn chữ.

## Chưa làm trong bản vẽ (để sau)

- Số vừa tăng nháy xanh một nhịp kiểu bảng điện, kèm `+N hôm nay` cạnh download.
- Logo rail là vẽ tạm, thay bằng logo thật.
- Chưa tính `ui-zoom` 1.15 của Launcher.
