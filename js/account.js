// ==========================================================================
// XRU ACCOUNT — Menu tài khoản (bấm avatar IL) + Cài đặt giao diện
// Đổi: chế độ sáng/tối, font chữ, màu nhấn, cỡ giao diện. Lưu vào trình duyệt, mọi trang dùng chung.
// File này nạp trong <head> để áp cài đặt ngay, không bị nháy màu cũ.
// ==========================================================================
(() => {
  const KEY = 'xru-ui-settings';
  const DEFAULTS = { mode: 'dark', font: 'Inter', accent: '#00d2b4', zoom: '1.15' };
  const MODES = [['system', 'Hệ thống'], ['light', 'Sáng'], ['dark', 'Tối']];
  const systemMode = window.matchMedia('(prefers-color-scheme: dark)');

  const FONTS = {
    'Inter':          'Inter:wght@300;400;500;600;700',
    'Be Vietnam Pro': 'Be+Vietnam+Pro:wght@300;400;500;600;700',
    'IBM Plex Sans':  'IBM+Plex+Sans:wght@300;400;500;600;700',
    'Roboto':         'Roboto:wght@300;400;500;700',
  };
  // Chọn màu nhấn theo tên; không có ô nhập mã màu.
  const ACCENTS = [
    ['#00d2b4', 'Cyan XRU'],
    ['#4da3ff', 'Xanh dương'],
    ['#9b8cff', 'Tím'],
    ['#7fd17f', 'Xanh lá'],
    ['#e7e7e2', 'Trắng'],
    ['#f3ce5c', 'Vàng'],
    ['#f574bd', 'Hồng'],
    ['#ff8a70', 'Cam'],
  ];
  const ZOOMS = [['1', '100%'], ['1.1', '110%'], ['1.15', '115%'], ['1.2', '120%']];

  const load = () => {
    try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; }
    catch { return { ...DEFAULTS }; }
  };
  const save = (s) => localStorage.setItem(KEY, JSON.stringify(s));

  function ensureFont(name) {
    if (name === 'Inter' || !FONTS[name]) return; // Inter đã nạp sẵn trong từng trang
    const id = 'xru-font-' + name.replace(/\s/g, '');
    if (document.getElementById(id)) return;
    const l = document.createElement('link');
    l.id = id;
    l.rel = 'stylesheet';
    l.href = `https://fonts.googleapis.com/css2?family=${FONTS[name]}&display=swap`;
    document.head.appendChild(l);
  }

  function apply(s) {
    document.documentElement.dataset.uiMode = s.mode === 'system' ? (systemMode.matches ? 'dark' : 'light') : s.mode;
    const r = document.documentElement.style;
    r.setProperty('--font-sans', `'${s.font}', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`);
    r.setProperty('--active-cyan', s.accent);
    const [cr, cg, cb] = [1, 3, 5].map(i => parseInt(s.accent.slice(i, i + 2), 16));
    r.setProperty('--active-cyan-soft', `rgba(${cr}, ${cg}, ${cb}, 0.2)`);
    r.setProperty('--active-cyan-line', `rgba(${cr}, ${cg}, ${cb}, 0.35)`);
    r.setProperty('--ui-zoom', s.zoom);
    ensureFont(s.font);
  }

  let settings = load();
  apply(settings);
  systemMode.addEventListener('change', () => { if (settings.mode === 'system') apply(settings); });

  function update(patch) {
    settings = { ...settings, ...patch };
    save(settings);
    apply(settings);
    renderPanel();
  }

  // ---------------- Giao diện menu + bảng cài đặt ----------------
  let menu, modal;

  function buildMenu() {
    menu = document.createElement('div');
    menu.className = 'acc-menu';
    menu.innerHTML = `
      <div class="acc-head">
        <div class="acc-ava">IL</div>
        <div><div class="acc-name">Ilumyx</div><div class="acc-role">PO · XRU Federal</div></div>
      </div>
      <div class="acc-sep"></div>
      <button class="acc-item" data-act="settings">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>
        <span>Cài đặt giao diện</span>
      </button>
      <div class="acc-sep"></div>
      <button class="acc-item" data-act="close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        <span>Đăng xuất</span>
      </button>`;
    document.body.appendChild(menu);
    menu.addEventListener('click', (e) => {
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (act === 'settings') { closeMenu(); openPanel(); }
      if (act === 'close') closeMenu();
    });
  }

  function buildPanel() {
    modal = document.createElement('div');
    modal.className = 'acc-modal';
    modal.addEventListener('click', (e) => {
      if (e.target === modal) return closePanel();
      const b = e.target.closest('[data-k]');
      if (b) update({ [b.dataset.k]: b.dataset.v });
      if (e.target.closest('[data-reset]')) update({ ...DEFAULTS });
      if (e.target.closest('[data-done]')) closePanel();
    });
    document.body.appendChild(modal);
  }

  function renderPanel() {
    if (!modal) return;
    const on = (k, v) => (settings[k] === v ? ' is-on' : '');
    modal.innerHTML = `
      <div class="acc-panel" role="dialog" aria-label="Cài đặt giao diện">
        <div class="acc-panel-head">
          <span>Cài đặt giao diện</span>
          <button class="acc-x" data-done aria-label="Đóng">✕</button>
        </div>

        <div class="acc-options">
          <div class="acc-row">
            <span class="acc-row-label">Chế độ</span>
            <div class="acc-seg acc-modes" aria-label="Chế độ giao diện">
              ${MODES.map(([v, n]) => `<button class="${on('mode', v).trim()}" data-k="mode" data-v="${v}" aria-pressed="${settings.mode === v}">${n}</button>`).join('')}
            </div>
          </div>
          <div class="acc-row">
            <span class="acc-row-label">Font chữ</span>
            <details class="acc-dropdown" name="acc-setting-picker">
              <summary><b class="acc-font-sample">Aa</b><span>${settings.font}</span><span class="acc-chevron">⌄</span></summary>
              <div class="acc-dropdown-menu" aria-label="Chọn font chữ">
                ${Object.keys(FONTS).map(f => {
                  ensureFont(f);
                  return `<button class="acc-option${on('font', f)}" data-k="font" data-v="${f}" aria-label="${f}" style="font-family:'${f}'" aria-pressed="${settings.font === f}"><b class="acc-font-sample">Aa</b><span>${f}</span><span class="acc-check">${settings.font === f ? '✓' : ''}</span></button>`;
                }).join('')}
              </div>
            </details>
          </div>
          <div class="acc-row">
            <span class="acc-row-label">Màu nhấn</span>
            <details class="acc-dropdown" name="acc-setting-picker">
              <summary><i class="acc-swatch" style="background:${settings.accent}"></i><span>${ACCENTS.find(([c]) => c === settings.accent)?.[1] || 'Màu hiện tại'}</span><span class="acc-chevron">⌄</span></summary>
              <div class="acc-dropdown-menu" aria-label="Chọn màu nhấn">
                ${ACCENTS.map(([c, n]) => `<button class="acc-option${on('accent', c)}" data-k="accent" data-v="${c}" aria-label="${n}" aria-pressed="${settings.accent === c}"><i class="acc-swatch" style="background:${c}"></i><span>${n}</span><span class="acc-check">${settings.accent === c ? '✓' : ''}</span></button>`).join('')}
              </div>
            </details>
          </div>
          <div class="acc-row">
            <span class="acc-row-label">Cỡ giao diện</span>
            <div class="acc-seg" aria-label="Cỡ giao diện">
              ${ZOOMS.map(([v, n]) => `<button class="${on('zoom', v).trim()}" data-k="zoom" data-v="${v}" aria-pressed="${settings.zoom === v}">${n}</button>`).join('')}
            </div>
          </div>
        </div>

        <div class="acc-foot">
          <button class="acc-ghost" data-reset>Về mặc định</button>
          <button class="acc-primary" data-done>Xong</button>
        </div>
      </div>`;
  }

  const isMenuOpen = () => menu?.classList.contains('is-open');
  const isPanelOpen = () => modal?.classList.contains('is-open');
  function openMenu() { menu.classList.add('is-open'); }
  function closeMenu() { menu?.classList.remove('is-open'); }
  function openPanel() { renderPanel(); modal.classList.add('is-open'); }
  function closePanel() { modal?.classList.remove('is-open'); }

  document.addEventListener('DOMContentLoaded', () => {
    const ava = document.querySelector('.user-avatar');
    if (!ava) return;
    buildMenu();
    buildPanel();
    ava.addEventListener('click', (e) => {
      e.stopPropagation();
      isMenuOpen() ? closeMenu() : openMenu();
    });
    document.addEventListener('click', (e) => {
      if (isMenuOpen() && !menu.contains(e.target)) closeMenu();
    });
  });

  // Khi menu / bảng cài đặt đang mở: ESC chỉ đóng nó, và chặn phím tắt của trang (1/2/3, ESC về Launcher)
  window.addEventListener('keydown', (e) => {
    if (!isMenuOpen() && !isPanelOpen()) return;
    if (e.key === 'Tab') return;
    if (e.key === 'Escape') { closeMenu(); closePanel(); }
    e.stopImmediatePropagation();
  }, true);
})();
