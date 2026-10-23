// Gate Dash trên nền Preact (PO 23/10): đọc thẳng /api/stats của từng Backend lane; màn là hàm của một sổ tay, 15 giây đọc lại
// thì Preact chỉ sửa chỗ số đổi, cây nguồn không bị dựng lại.
// Câu hỏi chính khi thêm nguồn hàng loạt: nguồn nào mang về đồ sạch, nguồn nào toàn rác?
//   Tỷ lệ nhận ở sidebar tính từ trạng thái hiện tại; gồm quyết định máy và PO.
// Sidebar: lọc nền tảng, sắp theo độ sạch / hàng chờ / số hồ sơ / tên; cây tất cả → nền tảng → kênh. Chọn đâu, cả trang tính theo đó.
// Phần máy chỉ trình bày trường kết luận được ghi nhận, không suy ra đã soi sạch.
import { h, render } from 'preact';
import { createStore, useStore as useSheet } from '/kit/store/store.js';

const t = (k) => (window.XRU_I18N ? window.XRU_I18N.t(k) : k);
const n = (v) => (v === null || v === undefined ? '—' : v.toLocaleString('en-US'));
// Nền tảng có trong ô chọn Platform (kể cả chưa có nguồn nào, để thấy sẵn chỗ khi thêm nguồn hàng loạt)
const PLATFORM = { dvids: 'DVIDS', facebook: 'Facebook', reddit: 'Reddit', x: 'X', rss: 'RSS', telegram: 'Telegram', waralbum: 'War Album' };
const MIN_CLOSED_RECORDS = 20; // dưới số này thì % sạch chưa đáng tin → xếp cuối, ghi "ít mẫu"
const STATES = [
  ['WAITING_PO', 'WAIT', 'waiting_po'],
  ['MACHINE_FLAGGED', 'MACHINE FLAG', 'machine_flag_sub'],
  ['DETAINED', 'DETAIN', 'detained'],
  ['ACCEPT_APPROVED', 'ACCEPT', 'cleared_sub'],
  ['ARREST_APPROVED', 'ARREST', 'arrested_sub'],
];
const FINDINGS = [
  ['finding_music', ['MUSIC']],
  ['finding_dup', ['DUPLICATE', 'DUPLICATE_CANDIDATE']],
  ['finding_wm', ['WATERMARK', 'TEXT_WATERMARK']],
  ['finding_text', ['TEXT']],
  ['finding_err', ['AUDIO_ERROR', 'TEXT_WATERMARK_ERROR']],
  ['finding_untagged', ['UNTAGGED']],
];
const SORTS = [['clean_low', 'sort_clean_low'], ['clean_high', 'sort_clean_high'], ['wait', 'sort_wait'], ['total', 'sort_total'], ['name', 'sort_alpha']];

// ---------- Sổ tay của màn ----------
const store = createStore({ live: {}, kind: 'video', scope: null, platform: 'all', q: '', sort: 'clean_low', open: {} });
const useStore = () => useSheet(store);

