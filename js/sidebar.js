// XRU SIDEBAR LỌC — mockup: gõ vào ô tìm nhanh thì ẩn dòng không khớp (tiêu đề + nguồn).
// Bản thật: lọc do lõi của land làm, UI chỉ gửi chữ đi và vẽ kết quả.
(() => {
  const input = document.querySelector('.side-search input');
  if (!input) return;
  const items = [...document.querySelectorAll('.side-item')];
  const empty = document.createElement('div');
  empty.className = 'side-empty';
  empty.textContent = 'Không có mục khớp.';
  empty.hidden = true;
  document.querySelector('.side-items').appendChild(empty);
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    let shown = 0;
    for (const it of items) {
      it.hidden = Boolean(q) && !it.textContent.toLowerCase().includes(q);
      if (!it.hidden) shown++;
    }
    empty.hidden = shown > 0;
  });
  // Đang gõ trong ô tìm: phím tắt của trang (A/D/S, 1/2/3, ESC) không chạy; ESC thì xoá chữ rồi thoát ô.
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { input.value = ''; input.dispatchEvent(new Event('input')); input.blur(); }
    e.stopPropagation();
  });
})();
