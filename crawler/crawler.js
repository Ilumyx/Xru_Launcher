// Dash Crawler trên nền Preact (PO 23/10); số thật lấy từ /api/board, chỉ đọc. Phần đọc bảng và bộ lọc chung ở crawler/board.js.
// Sidebar trái = tìm + lọc (lọc nhanh, nền tảng); nền tảng nằm trên URL, dùng chung với màn Nguồn. Lọc gì thì số và biểu đồ tính theo đó.
import { h, render } from 'preact';
import { useStore } from '/kit/store/store.js';
import { t, n, two, boardStore, watchBoard, keepFilters, platQuery, FilterRows, SearchBox } from '/crawler/board.js';

const PLATFORM = { facebook: 'Facebook', dvids: 'DVIDS', waralbum: 'War Album', reddit: 'Reddit', x: 'X', telegram: 'Telegram', youtube: 'YouTube', vk: 'VK', tiktok: 'TikTok', bilibili: 'Bilibili', direct: 'Direct' };
const SWATCH = ['var(--accent)', 'var(--m-11)', 'var(--m-8)', 'var(--m-6)', 'var(--m-5)'];
const platformName = (p) => PLATFORM[p] || (p ? p[0].toUpperCase() + p.slice(1) : '—');
const dm = (d) => `${two(d.getDate())}/${two(d.getMonth() + 1)}`;
const isToday = (iso) => iso && new Date(iso).toDateString() === new Date().toDateString();
const QUICK = { issue: ['cr_q_issue', (s) => s.state === 'broken'], waiting: ['cr_q_waiting', (s) => s.waiting] };
const SERIES = [['stock', 'cr_stock'], ['total', 'cr_total'], ['video', null], ['image', 'kind_image']];

const store = boardStore({ series: { stock: true, total: true, video: true, image: true } }, Object.keys(QUICK));
keepFilters(store, '', '/crawler/dash.html');
// Một dòng là một cụm; ảnh/video chỉ là số khai sinh theo loại.
watchBoard(store, (rows) => rows.map((row) => ({ ...row, name: row.display_name })));

function matcher(s) {
  const q = s.q.trim().toLocaleLowerCase('vi');
  return (src, skip) => {
    if (q && !`${src.name} ${src.platform}`.toLocaleLowerCase('vi').includes(q)) return false;
    if (skip !== 'plat' && s.plat.length && !s.plat.includes(src.platform)) return false;
    if (skip !== 'quick' && s.quick && !QUICK[s.quick][1](src)) return false;
    return true;
  };
}

function Sidebar() {
  const s = useStore(store);
  return [
    h('div', { class: 'side-head' },
      h('div', { class: 'side-count' }, h('b', { id: 'cr-count' }, s.board ? n(s.sources.length) : '—'), h('span', null, t('cr_sources'))),
      h(SearchBox, { value: s.q, ph: t('cr_search_ph'), aria: t('cr_search_aria'), onInput: (q) => store.set({ q }) })),
    h('div', { class: 'side-items', id: 'cr-filters' }, s.board ? h(FilterRows, { s, set: (c) => store.set(c), quick: QUICK, match: matcher(s), platName: platformName, platHead: () => t('cr_f_platform'), warn: 'gap' }) : null),
  ];
}

// Biểu đồ: khung toạ độ x 48→678, y 330→32. Kho = tổng đã thu tính tới cuối mỗi ngày (PO 22/10: nhìn kho lớn dần).
function Chart({ days, rows, total, series }) {
  if (!days.length) return h('svg', { class: 'cr-chart', id: 'cr-chart', viewBox: '0 0 720 380' });
  const perDay = (kind) => days.map((_, i) => rows.reduce((a, r) => a + r.by_day[kind][i], 0));
  const img = perDay('image'), vid = perDay('video'), tot = img.map((v, i) => v + vid[i]);
  const stock = tot.map((_, i) => total - tot.slice(i + 1).reduce((a, v) => a + v, 0));
  // Tắt Kho thì trục co lại theo đường mỗi ngày.
  const top = Math.max(...tot, ...(series.stock ? stock : []), 1);
  const step = [5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000].find((v) => v * 3 >= top) || 100000;
  const max = step * 3, X = (i) => 48 + i * (630 / Math.max(days.length - 1, 1)), Y = (v) => 330 - (v / max) * 298;
  const pts = (a) => a.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
  const k = (v) => (v >= 1000 ? `${v / 1000}k` : v);
  const end = (a) => [h('circle', { cx: X(a.length - 1), cy: Y(a.at(-1)).toFixed(1), r: 3 }),
    h('text', { class: 'cr-chart-value', x: X(a.length - 1) - 12, y: (Y(a.at(-1)) - 12).toFixed(1), 'text-anchor': 'end' }, n(a.at(-1)))];
  const line = (key, a, area) => h('g', { id: 'cr-series-' + key, class: 'cr-series ' + key, hidden: !series[key] },
    area ? h('polygon', { class: 'area', points: `48,330 ${pts(a)} 678,330` }) : null, h('polyline', { class: 'line', points: pts(a) }), end(a));
  return h('svg', { class: 'cr-chart', id: 'cr-chart', viewBox: '0 0 720 380', role: 'img', 'aria-label': t('cr_chart_aria') },
    [3, 2, 1, 0].map((g) => [h('path', { class: 'grid', d: `M48 ${Y(g * step).toFixed(1)}H678` }), h('text', { x: 8, y: (Y(g * step) + 4).toFixed(1) }, k(g * step))]),
    line('stock', stock), line('total', tot, true), line('video', vid), line('image', img),
    days.map((d, i) => h('text', { x: X(i).toFixed(1), y: 360, 'text-anchor': 'middle' }, `${d.slice(8, 10)}/${d.slice(5, 7)}`)));
}

