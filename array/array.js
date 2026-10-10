// XRU ARRAY — blind test (mockup), hai màn kiểu Google.
// Chỉ là logic để nhìn: đọc bản chụp thật từ Array (data/array_snapshot.js), không gọi backend.
const S = window.ARRAY_SNAPSHOT;
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const norm = (q) => String(q || '').trim().replace(/\s+/g, ' ').toLowerCase();
const fmt = (n) => Number(n || 0).toLocaleString('vi-VN');
const AXIS_ORDER = ['type', 'role', 'country', 'caliber', 'mobility', 'feature', 'arm'];
const TABS = ['all', 'know', 'img', 'vid', 'evt', 'ai'];
const SOON = new Set(['img', 'vid', 'evt', 'ai']);
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

const IC_SEARCH = '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" stroke-width="1.8"/><path stroke-linecap="round" stroke-width="1.8" d="M21 21l-4.35-4.35"/></svg>';
const IC_CLASS = {
  Object: '<svg fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><path stroke-linejoin="round" d="M12 2l9 5v10l-9 5-9-5V7l9-5z"/><path stroke-linejoin="round" d="M3 7l9 5 9-5M12 12v10"/></svg>',
  Event: '<svg fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 21V4M5 4h11l-2 4 2 4H5"/></svg>',
};

const ax = $('ax');
const input = $('ax-q');
let state = { q: '', tab: 'all', d: null };
let picked = -1;

