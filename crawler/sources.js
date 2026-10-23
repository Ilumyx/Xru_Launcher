// Màn Nguồn Crawler trên nền Preact (PO 23/10). Chỉ đọc /api/board; phần đọc bảng và bộ lọc chung ở crawler/board.js.
// Một nguồn một dòng, chia nhóm theo trạng thái; bấm dòng mở cột phải chi tiết, bấm lại đúng dòng đó thì đóng.
import { h, render } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { useStore } from '/kit/store/store.js';
import { t, n, stamp, boardStore, watchBoard, keepFilters, platQuery, FilterRows, SearchBox } from '/crawler/board.js';

const KINDS = ['image', 'video'];
const daysSince = (iso) => (iso ? Math.max(0, Math.floor((Date.now() - new Date(iso)) / 864e5)) : null);
const PLATFORM = { facebook: ['Facebook', 'FB'], telegram: ['Telegram', 'TG'], waralbum: ['War Album', 'WAR'], dvids: ['DVIDS', 'DVIDS'], x: ['X', 'X'], reddit: ['Reddit', 'RDT'], youtube: ['YouTube', 'YT'], vk: ['VK', 'VK'], tiktok: ['TikTok', 'TT'], direct: ['Direct', 'DIR'], bilibili: ['Bilibili', 'BILI'], instagram: ['Instagram', 'IG'] };
const platName = (p) => PLATFORM[p]?.[0] || p;
const platCode = (p) => PLATFORM[p]?.[1] || String(p).slice(0, 4).toUpperCase();
// Nước và loại khí tài suy từ tag PO dán trong labels.json (sticker của UI).
const COUNTRY = { US: 'US', UK: 'UK', Germany: 'DE', France: 'FR', Poland: 'PL', Australia: 'AU', Japan: 'JP', Korea: 'KR', Taiwan: 'TW', Thailand: 'TH', China: 'CN', Russia: 'RU', USSR: 'SU', Ukraine: 'UA', Israel: 'IL', NATO: 'NATO' };
const country = (s) => { const c = (s.tags || []).filter((x) => COUNTRY[x]); return COUNTRY[c.find((x) => x !== 'NATO') || c[0]] || '—'; };
const ARM = { Tank: 'ground', Gun: 'ground', Infantry: 'ground', Artillery: 'ground', Missile: 'ground', Air: 'air', Heli: 'air', Drone: 'air', Navy: 'navy', Ship: 'navy', Submarine: 'navy' };
const ICON = { ground: 'M3 15h18l-2 3H5zM6 15l1-4h9l2 4M10 11V8h5M15 9h6', air: 'M12 3v18M4 13l8-4 8 4M8 20l4-2 4 2', navy: 'M3 15h18l-3 4H6zM7 15V11h10v4M11 11V7h3' };
function Arm({ s }) {
  const k = (s.tags || []).map((x) => ARM[x]).find(Boolean);
  return k ? h('svg', { class: 'src-arm', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.6, 'aria-label': k },
    h('title', null, (s.tags || []).filter((x) => ARM[x]).join(', ')), h('path', { d: ICON[k] })) : null;
}

