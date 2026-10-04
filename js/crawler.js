// XRU CRAWLER — mockup chỉ xem. Đọc data/crawler_snapshot.js (số thật, chụp bằng tools/crawler_snapshot.py).
// Không có nút ra lệnh: crawler chỉ có cửa Silicon. Lọc / chọn dòng chỉ đổi chỗ đang NHÌN.
const S = window.CRAWLER_SNAPSHOT;
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (n) => Number(n || 0).toLocaleString('vi-VN');
const NOW = new Date(S.taken_at);
const LANE = { image: 'Ảnh', video: 'Video' };
const MODE = { cycle: 'chu kỳ', discover_all: 'dò toàn bộ', discover: 'dò' };

function bytes(b) {
  // Đơn vị nhị phân cho khớp `du -sh` (48G) trên máy
  if (b >= 2 ** 30) return `${(b / 2 ** 30).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} GB`;
  if (b >= 2 ** 20) return `${Math.round(b / 2 ** 20).toLocaleString('vi-VN')} MB`;
  return b ? `${Math.round(b / 1024)} KB` : '—';
}
const d2 = (n) => String(n).padStart(2, '0');
function when(s, withTime = true) {
  if (!s) return '—';
  const t = new Date(s);
  return `${d2(t.getDate())}/${d2(t.getMonth() + 1)}${withTime ? ` ${d2(t.getHours())}:${d2(t.getMinutes())}` : ''}`;
}
function ago(s) {
  if (!s) return 'chưa chạy';
  const h = (NOW - new Date(s)) / 36e5;
  if (h < 1) return `${Math.max(1, Math.round(h * 60))} phút`;
  if (h < 48) return `${Math.round(h)} giờ`;
  return `${Math.round(h / 24)} ngày`;
}
const daysUntil = (s) => Math.ceil((new Date(s) - NOW) / 864e5);
function dur(sec) {
  if (sec == null) return '—';
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.round(sec / 60)}m`;
  return `${Math.floor(sec / 3600)}h${d2(Math.round((sec % 3600) / 60))}`;
}
const statusPill = (s) => s.status === 'on' ? '<span class="cr-pill on"><i class="cr-dot on"></i>Đang bật</span>'
  : s.status === 'quarantine' ? `<span class="cr-pill quarantine"><i class="cr-dot quarantine"></i>Cách ly${s.review_after ? ` · đến ${when(s.review_after, false)}` : ''}</span>`
  : '<span class="cr-pill"><i class="cr-dot"></i>Tắt</span>';
const statusText = (s) => `<span class="cr-st ${s.status}"><i class="cr-dot ${s.status}"></i>${
  s.status === 'on' ? 'bật' : s.status === 'quarantine' ? `cách ly · ${s.review_after ? when(s.review_after, false) : '—'}` : 'tắt'}</span>`;
const blockedLanes = (s) => Object.entries(s.lanes).filter(([, L]) => L.blocked_at);
const hasErr = (s) => s.errors_open > 0;

// ---------- Header chung ----------
$('cr-snap').textContent = `chụp ${when(S.taken_at)} · chỉ xem`;
$('cr-tab-n').textContent = S.totals.sources;
window.addEventListener('keydown', (e) => {
  const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);
  if (e.key === 'Escape') { if (typing) document.activeElement.blur(); else location.href = 'launcher_mockup.html?continent=eurasia'; return; }
  if (typing) return;
  if (e.key === '1' && document.body.dataset.page !== 'dash') location.href = 'crawler_dash.html';
  if (e.key === '2' && document.body.dataset.page !== 'src') location.href = 'crawler_sources.html';
});

// ===================== DASHBOARD =====================
function renderDash() {
  const T = S.totals;
  const last = S.runs[0];
  const lastH = last ? (NOW - new Date(last.start)) / 36e5 : Infinity;
  const topPend = [...S.sources].sort((a, b) => b.pending - a.pending)[0];
  const topErr = S.errors.find((g) => g.open);
  const empty = S.sources.filter((s) => s.status === 'on' && !s.assets).length;
  const off = S.sources.filter((s) => s.status === 'off').length;
  const lastSrc = last?.sources?.[0] || '';

  $('cr-kpis').innerHTML = `
    <div class="cr-kpi"><span class="cr-label">Kho</span><b>${fmt(T.images + T.videos)}</b>
      <p>${fmt(T.images)} ảnh · ${fmt(T.videos)} video · ${bytes(T.image_bytes + T.video_bytes)}</p></div>
    <div class="cr-kpi${lastH > 48 ? ' warn' : ''}"><span class="cr-label">Lần chạy cuối</span><b>${ago(last?.start)}<small>trước</small></b>
      <p title="${esc(lastSrc)}">${when(last?.start)} · ${esc(lastSrc)} · ${LANE[last?.lane] || ''}</p></div>
    <div class="cr-kpi"><span class="cr-label">Hàng chờ tải</span><b>${fmt(T.pending)}</b>
      <p>${topPend?.pending ? `${fmt(topPend.pending)} của ${esc(topPend.name)}` : 'Không còn link nào chờ'}</p></div>
    <div class="cr-kpi${T.errors_open ? ' bad' : ''}"><span class="cr-label">Lỗi chưa xử lý</span><b>${fmt(T.errors_open)}<small>/ ${fmt(T.errors_total)}</small></b>
      <p>${topErr ? `${esc(topErr.code)} ×${topErr.open} · ${esc(topErr.sources[0] || '')}` : 'Sạch'}</p></div>
    <div class="cr-kpi"><span class="cr-label">Nguồn</span><b>${T.active}<small>/ ${T.sources} bật</small></b>
      <p>${T.quarantine} cách ly · ${off} tắt${empty ? ` · <span class="c-warn">${empty} bật mà chưa có món</span>` : ''}</p></div>`;

  drawChart();
  new ResizeObserver(() => drawChart()).observe($('cr-chart'));

  // Kho theo nguồn (dung lượng)
  const bySize = [...S.sources].filter((s) => s.bytes).sort((a, b) => b.bytes - a.bytes).slice(0, 8);
  const max = bySize[0]?.bytes || 1;
  $('cr-bars').innerHTML = bySize.map((s) => {
    const v = s.lanes.video?.bytes || 0, im = s.lanes.image?.bytes || 0;
    return `<div class="cr-bar${s.status !== 'on' ? ' off' : ''}" title="${esc(s.name)} · ${fmt(s.assets)} món">
      <span>${esc(s.name)}</span><b>${bytes(s.bytes)}</b>
      <div class="track"><i class="v" style="width:${(v / max) * 100}%"></i><i class="im" style="width:${Math.max(im ? 0.6 : 0, (im / max) * 100)}%"></i></div></div>`;
  }).join('');

  // Các lần chạy
  $('cr-runs-n').textContent = `${S.runs_total} lần · 7 gần nhất`;
  const n = (v, cls = '') => `<td class="n ${v ? cls : 'zero'}">${v ? fmt(v) : '·'}</td>`;
  $('cr-runs').innerHTML = `<thead><tr><th>Lúc</th><th>Làn</th><th>Kiểu</th><th>Nguồn</th><th style="text-align:right">Tải</th><th style="text-align:right">Trùng</th><th style="text-align:right">Lỗi</th><th style="text-align:right">Chạy</th></tr></thead><tbody>${
    S.runs.slice(0, 7).map((r) => `<tr title="${esc(r.id)}">
      <td class="t">${when(r.start)}</td><td>${LANE[r.lane]}</td><td class="t">${MODE[r.mode] || esc(r.mode)}</td>
      <td class="src">${esc(r.sources.join(', ') || '—')}</td>
      ${n(r.published, 'c-on')}${n(r.duplicate)}${n(r.failed, 'c-bad')}<td class="n t">${dur(r.secs)}</td></tr>`).join('')
  }</tbody>`;

  // Lỗi gom theo mã
  $('cr-errs-n').textContent = `${S.totals.errors_open} còn mở`;
  $('cr-errs').innerHTML = S.errors.slice(0, 3).map((g) => `<div class="cr-err${g.open ? '' : ' done'}">
      <div class="cr-err-h">${esc(g.code)} ×${g.n}<em>${g.open ? `còn ${g.open}` : 'chạy lại đã ổn'}</em></div>
      <p title="${esc(g.msg)}">${esc(g.msg)}</p>
      <p>${esc(g.sources.join(' · ') || LANE[g.lanes[0]] || '')} · lần cuối ${when(g.last)}</p></div>`).join('')
    + (S.errors.length > 3 ? `<div class="cr-empty">+${S.errors.length - 3} mã lỗi lẻ: ${S.errors.slice(3).map((g) => `${esc(g.code)} ×${g.n}`).join(', ')}</div>` : '')
    || '<div class="cr-empty">Không có lỗi.</div>';

  // Cách ly theo từng làn, xếp theo ngày xem lại
  const rv = S.sources.flatMap((s) => blockedLanes(s).map(([lane, L]) => ({ s, lane, L })))
    .sort((a, b) => (a.L.review_after || '').localeCompare(b.L.review_after || ''));
  $('cr-review').innerHTML = rv.map(({ s, lane, L }) => `<div class="cr-rv">
      <b>${esc(s.name)} <span class="c-dim">· ${LANE[lane]}</span></b>
      <em>${L.review_after ? `còn ${daysUntil(L.review_after)} ngày · ${when(L.review_after, false)}` : '—'}</em>
      <p>${esc(L.blocked_reason || 'Không ghi lý do')} · từ ${when(L.blocked_at, false)}</p></div>`).join('')
    || '<div class="cr-empty">Không có nguồn nào đang cách ly.</div>';
}

// Biểu đồ cột chồng theo ngày (video dưới, ảnh trên) + vùng "nghỉ" cuối
function drawChart() {
  const el = $('cr-chart');
  const W = el.clientWidth, H = 224, x0 = 40, top = 14, bottom = 24;
  if (!W) return;
  const data = S.chart;
  const tot = data.map((d) => d.image + d.video);
  const peak = Math.max(1, ...tot);
  const step = Math.pow(10, Math.floor(Math.log10(peak)));
  const yMax = Math.ceil(peak / step) * step;
  const ph = H - top - bottom, bw = (W - x0 - 4) / data.length;
  const y = (v) => top + ph - (v / yMax) * ph;
  const lastActive = tot.reduce((acc, v, i) => (v ? i : acc), -1);
  const idleDays = data.length - 1 - lastActive;

  let svg = '';
  for (let i = 0; i <= 4; i++) {
    const v = (yMax / 4) * i, yy = y(v);
    svg += `<line class="grid" x1="${x0}" x2="${W}" y1="${yy}" y2="${yy}"/><text class="axis" x="${x0 - 6}" y="${yy + 3}" text-anchor="end">${v >= 1000 ? `${v / 1000}k` : v}</text>`;
  }
  if (idleDays >= 2) {
    const xi = x0 + (lastActive + 1) * bw;
    svg += `<rect class="idle" x="${xi}" y="${top}" width="${W - xi}" height="${ph}"/><line class="idle-line" x1="${xi}" x2="${xi}" y1="${top}" y2="${top + ph}"/>
      <text class="idle-txt" x="${W - 4}" y="${top + 12}" text-anchor="end">nghỉ ${idleDays} ngày</text>`;
  }
  data.forEach((d, i) => {
    const x = x0 + i * bw, w = Math.max(1, bw * 0.72), xb = x + (bw - w) / 2;
    const hv = (d.video / yMax) * ph, hi = (d.image / yMax) * ph;
    svg += `<g class="col" data-i="${i}"><rect class="hit" x="${x}" y="${top}" width="${bw}" height="${ph}"/>`;
    if (d.video) svg += `<rect class="b-video" x="${xb}" y="${top + ph - hv}" width="${w}" height="${Math.max(1, hv)}" rx="1"/>`;
    if (d.image) svg += `<rect class="b-image" x="${xb}" y="${top + ph - hv - Math.max(1, hi)}" width="${w}" height="${Math.max(1, hi)}" rx="1"/>`;
    svg += '</g>';
    const dt = new Date(d.d);
    if (i === data.length - 1) svg += `<text class="today" x="${x + bw / 2}" y="${H - 6}" text-anchor="end">hôm nay</text>`;
    else if (dt.getDay() === 1 && i < data.length - 4) svg += `<text class="axis" x="${x + bw / 2}" y="${H - 6}" text-anchor="middle">${when(d.d, false)}</text>`;
  });
  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Số món thu mỗi ngày">${svg}</svg><div class="cr-tip" id="cr-tip" hidden></div>`;

  const pi = tot.indexOf(peak);
  $('cr-chart-range').textContent = `${when(data[0].d, false)} → ${when(data.at(-1).d, false)} · thứ Hai làm mốc`;
  $('cr-chart-note').innerHTML = `Đỉnh <b style="color:var(--fg-strong)">${fmt(peak)}</b> ngày ${when(data[pi].d, false)} · 14 ngày gần nhất: ${fmt(tot.slice(-14).reduce((a, b) => a + b, 0))} món`;

  const tip = $('cr-tip');
  el.querySelector('svg').addEventListener('mousemove', (e) => {
    const g = e.target.closest('.col');
    if (!g) { tip.hidden = true; return; }
    const d = data[+g.dataset.i];
    const r = el.getBoundingClientRect(), z = r.width / el.offsetWidth;
    tip.innerHTML = `<b>${when(d.d, false)}</b> · ${fmt(d.video)} video · ${fmt(d.image)} ảnh`;
    tip.style.left = `${(e.clientX - r.left) / z}px`;
    tip.style.top = `${(e.clientY - r.top) / z - 10}px`;
    tip.hidden = false;
  });
  el.querySelector('svg').addEventListener('mouseleave', () => { tip.hidden = true; });
}