function Main() {
  const s = useStore(store), board = s.board, ok = board?.complete;
  const rows = s.sources.filter((src) => matcher(s)(src));
  const chips = [...s.plat.map(platformName), ...(s.quick ? [t(QUICK[s.quick][0])] : [])];
  const last = (kind) => rows.reduce((a, r) => a + r.by_day[kind].at(-1), 0);
  const total = (kind) => rows.reduce((a, r) => a + r[kind === 'image' ? 'images' : 'videos'], 0);
  const on = rows.filter((r) => r.enabled).length;
  const latest = rows.filter((r) => r.last_born_at).sort((a, b) => new Date(b.last_born_at) - new Date(a.last_born_at))[0];
  const when = latest && new Date(latest.last_born_at);
  const byPlat = {};
  for (const r of rows) byPlat[r.platform] = (byPlat[r.platform] || 0) + r.assets;
  const plats = Object.entries(byPlat).sort((a, b) => b[1] - a[1]), sum = plats.reduce((a, [, v]) => a + v, 0);
  let at = 0;
  const stops = plats.map(([, v], i) => { const from = at; at += (sum ? v / sum : 0) * 100; return `${SWATCH[Math.min(i, SWATCH.length - 1)]} ${from}% ${at}%`; });
  const message = s.fault ? t(s.fault.key) + s.fault.extra : '';
  const metric = (label, value, sub) => h('div', { class: 'cr-metric' }, h('span', { class: 'cr-label' }, t(label)), value, h('p', null, sub));
  return h('main', { class: 'cr-stage' },
    h('header', { class: 'page-head' },
      h('div', { class: 'page-title' }, h('a', { href: '/?continent=eurasia' }, 'EURASIA'), h('span', null, '/'), h('a', { href: '/crawler/dash.html' + platQuery(s) }, 'CRAWLER'), h('span', null, '/'), h('h1', null, 'DASHBOARD')),
      h('div', { class: 'cr-active' }, h('span', { id: 'cr-active' }, chips.length ? t('cr_filtering') + chips.join(' + ') : ''),
        chips.length ? h('button', { type: 'button', id: 'cr-clear', onClick: () => store.set({ plat: [], quick: '' }) }, t('cr_clear')) : null)),
    h('div', { id: 'cr-error', role: 'alert', hidden: !message }, message),
    h('section', { class: 'cr-metrics', 'aria-label': t('cr_metrics_aria') },
      metric('cr_m_today', h('b', null, ok ? n(last('image') + last('video')) : '—'), ok ? t('cr_split', { img: n(last('image')), vid: n(last('video')) }) : ''),
      metric('cr_m_on', h('b', null, ok ? on : '—', ' ', h('span', { class: 'cr-dim' }, '/ ', ok ? rows.length : '—')), ok ? t('cr_off_n', { n: rows.length - on }) : ''),
      metric('cr_m_total', h('b', null, ok ? n(total('image') + total('video')) : '—'), ok ? t('cr_split', { img: n(total('image')), vid: n(total('video')) }) : ''),
      metric('cr_m_latest', h('b', null, ok && when ? (isToday(latest.last_born_at) ? `${two(when.getHours())}:${two(when.getMinutes())}` : dm(when)) : '—'), ok && latest ? latest.name : '')),
    h('div', { class: 'cr-columns' },
      h('section', { class: 'cr-section' },
        h('div', { class: 'cr-section-head' }, h('h3', null, t('cr_rhythm')), h('span', { class: 'cr-label' }, t('cr_last7'))),
        ok ? h(Chart, { days: board.days, rows, total: total('image') + total('video'), series: s.series }) : h('svg', { class: 'cr-chart', id: 'cr-chart', viewBox: '0 0 720 380' }),
        h('div', { class: 'cr-legend', 'aria-label': t('cr_legend_aria') }, SERIES.map(([key, label]) => h('button', {
          key, type: 'button', 'data-chart-series': key, 'aria-pressed': String(s.series[key]), 'aria-controls': 'cr-series-' + key,
          onClick: () => store.set({ series: { ...s.series, [key]: !s.series[key] } }),
        }, h('i', { class: key }), label ? h('span', null, t(label)) : 'Video')))),
      h('aside', { class: 'cr-section' },
        h('div', { class: 'cr-section-head' }, h('h3', null, t('cr_by_platform')), h('a', { href: '/crawler/sources.html' + platQuery(s) }, t('cr_view_sources'))),
        h('div', { class: 'cr-platform-chart', id: 'cr-donut', role: 'img', style: { background: ok && sum ? `conic-gradient(${stops.join(', ')})` : 'var(--panel)' } },
          h('div', { class: 'cr-platform-total' }, h('b', { id: 'cr-donut-total' }, ok ? n(sum) : '—'), h('span', null, t('cr_img_vid')))),
        h('div', { class: 'cr-platform-legend', id: 'cr-platforms' }, ok ? plats.map(([p, v], i) => h('div', { key: p },
          h('span', null, h('i', { style: { background: SWATCH[Math.min(i, SWATCH.length - 1)] } }), platformName(p)), h('b', null, n(v)), h('small', null, `${((sum ? v / sum : 0) * 100).toFixed(1)}%`))) : null))),
    h('footer', { class: 'page-foot' }, h('div', null), h('div', { id: 'cr-foot' }, message || t('cr_foot'))));
}

render(h(Sidebar), document.querySelector('.side'));
render(h(Main), document.querySelector('.ws-main'));
