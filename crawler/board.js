// Phần chung của hai màn Crawler (Dash, Nguồn) trên nền Preact (PO 23/10). Chỉ đọc /api/board.
//   Sổ tay chung: bảng đọc được, bộ lọc trên URL (nền tảng dùng chung giữa hai màn), câu lỗi.
//   Hỏi tem sổ (~1ms) 5 giây một lần và khi quay lại cửa sổ; tem đổi (hoặc vừa mất kết nối) mới đọc lại cả bảng.
//   Bảng đổi thì Preact chỉ sửa chỗ số đổi: Crawler đang cào cũng không dựng lại bảng mỗi 5 giây.
import { h } from 'preact';
import { createStore } from '/kit/store/store.js';

export const t = (key, fill) => { const text = window.XRU_I18N.t(key); return fill ? text.replace(/\{(\w+)\}/g, (_, name) => fill[name]) : text; };
export const n = (v) => (v == null ? '—' : Number(v).toLocaleString('en-US'));
export const two = (v) => String(v).padStart(2, '0');
export const stamp = (iso) => { if (!iso) return '—'; const d = new Date(iso); return `${two(d.getDate())}/${two(d.getMonth() + 1)} ${two(d.getHours())}:${two(d.getMinutes())}`; };

// Sổ tay của một màn Crawler. extra: phần riêng của màn (sort mặc định, nhóm mở…). quick lạ thì bỏ.
export function boardStore(extra, quickKeys) {
  const p = new URLSearchParams(location.search);
  const quick = p.get('quick') || '';
  return createStore({ board: null, sources: [], readAt: '', fault: null, backend: null,
    plat: (p.get('plat') || '').split(',').filter(Boolean), quick: quickKeys.includes(quick) ? quick : '', q: '', ...extra, ...(p.get('sort') ? { sort: p.get('sort') } : {}) });
}

// Đọc bảng theo tem sổ. toSources(rows) dựng dòng của màn; câu lỗi lưu dạng khoá chữ + phần Backend trả (không dịch).
export function watchBoard(store, toSources) {
  let disconnected = false, polling = false, seen = null;
  const fail = (key, extra = '') => store.set({ fault: key ? { key, extra } : null });
  async function readBoard() {
    try {
      const r = await fetch(store.s.backend + '/api/board', { cache: 'no-store', signal: AbortSignal.timeout(20000) }), data = await r.json();
      if (!Array.isArray(data.rows)) throw Error(data.error || t('cr_err_nodata'));
      store.set({ board: data, sources: toSources(data.rows), readAt: stamp(new Date().toISOString()) });
      const failures = Object.values(data.errors || {});
      failures.length ? fail('cr_err_missing', failures.join(' · ')) : fail();
      disconnected = !data.complete;
    } catch (e) { disconnected = true; fail('cr_err_down_read', e.message); }
  }
  async function health() {
    if (!store.s.backend || polling || document.hidden) return;
    polling = true;
    try {
      const r = await fetch(store.s.backend + '/api/stamp', { cache: 'no-store', signal: AbortSignal.timeout(3000) }), tem = await r.json();
      if (!r.ok && !tem.errors) throw Error('HTTP ' + r.status);
      if (disconnected || !tem.stamp || tem.stamp !== seen) { seen = tem.stamp; await readBoard(); }
    } catch { disconnected = true; fail('cr_err_down'); }
    finally { polling = false; }
  }
  window.addEventListener('focus', health);
  setInterval(health, 5000);
  window.addEventListener('xru-lang-applied', () => store.set({}));
  fetch('/ui-config', { cache: 'no-store' }).then((r) => r.json()).then((c) => { store.set({ backend: c.crawler_backend }); health(); }).catch(() => fail('cr_err_config'));
}

// Bộ lọc nằm trên URL; nền tảng dùng chung giữa Dash và Nguồn. Rail mang bộ lọc sang màn kia (XRU_RAILS.crawler.carry).
export function keepFilters(store, defaultSort, path) {
  store.subs.add(() => {
    const s = store.s, q = new URLSearchParams();
    if (s.plat.length) q.set('plat', s.plat.join(','));
    if (s.quick) q.set('quick', s.quick);
    if (s.sort && s.sort !== defaultSort) q.set('sort', s.sort);
    const qs = q.toString() ? '?' + q : '', plat = s.plat.length ? '?plat=' + encodeURIComponent(s.plat.join(',')) : '';
    if (location.search !== qs) history.replaceState(null, '', path + qs);
    window.XRU_RAILS.crawler.carry((key) => (path.endsWith(key + '.html') ? qs : plat));
  });
}
export const platQuery = (s) => (s.plat.length ? '?plat=' + encodeURIComponent(s.plat.join(',')) : '');

// Sidebar trái: lọc nhanh rồi nền tảng, mỗi dòng có số đếm; set = store.set của màn. quick: { key: [khoá chữ, test] }; match(s, skip) bỏ qua một nhóm lọc khi đếm.
export function FilterRows({ s, set, quick, match, platName, platHead, warn = 'red', redQuick = () => true }) {
  const toggle = (list, v) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const row = (key, on, label, count, red, pick) => h('button', { key, type: 'button', class: 'f-row' + (on ? ' on' : '') + (count ? '' : ' empty'), onClick: pick },
    h('span', null, label), h('b', { class: red && count ? warn : '' }, count));
  const qpool = s.sources.filter((src) => match(src, 'quick'));
  const plats = {};
  for (const src of s.sources.filter((x) => match(x, 'plat'))) plats[src.platform] = (plats[src.platform] || 0) + 1;
  const all = [...new Set(s.sources.map((src) => src.platform))].sort((a, b) => (plats[b] || 0) - (plats[a] || 0));
  return [
    h('div', { key: 'qh', class: 'f-head' }, h('span', null, t('cr_f_quick'))),
    ...Object.entries(quick).map(([k, [label, test]]) => { const c = qpool.filter(test).length; return row('q:' + k, s.quick === k, t(label), c, redQuick(k), () => set({ quick: s.quick === k ? '' : k })); }),
    h('div', { key: 'ph', class: 'f-head' }, h('span', null, platHead(all.length))),
    ...all.map((p) => row('p:' + p, s.plat.includes(p), platName(p), plats[p] || 0, false, () => set({ plat: toggle(s.plat, p) }))),
  ];
}

export const SearchBox = ({ value, ph, aria, onInput }) => h('label', { class: 'side-search' },
  h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor' }, h('circle', { cx: 11, cy: 11, r: 7 }), h('path', { d: 'M21 21l-4.35-4.35' })),
  h('input', { type: 'search', value, placeholder: ph, 'aria-label': aria, onInput: (e) => onInput(e.currentTarget.value), onKeyDown: (e) => e.stopPropagation() }));
