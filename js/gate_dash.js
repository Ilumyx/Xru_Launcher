// XRU GATE DASH — số thật từ data/gate_snapshot.js (tools/gate_snapshot.py chụp từ lệnh `stats` của Gate).
// Sidebar chọn phạm vi (tất cả / một nền tảng / một kênh) → phễu tính lại theo phạm vi đó.
// Phần máy: lõi mới cho số toàn lane; đúng / bắt lộn / hụt cần lõi ghi "máy nói × PO quyết" theo từng hồ sơ.
(() => {
  const SNAP = window.GATE_SNAPSHOT;
  const $ = (id) => document.getElementById(id);
  const n = (v) => (v === null || v === undefined ? '—' : v.toLocaleString('en-US'));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const t = (k, fb) => (window.XRU_I18N ? window.XRU_I18N.t(k) : fb);
  const PLATFORM = { facebook: 'Facebook', reddit: 'Reddit', dvids: 'DVIDS', waralbum: 'War Album' };

  function getStates() {
    return [
      ['WAITING_PO', 'WAIT', t('waiting_po', 'chờ PO xem')],
      ['MACHINE_FLAGGED', 'MACHINE FLAG', t('machine_flag_sub', 'máy cắm cờ, chờ PO')],
      ['DETAINED', 'DETAIN', t('detained', 'đang giữ')],
      ['ACCEPT_APPROVED', 'ACCEPT', t('cleared_sub', 'qua cửa')],
      ['PURGE_APPROVED', 'PURGE', t('purged_sub', 'loại bỏ')],
    ];
  }

  // Loại cờ máy → các mã finding của lõi
  function getFindings() {
    return [
      [t('finding_music', 'Nhạc'), ['MUSIC']],
      [t('finding_dup', 'Trùng'), ['DUPLICATE', 'DUPLICATE_CANDIDATE']],
      ['Watermark', ['WATERMARK', 'TEXT_WATERMARK']],
      [t('finding_text', 'Chữ chèn'), ['TEXT']],
      [t('finding_err', 'Máy đọc lỗi'), ['AUDIO_ERROR', 'TEXT_WATERMARK_ERROR']],
      [t('finding_untagged', 'Chưa gắn loại'), ['UNTAGGED']],
    ];
  }

  const state = { kind: 'video', scope: null, q: '', sort: 'wait', open: {} };
  const lane = () => SNAP[state.kind];
  const wait = (s) => s.by_state.WAITING_PO || 0;

  // Nguồn gom theo nền tảng; mỗi nhóm có by_state cộng dồn
  function groups() {
    const map = new Map();
    for (const src of lane().by_source) {
      const key = src.source_platform;
      if (!map.has(key)) map.set(key, { key, name: PLATFORM[key] || key, total: 0, by_state: {}, sources: [] });
      const g = map.get(key);
      g.sources.push(src);
      g.total += src.total;
      for (const [k, v] of Object.entries(src.by_state)) g.by_state[k] = (g.by_state[k] || 0) + v;
    }
    const cmp = { wait: (a, b) => wait(b) - wait(a), total: (a, b) => b.total - a.total, name: (a, b) => (a.name || a.source_name).localeCompare(b.name || b.source_name) }[state.sort];
    const list = [...map.values()].sort(cmp);
    list.forEach((g) => g.sources.sort(cmp));
    return list;
  }

  function scope() {
    const L = lane();
    if (!state.scope) return { name: t('all_sources_head', 'Tất cả nguồn'), total: L.total, by_state: L.by_state };
    const [kind, key] = state.scope;
    const gs = groups();
    if (kind === 'platform') return gs.find((g) => g.key === key) || null;
    for (const g of gs) for (const s of g.sources) if (s.source_name === key) return { name: s.source_name, total: s.total, by_state: s.by_state };
    return null;
  }

  function tree() {
    const isEn = window.XRU_I18N && window.XRU_I18N.getActiveLang() === 'en';
    const recWord = isEn ? 'records' : 'hồ sơ';
    const waitWord = isEn ? 'pending' : 'chờ';
    const q = state.q.toLowerCase();
    const row = (sel, label, count, cls, waiting) =>
      `<div class="side-item ${cls}${JSON.stringify(state.scope) === JSON.stringify(sel) ? ' is-active' : ''}" data-scope='${esc(JSON.stringify(sel))}'>` +
      `<span class="n">${cls.includes('is-group') ? (state.open[sel?.[1]] === false ? '▸' : '▾') : ''}</span>` +
      `<div><div class="t">${esc(label)}</div><div class="s">${n(count)} ${recWord}${waiting ? ` · ${n(waiting)} ${waitWord}` : ''}</div></div></div>`;
    let html = row(null, t('all_sources_head', 'Tất cả nguồn'), lane().total, 'is-all', wait(lane()));
    for (const g of groups()) {
      const hits = g.sources.filter((s) => !q || s.source_name.toLowerCase().includes(q) || g.name.toLowerCase().includes(q));
      if (!hits.length) continue;
      html += row(['platform', g.key], g.name, g.total, 'is-group', wait(g));
      if (state.open[g.key] !== false || q) html += hits.map((s) => row(['source', s.source_name], s.source_name, s.total, 'is-child', wait(s))).join('');
    }
    $('gd-tree').innerHTML = html;
    $('gd-tree').querySelectorAll('[data-scope]').forEach((el) => el.addEventListener('click', (e) => {
      const sel = JSON.parse(el.dataset.scope);
      // Bấm vào mũi tên của nhóm: chỉ đóng/mở; bấm vào tên: chọn phạm vi
      if (sel && sel[0] === 'platform' && e.target.classList.contains('n')) state.open[sel[1]] = state.open[sel[1]] === false;
      else state.scope = sel;
      render();
    }));
  }

  function funnel(sc) {
    const STATES = getStates();
    const cols = STATES.filter(([k]) => k in lane().by_state);
    $('gd-funnel').style.setProperty('--cols', cols.length);
    $('gd-funnel').innerHTML = cols.map(([k, label, sub]) => {
      const v = sc.by_state[k] || 0;
      return `<div class="gd-step${k === 'WAITING_PO' && v ? ' is-wait' : ''}"><span class="gd-label">${label}</span><b>${n(v)}</b>` +
        `<p>${sub}</p><small>${sc.total ? Math.round((v / sc.total) * 100) : 0}%</small></div>`;
    }).join('');
    $('gd-flow').innerHTML = `<span class="gd-label">${esc(sc.name.toUpperCase())} · ${n(sc.total)} ${t('records_lbl', 'HỒ SƠ')} · ${t('funnel_flow_lbl', 'ĐANG NẰM Ở CỬA NÀO')}</span><div>` +
      cols.map(([k]) => `<i class="f-${k}" style="flex:${sc.by_state[k] || 0}"></i>`).join('') + '</div>';
  }

  function machine() {
    const isEn = window.XRU_I18N && window.XRU_I18N.getActiveLang() === 'en';
    const L = lane();
    if (!L.machine) {
      $('gd-machine').innerHTML = `<div class="gd-section-head"><h2>${t('machine_head', 'Máy')}</h2></div>` +
        `<p class="gd-note">${isEn ? 'Gate image/video has no engine scanner yet, and no records have PO decisions. Once metrics arrive, this will appear automatically.' : 'Gate ' + (state.kind === 'image' ? 'ảnh' : 'video') + ' chưa có máy soi, và PO chưa quyết hồ sơ nào. Có số thì phần này tự hiện.'}</p>`;
      return;
    }
    const f = L.machine.findings, o = L.machine.by_outcome, po = L.decisions.PO || {}, marks = L.po_marks || {};
    const sum = (codes) => codes.reduce((a, c) => a + (f[c] || 0), 0);
    const FINDINGS = getFindings();
    const rows = FINDINGS.map(([name, codes]) => [name, sum(codes)]).filter(([, v]) => v);
    const last = L.last_po_decision_at ? new Date(L.last_po_decision_at).toLocaleDateString(isEn ? 'en-US' : 'vi-VN') : '—';
    const strip = (items) => `<div class="gd-strip">${items.map(([l, v]) => `<div><span class="gd-label">${l}</span><b>${n(v)}</b></div>`).join('')}</div>`;
    const laneKindStr = state.kind === 'video' ? 'VIDEO' : (isEn ? 'IMAGE' : 'ẢNH');
    const unsplitStr = state.scope ? ` · ${t('unsplit_source', 'LÕI CHƯA TÁCH THEO NGUỒN')}` : '';

    $('gd-machine').innerHTML = `
      <div class="gd-section-head"><h2>${t('machine_scoring', 'Máy chấm điểm')}</h2><span class="gd-label">${t('entire_lane', 'TOÀN LANE')} ${laneKindStr}${unsplitStr}</span></div>
      <div class="gd-two">
        <div><h3 class="gd-sub">${t('machine_verdict', 'Máy kết luận')}</h3>${strip([[t('mach_detain', 'MÁY GIỮ'), o.DETAIN], [t('mach_flag', 'MÁY CẮM CỜ'), o.FLAG], [t('mach_keep', 'MÁY CHO GIỮ LẠI'), o.KEEP], [t('mach_none', 'KHÔNG THẤY GÌ'), o.NONE]])}</div>
        <div><h3 class="gd-sub">${t('po_decisions_head', 'PO đã bấm (số lượt, kể cả bấm lại)')} · ${t('po_last_decision', 'lần cuối')} ${last}</h3>${strip([['ACCEPT', (po.ACCEPT || 0) + (po.RESCUE_ACCEPT || 0)], ['DETAIN', (po.DETAIN || 0) + (po.DETAIN_ACCEPT || 0)], [t('po_rescue', 'CỨU LẠI'), po.RESCUE], [t('po_keep_dup', 'GIỮ BẢN TRÙNG'), po.KEEP_DUPLICATE]])}</div>
      </div>
      <p class="gd-marks">${t('po_marks', 'PO đánh dấu')}: note <b>${n(marks.note)}</b> · noise <b>${n(marks.noise)}</b> · watermark <b>${n(marks.watermark)}</b></p>
      <table class="gd-score">
        <thead><tr><th>${t('th_flag_type', 'LOẠI CỜ')}</th><th>${t('th_detected', 'MÁY BẮT')}</th><th>${t('th_correct', 'ĐÚNG')}</th><th>${t('th_false_pos', 'BẮT LỘN')}</th><th>${t('th_missed', 'HỤT')}</th>
          <th title="${isEn ? 'Precision' : 'Trong số máy bắt, bao nhiêu là lỗi thật'}">${t('th_precision', 'BẮT TRÚNG')}</th><th title="${isEn ? 'Recall' : 'Trong số lỗi thật, máy bắt được bao nhiêu'}">${t('th_recall', 'BẮT ĐỦ')}</th></tr></thead>
        <tbody>${rows.map(([name, v]) => `<tr><td>${name}</td><td>${n(v)}</td>${'<td class="is-pending">—</td>'.repeat(5)}</tr>`).join('')}</tbody>
      </table>
      <p class="gd-note">${isEn ? '<b>Correct · False Positive · Missed</b> are currently blank: Gate core currently tracks "engine flagged" and "PO decisions" independently without mapping pairs per record. When available, these columns will populate automatically. <b>Precision</b> = ratio of accurate flags, <b>Recall</b> = ratio of detected defects.' : '<b>Đúng · Bắt lộn · Hụt</b> đang để trống: lõi Gate mới đếm riêng "máy bắt" và "PO quyết", chưa ghép trên từng hồ sơ. Khi lõi xuất được cặp đó (theo loại cờ và theo nguồn), các cột này tự có số. <b>Bắt trúng</b> = máy cắm cờ thì đúng mấy phần, <b>Bắt đủ</b> = lỗi thật thì máy thấy mấy phần.'}</p>`;
  }

  function render() {
    const isEn = window.XRU_I18N && window.XRU_I18N.getActiveLang() === 'en';
    document.querySelectorAll('[data-kind]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.kind === state.kind)));
    let sc = scope();
    if (!sc) { state.scope = null; sc = scope(); }
    tree();
    $('gd-count').textContent = n(sc.total);
    $('gd-count-label').textContent = state.kind === 'video' ? t('records_video', 'HỒ SƠ VIDEO') : t('records_image', 'HỒ SƠ ẢNH');
    $('gd-scope').textContent = sc.name.toUpperCase();
    if (SNAP) {
      $('gd-taken').textContent = `${t('snapshot_at', 'Số chụp lúc')} ${new Date(SNAP.taken_at).toLocaleString(isEn ? 'en-US' : 'vi-VN')}`;
    }
    funnel(sc);
    machine();
  }

  if (!SNAP) {
    document.querySelector('.gd-stage').insertAdjacentHTML('afterbegin', '<p class="gd-note">Chưa có data/gate_snapshot.js — chạy: python3 tools/gate_snapshot.py</p>');
    return;
  }
  document.querySelectorAll('[data-kind]').forEach((b) => b.addEventListener('click', () => { Object.assign(state, { kind: b.dataset.kind, scope: null }); render(); }));
  $('gd-sort').addEventListener('change', (e) => { state.sort = e.target.value; render(); });
  $('gd-q').addEventListener('input', (e) => { state.q = e.target.value.trim(); tree(); });
  $('gd-q').addEventListener('keydown', (e) => e.stopPropagation());
  window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() !== 'v' || ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
    Object.assign(state, { kind: state.kind === 'video' ? 'image' : 'video', scope: null });
    render();
  });

  window.addEventListener('xru-lang-applied', render);
  render();
})();
