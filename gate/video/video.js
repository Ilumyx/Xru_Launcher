// Gate video trên nền Preact (PO 23/10). Màn hình là hàm của một sổ tay (store): sổ đổi chỗ nào, Preact chỉ sửa đúng chỗ đó.
// Lõi giữ mọi sự thật và quyết định. Màn giữ trang đang xem trong tay: quyết là đi tiếp ngay, lệnh ghi xếp hàng gửi ngầm,
// gửi hết mới đọc lại lặng lẽ để đối số (Ca 6, UI_STUDY_CASE.md).
import { h, render } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { Wall, WallPager, WallNext } from '/kit/wall/Wall.js';
import { Filters } from '/kit/sidebar/Filters.js';
import { createStore, useStore as useSheet } from '/kit/store/store.js';

const t = (key) => window.XRU_I18N.t(key);
const n = (v) => Number(v).toLocaleString('en-US');
const time = (v) => Number.isFinite(v) ? `${Math.floor(v / 60)}:${String(Math.floor(v % 60)).padStart(2, '0')}` : '';
const SIZE = 100;
const LANES = ['WAITING_PO', 'MACHINE_FLAGGED', 'DETAINED', 'ACCEPT_APPROVED', 'PURGE_APPROVED'];
const TABS = [['WAITING_PO', 'WAIT', 'alert'], ['MACHINE_FLAGGED', 'MACHINE FLAG', 'alert'], ['DETAINED', 'DETAIN', 'warn'], ['ACCEPT_APPROVED', 'ACCEPT', 'accept'], ['PURGE_APPROVED', 'PURGE', '']];
// [lệnh, nhãn, phím]
const ACTIONS = {
  WAITING_PO: [['ACCEPT', 'Accept', 'a'], ['DETAIN', 'Detain', 'd']],
  MACHINE_FLAGGED: [['KEEP', 'YES · KEEP', 'a'], ['DETAIN', 'NO · DETAIN', 'd']],
  DETAINED: [['RESCUE', 'RESCUE TO WAIT', 'r'], ['PURGE', 'PURGE', 'p']],
  PURGE_APPROVED: [['RESTORE_PURGE', 'RESTORE TO DETAIN', 'r']],
  ACCEPT_APPROVED: [['RESCUE_ACCEPT', 'RESCUE TO WAIT', 'r'], ['DETAIN_ACCEPT', 'DETAIN', 'd']],
};
const BTN = { a: 'accept', d: 'detain', p: 'purge', r: 'rescue' };
// Sort theo lane: hai sort "PO quyết định" chỉ có nghĩa ở lane đã quyết.
const sorts = (state) => [['oldest', 'sort_oldest'], ['newest', 'sort_newest'], ['duration_longest', 'sort_longest'], ['duration_shortest', 'sort_shortest'],
  ...(['DETAINED', 'ACCEPT_APPROVED', 'PURGE_APPROVED'].includes(state) ? [['po_newest', 'sort_po_newest'], ['po_oldest', 'sort_po_oldest']] : [])];

// ---------- Sổ tay của màn ----------
const p = new URLSearchParams(location.search);
const store = createStore({
  view: { state: LANES.includes(p.get('state')) ? p.get('state') : 'WAITING_PO', platform: p.get('platform') || '', source: p.get('source') || '',
    reason: p.get('reason') || '', sort: p.get('sort') || 'oldest', q: p.get('q') || '', page: Math.max(1, +p.get('page') || 1), mode: p.get('view') === 'grid' ? 'grid' : 'watch' },
  page: null, selectedId: p.get('selected'), detail: null, drafts: {}, notice: '', reading: true,
});
const useStore = () => useSheet(store);
// Clip đang xem: bản chi tiết nếu đã đọc xong, không thì bản trong trang (lane là lane đang xem).
function current(s) {
  if (!s.selectedId || !s.page) return null;
  if (s.detail?.item.xru_id === s.selectedId) return s.detail.item;
  const row = s.page.items.find((r) => r.xru_id === s.selectedId);
  return row ? { ...row, lane: s.view.state } : null;
}
const valid = (s, item = current(s)) => !!item && !s.reading && item.lane === s.view.state;

