// ==========================================================================
// XRU RAIL (kit) — thanh dọc bên trái. Chỉ biết VẼ, không biết land nào có màn gì.
// Trang đặt:  <script>window.XRU_RAILS = { <khu>: { label, home, homeTip, groups: [[{ key, href, icon, tip }]] } }</script>
//             <nav class="rail" data-rail="<khu>" data-active="<key>"></nav><script src=".../kit/rail/rail.js"></script>
//   label/homeTip/tip: khóa chữ trong kit/i18n (không có khóa thì in nguyên chữ). icon: tên trong kit/icons/icons.svg.
//   data-panel: thêm nút đóng/mở cột danh sách (trang có sidebar lọc).
//   Rail vẽ lại khi đổi ngôn ngữ (xru-lang-applied) hoặc khi màn đổi XRU_RAILS rồi phát window 'xru-rail-changed'.
// ==========================================================================
(() => {
  const script = document.currentScript;
  const ICON_SPRITE = new URL('../icons/icons.svg', script.src).href;
  const t = (k) => (window.XRU_I18N ? window.XRU_I18N.t(k) : k);

  const LOGO = `<svg viewBox="140 60 520 520" fill="currentColor">
    <mask id="xru-emblem-mask"><rect x="100" y="0" width="600" height="600" fill="#fff"/><rect x="140" y="305" width="80" height="30" fill="#000"/><rect x="580" y="305" width="80" height="30" fill="#000"/></mask>
    <circle cx="400" cy="320" r="220" fill="none" stroke="currentColor" stroke-width="40" mask="url(#xru-emblem-mask)"/>
    <rect x="290" y="240" width="40" height="150"/><rect x="470" y="240" width="40" height="150"/>
    <rect x="290" y="420" width="220" height="30"/><rect x="382" y="145" width="36" height="80"/>
    <circle cx="400" cy="320" r="35"/></svg>`;

  const svg = (name) => `<svg fill="none" stroke="currentColor"><use href="${ICON_SPRITE}#i-${name}"/></svg>`;

  const nav = script.previousElementSibling;
  if (!nav) return;
  // Menu của khu: trang/vỏ đưa vào window.XRU_RAILS; chữ dịch qua kit/i18n
  function menu(kind) {
    const r = (window.XRU_RAILS || {})[kind];
    if (!r) return null;
    return { ...r, label: t(r.label), homeTip: t(r.homeTip),
      groups: r.groups.map((g) => g.map((m) => ({ ...m, tip: t(m.tip) }))) };
  }

  function renderRail() {
    const kind = nav.dataset.rail, active = nav.dataset.active;
    const rail = menu(kind);
    if (!rail) return;

    const item = (m) => m.key === active
      ? `<a href="${m.href}" class="rail-icon-btn is-active" data-tooltip="${m.tip}" aria-label="${m.tip}" aria-current="page">${svg(m.icon)}</a>`
      : `<a href="${m.href}" class="rail-icon-btn" data-tooltip="${m.tip}" aria-label="${m.tip}">${svg(m.icon)}</a>`;

    const groups = rail.groups.map((g) => `<div class="rail-nav">${g.map(item).join('')}</div>`);
    if ('panel' in nav.dataset) {
      const toggleTip = t('toggle_list');
      groups.unshift(`<div class="rail-nav"><button type="button" class="rail-icon-btn" data-sidebar-toggle aria-expanded="${!document.documentElement.classList.contains('sidebar-hidden')}" data-tooltip="${toggleTip}" aria-label="${toggleTip}">${svg('panel')}</button></div>`);
    }
    // Launcher: logo cũng là một "lục địa" (xru) để launcher.js bật/tắt sáng nó.
    const logoData = kind === 'launcher' ? ' data-continent="xru"' : '';

    nav.setAttribute('aria-label', rail.label);
    nav.innerHTML = `
      <div class="rail-top">
        <a href="${rail.home}" class="rail-logo"${logoData}${kind === 'launcher' ? ` onclick="switchContinent('xru'); return false;"` : ''} data-tooltip="${rail.homeTip}" aria-label="${rail.homeTip}">${LOGO}${kind === 'launcher' ? '<span class="rail-indicator" title="Federal Live"></span>' : ''}</a>
        ${groups.join('<div class="rail-divider"></div>')}
      </div>
      <div class="rail-bottom"><div class="user-avatar" title="Ilumyx (PO)">IL</div></div>`;
  }

  renderRail();
  window.addEventListener('xru-lang-applied', renderRail);
  // Màn đổi href trong XRU_RAILS (mang bộ lọc sang màn kia) thì báo ở đây để rail vẽ lại.
  window.addEventListener('xru-rail-changed', renderRail);
})();
