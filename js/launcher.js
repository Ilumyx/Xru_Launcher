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
        landsCount: '2 Sectors (Grid, Incubator)',
        status: '● SẴN SÀNG',
        statusType: 'live'
      },
      {
        id: 'eurasia',
        code: 'CON-02',
        name: 'EURASIA',
        role: 'Data & Labeling Industry',
        desc: 'Công xưởng dữ liệu Liên Bang: Thu thập, kiểm định thông quan và bầy AI gán nhãn',
        landsCount: '4 Sectors (Crawler, Gate, Foundry, Division)',
        status: '● HOẠT ĐỘNG (548 chờ)',
        statusType: 'alert'
      },
      {
        id: 'euruska',
        code: 'CON-03',
        name: 'EURUSKA',
        role: 'Content Factory',
        desc: 'Tổ hợp chế tạo khí tài: Cắt dựng montage, hiệu ứng, render Shorts 9:16',
        landsCount: '2 Sectors (Processing, Manufacturing)',
        status: '● HOẠT ĐỘNG',
        statusType: 'live'
      },
      {
        id: 'europa',
        code: 'CON-04',
        name: 'EUROPA',
        role: 'Tenant-Facing & SaaS',
        desc: 'Khối ngoại giao: Giao diện SaaS bóng bẩy, tactical dashboard và tiếp đón đối tác',
        landsCount: '3 Sectors (Interface, Delivery, Tenant)',
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
        code: 'SECTOR-1',
        name: 'Grid',
        tagline: 'Cung cấp API LLM local, YOLO và SAM cho Eurasia (Xru_Grid)',
        image: '',
        mods: [
          { label: 'API Local', url: '#' },
          { label: 'YOLO v11', url: '#' },
          { label: 'SAM Segment', url: '#' }
        ],
        ago: 'Vừa xong',
        status: '● SẴN SÀNG',
        statusType: 'live'
      },
      {
        code: 'SECTOR-2',
        name: 'Incubator',
        tagline: 'Huấn luyện và ươm tạo model chuyên dụng (Xru_Incubator)',
        image: '',
        mods: [
          { label: 'Training Pipeline', url: '#' },
          { label: 'Weights & Ckpt', url: '#' }
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
      { label: 'Active Sectors', value: '4 / 4', type: 'ok' },
      { label: 'System State', value: 'ONLINE', type: 'ok' }
    ],
    lands: [
      {
        code: 'SECTOR-1',
        name: 'Crawler',
        tagline: 'Vòi bạch tuộc thu thập nguyên liệu thô (Video / Image / News)',
        image: '',
        mods: [
          { label: 'Dashboard', url: 'crawler_dash.html' },
          { label: 'Nguồn đã thêm', url: 'crawler_sources.html' }
        ],
        ago: '1 ngày trước',
        status: '● HOẠT ĐỘNG',
        statusType: 'live'
      },
      {
        code: 'SECTOR-2',
        name: 'Gate',
        tagline: 'Kiểm định đầu vào & Cửa khẩu thông quan',
        image: '',
        mods: [
          { label: 'Duyệt ảnh (548 chờ)', url: 'gate_image.html', isAlert: true },
          { label: 'Duyệt video', url: 'gate_video.html' }
        ],
        ago: 'Vừa xong',
        status: '● SẴN SÀNG',
        statusType: 'live'
      },
      {
        code: 'SECTOR-3',
        name: 'Foundry',
        tagline: 'Tiền xử lý + Đóng gói Work Item cho dây chuyền gán nhãn',
        image: '',
        mods: [
          { label: 'Tiền xử lý', url: '#' },
          { label: 'Work Item', url: '#' }
        ],
        ago: '12 ngày trước',
        status: '▲ CHỜ ĐỢT MỚI',
        statusType: 'stale'
      },
      {
        code: 'SECTOR-4',
        name: 'Division',
        tagline: 'Bầy AI gán nhãn & Định danh thực thể (Labeling platoon)',
        image: '',
        mods: [
          { label: 'Trực chiến (:5057)', url: 'http://127.0.0.1:5057' }
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
        code: 'SECTOR-1',
        name: 'Processing',
        tagline: 'Cắt dựng montage, hiệu ứng âm thanh, render engine',
        image: '',
        mods: [
          { label: 'Montage Editor', url: '#' },
          { label: 'Render Queue', url: '#' }
        ],
        ago: '4 giờ trước',
        status: '● SẴN SÀNG',
        statusType: 'live'
      },
      {
        code: 'SECTOR-2',
        name: 'Manufacturing',
        tagline: 'Đóng gói xuất xưởng Content thành phẩm (Shorts 9:16)',
        image: '',
        mods: [
          { label: 'Kho thành phẩm', url: '#' },
          { label: 'Xuất bản tự động', url: '#' }
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
        code: 'SECTOR-1',
        name: 'Interface',
        tagline: 'Giao diện SaaS bóng bẩy, tactical dashboard',
        image: '',
        mods: [
          { label: 'Tactical Dashboard', url: '#' },
          { label: 'Client Portal', url: '#' }
        ],
        ago: '5 ngày trước',
        status: '● HOẠT ĐỘNG',
        statusType: 'live'
      },
      {
        code: 'SECTOR-2',
        name: 'Delivery',
        tagline: 'Kênh phân phối nội dung đa nền tảng tự động',
        image: '',
        mods: [
          { label: 'Multi-Platform', url: '#' },
          { label: 'Schedules', url: '#' }
        ],
        ago: '3 ngày trước',
        status: '● SẴN SÀNG',
        statusType: 'live'
      },
      {
        code: 'SECTOR-3',
        name: 'Tenant Interaction',
        tagline: 'Tiếp đón và quản lý quyền truy cập đối tác / khách hàng bên ngoài',
        image: '',
        mods: [
          { label: 'Access Keys', url: '#' },
          { label: 'Contracts', url: '#' }
        ],
        ago: 'Chưa kích hoạt',
        status: '■ DỰ KIẾN',
        statusType: 'idle'
      }
    ]
  }
};

window.CONTINENTAL_DATA = CONTINENTAL_DATA;

let currentContinent = 'xru';
let disposeGlobe = null;

function switchContinent(continentId) {
  if (continentId !== 'xru' && !CONTINENTAL_DATA[continentId]) return;
  currentContinent = continentId;

  // Cập nhật trạng thái active trên thanh Rail
  document.querySelectorAll('.rail-icon-btn, .rail-logo').forEach(el => {
    const isTarget = el.getAttribute('data-continent') === continentId;
    el.classList.toggle('is-active', isTarget);
  });

  // Nếu đang ở màn 3 cột, chuyển continent mượt mà không reload DOM
  const federalMap = document.querySelector('.federal-map');
  if (federalMap && continentId !== 'xru') {
    LauncherGlobe.setActive(continentId);
    return;
  }

  renderStage();
}

function renderStage() {
  const stage = document.querySelector('.stage');
  if (!stage) return;

  disposeGlobe?.();
  disposeGlobe = null;

  // Render Header với Telemetry tối giản
  const headerHtml = `
    <header class="hud-header federal-header">
      <div class="hud-title-group">
        <h1>XRU FEDERAL</h1>
      </div>
      <div class="hud-stats">
        <div class="stat-block">
          <span class="stat-label" data-i18n="system_lbl">Hệ Thống</span>
          <span class="stat-value federal-online">ONLINE</span>
        </div>
      </div>
    </header>
  `;

  // Màn 3 Cột thống nhất
  const contentHtml = LauncherGlobe.markup(CONTINENTAL_DATA.xru.continents);

  // Footer HUD
  const footerHtml = `
    <footer class="page-foot">
      <div class="key-hints">
        <span><span class="key">1</span> Euramerika</span>
        <span><span class="key">2</span> Eurasia</span>
        <span><span class="key">3</span> Euruska</span>
        <span><span class="key">4</span> Europa</span>
        <span><span class="key">/</span> Array</span>
      </div>
      <div>XRU FEDERAL SYSTEM // 2026</div>
    </footer>
  `;

  stage.innerHTML = headerHtml + contentHtml + footerHtml;
  if (window.XRU_I18N && typeof window.XRU_I18N.apply === 'function') {
    window.XRU_I18N.apply();
  }

  disposeGlobe = LauncherGlobe.mount(stage.querySelector('.federal-map'), (selectedId) => {
    currentContinent = selectedId;
    document.querySelectorAll('.rail-icon-btn, .rail-logo').forEach(el => {
      const isTarget = el.getAttribute('data-continent') === selectedId;
      el.classList.toggle('is-active', isTarget);
    });
  });

  const initialTarget = (currentContinent && currentContinent !== 'xru') ? currentContinent : 'eurasia';
  LauncherGlobe.setActive(initialTarget);
}

// Bắt phím tắt
window.addEventListener('keydown', (e) => {
  const isInputActive = ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName);
  if (isInputActive) return;

  if (e.key === '1') switchContinent('euramerika');
  if (e.key === '2') switchContinent('eurasia');
  if (e.key === '3') switchContinent('euruska');
  if (e.key === '4') switchContinent('europa');
});

// Khởi chạy mặc định lúc nạp trang
document.addEventListener('DOMContentLoaded', () => {
  switchContinent('eurasia');
});

// Lắng nghe sự kiện đổi ngôn ngữ để cập nhật lại giao diện
window.addEventListener('xru-lang-applied', () => {
  if (window.XRU_I18N && typeof window.XRU_I18N.apply === 'function') {
    window.XRU_I18N.apply();
  }
});

// Mở thẳng một lục địa từ link ở trang khác, vd. launcher_mockup.html?continent=euruska
(() => {
  const c = new URLSearchParams(location.search).get('continent');
  if (c && typeof switchContinent === 'function') switchContinent(c);
})();
