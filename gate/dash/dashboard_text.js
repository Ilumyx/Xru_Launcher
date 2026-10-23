// Dashboard-owned wording: current states are distinct from PO decisions.
window.XRU_I18N.add({
 vi: {
  sort_clean_low: 'Tỷ lệ nhận thấp nhất', sort_clean_high: 'Tỷ lệ nhận cao nhất',
  gd_not_reviewed: 'chưa có hồ sơ nhận/giữ/bắt', gd_clean_word: 'nhận',
  gd_ratio_note: 'Tỷ lệ nhận = Nhận / (Nhận + Tạm giữ + Bắt), theo trạng thái hiện tại. Tạm giữ gồm cả máy và PO; đây không phải tỷ lệ duyệt riêng của PO.',
  unsplit_source: 'không theo nguồn đang chọn',
  gd_recorded: 'Đã ghi kết luận máy', gd_missing: 'Chưa có kết luận máy',
  gd_no_machine: 'Chưa có dữ liệu kết luận máy cho làn này.',
  gd_machine_wait_core: 'Chưa có số máy đúng/sai so với PO. Dấu hiệu và kết luận máy ở đây là số toàn làn, chưa chia theo nguồn.',
  gd_updated: 'Đã đọc lúc', gd_loading: 'Đang đọc số Gate…',
  gd_read_error: 'Backend làn này đang tắt hoặc chưa trả được dữ liệu. Chưa có số; tự thử lại mỗi 15 giây.',
 },
 en: {
  sort_clean_low: 'Lowest acceptance ratio', sort_clean_high: 'Highest acceptance ratio',
  gd_not_reviewed: 'no accepted/detained/arrested records', gd_clean_word: 'accepted',
  gd_ratio_note: 'Acceptance ratio = Accept / (Accept + Detain + Arrest), using current states. Detain includes both machine and PO actions; this is not a PO-only approval rate.',
  unsplit_source: 'not filtered by selected source',
  gd_recorded: 'Recorded machine verdict', gd_missing: 'No machine verdict recorded',
  gd_no_machine: 'No machine-verdict data is available for this lane.',
  gd_machine_wait_core: 'Machine accuracy against PO is unavailable. Findings and verdicts shown here cover the entire lane, without source breakdown.',
  gd_updated: 'Read at', gd_loading: 'Reading Gate stats…',
  gd_read_error: 'This lane Backend is off or cannot return data. Stats unavailable; retrying every 15 seconds.',
 }
});