// ===================== NGUỒN ĐÃ THÊM =====================
const F = { status: 'all', lane: 'all', q: '' };
let rows = [];
let sel = 0;

function spark(s, w = 90, h = 20, cls = 'cr-spark') {
  const im = s.lanes.image?.spark || [], vd = s.lanes.video?.spark || [];
  const n = Math.max(im.length, vd.length);
  const tot = Array.from({ length: n }, (_, i) => (im[i] || 0) + (vd[i] || 0));
  const max = Math.max(1, ...tot), bw = w / n;
  let r = `<line x1="0" x2="${w}" y1="${h - 0.5}" y2="${h - 0.5}"/>`;
  tot.forEach((v, i) => {
    if (!v) return;
    const hv = Math.max(1.5, (vd[i] || 0) / max * (h - 2)), hi = (im[i] || 0) ? Math.max(1.5, im[i] / max * (h - 2)) : 0;
    if (vd[i]) r += `<rect x="${i * bw}" y="${h - 1 - hv}" width="${Math.max(1, bw - 0.6)}" height="${hv}"/>`;
    if (hi) r += `<rect class="im" x="${i * bw}" y="${h - 1 - (vd[i] ? hv : 0) - hi}" width="${Math.max(1, bw - 0.6)}" height="${hi}"/>`;
  });
  return `<svg class="${cls}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">${r}</svg>`;
}