// ---------- Nói chuyện với Backend ----------
let backend = null, imageBackend = null, readId = 0, detailId = 0, pending = false, flushing = null;
const outbox = [];
const media = (id) => backend + '/media/' + encodeURIComponent(id);
async function json(path, options = {}) {
  const r = await fetch(backend + path, { ...options, cache: 'no-store', signal: AbortSignal.timeout(20000) });
  const d = await r.json(); if (!r.ok) throw Error(d.error || 'Backend chưa sẵn sàng.'); return d;
}
const query = (v) => new URLSearchParams({ state: v.state, platform: v.platform, source: v.source, reason: v.reason, q: v.q.trim(), sort: v.sort, limit: SIZE, offset: (v.page - 1) * SIZE });

async function readDetail(id) {
  const my = ++detailId; if (!id) return;
  try {
    const d = await json('/api/assets/' + encodeURIComponent(id)); if (my !== detailId) return;
    if (d.item.lane !== store.s.view.state) { store.set({ notice: 'Clip đã chuyển lane. Đang đọc lại…' }); await load(); return; }
    store.set({ detail: d });
  } catch (e) { if (my !== detailId) return; store.set({ reading: true, notice: 'Backend Gate video đang tắt hoặc đọc lỗi. ' + e.message }); }
}
function choose(id) { if (store.s.reading || id === store.s.selectedId) return; store.set({ selectedId: id, detail: null }); readDetail(id); }

// Đọc một trang. preferred: id muốn chọn; không còn trên trang thì chọn ô số slot (kẹp ở ô cuối). locate: nhờ lõi tìm trang chứa preferred.
async function load(preferred = store.s.selectedId, { locate = false, slot = 0 } = {}) {
  if (!backend) return; if (flushing) await flushing;
  if (!sorts(store.s.view.state).some(([k]) => k === store.s.view.sort)) store.set((s) => ({ view: { ...s.view, sort: 'oldest' } }));
  const id = ++readId; pending = id;
  const q = query(store.s.view); if (locate && preferred) q.set('selected', preferred);
  try {
    const result = await json('/api/queue?' + q); if (id !== readId) return;
    const items = result.items, at = items.findIndex((r) => r.xru_id === preferred);
    const pick = items.length ? items[at >= 0 ? at : Math.min(slot, items.length - 1)].xru_id : null;
    store.set((s) => ({ page: result, view: { ...s.view, page: Math.floor(result.offset / result.limit) + 1 }, reading: false,
      notice: items.length ? '' : 'Không có clip khớp bộ lọc.', selectedId: pick, detail: null }));
    readDetail(pick);
  } catch (e) {
    if (id !== readId) return;
    store.set({ reading: true, notice: 'Backend Gate video đang tắt hoặc đọc lỗi. Số đang hiện chưa được cập nhật. ' + e.message });
  } finally { if (pending === id) pending = false; }
}
// Đổi bộ lọc / lane / trang rồi đọc lại.
function go(change, preferred = store.s.selectedId, slot = 0) { store.set((s) => ({ view: { ...s.view, ...change } })); load(preferred, { slot }); }