const wait = (s) => (s.by_state.WAITING_PO || 0) + (s.by_state.MACHINE_FLAGGED || 0);
// Tỷ lệ nhận trong trạng thái nhận/giữ/bắt; không phải tỷ lệ quyết định PO.
function acceptance(s) {
  const b = s.by_state, ok = b.ACCEPT_APPROVED || 0;
  const closed = ok + (b.DETAINED || 0) + (b.ARREST_APPROVED || 0);
  return { ok, closed, pct: closed ? Math.round((ok / closed) * 100) : null, solid: closed >= MIN_CLOSED_RECORDS };
}
const label = (s) => s.name || s.source_name || PLATFORM[s.source_platform] || s.source_platform;
const sourceId = (s) => JSON.stringify([s.source_platform, s.source_name]);
function sorter(sort) {
  const byClean = (dir) => (a, b) => {
    const A = acceptance(a), B = acceptance(b);
    if (A.solid !== B.solid) return A.solid ? -1 : 1; // đủ mẫu lên trước
    return dir * ((A.pct ?? -1) - (B.pct ?? -1)) || wait(b) - wait(a);
  };
  return { clean_low: byClean(1), clean_high: byClean(-1), wait: (a, b) => wait(b) - wait(a), total: (a, b) => b.total - a.total, name: (a, b) => label(a).localeCompare(label(b)) }[sort];
}
// Nguồn gom theo nền tảng; mỗi nhóm có by_state cộng dồn
function groups(lane, sort) {
  const map = new Map();
  for (const src of lane.by_source) {
    const key = src.source_platform;
    if (!map.has(key)) map.set(key, { key, name: PLATFORM[key] || key, total: 0, by_state: {}, sources: [] });
    const g = map.get(key); g.sources.push(src); g.total += src.total;
    for (const [k, v] of Object.entries(src.by_state)) g.by_state[k] = (g.by_state[k] || 0) + v;
  }
  const cmp = sorter(sort), list = [...map.values()].sort(cmp);
  list.forEach((g) => g.sources.sort(cmp));
  return list;
}
// Phạm vi đang chọn: tất cả / một nền tảng / một kênh (kênh không còn thì về tất cả)
function scope(s, lane, gs) {
  const all = { name: t('all_sources_head'), total: lane.total, by_state: lane.by_state };
  if (!s.scope) return all;
  const [kind, key] = s.scope;
  if (kind === 'platform') return gs.find((x) => x.key === key) || { name: PLATFORM[key] || key, total: 0, by_state: {} };
  for (const g of gs) for (const src of g.sources) if (sourceId(src) === key) return { name: label(src), total: src.total, by_state: src.by_state };
  return all;
}

// ---------- Cột trái ----------
function Row({ sel, name, data, cls, s }) {
  const c = acceptance(data), w = wait(data), group = cls === 'is-group';
  const head = c.pct === null ? t('gd_not_reviewed') : `${c.pct}% ${t('gd_clean_word')}${c.solid ? '' : ` · ${t('gd_few')}`}`;
  const pick = (e) => {
    // Bấm vào mũi tên của nhóm: chỉ đóng/mở; bấm vào tên: chọn phạm vi. Bấm "Tất cả nguồn" thì bỏ lọc nền tảng.
    if (group && e.target.classList.contains('n')) { store.set({ open: { ...s.open, [sel[1]]: s.open[sel[1]] === false } }); return; }
    store.set({ scope: sel, ...(!sel ? { platform: 'all' } : sel[0] === 'platform' ? { platform: sel[1] } : {}) });
  };
  return h('div', { class: `side-item ${cls}${JSON.stringify(s.scope) === JSON.stringify(sel) ? ' is-active' : ''}`, onClick: pick },
    h('span', { class: 'n' }, group ? (s.open[sel[1]] === false ? '▸' : '▾') : ''),
    h('div', null, h('div', { class: 't' }, name), h('div', { class: 's' }, head + (w ? ` · ${n(w)} ${t('waiting_count')}` : '')),
      c.pct === null ? null : h('i', { class: 'gd-mini' + (c.solid ? '' : ' is-thin') }, h('s', { style: { width: c.pct + '%' } }))));
}
function Sidebar() {
  const s = useStore(), current = s.live[s.kind], lane = current?.data;
  const gs = lane ? groups(lane, s.sort) : [], sc = lane ? scope(s, lane, gs) : null, q = s.q.trim().toLowerCase();
  const rows = [];
  if (lane) {
    rows.push(h(Row, { key: '*', sel: null, name: t('all_sources_head'), data: lane, cls: 'is-all', s }));
    for (const g of gs) {
      if (s.platform !== 'all' && g.key !== s.platform) continue;
      const hits = g.sources.filter((src) => !q || label(src).toLowerCase().includes(q) || g.name.toLowerCase().includes(q));
      if (!hits.length) continue;
      rows.push(h(Row, { key: g.key, sel: ['platform', g.key], name: g.name, data: g, cls: 'is-group', s }));
      if (s.open[g.key] !== false || q) for (const src of hits) rows.push(h(Row, { key: sourceId(src), sel: ['source', sourceId(src)], name: label(src), data: src, cls: 'is-child', s }));
    }
  }
  const count = Object.fromEntries(gs.map((g) => [g.key, g.total]));
  return [
    h('div', { class: 'side-head' },
      h('div', { class: 'side-count' }, h('b', { id: 'gd-count' }, sc ? n(sc.total) : '—'), h('span', { id: 'gd-count-label' }, s.kind === 'video' ? t('records_video') : t('records_image'))),
      h('label', { class: 'side-search' },
        h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor' }, h('circle', { cx: 11, cy: 11, r: 7 }), h('path', { d: 'M21 21l-4.35-4.35' })),
        h('input', { type: 'search', id: 'gd-q', value: s.q, placeholder: t('search_channels'), 'aria-label': t('search_channels'), onInput: (e) => store.set({ q: e.currentTarget.value }), onKeyDown: (e) => e.stopPropagation() })),
      h('div', { class: 'side-field' }, h('label', { for: 'gd-platform' }, t('platform_lbl')),
        h('select', { id: 'gd-platform', value: s.platform, onChange: (e) => { const v = e.currentTarget.value; store.set({ platform: v, scope: v === 'all' ? null : ['platform', v] }); } },
          lane ? [h('option', { key: 'all', value: 'all' }, `${t('all_platforms')} (${n(lane.total)})`),
            ...[...new Set([...Object.keys(PLATFORM), ...Object.keys(count)])].map((k) => h('option', { key: k, value: k, disabled: !count[k] }, `${PLATFORM[k] || k} (${n(count[k] || 0)})`))] : null)),
      h('div', { class: 'side-field' }, h('label', { for: 'gd-sort' }, t('sort_lbl')),
        h('select', { id: 'gd-sort', value: s.sort, onChange: (e) => store.set({ sort: e.currentTarget.value }) }, SORTS.map(([v, k]) => h('option', { key: v, value: v }, t(k)))))),
    h('div', { class: 'side-items', id: 'gd-tree' }, rows),
    h('div', { class: 'side-pager' }, h('span', { id: 'gd-taken' }, lane ? `${t('gd_updated')} ${new Date(current.read_at).toLocaleString(document.documentElement.lang === 'en' ? 'en-US' : 'vi-VN')}` : '—')),
  ];
}