function laneChips(s) {
  return ['image', 'video'].filter((l) => s.lanes[l]).map((l) => {
    const L = s.lanes[l];
    const st = L.blocked_at ? ' style="box-shadow:inset 0 0 0 1px rgba(229,168,59,.45)"' : '';
    return `<span class="cr-lane${L.active ? '' : ' off'}"${st} title="${LANE[l]} · ${L.active ? 'bật' : L.blocked_at ? 'cách ly' : 'tắt'}">${LANE[l]} <i>${fmt(L.assets)}</i></span>`;
  }).join('');
}

function renderSources() {
  const count = (fn) => S.sources.filter(fn).length;
  const st = [['all', 'Tất cả', () => true], ['on', 'Đang bật', (s) => s.status === 'on'], ['quarantine', 'Cách ly', (s) => s.status === 'quarantine' || blockedLanes(s).length],
    ['off', 'Tắt', (s) => s.status === 'off'], ['err', 'Có lỗi', hasErr], ['empty', 'Chưa có món', (s) => !s.assets]];
  const ln = [['all', 'Ảnh + Video', () => true], ['image', 'Ảnh', (s) => s.lanes.image], ['video', 'Video', (s) => s.lanes.video]];
  const FN = Object.fromEntries([...st, ...ln.slice(1)].map(([k, , fn]) => [k, fn]));
  $('cr-f-status').innerHTML = st.map(([k, label, fn]) => `<button data-k="${k}">${label} · ${count(fn)}</button>`).join('');
  $('cr-f-lane').innerHTML = ln.map(([k, label, fn]) => `<button data-k="${k}">${label}${k === 'all' ? '' : ` · ${count(fn)}`}</button>`).join('');

  function apply() {
    const q = F.q.trim().toLowerCase();
    rows = S.sources.filter((s) => (F.status === 'all' || FN[F.status](s)) && (F.lane === 'all' || FN[F.lane](s))
      && (!q || `${s.name} ${s.adapter} ${s.host} ${Object.values(s.lanes).map((L) => L.description).join(' ')}`.toLowerCase().includes(q)));
    document.querySelectorAll('#cr-f-status button').forEach((b) => b.classList.toggle('is-on', b.dataset.k === F.status));
    document.querySelectorAll('#cr-f-lane button').forEach((b) => b.classList.toggle('is-on', b.dataset.k === F.lane));
    $('cr-table').innerHTML = `<thead><tr><th style="padding-left:10px">Nguồn</th><th>Làn</th><th>Trạng thái</th><th>Hạng</th><th class="n">Kho</th><th class="n hide-md">Dung lượng</th><th class="hide-md">45 ngày</th><th>Lần cuối</th><th class="n">Chờ tải</th><th class="n">Lỗi</th></tr></thead><tbody>${
      rows.map((s, i) => `<tr data-i="${i}" class="${s.status !== 'on' ? 'is-off' : ''}">
        <td><div class="cr-name"><div><b title="${esc(s.name)}">${esc(s.name)}</b><small>${esc(s.adapter)} · ${esc(s.host)}</small></div></div></td>
        <td><div class="cr-lanes">${laneChips(s)}</div></td>
        <td>${statusText(s)}</td>
        <td class="t">${esc(s.tier || '—')}</td>
        <td class="n">${s.assets ? fmt(s.assets) : '<span class="c-warn">0</span>'}</td>
        <td class="n hide-md">${bytes(s.bytes)}</td>
        <td class="hide-md">${spark(s)}</td>
        <td class="t" title="${esc(s.last || '')}">${s.last ? `${when(s.last, false)} <span class="c-dim">· ${ago(s.last)}</span>` : '<span class="c-dim">chưa chạy</span>'}</td>
        <td class="n">${s.pending ? fmt(s.pending) : '<span class="c-dim">·</span>'}</td>
        <td class="n">${s.errors_open ? `<span class="c-bad">${s.errors_open}</span>` : '<span class="c-dim">·</span>'}</td></tr>`).join('')
    }</tbody>`;
    $('cr-none').hidden = rows.length > 0;
    $('cr-count').textContent = `${rows.length} / ${S.sources.length} nguồn · ${S.totals.registrations} đăng ký (ảnh + video)`;
    pick(Math.min(sel, rows.length - 1));
  }

  $('cr-f-status').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { F.status = b.dataset.k; sel = 0; apply(); } });
  $('cr-f-lane').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { F.lane = b.dataset.k; sel = 0; apply(); } });
  $('cr-q').addEventListener('input', (e) => { F.q = e.target.value; sel = 0; apply(); });
  $('cr-table').addEventListener('click', (e) => { const tr = e.target.closest('tbody tr'); if (tr) pick(+tr.dataset.i); });
  window.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
    if (e.key === '/') { e.preventDefault(); $('cr-q').focus(); }
    if (e.key === 'ArrowDown' || e.key === 'j') { e.preventDefault(); pick(Math.min(rows.length - 1, sel + 1)); }
    if (e.key === 'ArrowUp' || e.key === 'k') { e.preventDefault(); pick(Math.max(0, sel - 1)); }
  });
  apply();
}

