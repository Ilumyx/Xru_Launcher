// Nhóm lọc bấm thẳng ở sidebar (kit/sidebar/sidebar.css: .side-filters, .side-sect, .side-item.is-filter). PO 23/10.
//   const filters = XRU_FILTERS(el, pick);   pick(change): màn gán change ({reason} / {platform, source} / {sort}) vào bộ lọc rồi đọc lại.
//   filters.render([{ key, title, rows: [{ pick, name, total?, on, all? }] }, { key, title, tree: { all, total, sources, platform, source } }])
//   Bấm tiêu đề nhóm để gập (nhớ trong trình duyệt, gập rồi vẫn ghi lựa chọn đang bật). Cây nguồn: nền tảng → kênh, bấm mũi tên mở/đóng kênh.
window.XRU_FILTERS = (el, pick) => {
  const PLATFORM = { dvids: 'DVIDS', facebook: 'Facebook', reddit: 'Reddit', x: 'X', rss: 'RSS', telegram: 'Telegram', waralbum: 'War Album' };
  const FOLD = 'xru-side-folds';
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const n = (v) => Number(v).toLocaleString('en-US');
  let folded, last = [], first = true;
  try { folded = new Set(JSON.parse(localStorage.getItem(FOLD) || '[]')); } catch { folded = new Set(); }
  const opened = new Set();

  const row = (p, name, total, cls, on, caret = '') =>
    `<div class="side-item is-filter ${cls}${on ? ' is-active' : ''}" data-pick="${esc(JSON.stringify(p))}">` +
    `<span class="n">${caret}</span><div class="t">${esc(name)}</div><span class="c">${total == null ? '' : n(total)}</span></div>`;
  // Cây nguồn: nhiều món đứng trước, bằng nhau thì theo tên.
  function tree(t) {
    const groups = new Map();
    for (const s of t.sources) {
      if (!groups.has(s.source_platform)) groups.set(s.source_platform, { key: s.source_platform, total: 0, sources: [] });
      const g = groups.get(s.source_platform); g.total += s.total; g.sources.push(s);
    }
    const most = (a, b) => b.total - a.total || String(a.key ?? a.source_name).localeCompare(String(b.key ?? b.source_name));
    let html = row({ platform: '', source: '' }, t.all, t.total, 'is-all', !t.platform && !t.source), active = t.all;
    for (const g of [...groups.values()].sort(most)) {
      const name = PLATFORM[g.key] || g.key, open = opened.has(g.key);
      if (t.platform === g.key && !t.source) active = name;
      html += row({ platform: g.key, source: '' }, name, g.total, 'is-group', t.platform === g.key && !t.source, open ? '▾' : '▸');
      for (const s of g.sources.sort(most)) {
        const id = g.key + ':' + (s.source_name || ''), label = s.source_name || name;
        if (t.source === id) active = label;
        if (open) html += row({ platform: g.key, source: id }, label, s.total, 'is-child', t.source === id);
      }
    }
    return { html, active };
  }
  function render(sections) {
    last = sections;
    if (first) { first = false; for (const s of sections) if (s.tree?.platform) opened.add(s.tree.platform); }
    el.innerHTML = sections.map((s) => {
      const body = s.rows ? { html: s.rows.map((r) => row(r.pick, r.name, r.total, r.all ? 'is-all' : '', r.on)).join(''), active: s.rows.find((r) => r.on)?.name } : tree(s.tree);
      const shut = folded.has(s.key);
      return `<div class="side-sect${shut ? ' is-folded' : ''}" data-fold="${esc(s.key)}"><span class="side-fold">${shut ? '▸' : '▾'}</span>${esc(s.title)}` +
        `${shut && body.active ? `<em>${esc(body.active)}</em>` : ''}</div>${shut ? '' : body.html}`;
    }).join('');
  }
  el.addEventListener('click', (e) => {
    const fold = e.target.closest('[data-fold]');
    if (fold) {
      const key = fold.dataset.fold; folded.has(key) ? folded.delete(key) : folded.add(key);
      try { localStorage.setItem(FOLD, JSON.stringify([...folded])); } catch { /* vẫn gập được trong phiên */ }
      render(last); return;
    }
    const r = e.target.closest('[data-pick]'); if (!r) return;
    const p = JSON.parse(r.dataset.pick);
    if (r.classList.contains('is-group') && e.target.classList.contains('n')) { opened.has(p.platform) ? opened.delete(p.platform) : opened.add(p.platform); render(last); return; }
    if (p.platform) opened.add(p.platform);
    pick(p);
  });
  return { render };
};