function toast(msg) {
  const t = $('ax-toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove('show'), 2400);
}

function findQuery(q) {
  const key = Object.keys(S.queries).find((k) => norm(k) === norm(q));
  return key ? S.queries[key] : null;
}

// ---------- Điều hướng: ?q= → màn kết quả, không có q → trang đầu ----------
function navigate(q, tab = 'all', { push = true } = {}) {
  q = String(q || '').trim();
  const p = new URLSearchParams();
  if (q) p.set('q', q);
  if (q && tab !== 'all') p.set('tab', tab);
  const url = p.toString() ? `?${p}` : location.pathname;
  if (push && url !== location.search) history.pushState(null, '', url);
  else history.replaceState(null, '', url);
  apply(q, tab, true);
}

function apply(q, tab, animate) {
  const view = q ? 'results' : 'home';
  const change = () => {
    ax.dataset.view = view;
    closeSug();
    if (view === 'home') {
      input.value = '';
      state = { q: '', tab: 'all', d: null };
      syncClear();
      return;
    }
    renderResults(q, tab);
  };
  // Đổi màn (đầu ↔ kết quả) thì cho chữ ARRAY + ô tra trượt; đổi câu trong cùng màn thì thay ngay
  if (animate && view !== ax.dataset.view && document.startViewTransition && !reduceMotion) {
    document.documentElement.classList.add('vt-array');
    document.startViewTransition(change).finished.finally(() => document.documentElement.classList.remove('vt-array'));
  } else change();
}

window.addEventListener('popstate', () => {
  const p = new URLSearchParams(location.search);
  apply(p.get('q') || '', TABS.includes(p.get('tab')) ? p.get('tab') : 'all', true);
});

// ---------- Màn kết quả ----------
function renderResults(q, tab) {
  input.value = q;
  syncClear();
  const d = findQuery(q);
  state = { q, tab, d };
  document.querySelectorAll('#ax-tabs button').forEach((b) => b.classList.toggle('is-active', b.dataset.tab === tab));
  $('ax-main').scrollTop = 0;

  if (SOON.has(tab)) {
    ax.dataset.soon = '';
    $('ax-under').innerHTML = '';
    $('ax-related').hidden = true;
    $('ax-results').innerHTML = renderSoon(tab, d);
    return;
  }
  delete ax.dataset.soon;
  if (!d) { ax.dataset.soon = ''; return renderMissing(q); }
  if (!d.results.length) ax.dataset.soon = '';
  renderUnder(d, tab);
  renderList(d, tab);
  renderRelated(d);
  pick(d.results.length ? 0 : -1, { scroll: false });
}

function renderMissing(q) {
  $('ax-under').innerHTML = '';
  $('ax-related').hidden = true;
  $('ax-results').innerHTML = `<div class="ax-empty">Bản chụp chưa có câu <b>${esc(q)}</b>.<br>
    Mockup chỉ chụp sẵn ${S.order.length} câu thật từ Array. Nối backend rồi thì gõ gì Array trả nấy.
    <ul>${S.order.map((x) => `<li><a href="?q=${encodeURIComponent(x)}" data-q="${esc(x)}">${esc(x)}</a></li>`).join('')}</ul></div>`;
  pick(-1);
}

// Dòng "Array hiểu thành": mỗi vế một chip, số là còn lại sau vế đó
function chipForObject(o) {
  if (o.axis) return `<span class="ax-chip">${esc(o.name)}<i>${esc(o.axis)}</i></span>`;
  if (o.canonical_name) return `<span class="ax-chip">${esc(o.canonical_name)}<i>entry</i></span>`;
  return `<span class="ax-chip">${esc(o.name || o.target || JSON.stringify(o))}</span>`;
}

function renderUnder(d, tab) {
  const shown = d.results.length;
  const stat = d.total
    ? `<b>${fmt(d.total)}</b> entry trong Atlas${d.total > shown ? ` · bản chụp lấy ${shown} đầu` : ''}`
    : 'Không ra entry nào';
  const chain = d.understood.map((u) => {
    const zero = u.cumulative_count === 0;
    const title = [u.choice, `riêng vế này: ${fmt(u.count)}`].filter(Boolean).join(' · ');
    return `<span class="ax-cl-chip${zero ? ' is-zero' : ''}" title="${esc(title)}">${u.negated ? '<span class="neg">!</span>' : ''}<b>${esc(u.text)}</b><i>${esc(u.label || u.kind)}</i><em>${fmt(u.cumulative_count)}</em></span>`;
  }).join('<span class="ax-op">→</span>');

  const base = Math.max(1, ...d.understood.map((u) => u.count));
  const rows = d.understood.map((u) => {
    const zero = u.cumulative_count === 0;
    const pct = Math.max(zero ? 0 : 1.5, (u.cumulative_count / base) * 100);
    const carries = (u.inherited_carries || []).map((c) => `${esc(c.canonical_name)} kế thừa từ ${esc(c.source_name)}`).join(' · ');
    return `<div class="ax-cl${zero ? ' is-zero' : ''}">
      <div class="ax-cl-text">${u.negated ? '<span class="neg">!</span>' : ''}${esc(u.text)}</div>
      <div class="ax-cl-kind">${esc(u.label || u.kind)}${u.relation ? ` · ${esc(u.relation)}` : ''}</div>
      <div class="ax-cl-match">${(u.objects || []).map(chipForObject).join('') || '<span class="kp-empty">không khớp gì</span>'}
        ${u.choice ? `<div class="ax-cl-choice">${esc(u.choice)}${carries && !u.choice.includes('kế thừa') ? ' · ' + carries : ''}</div>` : ''}</div>
      <div class="ax-cl-num">riêng ${fmt(u.count)} → <b>${fmt(u.cumulative_count)}</b><div class="ax-bar"><span style="width:${pct}%"></span></div></div>
    </div>`;
  }).join('');

  const reasons = (d.reasons || []).length ? `<div class="ax-reasons">${d.reasons.map(esc).join('<br>')}</div>` : '';
  const src = tab === 'know'
    ? `<div class="ax-srcchips"><span class="is-on">Atlas · ${fmt(d.total)}</span><span>Wiki XRU · chưa index</span><span>XRU DB · chưa index</span></div>` : '';

  $('ax-under').innerHTML = `<div class="ax-stat">${stat}</div>
    ${d.understood.length ? `<div class="ax-chain"><span class="ax-chain-l">Array hiểu thành</span>${chain}</div>
    <details class="ax-detail"><summary>xem từng vế</summary><div class="ax-clauses">${rows}</div></details>` : ''}
    ${reasons}${src}`;
}

// Tô đậm chữ trong câu tra xuất hiện ở đoạn trích (Google cũng làm vậy)
function highlighter(q) {
  const words = [...new Set(q.split(/[\s+!]+/).filter((w) => w.length >= 2))]
    .map((w) => esc(w).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (!words.length) return (s) => s;
  const re = new RegExp(`(${words.join('|')})`, 'gi');
  return (s) => s.replace(re, '<b>$1</b>');
}

function renderList(d, tab) {
  if (!d.results.length) {
    $('ax-results').innerHTML = `<div class="ax-empty">Array không ra entry nào cho <b>${esc(d.q)}</b>.${d.message && !(d.reasons || []).length ? `<br>${esc(d.message)}` : ''}</div>`;
    return;
  }
  const hl = highlighter(d.q);
  const items = d.results.map((r, i) => {
    const alias = (r.other_name || []).slice(0, 3).join(' · ');
    const meta = [r.why, (r.country || []).join(', '), r.links?.length ? `${r.links.length} quan hệ` : ''].filter(Boolean);
    return `<article class="ax-r" data-i="${i}">
      <div class="ax-r-src"><span class="ax-fav">${IC_CLASS[r.class] || IC_CLASS.Object}</span>
        <div><b>Atlas · ${esc(r.class)}</b><small>atlas › ${esc(r.key)}</small></div>
        <span class="ax-tier t${r.relevance_tier}" title="Mức liên quan">T${r.relevance_tier}</span></div>
      <h3 class="ax-r-title">${esc(r.canonical_name)}</h3>
      <p class="ax-r-snip">${alias ? `<span class="ax-r-alias">${hl(esc(alias))} — </span>` : ''}${hl(esc(r.description || 'Không có mô tả.'))}</p>
      <div class="ax-r-meta">${meta.map((m) => `<span>${esc(m)}</span>`).join('')}</div>
    </article>`;
  });
  // Tab Tất cả: xen khối Ảnh sau kết quả thứ 3, nối bằng khoá Atlas của kết quả đầu (chưa có ruột)
  if (tab === 'all') {
    const k = d.results[0].key;
    items.splice(Math.min(3, items.length), 0, `<section class="ax-strip">
      <div class="ax-strip-h">Ảnh <code>khoá ${esc(k)}</code><span class="ax-soon">chưa có · Euruska Search</span></div>
      <div class="ax-strip-tiles">${'<span class="ax-ph"></span>'.repeat(5)}</div></section>`);
  }
  const more = d.total > d.results.length
    ? `<div class="ax-more">Còn ${fmt(d.total - d.results.length)} entry nữa · bản chụp chỉ lấy ${d.results.length} đầu</div>` : '';
  $('ax-results').innerHTML = items.join('') + more;
}

// Tìm kiếm liên quan = câu hiện tại + một tag hay đi cùng trong tập kết quả
function renderRelated(d) {
  const inQ = new Set(norm(d.q).split(/[\s+!]+/));
  const tags = Object.values(d.cooccurring_tags || {}).flat()
    .filter((t) => !inQ.has(norm(t.name)) && t.count < d.total)
    .sort((a, b) => b.count - a.count).slice(0, 8);
  $('ax-related').hidden = !tags.length;
  $('ax-related').innerHTML = `<h2>Tìm kiếm liên quan<span>từ tag hay đi cùng</span></h2><div class="ax-rel-grid">${
    tags.map((t) => `<button data-q="${esc(`${d.q} ${t.name}`)}">${IC_SEARCH}<span>${esc(d.q)} <b>${esc(t.name)}</b></span><small>${t.count}</small></button>`).join('')
  }</div>`;
}

// Tab chưa có ruột: nói rõ ruột sẽ là gì (theo 10_Array_Hinh_Dung)
function renderSoon(tab, d) {
  const k = d?.results?.[0]?.key;
  const keyTxt = k ? `<code>${esc(k)}</code>` : 'khoá Atlas';
  const tiles = `<div class="ax-strip-tiles">${'<span class="ax-ph"></span>'.repeat(10)}</div>`;
  const pages = {
    img: `<h2>Ảnh <span class="ax-soon">chưa có</span></h2>
      <p>Ruột: <b>Euruska Search trên kho Liên Bang</b>, kho riêng, code riêng. Ảnh nào đã label gắn ${keyTxt} sẽ hiện ở đây.</p>
      <p>Sợi chỉ nối với tab Kiến thức là <b>khoá Atlas chung</b>, không phải ảnh của nguồn tin.</p>${tiles}`,
    vid: `<h2>Video <span class="ax-soon">chưa có</span></h2>
      <p>Ruột: <b>Euruska Search trên kho Liên Bang</b>. Clip gắn ${keyTxt}, mỗi clip có ngày xuất hiện đầu tiên (first seen).</p>
      <p>12 lần đăng lại không phải 12 nguồn: clip trùng (PDQ / TMK+PDQF) gộp làm một.</p>${tiles}`,
    evt: `<h2>Sự kiện <span class="ax-soon">chưa có</span></h2>
      <p>Ruột: <b>biên niên các sự kiện đã xác nhận</b>, nối tiếp xương sống Event của Atlas (chiến tranh → mặt trận → chiến dịch → trận).</p>
      <p>Mỗi nguồn chấm <b>Admiralty Code</b> (nguồn A–F, tin 1–6). Nhận định dùng chữ có quy ước (Words of Estimative Probability). Nước ghi mã ISO: UA, GB.</p>
      <div class="ax-tpl">SỰ KIỆN · ngày xx-xx · khoá Atlas: [${k ? esc(k) : '...'}]
─ Các bên nói ─────────────
RU claim ...            [C3]
UA claim ...            [C3]
NATO / bên thứ ba ...   [B2]
─ Đã xác nhận ─────────────
...                     [B1]
─ XRU nhận định ───────────
"Có khả năng" ... (lý do)
─ Rủi ro ──────────────────
Risk 1 / 2 / 3
─ ⚠ CHƯA XÁC NHẬN ─────────
...</div>`,
    ai: `<h2>Chế độ AI <span class="ax-soon">chưa có</span></h2>
      <p>LLM ngồi trên, <b>gõ truy vấn chính xác thay người</b>. Không phải ô chat: câu nó gõ vẫn hiện ra trong ô tra, bro thấy Array chạy câu gì.</p>
      <div class="ax-ai-demo"><b>Bro hỏi:</b> mấy chiếc tăng nào bắn được đạn 3BM42?<br><b>LLM gõ:</b> <code>tank + 3bm42</code> → Array trả danh sách có đáy như thường.</div>`,
  };
  return `<div class="ax-soonpage">${pages[tab]}</div>`;
}

// ---------- Chọn kết quả → thẻ kiến thức ----------
function pick(i, { scroll = true } = {}) {
  picked = i;
  document.querySelectorAll('.ax-r').forEach((el) => el.classList.toggle('is-active', +el.dataset.i === i));
  const r = state.d && state.d.results[i];
  if (!r) {
    $('ax-panel').innerHTML = '<p class="kp-empty">Chọn một kết quả để xem thẻ kiến thức.</p>';
    return;
  }
  if (scroll) document.querySelector(`.ax-r[data-i="${i}"]`)?.scrollIntoView({ block: 'nearest' });

  const byAxis = {};
  r.tag.forEach((t) => (byAxis[t.axis] ||= []).push(t.name));
  const axes = AXIS_ORDER.concat(Object.keys(byAxis).filter((a) => !AXIS_ORDER.includes(a))).filter((a) => byAxis[a]);

  const byRel = {};
  r.links.forEach((l) => {
    const out = l.subject_xru_id === r.xru_id;
    const id = out ? l.object_xru_id : l.subject_xru_id;
    const other = S.names[id] || { name: id.slice(0, 13) + '…', class: '' };
    (byRel[l.relation] ||= []).push({ out, ...other });
  });

  $('ax-panel').innerHTML = `
    <div class="kp-class">${esc(r.class)} · Atlas</div>
    <div class="kp-name">${esc(r.canonical_name)}</div>
    ${r.other_name?.length ? `<div class="kp-alias">Còn gọi: ${esc(r.other_name.join(' · '))}</div>` : ''}
    <p class="kp-desc">${esc(r.description || 'Không có mô tả.')}</p>
    <div class="kp-sec"><h3>Định danh</h3><dl class="kp-meta">
      <dt>key</dt><dd>${esc(r.key)}</dd>
      <dt>xru_id</dt><dd class="id" title="Bấm để chép" data-copy="${esc(r.xru_id)}">${esc(r.xru_id)}</dd>
      <dt>quốc gia</dt><dd>${esc((r.country || []).join(', ') || '—')}</dd>
    </dl></div>
    <div class="kp-sec"><h3>Tag</h3><div class="kp-tags">${
      axes.map((a) => `<span>${esc(a)}</span><div>${byAxis[a].map((n) => `<span class="ax-chip">${esc(n)}</span>`).join('')}</div>`).join('')
    }</div></div>
    <div class="kp-sec"><h3>Quan hệ trực tiếp</h3>${
      Object.keys(byRel).length ? `<div class="kp-rel">${Object.entries(byRel).map(([rel, items]) => `
        <div class="kp-rel-group"><b>${esc(rel)}</b>${items.map((x) => `
          <div class="kp-rel-item"><span>${x.out ? '→' : '←'}</span>${esc(x.name)}<small>${esc(x.class)}</small></div>`).join('')}
        </div>`).join('')}</div>` : '<p class="kp-empty">Không có quan hệ trực tiếp.</p>'
    }</div>
    <div class="kp-src">Vì sao ra: ${esc(r.why)} · mức T${r.relevance_tier}</div>`;
}

// ---------- Gợi ý dưới ô tra (chỉ các câu đã chụp) ----------
let sugItems = [];
let sugHl = -1;

function openSug() {
  const v = norm(input.value);
  sugItems = S.order.filter((q) => !v || norm(q).includes(v));
  if (!sugItems.length || (sugItems.length === 1 && norm(sugItems[0]) === v)) return closeSug();
  sugHl = -1;
  $('ax-sug').innerHTML = `<li class="ax-sug-head">Câu đã chụp từ Array</li>` + sugItems.map((q, i) => {
    const at = v ? norm(q).indexOf(v) : -1;
    // Như Google: phần bro đã gõ để thường, phần còn lại tô đậm
    const label = at < 0 ? `<b>${esc(q)}</b>`
      : `<b>${esc(q.slice(0, at))}</b>${esc(q.slice(at, at + v.length))}<b>${esc(q.slice(at + v.length))}</b>`;
    return `<li role="option" data-i="${i}">${IC_SEARCH}<span>${label}</span><small>${fmt(S.queries[q].total)}</small></li>`;
  }).join('');
  $('ax-sug').hidden = false;
  $('ax-boxwrap').classList.add('is-open');
}

function closeSug() {
  $('ax-sug').hidden = true;
  $('ax-boxwrap').classList.remove('is-open');
  sugHl = -1;
}

function hlSug(n) {
  sugHl = (n + sugItems.length) % sugItems.length;
  document.querySelectorAll('#ax-sug li[data-i]').forEach((li) => li.classList.toggle('is-hl', +li.dataset.i === sugHl));
}

function syncClear() { $('ax-clear').hidden = !input.value; }

// ---------- Sự kiện ----------
$('ax-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const q = sugHl >= 0 ? sugItems[sugHl] : input.value;
  if (!q.trim()) return;
  input.blur();
  navigate(q);
});
input.addEventListener('input', () => { syncClear(); openSug(); });
input.addEventListener('mousedown', () => { if ($('ax-sug').hidden) setTimeout(openSug); });
input.addEventListener('blur', () => setTimeout(closeSug, 120));
$('ax-sug').addEventListener('mousedown', (e) => {
  const li = e.target.closest('li[data-i]');
  if (!li) return;
  e.preventDefault();
  input.blur();
  navigate(sugItems[+li.dataset.i]);
});
$('ax-clear').addEventListener('click', () => { input.value = ''; syncClear(); input.focus(); openSug(); });
$('ax-lucky').addEventListener('click', () => navigate(S.order[Math.floor(Math.random() * S.order.length)]));
$('ax-mark').addEventListener('click', (e) => { e.preventDefault(); if (ax.dataset.view !== 'home') navigate(''); });
$('ax-tabs').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-tab]');
  if (b && b.dataset.tab !== state.tab) navigate(state.q, b.dataset.tab, { push: false });
});
// Link câu mẫu (trang đầu + màn chưa có câu): đi trong trang, không tải lại
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[data-q]');
  if (!a) return;
  e.preventDefault();
  navigate(a.dataset.q);
});
$('ax-results').addEventListener('click', (e) => { const r = e.target.closest('.ax-r'); if (r) pick(+r.dataset.i); });
$('ax-related').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-q]');
  if (!b) return;
  findQuery(b.dataset.q) ? navigate(b.dataset.q) : toast((window.XRU_I18N ? window.XRU_I18N.t('ax_not_captured') : 'Bản chụp chưa có câu “{q}”. Nối backend rồi bấm là chạy.').replace('{q}', b.dataset.q));
});
$('ax-panel').addEventListener('click', (e) => {
  const id = e.target.closest('[data-copy]');
  if (!id) return;
  navigator.clipboard?.writeText(id.dataset.copy).then(() => toast('Đã chép xru_id'), () => toast('Trình duyệt chặn chép (cần localhost/HTTPS)'));
});