function pick(i) {
  sel = i;
  document.querySelectorAll('#cr-table tbody tr').forEach((tr) => tr.classList.toggle('is-active', +tr.dataset.i === i));
  const s = rows[i];
  if (!s) { $('cr-insp').innerHTML = '<p class="cr-empty">Chọn một nguồn để xem.</p>'; return; }
  document.querySelector(`#cr-table tbody tr[data-i="${i}"]`)?.scrollIntoView({ block: 'nearest' });

  const thumbs = Object.values(s.lanes).flatMap((L) => L.thumbs || []).sort((a, b) => (b.at || '').localeCompare(a.at || '')).slice(0, 8);
  const tiles = thumbs.length
    ? thumbs.map((t) => `<div class="ci-thumb" title="${esc(t.title || '')}${t.w ? ` · ${t.w}×${t.h}` : ''} · ${when(t.at)}"><img src="${esc(t.src)}" alt="" loading="lazy">${t.dur ? `<span>${Math.floor(t.dur / 60)}:${d2(Math.round(t.dur % 60))}</span>` : t.lane === 'image' ? '<span>ẢNH</span>' : ''}</div>`).join('')
    : '<div class="ci-thumb ph"></div>'.repeat(4);
  const q = blockedLanes(s).map(([lane, L]) => `<div class="ci-q"><b>Cách ly làn ${LANE[lane]}</b> từ ${when(L.blocked_at, false)}${L.review_after ? ` · xem lại ${when(L.review_after, false)} (còn ${daysUntil(L.review_after)} ngày)` : ''}<br>${esc(L.blocked_reason || '')}</div>`).join('');
  const lanes = ['image', 'video'].filter((l) => s.lanes[l]).map((l) => {
    const L = s.lanes[l];
    const pill = L.active ? '<span class="cr-pill on">bật</span>' : L.blocked_at ? '<span class="cr-pill quarantine">cách ly</span>' : '<span class="cr-pill">tắt</span>';
    return `<div class="ci-lane"><div class="ci-lane-h"><strong>${LANE[l]}</strong>${pill}${L.tier ? `<span class="cr-pill">hạng ${esc(L.tier)}</span>` : ''}</div>
      ${L.description ? `<p>${esc(L.description)}</p>` : ''}
      ${L.po_note ? `<p><span class="c-dim">Ghi chú PO:</span> ${esc(L.po_note)}</p>` : ''}
      <a href="${esc(L.locator)}" target="_blank" rel="noopener noreferrer">${esc(L.locator)}</a>
      <dl class="ci-meta"><dt>kho</dt><dd>${fmt(L.assets)} món · ${bytes(L.bytes)}</dd><dt>lần đầu</dt><dd>${when(L.first)}</dd><dt>lần cuối</dt><dd>${when(L.last)}</dd>
        <dt>chờ tải</dt><dd>${fmt(L.pending)}${L.retired ? ` · bỏ ${fmt(L.retired)}` : ''}</dd></dl></div>`;
  }).join('');
  const errs = (s.errors || []).map((g) => `<div class="${g.open ? '' : 'done'}">${esc(g.code)} ×${g.n}${g.open ? ` (còn ${g.open})` : ''} · ${when(g.last)}<br><span class="c-dim">${esc(g.msg)}</span></div>`).join('');

  $('cr-insp').innerHTML = `
    <div class="ci-top">${statusPill(s)}${s.tier ? `<span class="cr-pill">hạng ${esc(s.tier)}</span>` : ''}${s.errors_open ? `<span class="cr-pill bad">${s.errors_open} lỗi mở</span>` : ''}</div>
    <div class="ci-name">${esc(s.name)}</div>
    <div class="ci-host">${esc(s.adapter)} · ${esc(s.host)}</div>
    <div class="ci-nums"><div><span class="cr-label">Kho</span><b>${fmt(s.assets)}</b></div><div><span class="cr-label">Dung lượng</span><b>${bytes(s.bytes)}</b></div><div><span class="cr-label">Chờ tải</span><b>${fmt(s.pending)}</b></div></div>
    <div class="ci-sec"><h3>Món mới nhất${thumbs.length ? '' : ' · chưa có'}</h3><div class="ci-thumbs">${tiles}</div></div>
    ${q ? `<div class="ci-sec">${q}</div>` : ''}
    <div class="ci-sec"><h3>Nhịp thu 45 ngày · lần cuối ${s.last ? `${ago(s.last)} trước` : 'chưa chạy'}</h3>${spark(s, 360, 46, 'ci-spark cr-spark')}</div>
    <div class="ci-sec"><h3>Từng làn</h3>${lanes}</div>
    ${errs ? `<div class="ci-sec"><h3>Lỗi</h3><div class="ci-errs">${errs}</div></div>` : ''}`;
}

if (document.body.dataset.page === 'dash') renderDash();
else renderSources();