// Quyết là đi tiếp ngay: clip rời trang tại chỗ, lệnh ghi xếp hàng gửi ngầm từng lệnh một; gửi hết mới đọc lại lõi một lượt
// cho khớp số và lấp chỗ trống cuối trang. Ghi lỗi thì bỏ các lệnh sau, đọc lại về đúng clip đó, nháp vẫn giữ.
function act(action) {
  const s = store.s, item = current(s); if (!valid(s, item)) return;
  const at = s.page.items.findIndex((r) => r.xru_id === item.xru_id); if (at < 0) return;
  const d = s.drafts[item.xru_id] || item;
  outbox.push({ id: item.xru_id, body: { action, expected_lane: item.lane, po_note: d.po_note || null, noise_present: !!d.noise_present, watermark_present: !!d.watermark_present } });
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
      await load(job.id, { locate: true }); store.set({ notice: 'Chưa xác nhận lưu. Ghi chú và dấu chọn được giữ. ' + e.message }); return;
    }
  }
  flushing = null; await refresh();
}
// Đọc lại lặng lẽ: không khoá nút, không chọn lại nếu clip đang xem còn trên trang; bấm quyết trong lúc đọc thì bỏ kết quả này.
async function refresh() {
  const id = ++readId;
  try {
    const result = await json('/api/queue?' + query(store.s.view)); if (id !== readId || outbox.length) return;
    const keep = result.items.some((r) => r.xru_id === store.s.selectedId), pick = keep ? store.s.selectedId : result.items[0]?.xru_id ?? null;
    store.set((s) => ({ page: result, view: { ...s.view, page: Math.floor(result.offset / result.limit) + 1 }, selectedId: pick,
      ...(keep ? {} : { detail: null }), notice: result.items.length ? s.notice : 'Không có clip khớp bộ lọc.' }));
    if (!keep) readDetail(pick);
  } catch { /* lượt đọc thường sau sẽ báo lỗi */ }
}
// Tới thẳng một clip theo mã (gõ mã vào ô tìm, bấm clip liên quan): hỏi lõi clip đang ở lane nào, bỏ bộ lọc, mở đúng trang chứa nó.
async function jump(id) {
  try {
    const d = await json('/api/assets/' + encodeURIComponent(id));
    store.set((s) => ({ view: { ...s.view, state: d.item.lane, platform: '', source: '', reason: '', q: '', page: 1 } }));
    await load(id, { locate: true });
    // Nhảy tới đúng món đang xem thì nhìn như không có gì xảy ra: luôn đưa ô của nó vào giữa tầm nhìn.
    requestAnimationFrame(() => document.querySelector('#video-gallery .is-active')?.scrollIntoView({ block: 'center' }));
  } catch {
    // Mã của một ảnh thì mở màn Gate ảnh đúng ảnh đó; không có ở đâu thì trả danh sách về như cũ và báo.
    try {
      const r = await fetch(imageBackend + '/api/assets/' + encodeURIComponent(id), { cache: 'no-store' });
      if (r.ok) { const d = await r.json(); location.href = '/gate/image/?' + new URLSearchParams({ state: d.item.state, selected: id }); return; }
    } catch { /* Backend ảnh tắt: coi như không thấy */ }
    store.set((s) => ({ view: { ...s.view, q: '' } })); await load(); store.set({ notice: 'Không tìm thấy món ' + id + ' trong Gate.' });
  }
}
const isId = (text) => /^xru-[0-9a-f-]{36}$/i.test(text);
function step(delta, wrap = false) {
  const s = store.s; if (!s.page || s.reading) return;
  const items = s.page.items, at = items.findIndex((r) => r.xru_id === s.selectedId); if (at < 0) return;
  if (wrap && delta > 0 && s.page.offset + at === s.page.total - 1) return go({ page: 1 }, null);
  if (delta > 0 && at === items.length - 1 && s.page.offset + items.length < s.page.total) return go({ page: s.view.page + 1 }, null);
  if (delta < 0 && at === 0 && s.page.offset) return go({ page: s.view.page - 1 }, null, Infinity);
  choose(items[Math.max(0, Math.min(items.length - 1, at + delta))].xru_id);
}

// ---------- Nháp: ghi chú và dấu Noise / Watermark / EVENT / CAUTION, giữ theo clip tới khi lệnh ghi được lõi nhận ----------
function draftOf(s, item) { return s.drafts[item.xru_id] || { po_note: item.po_note || '', noise_present: !!item.noise_present, watermark_present: !!item.watermark_present }; }
function edit(change) {
  const s = store.s, item = current(s); if (!valid(s, item) || item.state !== 'WAITING_PO') return;
  store.set({ drafts: { ...s.drafts, [item.xru_id]: { ...draftOf(s, item), ...change } } });
}
const hasToken = (note, word) => note.split('\n').some((line) => line.trim() === word);
function token(word) {
  const s = store.s, item = current(s); if (!item) return;
  const note = draftOf(s, item).po_note, lines = note.split('\n'), at = lines.findIndex((x) => x.trim() === word);
  if (at >= 0) { lines.splice(at, 1); edit({ po_note: lines.join('\n').replace(/^\n+|\n+$/g, '') }); }
  else edit({ po_note: note.trimEnd() + (note.trimEnd() ? '\n' : '') + word });
}

