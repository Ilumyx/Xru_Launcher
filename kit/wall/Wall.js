// Tường ô nhỏ chung (kit/wall/wall.css), bản Preact: màn đưa danh sách món, tường vẽ ô theo id.
// Món nào còn thì ô đó giữ nguyên (ảnh không nạp lại), chỉ dời chỗ và đánh số lại.
//   h(Wall, { id, style, hidden, items, offset, activeId, sizes, thumb(item, width), media?(item), end?(item), tags?(item), onSelect(item, double) })
//   h(WallPager, { offset, total, size, onPage(page) })  — ô lật trang ở chân sidebar
//   h(WallNext, { offset, total, size, onPage(page) })   — nút "Trang sau" ở cuối tường
import { h } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';

const t = (key) => (window.XRU_I18N ? window.XRU_I18N.t(key) : key);
const n = (v) => Number(v).toLocaleString('en-US');

// Một video xem trước cho cả tường: rê chuột ở yên 300ms mới tải, rời chuột thì gỡ và trả bộ giải mã.
function Preview({ src }) {
  const ref = useRef();
  useEffect(() => {
    const v = ref.current; v.muted = true; v.play().catch(() => {});
    return () => { v.pause(); v.removeAttribute('src'); v.load(); };
  }, [src]);
  return h('video', { ref, src, loop: true, playsInline: true, 'aria-hidden': 'true' });
}

function Tile({ item, number, active, sizes, thumb, end, tags, preview, onSelect, onHover }) {
  const marks = tags ? tags(item) : [];
  return h('a', {
    class: 'wall-tile' + (active ? ' is-active' : ''), href: '#', 'data-id': item.xru_id,
    onClick: (e) => { if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return; e.preventDefault(); onSelect(item, e.detail === 2); },
    onPointerEnter: () => onHover(item), onPointerLeave: () => onHover(null),
  },
  h('img', { loading: 'lazy', decoding: 'async', alt: '', sizes, srcset: `${thumb(item, 240)} 240w, ${thumb(item, 480)} 480w`, src: thumb(item, 240) }),
  h('span', { class: 'wall-badge is-num' }, String(number).padStart(3, '0')),
  end && end(item) ? h('span', { class: 'wall-badge is-end' }, end(item)) : null,
  marks.length ? h('span', { class: 'wall-tags' }, marks.map((m) => h('span', { key: m, class: 'wall-badge is-tag' }, m))) : null,
  preview ? h(Preview, { src: preview }) : null);
}

export function Wall({ id, style, hidden, items, offset, activeId, sizes = '120px', thumb, media, end, tags, onSelect }) {
  const grid = useRef(), timer = useRef(0), [hover, setHover] = useState(null);
  // Lật trang thì về đầu tường; đổi ô đang chọn thì kéo ô vào tầm nhìn.
  useEffect(() => { grid.current.closest('.ws-main')?.scrollTo({ top: 0 }); }, [offset]);
  useEffect(() => { grid.current.querySelector('.is-active')?.scrollIntoView({ block: 'nearest' }); }, [activeId]);
  useEffect(() => () => clearTimeout(timer.current), []);
  const onHover = (item) => {
    clearTimeout(timer.current);
    if (!item || !media) { setHover(null); return; }
    timer.current = setTimeout(() => setHover(item.xru_id), 300);
  };
  return h('div', { id, class: 'wall', style, hidden, ref: grid }, items.map((item, index) => h(Tile, {
    key: item.xru_id, item, number: offset + index + 1, active: item.xru_id === activeId, sizes, thumb, end, tags,
    preview: hover === item.xru_id ? media(item) : null, onSelect, onHover,
  })));
}

const pages = (total, size) => Math.max(1, Math.ceil(total / size));
const pageOf = (offset, size) => Math.floor(offset / size) + 1;

export function WallPager({ id, offset, total, size, onPage }) {
  const at = pageOf(offset, size), last = pages(total, size);
  return h('div', { id, class: 'side-pager wall-pager' },
    h('button', { type: 'button', title: t('wall_prev'), disabled: at <= 1, onClick: () => onPage(at - 1) }, '‹'),
    total ? h('span', null, h('b', null, `${at}/${last}`), ` · ${n(offset + 1)}–${n(Math.min(total, offset + size))} / ${n(total)}`) : h('span', null, '0'),
    h('button', { type: 'button', title: t('wall_next'), disabled: at >= last, onClick: () => onPage(at + 1) }, '›'));
}

export function WallNext({ id, hidden, offset, total, size, onPage }) {
  const at = pageOf(offset, size);
  return h('div', { id, class: 'wall-next', hidden }, at < pages(total, size) ? h('button', { type: 'button', onClick: () => onPage(at + 1) }, t('wall_next')) : null);
}
