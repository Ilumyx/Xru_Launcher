// ==========================================================================
// XRU RAIL — thanh dọc bên trái, một bản cho mọi trang.
// Trang chỉ đặt:  <nav class="rail" data-rail="gate" data-active="image"></nav><script src="js/rail.js"></script>
//   data-rail   : khu nào (launcher, array, crawler, gate) → lấy menu trong RAILS bên dưới
//   data-active : mục đang mở (khóa trong menu)
//   data-panel  : có thì thêm nút đóng/mở cột danh sách (trang Gate có cột danh sách)
// Thêm/sửa mục rail: sửa RAILS ở file này, mọi trang đổi theo.
// ==========================================================================
(() => {
  const ICONS = {
    search:   '<circle cx="11" cy="11" r="7"/><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35"/>',
    bars:     '<path d="M4 19V13M10 19V5M16 19V9M22 19V3"/>',
    table:    '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 10v10"/>',
    feed:     '<path d="M5 4v16M9 6h11M9 12h11M9 18h11"/><circle cx="5" cy="6" r="1.5" fill="currentColor"/><circle cx="5" cy="12" r="1.5" fill="currentColor"/><circle cx="5" cy="18" r="1.5" fill="currentColor"/>',
    panel:    '<rect x="3" y="4" width="18" height="16" rx="2"/><line x1="9" y1="4" x2="9" y2="20"/>',
    image:    '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/><polyline points="21 15 16 10 5 21"/>',
    video:    '<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>',
    watch:    '<rect x="2" y="3" width="20" height="14" rx="2"/><polygon points="10 7 15 10 10 13" fill="currentColor" stroke="none"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
    stats:    '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
  };

  // Mỗi khu: logo về đâu, rồi các nhóm mục (giữa hai nhóm có vạch ngắn).
  const RAILS = {
    launcher: {
      label: 'Lục địa Liên Bang', home: 'launcher_mockup.html?continent=xru', homeTip: 'XRU FEDERAL // Bản đồ Toàn Cảnh Liên Bang',
      groups: [[{ key: 'array', href: 'array_search.html', icon: 'search', tip: 'Array (/ hoặc Ctrl+K)' }]],
    },
    array: {
      label: 'Lục địa Liên Bang', home: 'launcher_mockup.html?continent=xru', homeTip: 'Về Launcher (ESC)',
      groups: [[{ key: 'array', href: 'array_search.html', icon: 'search', tip: 'Array — blind test (/)' }]],
    },
    crawler: {
      label: 'Điều hướng Crawler', home: 'launcher_mockup.html?continent=eurasia', homeTip: 'Về Launcher (ESC)',
      groups: [
        [{ key: 'dash', href: 'crawler_dash.html', icon: 'bars', tip: 'Dashboard' }],
        [{ key: 'sources', href: 'crawler_sources.html', icon: 'table', tip: 'Nguồn đã thêm' },
         { key: 'activity', href: 'crawler_dash_activity.html', icon: 'feed', tip: 'Dòng hoạt động' }],
      ],
    },
    gate: {
      label: 'Điều hướng Gate', home: 'launcher_mockup.html', homeTip: 'Về Launcher (ESC)',
      groups: [
        [{ key: 'image', href: 'gate_image.html', icon: 'image', tip: 'Gate Image' },
         { key: 'video', href: 'gate_video.html', icon: 'video', tip: 'Gate Video' },
         { key: 'watch', href: 'gate_video_watch.html', icon: 'watch', tip: 'Gate Video — Xem to (thử)' },
         { key: 'dash', href: 'gate_dash.html', icon: 'stats', tip: 'Gate Dash' }],
      ],
    },
  };

  const LOGO = `<svg viewBox="140 60 520 520" fill="currentColor">
    <mask id="xru-emblem-mask"><rect x="100" y="0" width="600" height="600" fill="#fff"/><rect x="140" y="305" width="80" height="30" fill="#000"/><rect x="580" y="305" width="80" height="30" fill="#000"/></mask>
    <circle cx="400" cy="320" r="220" fill="none" stroke="currentColor" stroke-width="40" mask="url(#xru-emblem-mask)"/>
    <rect x="290" y="240" width="40" height="150"/><rect x="470" y="240" width="40" height="150"/>
    <rect x="290" y="420" width="220" height="30"/><rect x="382" y="145" width="36" height="80"/>
    <circle cx="400" cy="320" r="35"/></svg>`;

  const svg = (name) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">${ICONS[name]}</svg>`;

  const nav = document.currentScript.previousElementSibling;
  const kind = nav.dataset.rail, active = nav.dataset.active;
  const rail = RAILS[kind];
  if (!rail) throw new Error(`rail.js: không có khu "${kind}"`);

  const item = (m) => m.key === active
    ? `<a href="${m.href}" class="rail-icon-btn is-active" data-tooltip="${m.tip}" aria-label="${m.tip}" aria-current="page">${svg(m.icon)}</a>`
    : `<a href="${m.href}" class="rail-icon-btn" data-tooltip="${m.tip}" aria-label="${m.tip}">${svg(m.icon)}</a>`;

  const groups = rail.groups.map((g) => `<div class="rail-nav">${g.map(item).join('')}</div>`);
  if ('panel' in nav.dataset) {
    groups.unshift(`<div class="rail-nav"><button class="rail-icon-btn" data-tooltip="Đóng / mở danh sách" aria-label="Đóng / mở danh sách" onclick="toggleGatePanel()">${svg('panel')}</button></div>`);
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
})();