// ---------- Cột giữa: phễu của phần đang chọn, rồi phần máy ----------
function Funnel({ lane, sc }) {
  const cols = STATES.filter(([k]) => k in lane.by_state);
  return h('section', { class: 'gd-funnel', 'aria-label': t('funnel_aria') },
    h('div', { class: 'gd-funnel-cols', id: 'gd-funnel', style: { '--cols': cols.length } }, cols.map(([k, name, subKey]) => {
      const v = sc.by_state[k] || 0;
      return h('div', { key: k, class: 'gd-step' + (k === 'WAITING_PO' && v ? ' is-wait' : '') }, h('span', { class: 'gd-label' }, name), h('b', null, n(v)),
        h('p', null, t(subKey)), h('small', null, `${sc.total ? Math.round((v / sc.total) * 100) : 0}%`));
    })),
    h('div', { class: 'gd-flow', id: 'gd-flow', 'aria-hidden': 'true' },
      h('span', { class: 'gd-label' }, `${sc.name.toUpperCase()} · ${n(sc.total)} ${t('records_lbl')} · ${t('funnel_flow_lbl')}`),
      h('div', null, cols.map(([k]) => h('i', { key: k, class: 'f-' + k, style: { flex: sc.by_state[k] || 0, display: sc.by_state[k] ? 'block' : 'none' } })))));
}
// Máy: soi bao nhiêu, thấy vấn đề ở bao nhiêu, theo loại. Đúng/sai: chờ lõi.
function Machine({ lane, s }) {
  const head = (extra) => h('div', { class: 'gd-section-head' }, h('h2', null, t('gd_machine_head')), extra);
  if (!lane.machine) return h('section', { class: 'gd-block', id: 'gd-machine' }, head(null), h('p', { class: 'gd-note' }, t('gd_no_machine')));
  const f = lane.machine.findings, o = lane.machine.by_outcome;
  const recorded = Object.entries(o).filter(([key]) => key !== 'NONE').reduce((sum, [, v]) => sum + v, 0);
  const rows = FINDINGS.map(([key, codes]) => [t(key), codes.reduce((sum, code) => sum + (f[code] || 0), 0)]).filter(([, v]) => v);
  const top = Math.max(1, ...rows.map(([, v]) => v));
  return h('section', { class: 'gd-block', id: 'gd-machine' },
    head(h('span', { class: 'gd-label' }, `${t('entire_lane')} ${s.kind === 'video' ? 'VIDEO' : t('kind_image').toUpperCase()}${s.scope ? ` · ${t('unsplit_source')}` : ''}`)),
    h('p', { class: 'gd-machine-line' }, t('gd_recorded'), ' ', h('b', null, n(recorded)), ` / ${n(lane.total)} · ${t('gd_missing')} `, h('b', null, n(o.NONE || 0))),
    h('p', { class: 'gd-machine-line' }, `${t('detained')}: `, h('b', null, n(o.DETAIN || 0)), ' · FLAG: ', h('b', null, n(o.FLAG || 0)), ' · KEEP: ', h('b', null, n(o.KEEP || 0))),
    h('div', { class: 'gd-findings' }, rows.map(([name, v]) => h('div', { key: name }, h('span', null, name), h('i', null, h('s', { style: { width: (v / top) * 100 + '%' } })), h('b', null, n(v))))),
    h('p', { class: 'gd-note' }, t('gd_machine_wait_core')));
}
function Main() {
  const s = useStore(), current = s.live[s.kind], lane = current?.data;
  const sc = lane ? scope(s, lane, groups(lane, s.sort)) : null, status = current?.error || (lane ? '' : t('gd_loading'));
  return [
    h('header', { class: 'page-head' },
      h('div', { class: 'page-title' }, h('a', { href: '/?continent=eurasia' }, 'EURASIA'), h('span', null, '/'), h('a', { href: '/gate/dash/' }, 'GATE'), h('span', null, '/'),
        h('h1', { id: 'gd-scope' }, sc ? sc.name.toUpperCase() : t('all_sources_head'))),
      h('div', { class: 'gd-kind', 'aria-label': t('record_type_aria') }, ['video', 'image'].map((kind) => h('button', {
        key: kind, 'data-kind': kind, 'aria-pressed': String(s.kind === kind), onClick: () => store.set({ kind, scope: null, platform: 'all' }),
      }, kind === 'video' ? 'Video' : t('kind_image'))))),
    h('p', { id: 'gd-status', class: 'gd-note' + (current?.error ? ' is-error' : ''), role: 'status' }, status),
    lane ? h(Funnel, { lane, sc }) : null,
    h('p', { class: 'gd-note' }, t('gd_ratio_note')),
    lane ? h(Machine, { lane, s }) : null,
    h('footer', { class: 'page-foot' }, h('div', null), h('div', { id: 'gd-foot' }, t('real_read_only'))),
  ];
}

