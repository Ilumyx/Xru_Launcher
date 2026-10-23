// Gate ảnh trên nền Preact (PO 23/10), cùng khuôn Gate video: màn là hàm của một sổ tay, chỉ chỗ đổi được vẽ lại.
// Lõi giữ mọi sự thật và quyết định. Quyết là đi tiếp ngay, lệnh ghi xếp hàng gửi ngầm, gửi hết mới đọc lại lặng lẽ (Ca 6, UI_STUDY_CASE.md).
import { h, render } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { Wall, WallPager, WallNext } from '/kit/wall/Wall.js';
import { Filters } from '/kit/sidebar/Filters.js';
import { createStore, useStore as useSheet } from '/kit/store/store.js';

const t = (key) => window.XRU_I18N.t(key);
const n = (v) => Number(v).toLocaleString('en-US');
// Trang 250 ảnh (PO 22/10): đủ lướt bắt pattern, máy không gồng; lõi trả tối đa 250 món một lượt (Gate Order 55).
const SIZE = 250;
const STATES = ['WAITING_PO', 'DETAINED', 'ACCEPT_APPROVED', 'PURGE_APPROVED'];
const TABS = [['WAITING_PO', 'WAIT', 'alert'], [null, 'MACHINE FLAG', ''], ['DETAINED', 'DETAIN', 'warn'], ['ACCEPT_APPROVED', 'ACCEPT', 'accept'], ['PURGE_APPROVED', 'PURGE', '']];
// Nút theo lane: [lệnh, khoá nhãn hoặc nhãn, kiểu nút, phím]
const ACTIONS = {
  WAITING_PO: [['ACCEPT', 'btn_approve', 'approve', 'a'], ['DETAIN', 'btn_detain', 'detain', 'd']],
  DETAINED: [['RESCUE', 'Rescue → Waiting', 'approve', ''], ['PURGE', 'btn_purge', 'purge', '']],
};
// Sort theo lane: hai sort "PO quyết định" chỉ có nghĩa ở lane đã quyết.
const sorts = (state) => [['oldest', 'sort_oldest'], ['newest', 'sort_newest'], ...(state === 'WAITING_PO' ? [] : [['po_newest', 'sort_po_newest'], ['po_oldest', 'sort_po_oldest']])];
const sourceName = (item) => item.source_name || item.source_platform;
const resolution = (item) => item.resolution_readable ? `${item.width}×${item.height}` : '';

// ---------- Sổ tay của màn ----------
const p = new URLSearchParams(location.search);
const store = createStore({
  view: { state: STATES.includes(p.get('state')) ? p.get('state') : 'WAITING_PO', platform: p.get('platform') || '', source: p.get('source') || '',
    sort: p.get('sort') || 'oldest', q: p.get('q') || '', page: Math.max(1, +p.get('page') || 1) },
  page: null, selectedId: p.get('selected'), detail: null, drafts: {}, notice: '', reading: false, peek: false,
});
const useStore = () => useSheet(store);
// Ảnh đang xem: bản chi tiết nếu đã đọc xong, không thì bản trong trang.
function current(s) {
  if (!s.selectedId || !s.page) return null;
  if (s.detail?.item.xru_id === s.selectedId) return s.detail.item;
  return s.page.items.find((r) => r.xru_id === s.selectedId) || null;
}
const valid = (s, item = current(s)) => !!item && !s.reading && item.state === s.view.state;

// ---------- Nói chuyện với Backend ----------
let backend = null, videoBackend = null, readId = 0, detailId = 0, pending = false, flushing = null;
const outbox = [];
const media = (id) => backend + '/media/' + encodeURIComponent(id);
const thumb = (id, w) => backend + '/thumb/' + encodeURIComponent(id) + (w ? '?w=' + w : '');
async function json(path, options = {}) {
  const r = await fetch(backend + path, { ...options, cache: 'no-store', signal: AbortSignal.timeout(20000) });
  const d = await r.json(); if (!r.ok) throw new Error(d.error || 'Backend Gate ảnh chưa sẵn sàng.'); return d;
}
const query = (v) => new URLSearchParams({ state: v.state, sort: v.sort, platform: v.platform, source: v.source, q: v.q.trim(), limit: SIZE, offset: (v.page - 1) * SIZE });
// Trang trống: lane trống thật hay bộ lọc không ra món nào. Không phải lỗi, nên hiện giữa tường chứ không ở ô báo.
const emptyText = (v) => (v.platform || v.source || v.q.trim() ? 'Không có ảnh khớp bộ lọc.' : 'Lane này trống.');

