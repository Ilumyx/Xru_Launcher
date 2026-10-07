// Một trạng thái sidebar cho UI. Nạp trong head để áp bố cục trước khi vẽ màn.
(() => {
  const KEY = 'xru-sidebar-hidden';
  const root = document.documentElement;
  function read() {
    // Cookie cùng host dùng được giữa các cổng; localStorage riêng từng origin.
    const cookie = document.cookie.split('; ').find((entry) => entry.startsWith(KEY + '='));
    if (cookie) return cookie.slice(KEY.length + 1) === '1';
    try { return localStorage.getItem(KEY) === '1'; } catch { return false; }
  }
  function apply(hidden) {
    root.classList.toggle('sidebar-hidden', hidden);
    document.querySelectorAll('[data-sidebar-toggle]').forEach((button) => {
      button.setAttribute('aria-expanded', String(!hidden));
    });
  }
  apply(read());
  document.addEventListener('DOMContentLoaded', () => apply(read()));
  document.addEventListener('click', (event) => {
    if (!event.target.closest('[data-sidebar-toggle]')) return;
    const hidden = !root.classList.contains('sidebar-hidden');
    apply(hidden);
    try { localStorage.setItem(KEY, hidden ? '1' : '0'); } catch { /* vẫn đóng/mở được */ }
    document.cookie = `${KEY}=${hidden ? '1' : '0'}; Path=/; Max-Age=31536000; SameSite=Lax`;
    event.preventDefault();
  });
  window.addEventListener('focus', () => apply(read()));
  window.addEventListener('storage', (event) => { if (event.key === KEY) apply(read()); });
})();
