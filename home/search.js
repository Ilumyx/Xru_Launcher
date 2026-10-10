// ==========================================================================
// XRU LAUNCHER — phím tắt tìm kiếm
// Ô tìm nổi cũ đã bỏ: / hoặc Ctrl+K đi thẳng sang trang Array (kiểu Google).
// ==========================================================================
function goArray(q) {
  q = (q || '').trim();
  window.location.href = q ? `array/index.html?q=${encodeURIComponent(q)}` : 'array/index.html';
}

window.addEventListener('keydown', (e) => {
  const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);
  if (typing) return;
  if (e.key === '/' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) {
    e.preventDefault();
    goArray('');
  }
});