async function readDetail(id) {
  const my = ++detailId; if (!id) return;
  try {
    const d = await json('/api/assets/' + encodeURIComponent(id)); if (my !== detailId) return;
    store.set({ detail: d });
    if (d.item.state !== store.s.view.state) { store.set({ notice: 'Ảnh đã chuyển trạng thái. Đang đọc lại hàng chờ…' }); await load(); }
  } catch (e) { if (my !== detailId) return; store.set({ reading: true, notice: 'Backend Gate ảnh đang tắt hoặc đọc lỗi. ' + e.message }); }
}
function choose(id) { if (store.s.reading || id === store.s.selectedId) return; store.set({ selectedId: id, detail: null }); readDetail(id); }

// Đọc một trang. Trang vượt cuối (món vừa rời lane) thì lõi trả trang cuối; số trang theo offset lõi trả.
// preferred: id muốn chọn; không còn trên trang thì chọn ô đầu.
async function load(preferred = store.s.selectedId, locate = false) {
  if (!backend) return; if (flushing) await flushing;
  if (!sorts(store.s.view.state).some(([k]) => k === store.s.view.sort)) store.set((s) => ({ view: { ...s.view, sort: 'oldest' } }));
  const id = ++readId; pending = id;
  try {
    const q = query(store.s.view); if (locate && preferred) q.set('selected', preferred);
    const result = await json('/api/queue?' + q); if (id !== readId) return;
    const items = result.items, at = items.findIndex((r) => r.xru_id === preferred);
    const pick = items.length ? items[Math.max(0, at)].xru_id : null;
    store.set((s) => ({ page: result, view: { ...s.view, page: Math.floor(result.offset / SIZE) + 1 }, reading: false,
      notice: '', selectedId: pick, detail: null }));
    readDetail(pick);
  } catch (e) {
    if (id !== readId) return;
    store.set({ reading: true, notice: 'Backend Gate ảnh đang tắt hoặc đọc lỗi. Số đang hiện, nếu có, chưa được cập nhật. ' + e.message });
  } finally { if (pending === id) pending = false; }
}
// Tìm là một bộ lọc (PO 23/10): gõ đúng mã xru thì lõi trả đúng món đó. Món ở trạng thái khác thì chuyển sang đó (bỏ lọc nguồn),
// mã của một clip thì mở màn Gate video; không có ở đâu thì lọc như chữ thường (không còn món nào).
async function jump(id) {
  try {
    const d = await json('/api/assets/' + encodeURIComponent(id));
    store.set((s) => ({ view: { ...s.view, state: d.item.state, platform: '', source: '', q: id, page: 1 } }));
  } catch {
    try {
      const r = await fetch(videoBackend + '/api/assets/' + encodeURIComponent(id), { cache: 'no-store' });
      if (r.ok) { const d = await r.json(); location.href = '/gate/video/?' + new URLSearchParams({ state: d.item.lane, view: 'grid', q: id, selected: id }); return; }
    } catch { /* Backend video tắt: coi như không thấy */ }
  }
  await load(id);
}
const isId = (text) => /^xru-[0-9a-f-]{36}$/i.test(text);
function go(change, preferred = store.s.selectedId) { store.set((s) => ({ view: { ...s.view, ...change } })); load(preferred); }