// ---------- Trình phát ----------
// Đổi lưới ↔ xem to thì trình phát dựng lại ở cột khác: nhớ vị trí và đang phát hay không để nối tiếp đúng clip.
const resume = { id: null, at: 0, playing: false };
let videoEl = null;
const toggle = (v) => { if (v.paused || v.ended) v.play().catch(() => store.set({ notice: 'Chưa phát được video.' })); else v.pause(); };
function Player({ item, mode, canStep }) {
  const ref = useRef(), [, tick] = useState(0), [rate, setRate] = useState(1), [muted, setMuted] = useState(false);
  useEffect(() => {
    const v = ref.current; videoEl = v;
    const on = () => tick((x) => x + 1), events = ['play', 'pause', 'timeupdate', 'loadedmetadata', 'ended'];
    events.forEach((e) => v.addEventListener(e, on));
    const pickUp = () => { if (resume.id !== item.xru_id) return; try { v.currentTime = resume.at; } catch { /* clip chưa tua được */ } if (resume.playing) v.play().catch(() => {}); };
    if (v.readyState >= 1) pickUp(); else v.addEventListener('loadedmetadata', pickUp, { once: true });
    return () => {
      events.forEach((e) => v.removeEventListener(e, on));
      resume.id = item.xru_id; resume.at = v.currentTime; resume.playing = !v.paused && !v.ended;
      v.pause(); v.removeAttribute('src'); v.load(); if (videoEl === v) videoEl = null;
    };
  }, []);
  const v = ref.current, dur = v && Number.isFinite(v.duration) ? v.duration : item.duration_seconds, at = v ? v.currentTime : 0;
  const playing = !!v && !v.paused && !v.ended, ratio = dur > 0 ? at / dur : 0, play = () => v && toggle(v);
  const seek = (e) => { if (!v || !Number.isFinite(v.duration)) return; const r = e.currentTarget.getBoundingClientRect(); v.currentTime = Math.max(0, Math.min(v.duration, v.duration * (e.clientX - r.left) / r.width)); };
  const video = h('video', { id: 'review-video-player', ref, preload: 'metadata', src: media(item.xru_id), onClick: play });
  const track = (cls) => h('span', { class: cls, role: 'slider', tabindex: 0, 'aria-label': 'Vị trí video', 'aria-valuemin': 0, 'aria-valuemax': dur || 0, 'aria-valuenow': at, onClick: seek },
    h('span', { style: { width: ratio * 100 + '%' } }));
  if (mode === 'watch') return h('section', { class: 'watch' + (playing ? ' is-playing' : '') },
    h('div', { class: 'watch-stage' },
      h('div', { class: 'video-container' }, h('div', { class: 'watch-frame' + (item.orientation === 'portrait' ? ' is-portrait' : ''), id: 'watch-frame' },
        video, h('span', { class: 'g-play', onClick: play }), h('div', { class: 'watch-stamp' }))),
      h('button', { class: 'watch-nav prev', 'aria-label': 'Clip trước', disabled: !canStep, onClick: () => step(-1) }, '‹'),
      h('button', { class: 'watch-nav next', 'aria-label': 'Clip sau', disabled: !canStep, onClick: () => step(1) }, '›')),
    h('div', { class: 'watch-ctrl' },
      h('button', { class: 'watch-btn', 'aria-label': 'Phát / dừng', onClick: play }),
      h('span', { class: 'watch-time' }, time(at), ' / ', time(dur)),
      track('watch-track'),
      h('button', { class: 'watch-ic', onClick: () => { const r = rate >= 2 ? 0.5 : rate + 0.5; setRate(r); if (v) v.playbackRate = r; } }, rate + '×'),
      h('button', { class: 'watch-ic', 'aria-label': 'Âm thanh', onClick: () => { setMuted(!muted); if (v) v.muted = !muted; } }, muted ? '🔇' : '🔊'),
      h('button', { class: 'watch-ic', 'aria-label': 'Toàn màn hình', onClick: () => v?.requestFullscreen().catch(() => {}) }, '⛶')));
  return [
    h('div', { class: 'insp-img is-video' + (playing ? ' is-playing' : '') }, h('div', { class: 'video-container' }, video), h('span', { class: 'g-play', onClick: play })),
    h('div', { class: 'insp-bar' }, h('span', null, time(at)), track('track'), h('span', null, time(dur))),
  ];
}

