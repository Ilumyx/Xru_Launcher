// XRU ARRAY — blind test (mockup). Chỉ là logic để nhìn: đọc bản chụp thật từ Array, không gọi backend.
const S = window.ARRAY_SNAPSHOT;
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const norm = (q) => q.trim().replace(/\s+/g, ' ').toLowerCase();
const AXIS_ORDER = ['type', 'role', 'country', 'caliber', 'mobility', 'feature', 'arm'];

let current = null;   // dữ liệu câu đang xem
let picked = -1;      // dòng đang chọn

function toast(msg) {
  const t = $('ax-toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove('show'), 2200);
}

function findQuery(q) {
  const key = Object.keys(S.queries).find((k) => norm(k) === norm(q));
  return key ? S.queries[key] : null;
}

// ---------- Chạy một câu ----------
function run(q, { push = true } = {}) {
  q = q.trim();
  $('ax-q').value = q;
  document.querySelectorAll('#ax-pills button').forEach((b) => b.classList.toggle('is-active', norm(b.dataset.q) === norm(q)));
  if (push) history.replaceState(null, '', q ? `?q=${encodeURIComponent(q)}` : location.pathname);
  const d = findQuery(q);
  if (!d) return renderMissing(q);
  current = d;
  renderClauses(d);
  renderCooc(d);
  renderResults(d);
  pick(d.results.length ? 0 : -1);
}

function renderMissing(q) {
  current = null;
  $('ax-src-count').textContent = '—';
  $('ax-clauses').innerHTML = `<div class="ax-empty">Chưa có câu <b>${esc(q)}</b> trong bản chụp.<br>Mockup chỉ có ${S.order.length} câu chụp thật từ Array. Khi nối backend thì gõ gì Array trả nấy.</div>`;
  $('ax-reasons').hidden = true;
  $('ax-cooc-sec').hidden = true;
  $('ax-total').textContent = '';
  $('ax-results').innerHTML = '<div class="ax-empty">Bấm một câu mẫu phía trên để xem.</div>';
  pick(-1);
}

// ---------- Array hiểu thành ----------
function chipForObject(o) {
  if (o.axis) return `<span class="ax-chip">${esc(o.name)}<i>${esc(o.axis)}</i></span>`;
  if (o.canonical_name) return `<span class="ax-chip">${esc(o.canonical_name)}<i>entry</i></span>`;
  return `<span class="ax-chip">${esc(o.name || o.target || JSON.stringify(o))}</span>`;
}

function renderClauses(d) {
  $('ax-src-count').textContent = d.total.toLocaleString('vi-VN');
  const base = Math.max(1, ...d.understood.map((u) => u.count));
  $('ax-clauses').innerHTML = d.understood.map((u) => {
    const zero = u.cumulative_count === 0;
    const pct = Math.max(zero ? 0 : 1.5, (u.cumulative_count / base) * 100);
    const carries = (u.inherited_carries || []).map((c) => `${esc(c.canonical_name)} kế thừa từ ${esc(c.source_name)}`).join(' · ');
    return `<div class="ax-cl${zero ? ' is-zero' : ''}">
      <div class="ax-cl-text">${u.negated ? '<span class="neg">!</span>' : ''}${esc(u.text)}</div>
      <div class="ax-cl-kind">${esc(u.label || u.kind)}${u.relation ? ` · ${esc(u.relation)}` : ''}</div>
      <div class="ax-cl-match">${(u.objects || []).map(chipForObject).join('') || '<span class="kp-empty">không khớp gì</span>'}
        ${u.choice ? `<div class="ax-cl-choice">${esc(u.choice)}${carries && !u.choice.includes('kế thừa') ? ' · ' + carries : ''}</div>` : ''}</div>
      <div class="ax-cl-num">riêng ${u.count.toLocaleString('vi-VN')} → <b>${u.cumulative_count.toLocaleString('vi-VN')}</b>
        <div class="ax-bar"><span style="width:${pct}%"></span></div></div>
    </div>`;
  }).join('') || '<div class="ax-empty">Không tách được vế nào.</div>';

  const reasons = d.reasons || [];
  $('ax-reasons').hidden = !reasons.length;
  $('ax-reasons').innerHTML = reasons.map(esc).join('<br>');
}

// ---------- Tag hay đi cùng ----------
function renderCooc(d) {
  const groups = d.cooccurring_tags || {};
  const axes = AXIS_ORDER.concat(Object.keys(groups).filter((a) => !AXIS_ORDER.includes(a))).filter((a) => (groups[a] || []).length);
  $('ax-cooc-sec').hidden = !axes.length;
  $('ax-cooc').innerHTML = axes.map((a) => `<div class="ax-cooc-row"><span>${esc(a)}</span><div>${
    groups[a].slice(0, 10).map((t) => `<button class="ax-chip" data-add="${esc(t.name)}">${esc(t.name)}<i>${t.count}</i></button>`).join('')
  }</div></div>`).join('');
}

// ---------- Danh sách kết quả ----------
function renderResults(d) {
  $('ax-total').textContent = d.total ? `${d.total.toLocaleString('vi-VN')} entry` : '';
  if (!d.results.length) {
    $('ax-results').innerHTML = `<div class="ax-empty">${esc(d.message || 'Không có entry nào.')}</div>`;
    return;
  }
  const rows = d.results.map((r, i) => `<div class="ax-row" data-i="${i}">
      <span class="ax-row-n">${String(i + 1).padStart(2, '0')}</span>
      <div class="ax-row-name">${esc(r.canonical_name)}<small>${esc(r.key)}</small></div>
      <div class="ax-row-why">${esc(r.why)}${r.country?.length ? ' · ' + esc(r.country.join(', ')) : ''}</div>
      <div class="ax-row-side"><span class="ax-tier t${r.relevance_tier}">T${r.relevance_tier}</span><span class="ax-class">${esc(r.class)}</span></div>
    </div>`).join('');
  const more = d.total > d.results.length
    ? `<div class="ax-more">Còn ${(d.total - d.results.length).toLocaleString('vi-VN')} entry nữa · bản chụp chỉ lấy ${d.results.length} đầu</div>` : '';
  $('ax-results').innerHTML = rows + more;
}

// ---------- Chọn dòng → thẻ kiến thức ----------
function pick(i) {
  picked = i;
  document.querySelectorAll('.ax-row').forEach((row) => row.classList.toggle('is-active', +row.dataset.i === i));
  const r = current && current.results[i];
  if (!r) {
    $('ax-panel').innerHTML = '<p class="kp-empty">Chọn một entry để xem chi tiết.</p>';
    return;
  }
  document.querySelector(`.ax-row[data-i="${i}"]`)?.scrollIntoView({ block: 'nearest' });

  const byAxis = {};
  r.tag.forEach((t) => (byAxis[t.axis] ||= []).push(t.name));
  const axes = AXIS_ORDER.concat(Object.keys(byAxis).filter((a) => !AXIS_ORDER.includes(a))).filter((a) => byAxis[a]);

  const byRel = {};
  r.links.forEach((l) => {
    const out = l.subject_xru_id === r.xru_id;
    const other = S.names[out ? l.object_xru_id : l.subject_xru_id] || { name: (out ? l.object_xru_id : l.subject_xru_id).slice(0, 13) + '…', class: '' };
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

// ---------- Sự kiện ----------
$('ax-pills').innerHTML = S.order.map((q) => `<button data-q="${esc(q)}">${esc(q)}</button>`).join('');
$('ax-pills').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) run(b.dataset.q); });
$('ax-form').addEventListener('submit', (e) => { e.preventDefault(); run($('ax-q').value); $('ax-q').blur(); });
$('ax-results').addEventListener('click', (e) => { const row = e.target.closest('.ax-row'); if (row) pick(+row.dataset.i); });
$('ax-cooc').addEventListener('click', (e) => {
  const b = e.target.closest('[data-add]');
  if (!b) return;
  const q = `${$('ax-q').value.trim()} ${b.dataset.add}`;
  findQuery(q) ? run(q) : toast(`Bản chụp chưa có câu “${q}”. Khi nối backend bấm là chạy.`);
});
$('ax-panel').addEventListener('click', (e) => {
  const id = e.target.closest('[data-copy]');
  if (!id) return;
  navigator.clipboard?.writeText(id.dataset.copy).then(() => toast('Đã chép xru_id'), () => toast('Trình duyệt chặn chép (cần localhost/HTTPS)'));
});

window.addEventListener('keydown', (e) => {
  const typing = document.activeElement === $('ax-q');
  if (e.key === 'Escape') { if (typing) $('ax-q').blur(); else location.href = 'launcher_mockup.html'; return; }
  if (typing || ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
  if (e.key === '/' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) { e.preventDefault(); $('ax-q').focus(); $('ax-q').select(); return; }
  if (!current || !current.results.length) return;
  if (e.key === 'ArrowDown' || e.key === 'j') { e.preventDefault(); pick(Math.min(current.results.length - 1, picked + 1)); }
  if (e.key === 'ArrowUp' || e.key === 'k') { e.preventDefault(); pick(Math.max(0, picked - 1)); }
});

$('ax-gen').textContent = `${S.generation || ''} · chụp ${S.taken_at.replace('T', ' ')}`;
run(new URLSearchParams(location.search).get('q') || S.order[0], { push: false });