// Quyết là đi tiếp ngay: ảnh rời trang tại chỗ, lệnh ghi xếp hàng gửi ngầm từng lệnh một; gửi hết mới đọc lại lõi một lượt
// cho khớp số và lấp chỗ trống cuối trang. Ghi lỗi thì bỏ các lệnh sau, đọc lại về đúng ảnh đó, ghi chú vẫn giữ.
function act(action) {
  const s = store.s, item = current(s); if (!valid(s, item) || !ACTIONS[s.view.state]?.some(([cmd]) => cmd === action)) return;
  const at = s.page.items.findIndex((r) => r.xru_id === item.xru_id); if (at < 0) return;
  outbox.push({ id: item.xru_id, body: { action, expected_state: item.state, po_note: s.drafts[item.xru_id] ?? item.po_note } });
  ++readId;
  const rest = s.page.items.filter((r) => r.xru_id !== item.xru_id), next = rest.length ? rest[Math.min(at, rest.length - 1)].xru_id : null;
  store.set({ page: { ...s.page, items: rest, total: s.page.total - 1, counts: { ...s.page.counts, [s.view.state]: s.page.counts[s.view.state] - 1 } }, selectedId: next, detail: null, notice: '' });
  readDetail(next);
  if (!flushing) flushing = flush();
}
async function flush() {
  while (outbox.length) {
    const job = outbox[0];
    try {
      await json('/api/assets/' + encodeURIComponent(job.id) + '/decisions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(job.body) });
      outbox.shift(); store.set((s) => { const drafts = { ...s.drafts }; delete drafts[job.id]; return { drafts }; });
    } catch (e) {
      outbox.length = 0; flushing = null;
      await load(job.id); store.set({ notice: 'Chưa xác nhận lưu. Ghi chú được giữ. ' + e.message }); return;
    }
  }
  flushing = null; await refresh();
}
// Đọc lại lặng lẽ: không khoá nút, không chọn lại nếu ảnh đang xem còn trên trang; bấm quyết trong lúc đọc thì bỏ kết quả này.
async function refresh() {
  const id = ++readId;
  try {
    const result = await json('/api/queue?' + query(store.s.view)); if (id !== readId || outbox.length) return;
    const keep = result.items.some((r) => r.xru_id === store.s.selectedId), pick = keep ? store.s.selectedId : result.items[0]?.xru_id ?? null;
    store.set((s) => ({ page: result, view: { ...s.view, page: Math.floor(result.offset / SIZE) + 1 }, selectedId: pick,
      ...(keep ? {} : { detail: null }) }));
    if (!keep) readDetail(pick);
  } catch { /* lượt đọc thường sau sẽ báo lỗi */ }
}

// ---------- Cột trái ----------
let searchTimer = 0;
function Sidebar() {
  const s = useStore(), v = s.view, page = s.page, list = useRef();
  useEffect(() => { list.current?.querySelector('.is-active')?.scrollIntoView({ block: 'nearest' }); }, [s.selectedId]);
  const sections = page ? [
    { key: 'source', title: t('source_lbl'), tree: { all: t('all_sources'), total: page.counts[v.state], sources: page.sources, platform: v.platform, source: v.source } },
    { key: 'sort', title: t('sort_lbl'), rows: sorts(v.state).map(([key, label]) => ({ pick: { sort: key }, name: t(label), on: v.sort === key })) },
  ] : [];
  const typed = (e) => {
    const q = e.currentTarget.value; clearTimeout(searchTimer); ++readId;
    store.set((st) => ({ view: { ...st.view, q, page: 1 } })); searchTimer = setTimeout(() => (isId(q.trim()) ? jump(q.trim()) : load()), 250);
  };
  return [
    h('div', { class: 'side-head' },
      h('div', { class: 'side-count' }, h('b', { id: 'total' }, page ? n(page.total) : '—'), h('span', { id: 'lane-label' }, v.state)),
      h('label', { class: 'side-search' },
        h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor' }, h('circle', { cx: 11, cy: 11, r: 7 }), h('path', { d: 'M21 21l-4.35-4.35' })),
        h('input', { type: 'search', value: v.q, placeholder: t('search_title_src'), 'aria-label': t('search_in_list'), onInput: typed, onKeyDown: (e) => e.stopPropagation() }))),
    h(Filters, { id: 'filters', sections, onPick: (change) => go({ ...change, page: 1 }) }),
    h('div', { class: 'side-items', ref: list }, page ? page.items.map((item, i) => h('a', {
      key: item.xru_id, href: '#', class: 'side-item ig-row' + (item.xru_id === s.selectedId ? ' is-active' : ''),
      onClick: (e) => { e.preventDefault(); choose(item.xru_id); },
    }, h('span', { class: 'n' }, String(page.offset + i + 1).padStart(2, '0')),
    h('div', null, h('div', { class: 't' }, item.title || ''), h('div', { class: 's' }, sourceName(item) + (resolution(item) ? ' · ' + resolution(item) : ''))))) : null),
    page ? h(WallPager, { id: 'page-count', offset: page.offset, total: page.total, size: SIZE, onPage: (to) => go({ page: to }, null) }) : h('div', { class: 'side-pager wall-pager', id: 'page-count' }),
  ];
}

// ---------- Cột giữa ----------
function Main() {
  const s = useStore(), v = s.view, page = s.page;
  return [
    h('header', { class: 'page-head ws-head' },
      h('div', { class: 'page-title' }, h('a', { href: '/?continent=eurasia' }, 'EURASIA'), h('span', null, '/'), h('a', { href: '/gate/dash/' }, 'GATE'), h('span', null, '/'), h('h1', null, 'IMAGE')),
      h('div', { class: 'gate-tabs' }, TABS.map(([state, label, tone]) => state
        ? h('button', { key: label, class: 'gate-tab-btn' + (state === v.state ? ' is-active' : ''), onClick: () => go({ state, platform: '', source: '', page: 1 }, null) },
          h('span', { class: 'count ' + tone }, page ? n(page.counts[state]) : '—'), h('span', null, label))
        : h('button', { key: label, class: 'gate-tab-btn', disabled: true, title: 'Nghi trùng hiện trong hồ sơ ảnh; không có lane FLAG riêng' }, h('span', { class: 'count' }), h('span', null, label))))),
    h('div', { class: 'ig-flash', id: 'err', role: 'status', hidden: !s.notice }, s.notice),
    page ? h(Wall, { id: 'tiles', style: '--wall-min:120px; --wall-ratio:1 / 1', items: page.items, offset: page.offset, activeId: s.selectedId, sizes: '120px', empty: emptyText(v),
      thumb: (it, w) => thumb(it.xru_id, w), onSelect: (it, double) => { choose(it.xru_id); if (double) store.set({ peek: true }); } }) : null,
    page ? h(WallNext, { id: 'tiles-end', offset: page.offset, total: page.total, size: SIZE, onPage: (to) => go({ page: to }, null) }) : null,
    h('footer', { class: 'page-foot' },
      h('div', { class: 'key-hints' }, h('span', null, h('span', { class: 'key' }, 'A'), ' ', t('btn_approve')), h('span', null, h('span', { class: 'key' }, 'D'), ' ', t('btn_detain'))),
      h('div', null, 'XRU GATE // 2026')),
  ];
}

// ---------- Cột phải ----------
function Duplicates({ detail }) {
  const d = detail.duplicate_inspection; if (!d) return null;
  const head = d.status === 'COMPLETE' ? (detail.related.length ? 'Nghi trùng · DINO · PO quyết định' : 'Trạm DINO đã chạy; không có cặp vượt ngưỡng')
    : d.status === 'ERROR' ? 'Trạm trùng chưa chạy xong · Grid/media lỗi; bằng chứng cũ nếu có vẫn giữ' : 'Ảnh này chưa được trạm trùng soi';
  return h('section', { class: 'duplicate-evidence' }, h('p', { class: 'insp-cap' }, head),
    detail.related.map((row) => h('a', { key: row.xru_id, class: 'insp-cap', href: media(row.xru_id), target: '_blank', rel: 'noopener' },
      row.xru_id + ' · DINO ' + row.similarity.toFixed(4), h('img', { src: thumb(row.xru_id), alt: row.xru_id, loading: 'lazy', style: 'max-width:100%' }))));
}
function Inspector() {
  const s = useStore(), item = current(s), page = s.page, v = s.view, ok = valid(s, item);
  const index = item && page ? page.items.findIndex((r) => r.xru_id === item.xru_id) : -1;
  const detail = s.detail?.item.xru_id === s.selectedId ? s.detail : null, waiting = v.state === 'WAITING_PO';
  return [
    h('div', { class: 'insp-top' }, h('span', { class: 'insp-tag', id: 'insp-state' }, item?.state || ''),
      h('span', { class: 'insp-num', id: 'insp-num' }, index >= 0 ? `${String(page.offset + index + 1).padStart(3, '0')} / ${page.total}` : '')),
    item ? h('div', { class: 'insp-img' }, h('img', { id: 'insp-img', src: media(item.xru_id), alt: item.title || '', onDblClick: () => store.set({ peek: true }) })) : null,
    h('div', { class: 'insp-title', id: 'insp-title' }, item?.title || ''),
    h('div', { class: 'insp-caption' }, h('div', { class: 'insp-label' }, t('caption_lbl')), h('p', { class: 'insp-cap', id: 'insp-cap' }, item?.description || '')),
    detail ? h(Duplicates, { detail }) : null,
    h('dl', { class: 'insp-meta' },
      h('dt', null, t('res_lbl')), h('dd', { id: 'insp-res' }, item ? resolution(item) : ''),
      h('dt', null, t('source_lbl')), h('dd', { id: 'insp-src' }, item ? sourceName(item) : ''),
      h('dt', null, 'Lane'), h('dd', { id: 'insp-lane' }, item?.state || '')),
    h('div', { class: 'insp-bottom' },
      waiting ? h('textarea', { class: 'insp-note', id: 'po_note_input', placeholder: t('note_ph'), 'aria-label': 'Ghi chú', disabled: !ok,
        value: item ? (s.drafts[item.xru_id] ?? item.po_note ?? '') : '', onInput: (e) => item && store.set({ drafts: { ...s.drafts, [item.xru_id]: e.currentTarget.value } }) })
        : h('p', { class: 'insp-cap', id: 'insp-note' }, item?.po_note || ''),
      h('div', { class: 'insp-acts' }, (ACTIONS[v.state] || []).map(([cmd, label, kind, key]) => h('button', { key: cmd, type: 'button', class: 'card-act-btn ' + kind, 'data-act': cmd, disabled: !ok, onClick: () => act(cmd) },
        h('span', null, label.includes('_') ? t(label) : label), key ? h('kbd', null, key.toUpperCase()) : null))),
      item && !ACTIONS[v.state] ? h('span', { id: 'readonly' }, 'Terminal state · Read-only mode') : null),
  ];
}
// Xem ảnh lớn: bấm đúp hoặc Enter; Esc hay nút Đóng để thoát.
function Peek() {
  const s = useStore(), item = current(s), open = s.peek && !!item;
  return h('div', { class: 'gr-peek' + (open ? ' is-open' : ''), id: 'peek', role: 'dialog', 'aria-label': 'Xem ảnh lớn', 'aria-modal': open ? 'true' : null },
    open ? h('img', { id: 'peek-img', src: media(item.xru_id), alt: item.title || '' }) : null,
    h('button', { id: 'peek-close', class: 'card-act-btn', onClick: () => store.set({ peek: false }) }, 'Đóng · Esc'));
}

// ---------- Địa chỉ trang ----------
store.subs.add(() => {
  const s = store.s, v = s.view, q = new URLSearchParams({ state: v.state });
  for (const [k, val] of Object.entries({ platform: v.platform, source: v.source, sort: v.sort, q: v.q, page: v.page > 1 ? v.page : '', selected: s.selectedId || '' })) if (val) q.set(k, val);
  const url = '/gate/image/?' + q; if (location.pathname + location.search !== url) history.replaceState(null, '', url);
});

// ---------- Phím: A/D quyết, mũi tên chọn ô theo hàng của tường, Enter xem lớn, Esc đóng (PO 22/10) ----------
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey || e.target.closest?.('input,textarea,select')) return;
  const key = e.key.toLowerCase(), s = store.s;
  if (key === 'escape' && s.peek) { e.preventDefault(); store.set({ peek: false }); return; }
  if (key === 'a' || key === 'd') { e.preventDefault(); act(key === 'a' ? 'ACCEPT' : 'DETAIN'); return; }
  if (key === 'enter') { e.preventDefault(); if (current(s) && !s.reading) store.set({ peek: true }); return; }
  if (!s.page || s.reading || !s.selectedId) return;
  const tiles = [...document.getElementById('tiles').children], columns = tiles.filter((x) => x.offsetTop === tiles[0].offsetTop).length || 1;
  const moves = { arrowright: 1, arrowleft: -1, arrowdown: columns, arrowup: -columns };
  if (!(key in moves)) return;
  e.preventDefault();
  const at = s.page.items.findIndex((r) => r.xru_id === s.selectedId);
  choose(s.page.items[Math.max(0, Math.min(s.page.items.length - 1, at + moves[key]))].xru_id);
});
window.addEventListener('xru-lang-applied', () => store.set({}));
// Không vẽ lại gì khi cửa sổ được bấm vào; chỉ đọc lại khi Backend từng mất kết nối.
window.addEventListener('focus', () => { if (store.s.reading && backend && !pending) load(); });
setInterval(() => { if (store.s.reading && !pending && !document.hidden && backend) load(); }, 5000);

render(h(Sidebar), document.querySelector('.side'));
render(h(Main), document.querySelector('.ws-main'));
render(h(Inspector), document.querySelector('.ws-insp'));
render(h(Peek), document.getElementById('peek-root'));
fetch('/ui-config', { cache: 'no-store' }).then((r) => r.json()).then((c) => { backend = c.image_backend; videoBackend = c.video_backend; load(store.s.selectedId, !!store.s.selectedId && !p.has('page')); })
  .catch(() => store.set({ notice: 'Không đọc được cấu hình UI. Hãy tải lại trang.' }));