// ---------- Cột trái: số đếm, tìm, nhóm lọc, danh sách clip của trang, lật trang ----------
let searchTimer = 0;
function Sidebar() {
  const s = useStore(), v = s.view, page = s.page, list = useRef();
  useEffect(() => { list.current?.querySelector('.is-active')?.scrollIntoView({ block: 'nearest' }); }, [s.selectedId]);
  const sections = [];
  if (page) {
    if (v.state === 'MACHINE_FLAGGED' && page.reasons?.length) sections.push({ key: 'flag', title: t('flag_lbl'), rows: [
      { pick: { reason: '' }, name: t('all_flags'), total: page.counts[v.state], on: !v.reason, all: true },
      ...page.reasons.map((r) => ({ pick: { reason: r.reason }, name: r.reason, total: r.total, on: v.reason === r.reason }))] });
    sections.push({ key: 'source', title: t('source_lbl'), tree: { all: t('all_sources'), total: page.counts[v.state], sources: page.sources, platform: v.platform, source: v.source } });
    sections.push({ key: 'sort', title: t('sort_lbl'), rows: sorts(v.state).map(([key, label]) => ({ pick: { sort: key }, name: t(label), on: v.sort === key })) });
  }
  const typed = (e) => {
    const q = e.currentTarget.value; clearTimeout(searchTimer); ++readId;
    store.set((st) => ({ view: { ...st.view, q, page: 1 } })); searchTimer = setTimeout(() => (isId(q.trim()) ? jump(q.trim()) : load()), 180);
  };
  const keys = (e) => { e.stopPropagation(); if (e.key === 'Escape') { e.preventDefault(); e.currentTarget.blur(); go({ q: '', page: 1 }); } };
  return [
    h('div', { class: 'side-head' },
      h('div', { class: 'side-count' }, h('b', { class: 'queue-count' }, page ? n(page.total) : '—'), h('span', null, v.state)),
      h('label', { class: 'side-search' },
        h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor' }, h('circle', { cx: 11, cy: 11, r: 7 }), h('path', { d: 'M21 21l-4.35-4.35' })),
        h('input', { type: 'search', value: v.q, placeholder: t('search_title_src'), 'aria-label': t('search_in_list'), onInput: typed, onKeyDown: keys }))),
    h(Filters, { id: 'filters', sections, onPick: (change) => go({ ...change, page: 1 }) }),
    h('div', { class: 'side-items', id: 'queue-list', ref: list }, page ? page.items.map((item, i) => h('a', {
      key: item.xru_id, href: link(item.xru_id), class: 'side-item' + (item.xru_id === s.selectedId ? ' is-active' : ''),
      onClick: (e) => { if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return; e.preventDefault(); choose(item.xru_id); },
    }, h('span', { class: 'n' }, String(page.offset + i + 1).padStart(2, '0')),
    h('div', null, h('div', { class: 't' }, item.title), h('div', { class: 's' }, (item.source_name || item.source_platform) + (item.duration_seconds != null ? ' · ' + time(item.duration_seconds) : ''))))) : null),
    page ? h(WallPager, { id: 'page-range', offset: page.offset, total: page.total, size: SIZE, onPage: (to) => go({ page: to }, null) }) : h('div', { class: 'side-pager wall-pager', id: 'page-range' }),
  ];
}

