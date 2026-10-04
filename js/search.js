// ==========================================================================
// XRU FEDERAL GOOGLE-STYLE SEARCH OVERLAY LOGIC
// ==========================================================================
function openSearch() {
  const overlay = document.getElementById('search-overlay');
  const input = document.getElementById('search-input');
  if (!overlay || !input) return;

  overlay.classList.add('is-open');
  setTimeout(() => input.focus(), 50);
}

function closeSearch() {
  const overlay = document.getElementById('search-overlay');
  if (!overlay) return;
  overlay.classList.remove('is-open');
}

// Gõ câu blind test rồi Enter (hoặc bấm câu mẫu) → mở trang kết quả Array
function goArray(q) {
  q = (q || '').trim();
  if (!q) return;
  window.location.href = `array_search.html?q=${encodeURIComponent(q)}`;
}

function selectSearchChip(text) {
  const input = document.getElementById('search-input');
  if (!input) return;
  input.value = text;
  input.focus();
  filterSearchResults(text);
}

function filterSearchResults(query) {
  const resultsContainer = document.getElementById('search-results');
  if (!resultsContainer) return;

  const items = resultsContainer.querySelectorAll('.search-result-item');
  const q = query.trim().toLowerCase();

  items.forEach(item => {
    if (!q) {
      item.style.display = 'flex';
      return;
    }
    const text = item.textContent.toLowerCase();
    item.style.display = text.includes(q) ? 'flex' : 'none';
  });
}

// Bắt phím tắt toàn cục
window.addEventListener('keydown', (e) => {
  const overlay = document.getElementById('search-overlay');
  const isOpen = overlay && overlay.classList.contains('is-open');

  // Đóng bằng phím ESC
  if (e.key === 'Escape' && isOpen) {
    closeSearch();
    return;
  }

  // Mở bằng phím / hoặc Ctrl+K / Cmd+K (khi không gõ trong input khác)
  const isInputActive = ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName);
  if ((e.key === '/' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) && !isInputActive) {
    e.preventDefault();
    openSearch();
  }
});