// Trạng thái: mỗi dòng một badge, xét theo thứ tự; cái đầu tiên khớp là badge.
const STALE = { A: 3, B: 7, C: 14, D: 30 };
const TIER_RANK = { A: 0, B: 1, C: 2, D: 3 };
const onKinds = (s) => KINDS.filter((k) => s[k + '_enabled'] && s.operations?.[k]?.supported !== false);
const tierOf = (s, k) => (s.media || {})[k]?.tier || '';
const staleLimit = (s) => Math.min(...onKinds(s).map((k) => { const x = tierOf(s, k); return x === 'F' ? Infinity : STALE[x] || 7; }), Infinity);
const runs = (s) => KINDS.flatMap((k) => [s.operations?.[k]?.last_scout, s.operations?.[k]?.last_run]).filter(Boolean);
const noScout = (s, k) => { const o = s.operations?.[k] || {}; return onKinds(s).includes(k) && !o.last_scout && !o.found; };
const STATES = [
  ['stuck', 'cr_st_stuck', 'look', (s) => KINDS.some((k) => (s.errors || {})[k])],
  ['run', 'cr_g_run', 'run', (s) => runs(s).some((r) => r.state === 'running')],
  ['wait', 'cr_st_wait', 'look', (s) => s.waiting],
  ['new', 'cr_g_new', 'new', (s) => !runs(s).length && !s.last_born_at],
  ['stale', 'cr_st_stale', 'look', (s) => s.last_born_at && daysSince(s.last_born_at) > staleLimit(s)],
  ['scout', 'cr_st_scout', 'look', (s) => KINDS.some((k) => noScout(s, k))],
  ['ok', 'cr_st_ok', 'ok', () => true],
];
const ORDER = STATES.map(([k]) => k);
// PO 22/10: Ổn trên cùng, Cần nhìn dưới cùng.
const GROUPS = [['ok', 'cr_g_ok'], ['run', 'cr_g_run'], ['new', 'cr_g_new'], ['look', 'cr_g_look']];
const QUICK = { look: ['cr_q_look', (s) => s.st[2] === 'look'], stuck: ['cr_q_stuck', (s) => s.st[0] === 'stuck'], stale: ['cr_q_stale', (s) => s.st[0] === 'stale'], scout: ['cr_q_scout', (s) => s.st[0] === 'scout'], wait: ['cr_q_waiting', (s) => s.st[0] === 'wait'] };
const bestTier = (s) => Math.min(...KINDS.map((k) => TIER_RANK[tierOf(s, k)] ?? 9));
const newest = (s) => (s.last_born_at ? +new Date(s.last_born_at) : 0);
const count = (k) => (s) => s[k === 'image' ? 'images' : 'videos'] ?? -1;
const SORT = {
  tier: (a, b) => bestTier(a) - bestTier(b) || a.name.localeCompare(b.name),
  name: (a, b) => a.name.localeCompare(b.name),
  platform: (a, b) => platName(a.platform).localeCompare(platName(b.platform)) || a.name.localeCompare(b.name),
  recent: (a, b) => newest(b) - newest(a),
  recent_asc: (a, b) => (newest(a) || Infinity) - (newest(b) || Infinity),
  pending: (a, b) => (b.links_pending || 0) - (a.links_pending || 0),
  image: (a, b) => count('image')(b) - count('image')(a),
  image_asc: (a, b) => count('image')(a) - count('image')(b),
  video: (a, b) => count('video')(b) - count('video')(a),
  video_asc: (a, b) => count('video')(a) - count('video')(b),
};
const SORT_LABEL = { tier: 'cr_sort_tier', name: 'sort_alpha', platform: 'cr_sort_platform', recent: 'cr_sort_scraped', recent_asc: 'cr_sort_scraped_asc', pending: 'cr_sort_pending', image: 'cr_sort_image', image_asc: 'cr_sort_image_asc', video: 'cr_sort_video', video_asc: 'cr_sort_video_asc' };

const store = boardStore({ sort: 'tier', open: { look: true, run: true, ok: false, new: false }, picked: null, shot: null }, Object.keys(QUICK));
if (!(store.s.sort in SORT)) store.s.sort = 'tier';
keepFilters(store, 'tier', '/crawler/sources.html');
watchBoard(store, (rows) => rows.map((row) => { const s = { ...row, name: row.display_name }; s.st = STATES.find(([, , , test]) => test(s)); return s; }));
const idOf = (s) => `${s.platform}|${s.cluster_key}`;
// Cột phải chỉ hiện khi đã chọn một nguồn (khung kéo giãn của kit/frame cần cột này có sẵn trong HTML).
const detail = document.getElementById('src-detail');
store.subs.add(() => { detail.hidden = !store.s.picked || !store.s.sources.some((s) => idOf(s) === store.s.picked); });

function matcher(s) {
  const q = s.q.trim().toLocaleLowerCase('vi');
  return (src, skip) => {
    if (q && !`${src.name} ${platName(src.platform)}`.toLocaleLowerCase('vi').includes(q)) return false;
    if (skip !== 'plat' && s.plat.length && !s.plat.includes(src.platform)) return false;
    if (skip !== 'quick' && s.quick && !QUICK[s.quick][1](src)) return false;
    return true;
  };
}