// ---------- Cột giữa: đầu trang + lane, xem to hoặc tường, chân trang ghi phím ----------
function Hints({ s, item }) {
  const key = (...k) => k.map((x) => h('span', { key: x, class: 'key' }, x));
  const decide = [...new Set([...ACTIONS[s.view.state].map((a) => a[2].toUpperCase()), 'S'])];
  return h('div', { class: 'key-hints' },
    item?.state === 'WAITING_PO' ? [['1', 'Noise'], ['2', 'Watermark'], ['3', 'EVENT'], ['4', 'CAUTION']].map(([k, w]) => h('span', { key: k }, key(k), ' ', w)) : null,
    s.view.mode === 'watch' ? h('span', null, key('←', '→'), ' ', h('span', null, '±5s · Shift: ±15%')) : null,
    h('span', null, key(...decide), ' ', t('w_auto_next')),
    h('span', null, key('Space'), ' ', t('w_play_pause')));
}
function Main() {
  const s = useStore(), v = s.view, page = s.page, item = current(s), grid = v.mode === 'grid';
  return [
    h('header', { class: 'page-head ws-head' },
      h('div', { class: 'page-title' }, h('a', { href: '/?continent=eurasia' }, 'EURASIA'), h('span', null, '/'), h('a', { href: '/gate/dash/' }, 'GATE'), h('span', null, '/'), h('h1', null, 'VIDEO')),
      h('nav', { class: 'gate-tabs tabs-nav', 'aria-label': 'Review states' }, TABS.map(([state, label, tone]) => h('button', {
        key: state, type: 'button', class: `gate-tab-btn tab-link state-${state.toLowerCase()}${state === v.state ? ' is-active' : ''}`,
        onClick: () => go({ state, platform: '', source: '', reason: '', page: 1 }, null),
      }, h('strong', { class: 'count ' + tone }, page ? n(page.counts[state]) : '—'), h('span', null, label))))),
    h('div', { id: 'watch-area', hidden: grid }, !grid && item ? h(Player, { key: item.xru_id + ':watch', item, mode: 'watch', canStep: valid(s, item) }) : null),
    page ? h(Wall, { id: 'video-gallery', style: '--wall-min:160px; --wall-ratio:4 / 3; --wall-fit:contain', hidden: !grid, items: page.items, offset: page.offset, activeId: s.selectedId, sizes: '160px',
      thumb: (it, w) => backend + '/thumb/' + encodeURIComponent(it.xru_id) + '?w=' + w, media: (it) => media(it.xru_id), end: (it) => time(it.duration_seconds),
      tags: (it) => (it.gate_flag_reason || '').split(' + ').filter(Boolean), onSelect: (it) => choose(it.xru_id) }) : null,
    page ? h(WallNext, { id: 'video-next', hidden: !grid, offset: page.offset, total: page.total, size: SIZE, onPage: (to) => go({ page: to }, null) }) : null,
    h('footer', { class: 'page-foot' }, h(Hints, { s, item }), h('div', null, 'XRU GATE // 2026')),
    h('div', { class: 'flash-banner flash-error', id: 'api-error', role: 'status', hidden: !s.notice }, s.notice),
  ];
}

