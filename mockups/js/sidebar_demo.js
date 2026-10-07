// Tìm nhanh trong dữ liệu minh họa; không dùng cho hàng chờ thật.
(() => {
  const input = document.querySelector('.side-search input');
  if (!input) return;
  const items = [...document.querySelectorAll('.side-item')];
  const empty = document.createElement('div');
  empty.className = 'side-empty';
  empty.textContent = window.XRU_I18N ? window.XRU_I18N.t('no_match') : 'Không có mục khớp.';
  empty.setAttribute('data-i18n', 'no_match');
  empty.hidden = true;
  document.querySelector('.side-items').appendChild(empty);
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    let shown = 0;
    for (const item of items) {
      item.hidden = Boolean(q) && !item.textContent.toLowerCase().includes(q);
      if (!item.hidden) shown++;
    }
    empty.hidden = shown > 0;
  });
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      input.value = '';
      input.dispatchEvent(new Event('input'));
      input.blur();
      event.preventDefault();
    }
    event.stopPropagation();
  });
})();
