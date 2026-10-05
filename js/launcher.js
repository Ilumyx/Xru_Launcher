// ==========================================================================
// XRU FEDERAL LAUNCHER — CONTINENTAL DISPATCH SYSTEM
// Mỗi lục địa quản lý các Country trực thuộc độc lập
// ==========================================================================

const CONTINENTAL_DATA = {
  xru: {
    id: 'xru',
    name: 'XRU FEDERAL',
    sub: 'Bản đồ Địa Chính Trị & Tổng Chỉ Huy Toàn Liên Bang',
    stats: [
      { label: 'Lục Địa', value: '4 Khối', type: 'ok' },
      { label: 'Tổng Quốc Gia', value: '11 Lands', type: 'ok' },
      { label: 'Tình Trạng', value: 'ONLINE', type: 'ok' }
    ],
    isFederalOverview: true,
    continents: [
      {
        id: 'euramerika',
        code: 'CON-01',
        name: 'EURAMERIKA',
        role: 'AI Infrastructure & Model Industry',
        desc: 'Hậu phương AI Liên Bang: Cung cấp API LLM local, YOLO, SAM và ươm tạo model',
        landsCount: '2 Countries (Grid, Incubator)',
        status: '● SẴN SÀNG',
        statusType: 'live'
      },
      {
        id: 'eurasia',
        code: 'CON-02',
        name: 'EURASIA',
        role: 'Data & Labeling Industry',
        desc: 'Công xưởng dữ liệu Liên Bang: Thu thập, kiểm định thông quan và bầy AI gán nhãn',
        landsCount: '4 Countries (Gate, Crawler, Foundry, Division)',
        status: '● HOẠT ĐỘNG (548 chờ)',
        statusType: 'alert'
      },
      {
        id: 'euruska',
        code: 'CON-03',
        name: 'EURUSKA',
        role: 'Content Factory',
        desc: 'Tổ hợp chế tạo khí tài: Cắt dựng montage, hiệu ứng, render Shorts 9:16',
        landsCount: '2 Countries (Processing, Manufacturing)',
        status: '● HOẠT ĐỘNG',
        statusType: 'live'
      },
      {
        id: 'europa',
        code: 'CON-04',
        name: 'EUROPA',
        role: 'Tenant-Facing & SaaS',
        desc: 'Khối ngoại giao: Giao diện SaaS bóng bẩy, tactical dashboard và tiếp đón đối tác',
        landsCount: '3 Countries (Interface, Delivery, Tenant)',
        status: '▲ STAGING',
        statusType: 'stale'
      }
    ]
  },

  euramerika: {
    id: 'euramerika',
    name: 'EURAMERIKA',
    sub: 'Hậu phương AI Liên Bang & Công nghiệp Huấn luyện Mô hình',
    stats: [
      { label: 'Active Models', value: 'YOLO / SAM', type: 'ok' },
      { label: 'Cluster GPU', value: 'ONLINE', type: 'ok' },
      { label: 'Local API', value: 'SẴN SÀNG', type: 'ok' }
    ],
    lands: [
      {
        code: '1.1',
        name: 'Grid',
        tagline: 'Cung cấp API LLM local, YOLO và SAM cho Eurasia (Xru_Grid)',
        mods: [
          { label: 'API Local', url: '#' },
          { label: 'YOLO v11 Service', url: '#' },
          { label: 'SAM Segment', url: '#' },
          { label: 'Loadout', url: '/p/loadout?land=Grid' }
        ],
        ago: 'Vừa xong',
        status: '● SẴN SÀNG',
        statusType: 'live'
      },
      {
        code: '1.2',
        name: 'Incubator',
        tagline: 'Huấn luyện và ươm tạo model chuyên dụng (Xru_Incubator)',
        mods: [
          { label: 'Training Pipeline', url: '#' },
          { label: 'Weights & Checkpoints', url: '#' },
          { label: 'Loadout', url: '/p/loadout?land=Incubator' }
        ],
        ago: '2 ngày trước',
        status: '● HOẠT ĐỘNG',
        statusType: 'live'
      }
    ]
  },

  eurasia: {
    id: 'eurasia',
    name: 'EURASIA',
    sub: 'Lục địa Công xưởng Dữ liệu & Kiểm định Thông quan Liên Bang XRU',
    stats: [
      { label: 'PO Pending', value: '548', type: 'alert' },
      { label: 'Active Lands', value: '3 / 4', type: 'ok' },
      { label: 'System State', value: 'ONLINE', type: 'ok' }
    ],
    lands: [
      {
        code: 'SEC-01',
        name: 'Gate',
        tagline: 'Kiểm định đầu vào & Cửa khẩu thông quan',
        mods: [
          { label: 'Duyệt ảnh (548 chờ)', url: 'gate_image.html', isAlert: true },
          { label: 'Duyệt video', url: 'gate_video.html' },
          { label: 'Loadout', url: '/p/loadout?land=Gate' }
        ],
        ago: 'Vừa xong',
        status: '● SẴN SÀNG',
        statusType: 'live'
      },
      {
        code: 'SEC-02',
        name: 'Crawler',
        tagline: 'Vòi bạch tuộc thu thập nguyên liệu thô (Video / Image / News)',
        mods: [
          { label: 'Dashboard', url: 'crawler_dash.html' },
          { label: 'Nguồn đã thêm', url: 'crawler_sources.html' },
          { label: 'Loadout', url: '/p/loadout?land=Crawler' }
        ],
        ago: '1 ngày trước',
        status: '● HOẠT ĐỘNG',
        statusType: 'live'
      },
      {
        code: 'SEC-03',
        name: 'Foundry',
        tagline: 'Tiền xử lý + Đóng gói Work Item cho dây chuyền gán nhãn',
        mods: [
          { label: 'Tiền xử lý & Work Item', url: '#' },
          { label: 'Loadout', url: '/p/loadout?land=Foundry' }
        ],
        ago: '12 ngày trước',
        status: '▲ CHỜ ĐỢT MỚI',
        statusType: 'stale'
      },
      {
        code: 'SEC-04',
        name: 'Division',
        tagline: 'Bầy AI gán nhãn & Định danh thực thể (Labeling platoon)',
        mods: [
          { label: 'Trực chiến Gán nhãn (:5057)', url: 'http://127.0.0.1:5057' },
          { label: 'Loadout', url: '/p/loadout?land=Division' }
        ],
        ago: '3 ngày trước',
        status: '● SẴN SÀNG',
        statusType: 'live'
      }
    ]
  },

  euruska: {
    id: 'euruska',
    name: 'EURUSKA',
    sub: 'Tổ hợp Chế tạo Khí tài & Nhà máy Sản xuất Content Thành phẩm',
    stats: [
      { label: 'In Pipeline', value: '18 Shorts', type: 'ok' },
      { label: 'Đang Render', value: '2 Jobs', type: 'ok' },
      { label: 'Định Dạng', value: '9:16 VERTICAL', type: 'ok' }
    ],
    lands: [
      {
        code: '3.1',
        name: 'Processing',
        tagline: 'Cắt dựng montage, hiệu ứng âm thanh, render engine',
        mods: [
          { label: 'Montage Editor', url: '#' },
          { label: 'Audio Synth', url: '#' },
          { label: 'Render Queue', url: '#' },
          { label: 'Loadout', url: '/p/loadout?land=Processing' }
        ],
        ago: '4 giờ trước',
        status: '● SẴN SÀNG',
        statusType: 'live'
      },
      {
        code: '3.2',
        name: 'Manufacturing',
        tagline: 'Đóng gói xuất xưởng Content thành phẩm (Shorts 9:16)',
        mods: [
          { label: 'Kho thành phẩm Shorts', url: '#' },
          { label: 'Kênh xuất bản tự động', url: '#' },
          { label: 'Loadout', url: '/p/loadout?land=Manufacturing' }
        ],
        ago: '1 ngày trước',
        status: '● HOẠT ĐỘNG',
        statusType: 'live'
      }
    ]
  },

  europa: {
    id: 'europa',
    name: 'EUROPA',
    sub: 'Khối Ngoại giao, Kênh Phân phối & Giao diện Khách hàng SaaS',
    stats: [
      { label: 'Active Tenants', value: '3 Đối Tác', type: 'ok' },
      { label: 'Kênh Phân Phối', value: '5 Nền Tảng', type: 'ok' },
      { label: 'Môi Trường', value: 'STAGING', type: 'stale' }
    ],
    lands: [
      {
        code: '4.1',
        name: 'Interface',
        tagline: 'Giao diện SaaS bóng bẩy, tactical dashboard',
        mods: [
          { label: 'Tactical Dashboard', url: '#' },
          { label: 'Client Portal', url: '#' },
          { label: 'Loadout', url: '/p/loadout?land=Interface' }
        ],
        ago: '5 ngày trước',
        status: '● HOẠT ĐỘNG',
        statusType: 'live'
      },
      {
        code: '4.2',
        name: 'Delivery',
        tagline: 'Kênh phân phối nội dung đa nền tảng tự động',
        mods: [
          { label: 'Multi-Platform Dispatch', url: '#' },
          { label: 'Schedules', url: '#' },
          { label: 'Loadout', url: '/p/loadout?land=Delivery' }
        ],
        ago: '3 ngày trước',
        status: '● SẴN SÀNG',
        statusType: 'live'
      },
      {
        code: '4.3',
        name: 'Tenant Interaction',
        tagline: 'Tiếp đón và quản lý quyền truy cập đối tác / khách hàng bên ngoài',
        mods: [
          { label: 'Access Keys & Tokens', url: '#' },
          { label: 'Tenant Contracts', url: '#' },
          { label: 'Loadout', url: '/p/loadout?land=Tenant' }
        ],
        ago: 'Chưa kích hoạt',
        status: '■ DỰ KIẾN',
        statusType: 'idle'
      }
    ]
  }
};