function Sidebar() {
  const s = useStore(store);
  return [
    h('div', { class: 'side-head' },
      h('div', { class: 'side-count' }, h('b', { id: 'src-count' }, s.board ? n(s.sources.length) : '—'), h('span', null, t('cr_sources'))),
      h(SearchBox, { value: s.q, ph: t('cr_find_ph'), aria: t('cr_find_aria'), onInput: (q) => store.set({ q }) }),
      h('div', { class: 'side-field' }, h('label', { for: 'src-sort' }, t('cr_sort_group')),
        h('select', { id: 'src-sort', value: s.sort, onChange: (e) => store.set({ sort: e.currentTarget.value }) }, Object.keys(SORT).map((k) => h('option', { key: k, value: k }, t(SORT_LABEL[k])))))),
    h('div', { class: 'side-items', id: 'src-filters' }, s.board ? h(FilterRows, { s, set: (c) => store.set(c), quick: QUICK, match: matcher(s), platName, platHead: (len) => t('cr_f_platform_n', { n: len }), redQuick: (k) => k !== 'wait' }) : null),
    h('div', { class: 'src-legend' },
      h('p', null, h('i', { class: 'dot' }), h('span', null, t('cr_leg_scout')), ' ', h('b', null, '+'), ' ', h('span', null, t('cr_leg_bottom'))),
      h('p', null, t('cr_leg_stale'))),
  ];
}

// Scout chưa dò tới đáy thì thêm +: đã thấy 1,160 mà nguồn còn sâu.
const scoutText = (o) => n(o.found ?? 0) + (o.bottom_reached ? '' : '+');
const Tier = ({ m, s }) => (m.tier ? h('b', { class: 'tier t-' + m.tier, title: m.note || t('cr_tier', { tier: m.tier }) }, m.tier) : h('b', { class: 'tier none', title: t('cr_unrated') }));
// Ô ảnh/video: [hạng] plan │ scout │ download. Không chữ chú thích; số chờ chỉ hiện ở chi tiết.
function MediaCell({ s, k }) {
  const o = s.operations?.[k] || {}, m = (s.media || {})[k] || {};
  const on = onKinds(s).includes(k), never = s.st[0] === 'new';
  if (o.supported === false) return h('div', { class: 'mc off' }, h(Tier, { m }), h('span', { class: 'plan dim' }, '—'), h('span', { class: 'scout dim' }, '—'), h('span', { class: 'down dim' }, '—'));
  const plan = o.supports_count && o.total != null ? n(o.total) : '—';
  const scout = never ? '—' : scoutText(o), down = never ? '—' : n(s[k === 'image' ? 'images' : 'videos']);
  return h('div', { class: 'mc' + (on ? '' : ' off'), title: `${plan} │ ${scout} │ ${down}` }, h(Tier, { m }),
    h('span', { class: 'plan' + (plan === '—' ? ' dim' : '') }, plan),
    h('span', { class: 'scout' + (noScout(s, k) && s.st[0] === 'scout' ? ' red' : '') + (never ? ' dim' : '') }, scout),
    h('span', { class: 'down' + (never ? ' dim' : '') }, down));
}
function Row({ s, picked }) {
  const d = daysSince(s.last_born_at), [key, label] = s.st, id = idOf(s);
  return h('tr', { class: (s.enabled ? '' : 'off') + (picked === id ? ' picked' : ''), onClick: () => store.set({ picked: picked === id ? null : id }) },
    h('td', null, h(Arm, { s })), h('td', { class: 'nm', title: s.name }, s.name), h('td', { class: 'code' }, country(s)), h('td', { class: 'code' }, platCode(s.platform)),
    h('td', null, h(MediaCell, { s, k: 'image' })), h('td', { class: 'split' }, h(MediaCell, { s, k: 'video' })),
    h('td', { class: 'age' + (key === 'stale' ? ' red' : '') }, d == null ? '—' : d + t('cr_day_abbr')),
    h('td', null, h('span', { class: 'badge b-' + key }, key === 'run' ? h('i', { class: 'live' }) : null, t(label))));
}
const COLS = ['c-arm', '', 'c-country', 'c-plat', 'c-media', 'c-media', 'c-age', 'c-status'];
const HEADS = [['', ''], ['cr_th_cluster', ''], ['cr_th_country', ''], ['cr_th_platform', ''], ['cr_th_image', ''], ['cr_th_video', 'split'], ['cr_th_crawl', ''], ['cr_th_status', '']];
function Main() {
  const s = useStore(store), ok = s.board?.complete, match = matcher(s);
  const scope = s.sources.filter((src) => match(src, 'quick')), shown = s.sources.filter((src) => match(src));
  const filtering = !!(s.q.trim() || s.plat.length || s.quick);
  const message = s.fault ? t(s.fault.key) + s.fault.extra : '';
  const rows = [];
  for (const [g, label] of GROUPS) {
    const list = shown.filter((src) => src.st[2] === g).sort((a, b) => (g === 'look' ? ORDER.indexOf(a.st[0]) - ORDER.indexOf(b.st[0]) : 0) || SORT[s.sort](a, b));
    if (!list.length) continue;
    const isOpen = filtering || s.open[g];
    // Đang lọc thì mọi nhóm mở sẵn, bấm tiêu đề nhóm không gập.
    const toggle = () => { if (!filtering) store.set({ open: { ...s.open, [g]: !s.open[g] } }); };
    rows.push(h('tr', { key: 'g:' + g, class: 'grp g-' + g, tabindex: 0, onClick: toggle, onKeyDown: (e) => { if (e.key === 'Enter') toggle(); } },
      h('td', { colspan: 8 }, h('span', { class: 'chev' }, isOpen ? '▾' : '▸'), t(label), ' ', h('b', null, list.length))));
    if (isOpen) for (const src of list) rows.push(h(Row, { key: idOf(src), s: src, picked: s.picked }));
  }
  return h('main', { class: 'src-main' },
    h('header', { class: 'page-head' },
      h('div', { class: 'page-title' }, h('a', { href: '/?continent=eurasia' }, 'EURASIA'), h('span', null, '/'), h('a', { href: '/crawler/dash.html' + platQuery(s) }, 'CRAWLER'), h('span', null, '/'), h('h1', null, t('cr_sources'))),
      h('span', { class: 'src-stamp', id: 'src-stamp' }, s.readAt && t('cr_updated') + ' ' + s.readAt)),
    h('div', { id: 'src-error', role: 'alert', hidden: !message }, message),
    h('section', { class: 'src-totals', 'aria-label': t('cr_totals_aria') }, [['ok', 'cr_g_ok', ''], ['run', 'cr_g_run', 'green'], ['new', 'cr_g_new', 'dim'], ['look', 'cr_g_look', 'red']].map(([g, label, tone]) =>
      h('div', { key: g }, h('span', null, t(label)), h('b', { class: tone, id: 't-' + g }, ok ? n(scope.filter((src) => src.st[2] === g).length) : '—')))),
    h('table', { class: 'src-table' },
      h('colgroup', null, COLS.map((c, i) => h('col', { key: i, class: c || null }))),
      h('thead', null, h('tr', null, HEADS.map(([key, cls], i) => h('th', { key: i, class: cls || null }, key ? t(key) : '')))),
      h('tbody', { id: 'src-rows' }, rows)),
    h('p', { class: 'src-empty', id: 'src-empty', hidden: shown.length !== 0 || !ok }, t('cr_empty')),
    h('footer', { class: 'page-foot' }, h('div', null), h('div', null, t('cr_foot'))));
}