window.addEventListener('keydown', (e) => {
  const typing = document.activeElement === input;
  if (typing && !$('ax-sug').hidden && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
    e.preventDefault();
    hlSug(sugHl + (e.key === 'ArrowDown' ? 1 : -1));
    return;
  }
  if (e.key === 'Escape') {
    if (typing) { $('ax-sug').hidden ? input.blur() : closeSug(); return; }
    // Lùi một màn: kết quả → trang đầu Array → Launcher
    if (ax.dataset.view === 'results') navigate('');
    else location.href = '../index.html';
    return;
  }
  if (typing || ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
  if (e.key === '/' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) { e.preventDefault(); input.focus(); input.select(); return; }
  const d = state.d;
  if (ax.dataset.view !== 'results' || SOON.has(state.tab) || !d || !d.results.length) return;
  if (e.key === 'ArrowDown' || e.key === 'j') { e.preventDefault(); pick(Math.min(d.results.length - 1, picked + 1)); }
  if (e.key === 'ArrowUp' || e.key === 'k') { e.preventDefault(); pick(Math.max(0, picked - 1)); }
});

// ---------- Khởi động ----------
const shortGen = (S.generation || '').replace('generation-', '').slice(0, 8);
const taken = (S.taken_at || '').replace('T', ' ');
$('ax-gen').textContent = `gen ${shortGen} · chụp ${taken}`;
const tr = (k, vi) => (window.XRU_I18N ? window.XRU_I18N.t(k) : vi);
$('ax-foot-l').innerHTML = `Index: <b>Atlas</b> · <i>${tr('ax_not_yet', 'Wiki XRU, XRU DB chưa')}</i> · gen ${esc(shortGen)}`;
$('ax-hint-qs').innerHTML = S.order.map((q) => `<a href="?q=${encodeURIComponent(q)}" data-q="${esc(q)}">${esc(q)}</a>`).join('');
document.querySelectorAll('#ax-tabs .is-soon').forEach((b) => (b.title = tr('ax_soon_tip', 'Chưa có ruột — bấm để xem sẽ là gì')));
{
  const p = new URLSearchParams(location.search);
  apply(p.get('q') || '', TABS.includes(p.get('tab')) ? p.get('tab') : 'all', false);
  if (!p.get('q')) input.focus();
}