// ---------- Cột phải: lane, trình phát (lưới), nút quyết, hồ sơ clip ----------
function Decisions({ s, item }) {
  const ok = valid(s, item), editable = item.state === 'WAITING_PO', d = draftOf(s, item), grid = s.view.mode === 'grid';
  const label = (cmd, text) => cmd === 'ACCEPT' && grid ? t('btn_approve') : cmd === 'DETAIN' && s.view.state !== 'MACHINE_FLAGGED' && grid ? t('btn_detain') : text;
  return h('div', { class: 'actions-bar' },
    editable ? [
      h('div', { key: 'f', class: 'finding-row' },
        h('label', { class: 'finding-control' }, h('input', { id: 'noise-present', type: 'checkbox', disabled: !ok, checked: d.noise_present, onChange: (e) => edit({ noise_present: e.currentTarget.checked }) }), ' NOISE', h('kbd', null, '1')),
        h('label', { class: 'finding-control' }, h('input', { id: 'watermark-present', type: 'checkbox', disabled: !ok, checked: d.watermark_present, onChange: (e) => edit({ watermark_present: e.currentTarget.checked }) }), ' WMARK', h('kbd', null, '2')),
        ['EVENT', 'CAUTION'].map((word, i) => { const on = hasToken(d.po_note, word); return h('button', { key: word, class: 'finding-control' + (on ? ' active' : ''), 'aria-pressed': on, disabled: !ok, onClick: () => token(word) }, word + ' ', h('kbd', null, String(i + 3))); })),
      h('textarea', { key: 'n', id: 'po-note', class: 'insp-note', placeholder: t('note_ph'), disabled: !ok, value: d.po_note, onInput: (e) => edit({ po_note: e.currentTarget.value }) }),
    ] : null,
    h('div', { class: 'decision-row' },
      ACTIONS[item.lane].map(([cmd, text, key]) => h('button', { key: cmd, class: `btn btn-${BTN[key]}`, 'data-action': cmd, disabled: !ok, onClick: () => act(cmd) }, label(cmd, text) + ' ', h('kbd', null, key.toUpperCase()))),
      h('button', { class: 'btn btn-skip', id: 'skip-review-item', disabled: !ok || s.page.total < 2, onClick: () => step(1, true) }, 'Skip ', h('kbd', null, 'S'))));
}
function Inspector() {
  const s = useStore(), item = current(s), page = s.page;
  const index = item && page ? page.items.findIndex((r) => r.xru_id === item.xru_id) : -1;
  const detail = s.detail?.item.xru_id === s.selectedId ? s.detail : null;
  return [
    h('div', { class: 'insp-top' }, h('span', { class: 'insp-tag', title: item?.gate_flag_reason || '' }, item ? item.lane : ''),
      h('span', { class: 'insp-num', id: 'insp-num' }, index >= 0 ? `${String(page.offset + index + 1).padStart(3, '0')} / ${page.total}` : '')),
    h('div', { id: 'inspector-player' }, item && s.view.mode === 'grid' ? h(Player, { key: item.xru_id + ':grid', item, mode: 'grid' }) : null),
    h('div', { id: 'decision-controls' }, item ? h(Decisions, { s, item }) : null),
    h('section', { class: 'evidence-grid' },
      h('div', { class: 'insp-title', id: 'insp-title' }, item?.title || ''),
      h('div', { class: 'insp-caption' }, h('div', { class: 'insp-label' }, t('desc_lbl')), h('p', { class: 'insp-cap', id: 'insp-cap' }, item?.description || '')),
      h('div', { class: 'technical-manifest' }, h('div', { class: 'insp-label' }, 'Technical manifest'),
        h('dl', { class: 'insp-meta' },
          h('dt', null, 'XRU ID'), h('dd', { id: 'insp-xid', style: 'color:var(--accent)' }, item?.xru_id || ''),
          h('dt', null, t('source_lbl')), h('dd', { id: 'insp-src' }, item ? item.source_platform + (item.source_name ? ' / ' + item.source_name : '') : ''),
          h('dt', null, t('res_lbl')), h('dd', { id: 'insp-res' }, item?.resolution_readable ? `${item.width}×${item.height} (${item.aspect_ratio || ''})` : ''),
          h('dt', { 'aria-label': 'Current Lane' }, 'Lane'), h('dd', { id: 'insp-lane' }, item?.lane || ''))),
      item && item.state !== 'WAITING_PO' ? h('p', { class: 'po-note-display' }, item.po_note || '') : null,
      s.view.state === 'MACHINE_FLAGGED' && detail?.related.length ? h('div', { class: 'related-videos' }, h('div', { class: 'insp-label' }, 'RELATED VIDEOS'),
        detail.related.map((row) => h('span', { key: row.xru_id }, h('a', { href: '#', class: 'dupe-link', onClick: (e) => { e.preventDefault(); jump(row.xru_id); } }, row.xru_id), ' ', h('span', { class: 'state-chip' }, row.lane), ' '))) : null),
  ];
}