let currentContinent = 'xru';
let disposeGlobe = null;
let currentView = 'list';

function switchContinent(continentId) {
  if (!CONTINENTAL_DATA[continentId]) return;
  currentContinent = continentId;

  // Cập nhật trạng thái active trên thanh Rail
  document.querySelectorAll('.rail-icon-btn, .rail-logo').forEach(el => {
    const isTarget = el.getAttribute('data-continent') === continentId;
    el.classList.toggle('is-active', isTarget);
  });

  renderStage();
}

function renderStage() {
  const data = CONTINENTAL_DATA[currentContinent];
  const stage = document.querySelector('.stage');
  if (!stage) return;

  disposeGlobe?.();
  disposeGlobe = null;

  // Render Header
  const headerHtml = `
    <header class="hud-header${data.isFederalOverview ? ' federal-header' : ''}">
      <div class="hud-title-group">
        <h1>${data.name}</h1>
        ${data.isFederalOverview ? '' : `<p class="hud-sub">${data.sub}</p>`}
      </div>
      ${data.isFederalOverview ? '' : `<div class="hud-stats">
        ${data.stats.map(s => `
          <div class="stat-block">
            <span class="stat-label">${s.label}</span>
            <span class="stat-value ${s.type}">${s.value}</span>
          </div>
        `).join('')}
      </div>`}
    </header>
  `;

  let contentHtml = '';

  // NẾU LÀ TỔNG QUAN LIÊN BANG XRU (BẤM VÀO LOGO XRU TRÊN ĐỈNH)
  if (data.isFederalOverview) {
    contentHtml = LauncherGlobe.markup(data.continents);
  } else {
    // NẾU LÀ MỘT LỤC ĐỊA CỤ THỂ (EURAMERIKA, EURASIA, EURUSKA, EUROPA)
    contentHtml = `
      <!-- VIEW: BẢNG HÀNH TRÌNH -->
      <section class="list-view" id="view-list" style="display:${currentView === 'list' ? 'flex' : 'none'};">
        <div class="itin-header">
          <span>Mã</span>
          <span>Quốc Gia (Country / Land)</span>
          <span>Module Khả Dụng</span>
          <span>Hoạt Động Cuối</span>
          <span>Trạng Thái</span>
        </div>
        ${data.lands.map(l => `
          <div class="itin-row" ${l.name === 'Gate' ? 'onclick="if(!event.target.closest(\'a\')) window.location.href=\'gate_image.html\'" style="cursor:pointer;"' : ''}>
            <span class="itin-code">${l.code}</span>
            <div class="itin-name">
              <span class="status-dot ${l.statusType === 'stale' ? 'stale' : (l.statusType === 'idle' ? 'idle' : '')}"></span>
              ${l.name === 'Gate' ? '<a href="gate_image.html" style="color:inherit; text-decoration:none;" title="Vào bàn làm việc Gate"><b>Gate</b> ↗</a>' : `<b>${l.name}</b>`}
            </div>
            <div class="itin-mods">
              ${l.mods.map(m => `
                <a href="${m.url}" class="itin-mod-pill ${m.isAlert ? 'alert' : ''}" ${m.url.startsWith('http') ? 'target="_blank"' : ''}>
                  ${m.label}
                </a>
              `).join('')}
            </div>
            <div class="itin-ago ${l.statusType === 'stale' ? 'stale' : ''}">${l.ago}</div>
            <div class="itin-status ${l.statusType}">${l.status}</div>
          </div>
        `).join('')}
      </section>

      <!-- VIEW: HUD GRID CARDS -->
      <section class="grid-view" id="view-grid" style="display:${currentView === 'grid' ? 'grid' : 'none'};">
        ${data.lands.map(l => `
          <article class="sector-card" style="${l.statusType === 'alert' ? 'border-top: 2px solid var(--accent);' : ''}">
            <div class="sector-top">
              <div>
                <div class="sector-badge">
                  <span class="status-dot ${l.statusType === 'stale' ? 'stale' : (l.statusType === 'idle' ? 'idle' : '')}"></span>
                  <h2 class="sector-name">${l.name}</h2>
                </div>
                <p class="sector-tagline">${l.tagline}</p>
              </div>
              <div class="sector-activity">
                <span class="act-lbl">Last Active</span>
                <div class="act-val ${l.statusType === 'stale' ? 'stale' : ''}">${l.ago.toUpperCase()}</div>
              </div>
            </div>
            <div class="sector-actions" style="margin-top:20px;">
              ${l.mods.map(m => `
                <a href="${m.url}" class="action-btn ${m.isAlert ? 'primary' : ''}" ${m.url.startsWith('http') ? 'target="_blank"' : ''}>
                  ${m.label}
                </a>
              `).join('')}
            </div>
          </article>
        `).join('')}
      </section>
    `;
  }

  // Footer HUD
  const footerHtml = `
    <footer class="hud-footer">
      <div class="key-hints">
        ${data.isFederalOverview ? '' : '<span><span class="key">1</span> Cards</span><span><span class="key">2</span> List</span>'}
        <span><span class="key">/</span> Tìm kiếm</span>
        ${currentContinent === 'eurasia' ? '<span><span class="key">G</span> Gate</span><span><span class="key">C</span> Crawler</span>' : ''}
      </div>
      <div>XRU FEDERAL SYSTEM // 2026</div>
    </footer>
  `;

  stage.innerHTML = headerHtml + contentHtml + footerHtml;
  if (data.isFederalOverview) disposeGlobe = LauncherGlobe.mount(stage.querySelector('.federal-map'), switchContinent);
}

function switchView(type) {
  currentView = type;
  const grid = document.getElementById('view-grid');
  const list = document.getElementById('view-list');
  if (!grid || !list) return;

  if (type === 'grid') {
    grid.style.display = 'grid';
    list.style.display = 'none';
  } else {
    grid.style.display = 'none';
    list.style.display = 'flex';
  }
}

// Bắt phím tắt
window.addEventListener('keydown', (e) => {
  const isInputActive = ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName);
  if (isInputActive) return;

  if (e.key === '1') switchView('grid');
  if (e.key === '2') switchView('list');
  if (e.key.toLowerCase() === 'g' && currentContinent === 'eurasia') {
    window.open('gate_image.html', '_blank');
  }
  if (e.key.toLowerCase() === 'c' && currentContinent === 'eurasia') {
    window.location.href = 'crawler_dash.html';
  }
});

// Khởi chạy mặc định lúc nạp trang
document.addEventListener('DOMContentLoaded', () => {
  switchContinent(currentContinent);
});

// Mở thẳng một lục địa từ link ở trang khác, vd. launcher_mockup.html?continent=euruska
(() => {
  const c = new URLSearchParams(location.search).get('continent');
  if (c && typeof switchContinent === 'function') switchContinent(c);
})();
