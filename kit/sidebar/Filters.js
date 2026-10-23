// Nhóm lọc bấm thẳng ở sidebar (kit/sidebar/sidebar.css: .side-filters, .side-sect, .side-item.is-filter), bản Preact.
//   h(Filters, { sections, onPick(change) })
//   sections: [{ key, title, rows: [{ pick, name, total?, on, all? }] } | { key, title, tree: { all, total, sources, platform, source } }]
//   Bấm tiêu đề nhóm để gập (nhớ trong trình duyệt, gập rồi vẫn ghi lựa chọn đang bật). Cây nguồn: nền tảng → kênh, bấm mũi tên mở/đóng kênh.
import { h } from 'preact';
import { useState } from 'preact/hooks';

const PLATFORM = { dvids: 'DVIDS', facebook: 'Facebook', reddit: 'Reddit', x: 'X', rss: 'RSS', telegram: 'Telegram', waralbum: 'War Album' };
const FOLD = 'xru-side-folds';
const n = (v) => Number(v).toLocaleString('en-US');
function readFolds() { try { return new Set(JSON.parse(localStorage.getItem(FOLD) || '[]')); } catch { return new Set(); } }

function Row({ cls = '', on, name, total, caret = '', onPick, onCaret }) {
  return h('div', { class: `side-item is-filter ${cls}${on ? ' is-active' : ''}`, onClick: onPick },
    h('span', { class: 'n', onClick: onCaret ? (e) => { e.stopPropagation(); onCaret(); } : null }, caret),
    h('div', { class: 't' }, name),
    h('span', { class: 'c' }, total == null ? '' : n(total)));
}

// Cây nguồn: nhiều món đứng trước, bằng nhau thì theo tên.
function tree(t, opened, toggle, onPick) {
  const groups = new Map();
  for (const s of t.sources) {
    if (!groups.has(s.source_platform)) groups.set(s.source_platform, { key: s.source_platform, total: 0, sources: [] });
    const g = groups.get(s.source_platform); g.total += s.total; g.sources.push(s);
  }
  const most = (a, b) => b.total - a.total || String(a.key ?? a.source_name).localeCompare(String(b.key ?? b.source_name));
  const rows = [h(Row, { key: '*', cls: 'is-all', on: !t.platform && !t.source, name: t.all, total: t.total, onPick: () => onPick({ platform: '', source: '' }) })];
  let active = t.all;
  for (const g of [...groups.values()].sort(most)) {
    const name = PLATFORM[g.key] || g.key, open = opened.has(g.key);
    if (t.platform === g.key && !t.source) active = name;
    rows.push(h(Row, { key: g.key, cls: 'is-group', on: t.platform === g.key && !t.source, name, total: g.total, caret: open ? '▾' : '▸',
      onPick: () => { if (!open) toggle(g.key); onPick({ platform: g.key, source: '' }); }, onCaret: () => toggle(g.key) }));
    for (const s of g.sources.sort(most)) {
      const id = g.key + ':' + (s.source_name || ''), label = s.source_name || name;
      if (t.source === id) active = label;
      if (open) rows.push(h(Row, { key: id, cls: 'is-child', on: t.source === id, name: label, total: s.total, onPick: () => onPick({ platform: g.key, source: id }) }));
    }
  }
  return { rows, active };
}

export function Filters({ id, sections, onPick }) {
  const [folded, setFolded] = useState(readFolds);
  const [opened, setOpened] = useState(() => new Set(sections.map((s) => s.tree?.platform).filter(Boolean)));
  const fold = (key) => {
    const next = new Set(folded); next.has(key) ? next.delete(key) : next.add(key); setFolded(next);
    try { localStorage.setItem(FOLD, JSON.stringify([...next])); } catch { /* vẫn gập được trong phiên */ }
  };
  const toggle = (key) => { const next = new Set(opened); next.has(key) ? next.delete(key) : next.add(key); setOpened(next); };
  return h('div', { id, class: 'side-filters' }, sections.map((s) => {
    const body = s.rows
      ? { rows: s.rows.map((r, i) => h(Row, { key: i, cls: r.all ? 'is-all' : '', on: r.on, name: r.name, total: r.total, onPick: () => onPick(r.pick) })), active: s.rows.find((r) => r.on)?.name }
      : tree(s.tree, opened, toggle, onPick);
    const shut = folded.has(s.key);
    return [
      h('div', { key: s.key, class: 'side-sect' + (shut ? ' is-folded' : ''), onClick: () => fold(s.key) },
        h('span', { class: 'side-fold' }, shut ? '▸' : '▾'), s.title, shut && body.active ? h('em', null, body.active) : null),
      shut ? null : body.rows,
    ];
  }));
}