// ---------- Địa chỉ trang và hai nút rail mang theo bộ lọc ----------
function link(id) {
  const v = store.s.view;
  return '/gate/video/?' + new URLSearchParams({ state: v.state, view: v.mode, sort: v.sort, platform: v.platform, source: v.source, reason: v.reason, q: v.q, page: v.page, selected: id });
}
function sync() {
  const s = store.s, v = s.view, q = new URLSearchParams({ state: v.state, view: v.mode, sort: v.sort });
  for (const [k, val] of Object.entries({ platform: v.platform, source: v.source, reason: v.reason, q: v.q, page: v.page > 1 ? v.page : '', selected: s.selectedId || '' })) if (val) q.set(k, val);
  const url = '/gate/video/?' + q; if (location.pathname + location.search !== url) history.replaceState(null, '', url);
  document.body.dataset.mode = v.mode; document.querySelector('.rail').dataset.active = v.mode === 'grid' ? 'video' : 'watch';
  let changed = false;
  for (const entry of window.XRU_RAILS.gate.groups[0]) if (['video', 'watch'].includes(entry.key)) {
    const target = new URLSearchParams(q); target.set('view', entry.key === 'video' ? 'grid' : 'watch');
    const href = '/gate/video/?' + target; if (entry.href !== href) { entry.href = href; changed = true; }
  }
  if (changed) window.dispatchEvent(new Event('xru-rail-changed'));
}
store.subs.add(sync);

// ---------- Phím: chỉ phím làm việc (PO 22/10) ----------
document.addEventListener('keydown', (e) => {
  if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
  const v = videoEl, key = e.key.toLowerCase(), typing = e.target.closest?.('textarea,select,input:not([type="checkbox"]),[contenteditable="true"]');
  if (key === ' ' && v && !typing && !e.shiftKey) { e.preventDefault(); toggle(v); return; }
  if (typing) return;
  if ((key === 'arrowleft' || key === 'arrowright') && v) {
    e.preventDefault(); const delta = e.shiftKey && Number.isFinite(v.duration) ? v.duration * 0.15 : 5;
    v.currentTime = Math.max(0, Math.min(Number.isFinite(v.duration) ? v.duration : Infinity, v.currentTime + (key === 'arrowleft' ? -delta : delta))); return;
  }
  if (e.shiftKey) return;
  const s = store.s, item = current(s); if (!item) return;
  if (key === '1' || key === '2') { if (item.state === 'WAITING_PO' && valid(s, item)) { e.preventDefault(); const f = key === '1' ? 'noise_present' : 'watermark_present'; edit({ [f]: !draftOf(s, item)[f] }); } return; }
  if (key === '3' || key === '4') { if (item.state === 'WAITING_PO' && valid(s, item)) { e.preventDefault(); token(key === '3' ? 'EVENT' : 'CAUTION'); } return; }
  if (key === 'e' && document.getElementById('po-note')) { e.preventDefault(); document.getElementById('po-note').focus(); return; }
  if (key === 's') { if (valid(s, item) && s.page.total >= 2) { e.preventDefault(); step(1, true); } return; }
  const action = ACTIONS[item.lane]?.find((a) => a[2] === key);
  if (action && valid(s, item)) { e.preventDefault(); act(action[0]); }
});
// Rail "Video" / "Xem" là cùng màn: đổi chế độ tại chỗ.
document.addEventListener('click', (e) => {
  const a = e.target.closest('.rail a'); if (!a || new URL(a.href).pathname !== '/gate/video/') return;
  if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
  e.preventDefault(); store.set((s) => ({ view: { ...s.view, mode: new URL(a.href).searchParams.get('view') === 'grid' ? 'grid' : 'watch' } }));
});
window.addEventListener('xru-lang-applied', () => store.set({}));
// Backend từng mất thì thử đọc lại; còn sống thì không vẽ lại gì khi quay lại cửa sổ.
window.addEventListener('focus', () => { if (store.s.reading && backend && !pending) load(); });
setInterval(() => { if (store.s.reading && !pending && !document.hidden && backend) load(); }, 5000);
setInterval(async () => {
  if (!backend || pending || document.hidden) return;
  try { await json('/api/health'); } catch { store.set({ reading: true, notice: 'Backend Gate video đang tắt. Số đang hiện chưa được cập nhật.' }); }
}, 5000);

render(h(Sidebar), document.querySelector('.side'));
render(h(Main), document.querySelector('.ws-main'));
render(h(Inspector), document.querySelector('.ws-insp'));
sync();
fetch('/ui-config', { cache: 'no-store' }).then((r) => r.json()).then((c) => { backend = c.video_backend; imageBackend = c.image_backend; load(store.s.selectedId, { locate: !!store.s.selectedId && !p.has('page') }); })
  .catch(() => store.set({ notice: 'Không đọc được cấu hình UI.' }));
