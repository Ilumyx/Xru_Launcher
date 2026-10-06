// ==========================================================================
// XRU ACCOUNT — Menu tài khoản (bấm avatar IL) + Cài đặt giao diện
// Đổi: ngôn ngữ, profile màu, chế độ sáng/tối, font chữ, màu nhấn, cỡ giao diện. Lưu vào trình duyệt, mọi trang dùng chung.
// Màu của từng profile nằm ở profiles/<tên>.css. Thêm profile: tạo file đó, thêm 1 dòng @import
// trong kit/tokens.css và 1 dòng vào PROFILES dưới đây.
// Chữ của menu và bảng cài đặt lấy từ kit/i18n/i18n.js (không viết cứng hai thứ tiếng ở đây).
// File này nạp trong <head> để áp cài đặt ngay, không bị nháy màu cũ.
// ==========================================================================
(() => {
  const KEY = 'xru-ui-settings';
  const DEFAULTS = { profile: 'graphite', mode: 'dark', font: 'Inter', accent: '', zoom: '1.15', lang: 'en' };
  const PROFILES = [['graphite', 'Graphite'], ['cyan', 'Cyan XRU']];
  const MODES = ['system', 'light', 'dark'];
  const LANGUAGES = [['vi', 'Tiếng Việt'], ['en', 'English']];
  const t = (k) => (window.XRU_I18N ? window.XRU_I18N.t(k, settings.lang) : k);
  const systemMode = window.matchMedia('(prefers-color-scheme: dark)');

  // Nạp i18n nếu chưa có
  if (!window.XRU_I18N && !document.getElementById('xru-i18n-script')) {
    const s = document.createElement('script');
    s.id = 'xru-i18n-script';
    s.src = new URL('../i18n/i18n.js', document.currentScript.src).href;
    document.head.appendChild(s);
  }

  const FONTS = {
    'Inter':          'Inter:wght@300;400;500;600;700',
    'Be Vietnam Pro': 'Be+Vietnam+Pro:wght@300;400;500;600;700',
    'IBM Plex Sans':  'IBM+Plex+Sans:wght@300;400;500;600;700',
    'Roboto':         'Roboto:wght@300;400;500;700',
  };
  // Chọn màu nhấn theo tên; không có ô nhập mã màu. [mã màu, khóa chữ trong kit/i18n/i18n.js]; '' = màu nhấn của profile.
  const ACCENTS = [
    ['', 'accent_profile'],
    ['#00d2b4', 'acc_cyan'],
    ['#4da3ff', 'acc_blue'],
    ['#9b8cff', 'acc_purple'],
    ['#7fd17f', 'acc_green'],
    ['#e7e7e2', 'acc_white'],
    ['#f3ce5c', 'acc_yellow'],
    ['#f574bd', 'acc_pink'],
    ['#ff8a70', 'acc_orange'],
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
    document.documentElement.lang = s.lang;
    document.documentElement.dataset.lang = s.lang;
    const r = document.documentElement.style;
    r.setProperty('--font-sans', `'${s.font}', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`);
    document.documentElement.dataset.profile = PROFILES.some(([k]) => k === s.profile) ? s.profile : DEFAULTS.profile;
    if (s.accent) r.setProperty('--accent-rgb', [1, 3, 5].map(i => parseInt(s.accent.slice(i, i + 2), 16)).join(', '));
    else r.removeProperty('--accent-rgb');
    r.setProperty('--ui-zoom', s.zoom);
    ensureFont(s.font);
    if (window.XRU_I18N && typeof window.XRU_I18N.apply === 'function') {
      window.XRU_I18N.apply(s.lang);
    }
  }

  let settings = load();
  apply(settings);
  systemMode.addEventListener('change', () => { if (settings.mode === 'system') apply(settings); });

  function update(patch) {
    settings = { ...settings, ...patch };
    save(settings);
    apply(settings);
    renderMenu();
    renderPanel();
  }

  // ---------------- Giao diện menu + bảng cài đặt ----------------
  let menu, modal;

  function renderMenu() {
    if (!menu) return;
    menu.innerHTML = `
      <div class="acc-head">
        <div class="acc-ava">IL</div>
        <div><div class="acc-name">Ilumyx</div><div class="acc-role">PO · XRU Federal</div></div>
      </div>
      <div class="acc-sep"></div>
      <button class="acc-item" data-act="settings">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>
        <span>${t('menu_settings')}</span>
      </button>
      <div class="acc-sep"></div>
      <button class="acc-item" data-act="close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        <span>${t('menu_logout')}</span>
      </button>`;
  }

  function buildMenu() {
    menu = document.createElement('div');
    menu.className = 'acc-menu';
    renderMenu();
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
      if (b) {
        if (b.dataset.k === 'profile') update({ profile: b.dataset.v, accent: '' });
        else update({ [b.dataset.k]: b.dataset.v });
      }
      if (e.target.closest('[data-reset]')) update({ ...DEFAULTS });
      if (e.target.closest('[data-done]')) closePanel();
    });
    document.body.appendChild(modal);
  }

  function renderPanel() {
    if (!modal) return;
    const on = (k, v) => (settings[k] === v ? ' is-on' : '');
    modal.innerHTML = `
      <div class="acc-panel" role="dialog" aria-label="${t('menu_settings')}">
        <div class="acc-panel-head">
          <span>${t('settings_title')}</span>
          <button class="acc-x" data-done aria-label="${t('close_tip')}">✕</button>
        </div>

        <div class="acc-options">
          <div class="acc-row">
            <span class="acc-row-label">${t('lang_lbl')}</span>
            <div class="acc-seg" aria-label="${t('lang_lbl')}">
              ${LANGUAGES.map(([v, n]) => `<button class="${on('lang', v).trim()}" data-k="lang" data-v="${v}" aria-pressed="${settings.lang === v}">${n}</button>`).join('')}
            </div>
          </div>
          <div class="acc-row">
            <span class="acc-row-label">Profile</span>
            <div class="acc-seg" aria-label="Profile">
              ${PROFILES.map(([v, n]) => `<button class="${on('profile', v).trim()}" data-k="profile" data-v="${v}" aria-pressed="${settings.profile === v}">${n}</button>`).join('')}
            </div>
          </div>
          <div class="acc-row">
            <span class="acc-row-label">${t('mode_lbl')}</span>
            <div class="acc-seg acc-modes" aria-label="${t('mode_lbl')}">
              ${MODES.map((v) => [v, t('mode_' + v)]).map(([v, n]) => `<button class="${on('mode', v).trim()}" data-k="mode" data-v="${v}" aria-pressed="${settings.mode === v}">${n}</button>`).join('')}
            </div>
          </div>
          <div class="acc-row">
            <span class="acc-row-label">${t('font_lbl')}</span>
            <details class="acc-dropdown" name="acc-setting-picker">
              <summary><b class="acc-font-sample">Aa</b><span>${settings.font}</span><span class="acc-chevron">⌄</span></summary>
              <div class="acc-dropdown-menu" aria-label="${t('font_lbl')}">
                ${Object.keys(FONTS).map(f => {
                  ensureFont(f);
                  return `<button class="acc-option${on('font', f)}" data-k="font" data-v="${f}" aria-label="${f}" style="font-family:'${f}'" aria-pressed="${settings.font === f}"><b class="acc-font-sample">Aa</b><span>${f}</span><span class="acc-check">${settings.font === f ? '✓' : ''}</span></button>`;
                }).join('')}
              </div>
            </details>
          </div>
          <div class="acc-row">
            <span class="acc-row-label">${t('accent_lbl')}</span>
            <details class="acc-dropdown" name="acc-setting-picker">
              <summary><i class="acc-swatch" style="background:${settings.accent || 'var(--accent)'}"></i><span>${t(ACCENTS.find(([c]) => c === settings.accent)?.[1] || 'accent_profile')}</span><span class="acc-chevron">⌄</span></summary>
              <div class="acc-dropdown-menu" aria-label="${t('accent_lbl')}">
                ${ACCENTS.map(([c, n]) => {
                  const label = t(n);
                  return `<button class="acc-option${on('accent', c)}" data-k="accent" data-v="${c}" aria-label="${label}" aria-pressed="${settings.accent === c}"><i class="acc-swatch" style="background:${c || 'var(--accent)'}"></i><span>${label}</span><span class="acc-check">${settings.accent === c ? '✓' : ''}</span></button>`;
                }).join('')}
              </div>
            </details>
          </div>
          <div class="acc-row">
            <span class="acc-row-label">${t('zoom_lbl')}</span>
            <div class="acc-seg" aria-label="${t('zoom_lbl')}">
              ${ZOOMS.map(([v, n]) => `<button class="${on('zoom', v).trim()}" data-k="zoom" data-v="${v}" aria-pressed="${settings.zoom === v}">${n}</button>`).join('')}
            </div>
          </div>
        </div>

        <div class="acc-foot">
          <button class="acc-ghost" data-reset>${t('btn_reset')}</button>
          <button class="acc-primary" data-done>${t('btn_done')}</button>
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
