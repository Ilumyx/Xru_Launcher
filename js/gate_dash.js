// XRU GATE DASH — số thật từ data/gate_snapshot.js (tools/gate_snapshot.py chụp từ lệnh `stats` của Gate).
// Câu hỏi chính khi thêm nguồn hàng loạt: nguồn nào mang về đồ sạch, nguồn nào toàn rác?
//   Độ sạch (ở sidebar) = trong số hồ sơ PO đã quyết, bao nhiêu % được Accept.
// Sidebar: lọc nền tảng, sắp theo độ sạch / hàng chờ / số hồ sơ / tên; cây tất cả → nền tảng → kênh. Chọn đâu, cả trang tính theo đó.
// Phần máy: lõi mới cho số toàn lane; máy đúng hay sai cần lõi ghép "máy nói × PO quyết" theo từng hồ sơ.
(() => {
  const SNAP = window.GATE_SNAPSHOT;
  const $ = (id) => document.getElementById(id);
  const n = (v) => (v === null || v === undefined ? '—' : v.toLocaleString('en-US'));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const t = (k) => (window.XRU_I18N ? window.XRU_I18N.t(k) : k);
  // Nền tảng có trong ô chọn Platform (kể cả chưa có nguồn nào, để thấy sẵn chỗ khi thêm nguồn hàng loạt)
  const PLATFORM = { dvids: 'DVIDS', facebook: 'Facebook', reddit: 'Reddit', x: 'X', rss: 'RSS', telegram: 'Telegram', waralbum: 'War Album' };
  const MIN_DECIDED = 20; // dưới số này thì % sạch chưa đáng tin → xếp cuối, ghi "ít mẫu"

  const STATES = [
    ['WAITING_PO', 'WAIT', 'waiting_po'],
    ['MACHINE_FLAGGED', 'MACHINE FLAG', 'machine_flag_sub'],
    ['DETAINED', 'DETAIN', 'detained'],
    ['ACCEPT_APPROVED', 'ACCEPT', 'cleared_sub'],
    ['PURGE_APPROVED', 'PURGE', 'purged_sub'],
  ];
  const FINDINGS = [
    ['finding_music', ['MUSIC']],
    ['finding_dup', ['DUPLICATE', 'DUPLICATE_CANDIDATE']],
    ['finding_wm', ['WATERMARK', 'TEXT_WATERMARK']],
    ['finding_text', ['TEXT']],
    ['finding_err', ['AUDIO_ERROR', 'TEXT_WATERMARK_ERROR']],
    ['finding_untagged', ['UNTAGGED']],
  ];

  const state = { kind: 'video', scope: null, platform: 'all', q: '', sort: 'clean_low', open: {} };
  const lane = () => SNAP[state.kind];
  const wait = (s) => s.by_state.WAITING_PO || 0;
  // Độ sạch của một nhóm hồ sơ: accept / (accept + detain + purge)
  function clean(s) {
    const b = s.by_state, ok = b.ACCEPT_APPROVED || 0;
    const decided = ok + (b.DETAINED || 0) + (b.PURGE_APPROVED || 0);
    return { ok, decided, pct: decided ? Math.round((ok / decided) * 100) : null, solid: decided >= MIN_DECIDED };
  }
  const label = (s) => s.name || s.source_name;

  function sorter() {
    const byClean = (dir) => (a, b) => {
      const A = clean(a), B = clean(b);
      if (A.solid !== B.solid) return A.solid ? -1 : 1; // đủ mẫu lên trước
      return dir * ((A.pct ?? -1) - (B.pct ?? -1)) || wait(b) - wait(a);
    };
    return {
      clean_low: byClean(1), clean_high: byClean(-1),
      wait: (a, b) => wait(b) - wait(a), total: (a, b) => b.total - a.total,
      name: (a, b) => label(a).localeCompare(label(b)),
    }[state.sort];
  }

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
    const cmp = sorter();
    const list = [...map.values()].sort(cmp);
    list.forEach((g) => g.sources.sort(cmp));
    return list;
  }

  // Phạm vi đang chọn: tất cả / một nền tảng / một kênh
  function scope() {
    const L = lane(), gs = groups();
    if (!state.scope) return { name: t('all_sources_head'), total: L.total, by_state: L.by_state };
    const [kind, key] = state.scope;
    if (kind === 'platform') return gs.find((x) => x.key === key) || { name: PLATFORM[key] || key, total: 0, by_state: {} };
    for (const g of gs) for (const s of g.sources) if (s.source_name === key) return { name: s.source_name, total: s.total, by_state: s.by_state };
    return null;
  }

  function sub(s) {
    const c = clean(s), w = wait(s);
    const head = c.pct === null ? t('gd_not_reviewed') : `${c.pct}% ${t('gd_clean_word')}${c.solid ? '' : ` · ${t('gd_few')}`}`;
    return `${head}${w ? ` · ${n(w)} ${t('waiting_count')}` : ''}`;
  }
  const meter = (s) => {
    const c = clean(s);
    return c.pct === null ? '' : `<i class="gd-mini${c.solid ? '' : ' is-thin'}"><s style="width:${c.pct}%"></s></i>`;
  };

  function tree() {
    const q = state.q.toLowerCase();
    const row = (sel, name, s, cls) =>
      `<div class="side-item ${cls}${JSON.stringify(state.scope) === JSON.stringify(sel) ? ' is-active' : ''}" data-scope='${esc(JSON.stringify(sel))}'>` +
      `<span class="n">${cls.includes('is-group') ? (state.open[sel?.[1]] === false ? '▸' : '▾') : ''}</span>` +
      `<div><div class="t">${esc(name)}</div><div class="s">${sub(s)}</div>${meter(s)}</div></div>`;
    let html = row(null, t('all_sources_head'), lane(), 'is-all');
    for (const g of groups()) {
      if (state.platform !== 'all' && g.key !== state.platform) continue;
      const hits = g.sources.filter((s) => !q || s.source_name.toLowerCase().includes(q) || g.name.toLowerCase().includes(q));
      if (!hits.length) continue;
      html += row(['platform', g.key], g.name, g, 'is-group');
      if (state.open[g.key] !== false || q) html += hits.map((s) => row(['source', s.source_name], s.source_name, s, 'is-child')).join('');
    }
    $('gd-tree').innerHTML = html;
    $('gd-tree').querySelectorAll('[data-scope]').forEach((el) => el.addEventListener('click', (e) => {
      const sel = JSON.parse(el.dataset.scope);
      // Bấm vào mũi tên của nhóm: chỉ đóng/mở; bấm vào tên: chọn phạm vi
      if (sel && sel[0] === 'platform' && e.target.classList.contains('n')) state.open[sel[1]] = state.open[sel[1]] === false;
      else {
        state.scope = sel;
        if (!sel) state.platform = 'all'; // bấm "Tất cả nguồn" thì bỏ lọc nền tảng
        else if (sel[0] === 'platform') state.platform = sel[1];
      }
      render();
    }));
  }

  // Ô chọn Platform: mọi nền tảng đã biết + nền tảng mới xuất hiện trong số liệu, kèm số hồ sơ
  function platformSelect() {
    const count = Object.fromEntries(groups().map((g) => [g.key, g.total]));
    const keys = [...new Set([...Object.keys(PLATFORM), ...Object.keys(count)])];
    $('gd-platform').innerHTML = `<option value="all">${t('all_platforms')} (${n(lane().total)})</option>` +
      keys.map((k) => `<option value="${k}"${count[k] ? '' : ' disabled'}>${esc(PLATFORM[k] || k)} (${n(count[k] || 0)})</option>`).join('');
    $('gd-platform').value = state.platform;
  }

  function funnel(sc) {
    const cols = STATES.filter(([k]) => k in lane().by_state);
    $('gd-funnel').style.setProperty('--cols', cols.length);
    $('gd-funnel').innerHTML = cols.map(([k, name, subKey]) => {
      const v = sc.by_state[k] || 0;
      return `<div class="gd-step${k === 'WAITING_PO' && v ? ' is-wait' : ''}"><span class="gd-label">${name}</span><b>${n(v)}</b>` +
        `<p>${t(subKey)}</p><small>${sc.total ? Math.round((v / sc.total) * 100) : 0}%</small></div>`;
    }).join('');
    $('gd-flow').innerHTML = `<span class="gd-label">${esc(sc.name.toUpperCase())} · ${n(sc.total)} ${t('records_lbl')} · ${t('funnel_flow_lbl')}</span><div>` +
      cols.map(([k]) => `<i class="f-${k}" style="flex:${sc.by_state[k] || 0}"></i>`).join('') + '</div>';
  }

  // Máy: soi bao nhiêu, thấy vấn đề ở bao nhiêu, theo loại. Đúng/sai: chờ lõi.
  function machine() {
    const L = lane();
    if (!L.machine) {
      $('gd-machine').innerHTML = `<div class="gd-section-head"><h2>${t('gd_machine_head')}</h2></div><p class="gd-note">${t('gd_no_machine')}</p>`;
      return;
    }
    const f = L.machine.findings, o = L.machine.by_outcome;
    const scanned = Object.values(o).reduce((a, v) => a + v, 0), none = o.NONE || 0, hit = scanned - none;
    const rows = FINDINGS.map(([k, codes]) => [t(k), codes.reduce((a, c) => a + (f[c] || 0), 0)]).filter(([, v]) => v);
    const top = Math.max(...rows.map(([, v]) => v));
    $('gd-machine').innerHTML = `
      <div class="gd-section-head"><h2>${t('gd_machine_head')}</h2><span class="gd-label">${t('entire_lane')} ${state.kind === 'video' ? 'VIDEO' : t('kind_image').toUpperCase()}${state.scope ? ` · ${t('unsplit_source')}` : ''}</span></div>
      <p class="gd-machine-line">${t('gd_scanned')} <b>${n(scanned)}</b> · ${t('gd_found_issue')} <b>${n(hit)}</b> (${Math.round((hit / scanned) * 100)}%) · ${t('mach_none').toLowerCase()} <b>${n(none)}</b></p>
      <div class="gd-findings">${rows.map(([name, v]) => `<div><span>${name}</span><i><s style="width:${(v / top) * 100}%"></s></i><b>${n(v)}</b></div>`).join('')}</div>
      <p class="gd-note">${t('gd_machine_wait_core')}</p>`;
  }

  function render() {
    document.querySelectorAll('[data-kind]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.kind === state.kind)));
    let sc = scope();
    if (!sc) { state.scope = null; sc = scope(); }
    platformSelect();
    tree();
    $('gd-count').textContent = n(sc.total);
    $('gd-count-label').textContent = state.kind === 'video' ? t('records_video') : t('records_image');
    $('gd-scope').textContent = sc.name.toUpperCase();
    $('gd-taken').textContent = `${t('snapshot_at')} ${new Date(SNAP.taken_at).toLocaleString(document.documentElement.lang === 'en' ? 'en-US' : 'vi-VN')}`;
    funnel(sc);
    machine();
  }

  if (!SNAP) {
    document.querySelector('.gd-stage').insertAdjacentHTML('afterbegin', '<p class="gd-note">data/gate_snapshot.js missing — run: python3 tools/gate_snapshot.py</p>');
    return;
  }
  document.querySelectorAll('[data-kind]').forEach((b) => b.addEventListener('click', () => { Object.assign(state, { kind: b.dataset.kind, scope: null, platform: 'all' }); render(); }));
  $('gd-sort').value = state.sort;
  $('gd-platform').addEventListener('change', (e) => {
    state.platform = e.target.value;
    state.scope = state.platform === 'all' ? null : ['platform', state.platform];
    render();
  });
  $('gd-sort').addEventListener('change', (e) => { state.sort = e.target.value; render(); });
  $('gd-q').addEventListener('input', (e) => { state.q = e.target.value.trim(); tree(); });
  $('gd-q').addEventListener('keydown', (e) => e.stopPropagation());
  window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() !== 'v' || ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
    Object.assign(state, { kind: state.kind === 'video' ? 'image' : 'video', scope: null, platform: 'all' });
    render();
  });
  window.addEventListener('xru-lang-applied', render);
  render();
})();
