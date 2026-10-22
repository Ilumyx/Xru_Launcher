// Tường ô nhỏ chung (kit/wall/wall.css). Màn tự đọc Backend; tường chỉ vẽ ô của một trang, đánh dấu ô đang chọn,
// lật trang, và (tuỳ màn) rê chuột chờ một nhịp mới phát video không tiếng trong ô.
//   const wall = XRU_WALL({ grid, pager, next, size, thumb(item), media?(item), end?(item), onSelect(index, double), onPage(page) });
//   wall.render(items, offset, total) · wall.active(id) · wall.columns()
window.XRU_WALL = (o) => {
  const t = (key) => (window.XRU_I18N ? window.XRU_I18N.t(key) : key);
  const n = (v) => Number(v).toLocaleString('en-US');
  let offset = 0, total = 0, timer = 0;
  const preview = document.createElement('video');
  Object.assign(preview, { muted: true, loop: true, playsInline: true });
  preview.setAttribute('aria-hidden', 'true');

  function badge(tile, kind, text) { const b = document.createElement('span'); b.className = 'wall-badge ' + kind; b.textContent = text; tile.append(b); }
  function tile(item, index) {
    const a = document.createElement('a');
    a.className = 'wall-tile'; a.href = '#'; a.dataset.id = item.xru_id;
    const img = new Image(); img.loading = 'lazy'; img.decoding = 'async'; img.alt = ''; img.src = o.thumb(item);
    a.append(img);
    badge(a, 'is-num', String(offset + index + 1).padStart(3, '0'));
    const end = o.end && o.end(item); if (end) badge(a, 'is-end', end);
    a.addEventListener('click', (e) => { if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return; e.preventDefault(); o.onSelect(index, e.detail === 2); });
    if (o.media) {
      // Một video xem trước cho cả tường: rê chuột ở yên 300ms mới tải, rời chuột thì trả bộ giải mã.
      a.addEventListener('pointerenter', () => { clearTimeout(timer); timer = setTimeout(() => { preview.src = o.media(item); a.append(preview); preview.play().catch(() => {}); }, 300); });
      a.addEventListener('pointerleave', () => { clearTimeout(timer); if (preview.parentNode === a) stop(); });
    }
    return a;
  }
  function stop() { preview.pause(); preview.removeAttribute('src'); preview.load(); preview.remove(); }
  const pages = () => Math.max(1, Math.ceil(total / o.size));
  const page = () => Math.floor(offset / o.size) + 1;
  function button(label, title, to, disabled) {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = label; b.title = title; b.disabled = disabled;
    b.addEventListener('click', () => o.onPage(to)); return b;
  }
  function paintPager() {
    if (o.pager) {
      const span = document.createElement('span');
      span.innerHTML = total ? `${t('wall_page')} <b>${page()}/${pages()}</b> · ${n(offset + 1)}–${n(Math.min(total, offset + o.size))} / ${n(total)}` : '0';
      o.pager.replaceChildren(button('‹', t('wall_prev'), page() - 1, page() <= 1), span, button('›', t('wall_next'), page() + 1, page() >= pages()));
    }
    if (o.next) o.next.replaceChildren(...(page() < pages() ? [button(t('wall_next'), '', page() + 1, false)] : []));
  }
  return {
    render(items, at, count) {
      const turned = at !== offset; offset = at; total = count;
      clearTimeout(timer); stop();
      o.grid.replaceChildren(...items.map(tile));
      paintPager();
      if (turned) o.grid.closest('.ws-main')?.scrollTo({ top: 0 });
    },
    active(id) {
      for (const node of o.grid.children) node.classList.toggle('is-active', node.dataset.id === id);
      o.grid.querySelector('.is-active')?.scrollIntoView({ block: 'nearest' });
    },
    columns() {
      const first = o.grid.firstElementChild; if (!first) return 1;
      return [...o.grid.children].filter((node) => node.offsetTop === first.offsetTop).length;
    },
  };
};
