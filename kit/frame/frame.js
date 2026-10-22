// Bộ xương chung (kit/frame/frame.css): đóng/mở, kéo giãn hai cột bên, nhớ cho mọi màn.
// Nạp trong head để áp bề ngang trước khi vẽ màn.
(() => {
  const root = document.documentElement;
  const COLS = {
    side: { hidden: 'xru-sidebar-hidden', width: 'xru-sidebar-w', prop: '--side-user', cls: 'sidebar-hidden', min: 200, max: 480 },
    insp: { hidden: 'xru-insp-hidden', width: 'xru-insp-w', prop: '--insp-user', cls: 'insp-hidden', min: 280, max: 720 },
  };
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
  function width(c, w) {
    if (w == null) root.style.removeProperty(c.prop);
    else root.style.setProperty(c.prop, Math.round(Math.max(c.min, Math.min(c.max, w))) + 'px');
  }
  function hide(c, hidden) {
    root.classList.toggle(c.cls, hidden);
    if (c === COLS.side) document.querySelectorAll('[data-sidebar-toggle]').forEach((b) => b.setAttribute('aria-expanded', String(!hidden)));
    const t = document.querySelector('.insp-toggle');
    if (c === COLS.insp && t) { t.setAttribute('aria-expanded', String(!hidden)); t.title = hidden ? 'Mở cột phải' : 'Gập cột phải'; }
  }
  function load() {
    for (const c of Object.values(COLS)) { width(c, +stored(c.width) || null); hide(c, stored(c.hidden) === '1'); }
  }
  load();

  // Tay kéo nằm trong .ws, ngay mép trong của cột. Bù zoom giao diện khi đổi px chuột ra px CSS.
  function grip(frame, c, side) {
    const el = document.createElement('div');
    el.className = 'frame-grip is-' + side;
    el.title = 'Kéo để giãn · bấm đúp để về mặc định';
    el.innerHTML = '<span></span>';
    frame.appendChild(el);
    const tip = el.firstChild;
    el.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      root.classList.add('frame-dragging'); el.classList.add('is-dragging');
      const move = (ev) => {
        const r = frame.getBoundingClientRect(), scale = r.width / frame.offsetWidth;
        width(c, (side === 'side' ? ev.clientX - r.left : r.right - ev.clientX) / scale);
        tip.textContent = root.style.getPropertyValue(c.prop);
      };
      const up = () => {
        root.classList.remove('frame-dragging'); el.classList.remove('is-dragging');
        window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up);
        store(c.width, parseInt(root.style.getPropertyValue(c.prop)) || null);
        window.dispatchEvent(new Event('resize'));
      };
      move(event);
      window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
    });
    el.addEventListener('dblclick', () => { width(c, null); store(c.width, null); window.dispatchEvent(new Event('resize')); });
  }
  function build() {
    const frame = document.querySelector('.ws');
    if (!frame || frame.querySelector('.frame-grip')) return;
    if (frame.querySelector(':scope > .side')) grip(frame, COLS.side, 'side');
    if (frame.querySelector(':scope > .ws-insp')) {
      grip(frame, COLS.insp, 'insp');
      const t = document.createElement('button');
      t.type = 'button'; t.className = 'insp-toggle';
      t.innerHTML = '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 2l4 4-4 4M7 2l4 4-4 4" transform="translate(-1 0)"/></svg>';
      frame.appendChild(t);
      hide(COLS.insp, root.classList.contains(COLS.insp.cls));
    }
  }
  document.addEventListener('DOMContentLoaded', () => { load(); build(); });
  document.addEventListener('click', (event) => {
    const c = event.target.closest('[data-sidebar-toggle]') ? COLS.side : event.target.closest('.insp-toggle') ? COLS.insp : null;
    if (!c) return;
    const hidden = !root.classList.contains(c.cls);
    hide(c, hidden);
    store(c.hidden, hidden ? '1' : '0');
    event.preventDefault();
    setTimeout(() => window.dispatchEvent(new Event('resize')), 220);
  });
  window.addEventListener('focus', load);
  window.addEventListener('storage', load);
})();