// ---------- Đọc số: 15 giây một lượt khi màn đang hiện, lượt trước chưa xong thì không gọi lượt mới ----------
let backends = null, inFlight = false;
async function refresh(initial = false) {
  if (inFlight || (document.hidden && !initial)) return;
  inFlight = true;
  try {
    if (!backends) { const config = await fetch('/ui-config', { cache: 'no-store' }); if (!config.ok) throw new Error('UI config unavailable'); backends = await config.json(); }
    await Promise.all(['video', 'image'].map(async (kind) => {
      let entry;
      try {
        const response = await fetch(backends[kind + '_backend'] + '/api/stats', { cache: 'no-store', signal: AbortSignal.timeout(10000) });
        if (!response.ok) throw new Error('Backend unavailable');
        const data = await response.json(); if (data.db_found !== true) throw new Error('Ledger unavailable');
        entry = { data, read_at: new Date().toISOString(), error: null };
      } catch { entry = { data: null, error: t('gd_read_error') }; }
      store.set((s) => ({ live: { ...s.live, [kind]: entry } }));
    }));
  } catch {
    store.set({ live: { video: { data: null, error: t('gd_read_error') }, image: { data: null, error: t('gd_read_error') } } });
  } finally { inFlight = false; }
}
window.addEventListener('xru-lang-applied', () => store.set({}));
render(h(Sidebar), document.querySelector('.side'));
render(h(Main), document.querySelector('.ws-main'));
refresh(true);
setInterval(refresh, 15000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