// Cột phải: mọi chi tiết của nguồn.
const RUN_STATE = { running: 'cr_rs_running', done: 'cr_rs_done', failed: 'cr_rs_failed', interrupted: 'cr_rs_interrupted', waiting_links: 'cr_rs_waiting_links' };
const op = (r) => (r ? `${stamp(r.started_at)} → ${r.ended_at ? stamp(r.ended_at) : '…'} · ${RUN_STATE[r.state] ? t(RUN_STATE[r.state]) : r.state}${r.added != null ? ` · +${n(r.added)}` : ''}` : '—');
// Link mở được trên trình duyệt; từ khoá DVIDS mở trang tìm, Telegram mở t.me.
function sourceUrl(s) {
  const first = String(s.link || '').split(' · ')[0];
  if (/^https?:\/\//.test(first)) return first;
  if (s.platform === 'dvids') return 'https://www.dvidshub.net/search/?q=' + encodeURIComponent(first);
  if (s.platform === 'telegram') return 'https://t.me/' + encodeURIComponent(first);
  return '';
}
function Kind({ s, k }) {
  const o = s.operations?.[k] || {}, m = (s.media || {})[k] || {}, on = onKinds(s).includes(k), kind = t('cr_k_' + k);
  if (o.supported === false) return h('section', { class: 'd-kind off' }, h('h3', null, t('cr_k_none', { kind })));
  const delta = o.total_delta == null ? '—' : `${o.total_delta >= 0 ? '+' : ''}${n(o.total_delta)}`;
  const pause = o.rest_until ? t('cr_rest_until', { t: stamp(o.rest_until) }) : o.wait_until ? t('cr_wait_until', { t: stamp(o.wait_until) }) : t('cr_none');
  const num = (label, value) => h('div', null, h('span', null, label), h('b', null, value));
  const fact = (label, value, cls) => [h('dt', null, t(label)), h('dd', { class: cls || null }, value)];
  return h('section', { class: 'd-kind' + (on ? '' : ' off') },
    h('h3', null, `${kind} · ${t(on ? 'cr_on' : 'cr_off')}`, m.tier ? [' ', h('b', { class: 'tier t-' + m.tier }, m.tier)] : null),
    h('div', { class: 'd-nums' }, num('plan', o.supports_count && o.total != null ? n(o.total) : '—'), num('scout', o.found == null ? '—' : scoutText(o)), num('download', n(s[k === 'image' ? 'images' : 'videos'])), num(t('cr_pending'), n(o.pending))),
    h('dl', null, fact('cr_d_last_scout', op(o.last_scout)), fact('cr_d_delta', delta + (o.bottom_reached ? t('cr_bottom') : '')), fact('cr_d_last_run', op(o.last_run)),
      fact('cr_d_today7', `${n(o.today)} · ${n(o.new_7d)}`), fact('cr_d_error', o.error ? `[E] ${o.last_error?.reason || ''} ${o.last_error?.detail || ''}` : t('cr_none'), o.error ? 'red' : ''), fact('cr_d_rest', pause)),
    m.note ? h('p', { class: 'd-note' }, m.note) : null);
}
function Detail() {
  const st = useStore(store), s = st.sources.find((x) => idOf(x) === st.picked);
  if (!s) return null;
  const limit = staleLimit(s), shots = s.shots || [], link = sourceUrl(s);
  return [
    h('header', null, h('div', null, h('p', { class: 'd-plat', id: 'd-plat' }, `${platName(s.platform)} · ${country(s)}`), h('h2', { id: 'd-name' }, s.name),
      h('p', { class: 'd-sub', id: 'd-sub' }, h('span', { class: 'badge b-' + s.st[0] }, t(s.st[1])), s.enabled ? null : h('span', { class: 'badge b-off' }, t('cr_d_off')), (s.tags || []).map((x) => h('span', { key: x, class: 'tag' }, x))))),
    h('div', { class: 'd-body', id: 'd-body' },
      h('dl', { class: 'd-facts' }, h('dt', null, t('cr_d_last_crawl')), h('dd', null, s.last_born_at ? `${stamp(s.last_born_at)} · ${t('cr_days_ago', { n: daysSince(s.last_born_at) })}` : '—'),
        h('dt', null, t('cr_d_stale_limit')), h('dd', null, limit === Infinity ? t('cr_not_counted') : t('cr_n_days', { n: limit }))),
      KINDS.map((k) => h(Kind, { key: k, s, k })),
      s.note ? h('section', null, h('h3', null, t('cr_d_note')), h('p', { class: 'd-note' }, s.note)) : null,
      shots.length ? h('section', null, h('h3', null, t('cr_d_shots')), h('div', { class: 'd-shots' }, shots.map((name) => {
        const src = `${st.backend}/api/shots/${encodeURIComponent(name)}`;
        return h('button', { key: name, type: 'button', onClick: () => store.set({ shot: src }) }, h('img', { loading: 'lazy', src, alt: '' }));
      }))) : null,
      link ? h('a', { class: 'd-link', href: link, target: '_blank', rel: 'noopener noreferrer' }, t('cr_d_open')) : null),
  ];
}
// Xem ảnh chụp PO to: bấm ảnh trong chi tiết, bấm đâu cũng đóng.
function Shot() {
  const s = useStore(store), ref = useRef();
  useEffect(() => { const d = ref.current; if (s.shot && !d.open) d.showModal(); if (!s.shot && d.open) d.close(); }, [s.shot]);
  return h('dialog', { class: 'src-shot-view', id: 'shot-view', ref, onClick: () => store.set({ shot: null }), onClose: () => store.set({ shot: null }) }, h('img', { id: 'shot-view-img', src: s.shot || '', alt: '' }));
}

render(h(Sidebar), document.querySelector('.side'));
render(h(Main), document.querySelector('.ws-main'));
render(h(Detail), detail);
render(h(Shot), document.getElementById('shot-root'));
