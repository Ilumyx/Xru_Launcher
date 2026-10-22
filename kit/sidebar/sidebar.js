// Một trạng thái sidebar cho UI. Nạp trong head để áp bố cục trước khi vẽ màn.
(() => {
  const KEY = 'xru-sidebar-hidden', WIDTH = 'xru-sidebar-w', MIN = 200, MAX = 480;
  const root = document.documentElement;
  // Cookie cùng host dùng được giữa các cổng; localStorage riêng từng origin.
  function stored(key) {
    const cookie = document.cookie.split('; ').find((entry) => entry.startsWith(key + '='));
    if (cookie) return cookie.slice(key.length + 1);
    try { return localStorage.getItem(key); } catch { return null; }
  }
  function store(key, value) {
    try { if (value == null) localStorage.removeItem(key); else localStorage.setItem(key, value); } catch { /* vẫn chạy được */ }
    document.cookie = value == null ? `${key}=; Path=/; Max-Age=0` : `${key}=${value}; Path=/; Max-Age=31536000; SameSite=Lax`;
  }
  function read() { return stored(KEY) === '1'; }
  function width(w) {
    if (w == null) root.style.removeProperty('--side-user');
    else root.style.setProperty('--side-user', Math.round(Math.max(MIN, Math.min(MAX, w))) + 'px');
  }
  width(+stored(WIDTH) || null);
  // Tay kéo nằm ở cha của .side (khung lưới của màn), ngay mép phải sidebar.
  function grip() {
    const side = document.querySelector('.side');
    if (!side || document.querySelector('.side-grip')) return;
    const frame = side.parentElement;
    if (getComputedStyle(frame).position === 'static') frame.style.position = 'relative';
    const el = document.createElement('div');
    el.className = 'side-grip';
    el.title = 'Kéo để giãn · bấm đúp để về mặc định';
    frame.appendChild(el);
    el.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      root.classList.add('side-gripping');
      const move = (ev) => { const r = frame.getBoundingClientRect(); width((ev.clientX - r.left) / (r.width / frame.offsetWidth)); };
      const up = () => {
        root.classList.remove('side-gripping');
        window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up);
        store(WIDTH, parseInt(root.style.getPropertyValue('--side-user')) || null);
        window.dispatchEvent(new Event('resize'));
      };
      window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
    });
    el.addEventListener('dblclick', () => { width(null); store(WIDTH, null); window.dispatchEvent(new Event('resize')); });
  }
  function apply(hidden) {
    root.classList.toggle('sidebar-hidden', hidden);
    document.querySelectorAll('[data-sidebar-toggle]').forEach((button) => {
      button.setAttribute('aria-expanded', String(!hidden));
    });
  }
  apply(read());
  document.addEventListener('DOMContentLoaded', () => { apply(read()); grip(); });
  document.addEventListener('click', (event) => {
    if (!event.target.closest('[data-sidebar-toggle]')) return;
    const hidden = !root.classList.contains('sidebar-hidden');
    apply(hidden);
    store(KEY, hidden ? '1' : '0');
    event.preventDefault();
  });
  window.addEventListener('focus', () => { apply(read()); width(+stored(WIDTH) || null); });
  window.addEventListener('storage', (event) => { if (event.key === KEY) apply(read()); if (event.key === WIDTH) width(+stored(WIDTH) || null); });
})();
