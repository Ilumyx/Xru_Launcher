"use strict";
/* Label video: chỉ gọi Backend Label qua HTTP. Mọi số và nhãn lấy từ Backend; lưu xong mới vẽ lại. */
(() => {
  const $ = (id) => document.getElementById(id);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const t = (key) => window.XRU_I18N.t(key);
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = (n) => String(n).padStart(2, '0');
  const sec = (ms) => (ms / 1000).toFixed(1) + 's';
  const CELLS = ['tag', 'sub', 'var', 'actions', 'framing', 'palette'];

  const params = new URLSearchParams(location.search);
  const view = { status: params.get('status') || 'all', after: params.get('after') || '', before: params.get('before') || '', id: params.get('id') || '' };
  let backend = '', page = null, item = null, current = 0, editing = null, down = false, opening = 0;
  const selectedFrames = new Map();

  /* ---------- Gọi Backend ---------- */
  async function api(path, options = {}) {
    const response = await fetch(backend + path, { cache: 'no-store', signal: AbortSignal.timeout(20000), ...options });
    const data = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
    if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
    return data;
  }
  const post = (path, body) => api(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

  let bannerTimer;
  function say(text, kind = 'ok', stay = false) {
    const banner = $('banner');
    clearTimeout(bannerTimer);
    banner.textContent = text;
    banner.className = 'lb-banner' + (kind === 'error' ? ' error' : '');
    banner.hidden = !text;
    if (text && !stay) bannerTimer = setTimeout(() => { banner.hidden = true; }, kind === 'error' ? 4000 : 1400);
  }

  function syncUrl() {
    const q = new URLSearchParams();
    if (view.status !== 'all') q.set('status', view.status);
    if (view.after) q.set('after', view.after);
    if (view.before) q.set('before', view.before);
    if (item) q.set('id', item.xru_id);
    history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : ''));
  }

  /* ---------- Hàng chờ ---------- */
  function stateOf(row) {
    if (row.broken) return ['broken', 'lb_broken'];
    if (row.published) return ['done', 'lb_published'];
    if (row.complete) return ['done', 'lb_complete'];
    if (row.started) return ['doing', 'lb_in_progress'];
    return ['', 'lb_not_started'];
  }

  async function loadQueue({ keepItem = false } = {}) {
    const q = new URLSearchParams({ status: view.status });
    if (view.after) q.set('after', view.after);
    if (view.before) q.set('before', view.before);
    page = await api('/api/queue?' + q);
    paintQueue();
    if (keepItem && item) return;
    const usable = page.items.filter((row) => !row.broken);
    const wanted = usable.find((row) => row.xru_id === (item?.xru_id || view.id)) || usable[0];
    if (wanted) await openItem(wanted.xru_id);
    else showEmpty();
  }

  function paintQueue() {
    for (const status of ['all', 'todo', 'done']) $('count-' + status).textContent = page.counts[status].toLocaleString('en-US');
    $$('.lb-tab').forEach((tab) => tab.classList.toggle('is-active', tab.dataset.status === view.status));
    $('queue-count').textContent = page.counts[view.status].toLocaleString('en-US');
    $('queue-label').textContent = t('lb_' + view.status);
    $('page-prev').disabled = !page.previous;
    $('page-next').disabled = !page.next;
    $('page-range').textContent = page.items.length ? `${page.items.length} / page` : '';
    const list = $('queue-list');
    if (!page.items.length) { list.innerHTML = `<div class="side-empty">${esc(t('lb_empty'))}</div>`; return; }
    list.innerHTML = page.items.map((row, i) => {
      const [kind, key] = stateOf(row);
      if (row.broken) {
        return `<div class="side-item is-broken" title="${esc(row.xru_id)}"><span class="n">${pad(i + 1)}</span><div><div class="t">${esc(row.xru_id.slice(-12))}</div><div class="s"><span>${esc(row.broken)}</span><span class="q-state broken">${esc(t(key))}</span></div></div></div>`;
      }
      const pct = row.segment_count ? Math.floor(row.answered * 100 / row.segment_count) : 0;
      return `<a class="side-item${item && item.xru_id === row.xru_id ? ' is-active' : ''}" href="?id=${encodeURIComponent(row.xru_id)}" data-id="${esc(row.xru_id)}" title="${esc(row.xru_id)}">
        <span class="n">${pad(i + 1)}</span>
        <div><div class="t">${esc(row.title || '(no title)')}</div>
        <div class="s"><span>${esc(row.source_name)} · ${row.answered}/${row.segment_count}${row.claimed_by && !row.published ? ' · ' + esc(row.claimed_by) : ''}</span><span class="q-state ${kind}">${esc(t(key))}</span></div></div>
        <span class="q-bar" style="--v:${pct}%"></span></a>`;
    }).join('');
  }

  function markActive() {
    $$('#queue-list .side-item').forEach((row) => row.classList.toggle('is-active', !!item && row.dataset.id === item.xru_id));
    const active = document.querySelector('#queue-list .side-item.is-active');
    if (active) active.scrollIntoView({ block: 'nearest' });
  }

  function showEmpty() {
    item = null;
    $('work').hidden = true;
    $('dossier').hidden = true;
    $('empty').hidden = false;
    $('empty').textContent = t('lb_empty');
    syncUrl();
  }

  /* ---------- Mở một video ---------- */
  async function openItem(id) {
    if (editing && !(await commit(editing))) return;
    const ticket = ++opening;
    const detail = await api('/api/items/' + encodeURIComponent(id));
    if (ticket !== opening) return;
    const same = item && item.xru_id === detail.xru_id;
    item = detail;
    if (!same) { selectedFrames.clear(); current = item.segments.length ? item.segments[0].segment_number : 0; }
    renderItem(same);
    markActive();
    syncUrl();
  }

  function queueRow() { return page?.items.find((row) => row.xru_id === item?.xru_id); }

  function renderItem(same) {
    $('empty').hidden = true;
    $('work').hidden = false;
    $('dossier').hidden = false;
    if (!same) { $('stage-frames').dataset.seg = ''; renderPlayer(); }
    renderTrack();
    renderRows();
    renderDossier();
    if (!item.segments.some((s) => s.segment_number === current)) current = item.segments[0]?.segment_number || 0;
    select(current, { scroll: false });
    setMode(same ? stage.dataset.mode : 'frames');
  }

  function renderPlayer() {
    const box = $('stage-video');
    box.innerHTML = item.has_media
      ? `<video id="player" controls preload="metadata" playsinline src="${backend}/media/${encodeURIComponent(item.xru_id)}"></video>`
      : `<div class="stage-none">${esc(t('lb_no_media'))}</div>`;
    $('stage-mode').querySelector('[data-mode="video"]').disabled = !item.has_media;
    const player = $('player');
    if (!player) return;
    player.addEventListener('timeupdate', () => {
      if (stage.dataset.mode !== 'video') return;
      const ms = player.currentTime * 1000;
      moveHead(ms);
      const hit = segAt(ms);
      if (hit && hit.segment_number !== current) select(hit.segment_number);
    });
    player.addEventListener('play', () => setMode('video'));
  }

  function renderTrack() {
    const filled = new Set(item.rows.filter((r) => r.filled).map((r) => r.segment_number));
    $$('.track-seg').forEach((el) => el.remove());
    $('track').insertAdjacentHTML('afterbegin', item.segments.map((s) =>
      `<button type="button" class="track-seg${filled.has(s.segment_number) ? ' is-filled' : ''}" data-seg="${s.segment_number}" style="flex-grow:${Math.max(s.end_ms - s.start_ms, 1)}" title="segment ${s.segment_number} · ${sec(s.start_ms)}–${sec(s.end_ms)}"><span>${pad(s.segment_number)}</span></button>`).join(''));
    const total = item.segments.length ? Math.max(...item.segments.map((s) => s.end_ms)) : 0;
    $('ruler').innerHTML = [0, 1, 2, 3, 4].map((q) => `<span style="left:${q * 25}%">${(total * q / 4000).toFixed(1)}s</span>`).join('');
    $('seg-of').textContent = '/ ' + pad(item.segments.length);
  }

  function selectHtml(column, value, options) {
    const list = column === 'framing' ? ['', ...options] : options;
    return `<select class="cell-in">${list.map((o) => `<option value="${esc(o)}"${o === value ? ' selected' : ''}>${esc(o || '—')}</option>`).join('')}</select>`;
  }

  function renderRows() {
    const perSegment = {};
    for (const r of item.rows) perSegment[r.segment_number] = (perSegment[r.segment_number] || 0) + 1;
    $('rows').innerHTML = item.rows.map((r) => {
      const cells = CELLS.map((column) => {
        const value = r.cells[column];
        const input = column === 'framing' || column === 'palette'
          ? selectHtml(column, value, item[column + '_options'])
          : `<input class="cell-in" value="${esc(value)}" autocomplete="off" spellcheck="false">`;
        const warn = column === 'tag' && r.unknown_tag ? `<span class="cell-warn">${esc(t('lb_outside_dict'))}</span>` : '';
        return `<td class="cell" data-col="${column}"><span class="cell-v">${esc(value)}</span>${input}${warn}</td>`;
      }).join('');
      const del = perSegment[r.segment_number] > 1 ? `<button type="button" class="p-del" data-pos="${r.position}" aria-label="Delete protagonist">×</button>` : '';
      return `<tr class="lrow${r.filled ? '' : ' is-empty'}${r.sibling_index ? ' is-sibling' : ''}" data-seg="${r.segment_number}" data-pos="${r.position}">
        <td class="c-seg">${r.sibling_index ? '' : 'segment ' + r.segment_number}</td>
        <td class="c-time">${r.sibling_index ? '' : sec(r.start_ms)}</td>
        <td class="c-p">P${r.sibling_index + 1}${del}</td>
        ${cells}
        <td class="c-des" title="Goliath">${esc(r.des || '—')}</td>
        <td class="cell" data-col="note"><span class="cell-v">${esc(r.cells.note)}</span><input class="cell-in" value="${esc(r.cells.note)}" autocomplete="off"></td>
      </tr>`;
    }).join('');
  }

  function renderDossier() {
    const row = queueRow();
    const [kind, key] = row ? stateOf(row) : ['', ''];
    $('d-state').textContent = key ? t(key) : '';
    $('d-state').className = 'insp-tag ' + kind;
    $('d-num').textContent = item.xru_id.slice(-12);
    $('d-title').textContent = item.title || item.crawler_title || '(no title)';
    $('d-id').textContent = item.xru_id;
    $('d-source').textContent = `${item.source_name} / ${item.source_lane}`;
    $('d-domain').textContent = item.primary_domain || '—';
    $('d-note').textContent = item.po_note || '—';
    $('d-claim').textContent = row?.claimed_by || '—';
    $('d-aspect').textContent = item.gate.aspect;
    $('d-noise').textContent = item.gate.noise ? 'y' : 'n';
    $('d-wm').textContent = item.gate.watermark ? 'y' : 'n';
    paintProgress(item.progress);
  }

  function paintProgress(progress) {
    $('d-answered').textContent = progress.answered;
    $('d-segments').textContent = `/ ${progress.segments} segment`;
    $('d-bar').style.setProperty('--v', `${progress.segments ? Math.floor(progress.answered * 100 / progress.segments) : 0}%`);
  }

  /* ---------- Segment, frame, timeline ---------- */
  const stage = $('stage');
  const segs = () => item ? item.segments : [];
  const segEl = (n) => document.querySelector(`.track-seg[data-seg="${n}"]`);
  function segAt(ms) { let hit = segs()[0]; for (const s of segs()) if (s.start_ms <= ms) hit = s; return hit; }

  function renderFrames(n) {
    const s = segs().find((x) => x.segment_number === n);
    const box = $('stage-frames');
    if (!s || !s.frame_count) { box.innerHTML = `<div class="stage-none">${esc(t('lb_no_frames'))}</div>`; return; }
    const id = encodeURIComponent(item.xru_id);
    const [w, h] = String(item.gate.aspect).split(':').map(Number);
    box.style.setProperty('--frame-ratio', w > 0 && h > 0 ? `${w} / ${h}` : '9 / 16');
    box.dataset.seg = n;
    box.innerHTML = Array.from({ length: s.frame_count }, (_, i) => {
      const k = i + 1, ts = s.frame_timestamps[i];
      return `<button type="button" class="frame" data-k="${k}" data-ms="${ts ?? ''}" aria-label="Frame ${k} of segment ${n}">
        <img loading="lazy" decoding="async" alt="" src="${backend}/thumb/${id}/${n}/${k}">
        <span class="f-num">${pad(k)}</span>${ts != null ? `<span class="f-t">T+${(ts / 1000).toFixed(2)}s</span>` : ''}</button>`;
    }).join('');
  }

  function chooseFrame(button) {
    if (!button) return;
    selectedFrames.set(current, Number(button.dataset.k));
    $$('.frame').forEach((f) => f.classList.toggle('is-selected', f === button));
    const box = $('stage-frames');
    box.scrollTo({ left: button.offsetLeft - box.offsetLeft - (box.clientWidth - button.offsetWidth) / 2 });
    if (button.dataset.ms !== '') moveHead(Number(button.dataset.ms));
  }
  function frameForSegment() {
    const k = selectedFrames.get(current) || 1;
    return document.querySelector(`.frame[data-k="${k}"]`) || document.querySelector('.frame');
  }

  function select(n, { seek = false, scroll = true } = {}) {
    const s = segs().find((x) => x.segment_number === n);
    if (!s) return;
    const changed = n !== current || $('stage-frames').dataset.seg !== String(n);
    current = n;
    $$('.track-seg').forEach((el) => el.classList.toggle('is-active', Number(el.dataset.seg) === n));
    const rows = $$('.lrow');
    rows.forEach((r) => r.classList.toggle('is-cur', Number(r.dataset.seg) === n));
    $('seg-num').textContent = pad(n);
    $('seg-time').textContent = `${sec(s.start_ms)} – ${sec(s.end_ms)}`;
    if (changed) renderFrames(n);
    const player = $('player');
    if (seek && player && stage.dataset.mode === 'video') player.currentTime = s.start_ms / 1000 + 0.01;
    if (stage.dataset.mode === 'frames') chooseFrame(frameForSegment());
    else if (seek) moveHead(s.start_ms);
    if (scroll) {
      const first = rows.find((r) => Number(r.dataset.seg) === n), sheet = $('sheet');
      if (first) {
        const row = first.getBoundingClientRect(), box = sheet.getBoundingClientRect(), head = sheet.querySelector('thead').offsetHeight;
        if (row.top < box.top + head || row.bottom > box.bottom) sheet.scrollBy({ top: row.top - box.top - head - 8, behavior: 'smooth' });
      }
    }
  }

  function moveHead(ms) {
    const s = segAt(ms), el = s && segEl(s.segment_number);
    if (!el) return;
    const f = Math.min(1, Math.max(0, (ms - s.start_ms) / Math.max(1, s.end_ms - s.start_ms)));
    $('playhead').style.left = `${el.offsetLeft + f * el.offsetWidth - 1}px`;
  }
  function msAt(clientX) {
    const list = segs();
    let s = list.find((x) => { const r = segEl(x.segment_number).getBoundingClientRect(); return clientX >= r.left && clientX <= r.right; });
    if (!s) s = clientX < segEl(list[0].segment_number).getBoundingClientRect().left ? list[0] : list[list.length - 1];
    const r = segEl(s.segment_number).getBoundingClientRect();
    return s.start_ms + Math.min(1, Math.max(0, (clientX - r.left) / r.width)) * (s.end_ms - s.start_ms);
  }
  function seekTo(ms) {
    const s = segAt(ms);
    if (s && s.segment_number !== current) select(s.segment_number);
    if (stage.dataset.mode === 'frames') {
      const closest = $$('.frame').reduce((best, f) => f.dataset.ms === '' ? best
        : !best || Math.abs(Number(f.dataset.ms) - ms) < Math.abs(Number(best.dataset.ms) - ms) ? f : best, null);
      chooseFrame(closest);
    } else {
      moveHead(ms);
      if ($('player')) $('player').currentTime = ms / 1000;
    }
  }

  function setMode(m) {
    const player = $('player');
    if (m === 'video' && !player) m = 'frames';
    if (m === 'frames' && player) player.pause();
    stage.dataset.mode = m;
    $$('#stage-mode button').forEach((b) => b.classList.toggle('is-on', b.dataset.mode === m));
    if (m === 'frames') chooseFrame(frameForSegment());
    else if (player) {
      const hit = segAt(player.currentTime * 1000);
      if (hit && hit.segment_number !== current) select(hit.segment_number, { scroll: false });
      moveHead(player.currentTime * 1000);
    }
  }

  let scrubbing = false;
  const track = $('track');
  track.addEventListener('pointerdown', (e) => { if (!item || !segs().length) return; scrubbing = true; track.setPointerCapture(e.pointerId); seekTo(msAt(e.clientX)); });
  track.addEventListener('pointermove', (e) => { if (scrubbing) seekTo(msAt(e.clientX)); });
  track.addEventListener('pointerup', () => { scrubbing = false; });
  track.addEventListener('pointercancel', () => { scrubbing = false; });
  $('stage-mode').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b && !b.disabled) setMode(b.dataset.mode); });
  window.addEventListener('resize', () => { if (!item) return; if (stage.dataset.mode === 'frames') chooseFrame(frameForSegment()); else moveHead(($('player')?.currentTime || 0) * 1000); });

  /* ---------- Sửa ô: bấm để sửa, Enter lưu, Esc bỏ, Tab lưu rồi sang ô kế ---------- */
  function rowData(cell) { return item.rows.find((r) => r.position === Number(cell.closest('.lrow').dataset.pos)); }
  function inputOf(cell) { return cell.querySelector('.cell-in'); }

  function open(cell) {
    if (editing === cell) return;
    if (editing) commit(editing);
    const input = inputOf(cell);
    cell.dataset.before = rowData(cell).cells[cell.dataset.col];
    cell.classList.add('is-edit');
    cell.classList.remove('is-error');
    editing = cell;
    input.focus();
    if (input.tagName === 'INPUT') input.select();
    select(Number(cell.closest('.lrow').dataset.seg), { scroll: false });
  }
  function close(cell) { cell.classList.remove('is-edit'); if (editing === cell) editing = null; }
  function cancel(cell) { inputOf(cell).value = cell.dataset.before; cell.classList.remove('is-error'); close(cell); }

  async function commit(cell) {
    const input = inputOf(cell), column = cell.dataset.col, value = input.value;
    if (value === cell.dataset.before) { close(cell); return true; }
    const position = Number(cell.closest('.lrow').dataset.pos), xru = item.xru_id;
    cell.classList.add('is-saving');
    try {
      const saved = await post(`/api/items/${encodeURIComponent(xru)}/rows/${position}`, { cells: { [column]: value } });
      if (!item || item.xru_id !== xru) return true;
      const row = item.rows.find((r) => r.position === position);
      Object.assign(row, { cells: saved.cells, des: saved.des, filled: saved.filled, unknown_tag: saved.unknown_tag });
      item.progress = saved.progress;
      close(cell);
      paintRow(row);
      cell.classList.remove('is-saved'); void cell.offsetWidth; cell.classList.add('is-saved');
      say(t('lb_saved'));
      paintProgress(saved.progress);
      loadQueue({ keepItem: true }).then(() => { markActive(); renderDossier(); }).catch(() => {});
      return true;
    } catch (err) {
      cell.classList.add('is-error');
      cell.title = err.message;
      if (editing !== cell) { if (editing) close(editing); cell.classList.add('is-edit'); editing = cell; input.focus(); }
      say(`${t('lb_not_saved')} ${err.message}`, 'error');
      return false;
    } finally {
      cell.classList.remove('is-saving');
    }
  }

  // Vẽ lại một dòng từ dữ liệu Backend; ô đang sửa giữ nguyên chữ PO đang gõ.
  function paintRow(row) {
    const tr = document.querySelector(`.lrow[data-pos="${row.position}"]`);
    if (!tr) return;
    for (const column of [...CELLS, 'note']) {
      const cell = tr.querySelector(`.cell[data-col="${column}"]`);
      if (!cell || cell.classList.contains('is-edit')) continue;
      cell.querySelector('.cell-v').textContent = row.cells[column];
      inputOf(cell).value = row.cells[column];
    }
    tr.classList.toggle('is-empty', !row.filled);
    const tagCell = tr.querySelector('.cell[data-col="tag"]');
    let warn = tagCell.querySelector('.cell-warn');
    if (row.unknown_tag && !warn) tagCell.insertAdjacentHTML('beforeend', `<span class="cell-warn">${esc(t('lb_outside_dict'))}</span>`);
    else if (!row.unknown_tag && warn) warn.remove();
    const segFilled = item.rows.some((r) => r.segment_number === row.segment_number && r.filled);
    segEl(row.segment_number)?.classList.toggle('is-filled', segFilled);
  }

  const sheet = $('sheet');
  sheet.addEventListener('click', async (e) => {
    const del = e.target.closest('.p-del');
    if (del) { await deleteProtagonist(Number(del.dataset.pos)); return; }
    const lead = e.target.closest('.c-seg, .c-time, .c-p');
    if (lead) { select(Number(lead.closest('.lrow').dataset.seg), { seek: true, scroll: false }); return; }
    const cell = e.target.closest('.cell');
    if (cell && !cell.classList.contains('is-edit')) open(cell);
  });
  sheet.addEventListener('change', (e) => { if (e.target.tagName === 'SELECT') commit(e.target.closest('.cell')); });
  sheet.addEventListener('keydown', async (e) => {
    const cell = e.target.closest('.cell');
    if (!cell) return;
    if (e.key === 'Escape') { e.preventDefault(); cancel(cell); }
    else if (e.key === 'Enter') { e.preventDefault(); await commit(cell); }
    else if (e.key === 'Tab') {
      e.preventDefault();
      const cells = $$('.cell'), next = cells[cells.indexOf(cell) + (e.shiftKey ? -1 : 1)];
      if (await commit(cell) && next) open(next);
    }
  });
  document.addEventListener('mousedown', (e) => { if (editing && !editing.contains(e.target)) commit(editing); });

  /* ---------- Thêm / xoá nhân vật: tại chỗ, không tải lại trang ---------- */
  async function changeRows(request) {
    if (editing && !(await commit(editing))) return;
    const button = $('add-protagonist');
    button.disabled = true;
    try {
      item = await request();
      renderItem(true);
      loadQueue({ keepItem: true }).then(() => { markActive(); renderDossier(); }).catch(() => {});
    } catch (err) {
      say(err.message, 'error');
    } finally {
      button.disabled = false;
    }
  }
  $('add-protagonist').addEventListener('click', () => {
    if (item) changeRows(() => post(`/api/items/${encodeURIComponent(item.xru_id)}/segments/${current}/protagonists`, {}));
  });
  async function deleteProtagonist(position) {
    const row = item.rows.find((r) => r.position === position);
    const hasLabels = Object.values(row.cells).some((v) => v.trim()) || row.des.trim();
    if (hasLabels && !window.confirm(t('lb_confirm_delete'))) return;
    await changeRows(() => post(`/api/items/${encodeURIComponent(item.xru_id)}/rows/${position}/delete`, {}));
  }

  /* ---------- Chọn hàng chờ, tab, trang ---------- */
  $('queue-list').addEventListener('click', (e) => {
    const row = e.target.closest('a.side-item');
    if (!row || e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    openItem(row.dataset.id).catch((err) => say(err.message, 'error'));
  });
  $$('.lb-tab').forEach((tab) => tab.addEventListener('click', () => {
    if (tab.dataset.status === view.status) return;
    view.status = tab.dataset.status; view.after = ''; view.before = '';
    loadQueue().then(syncUrl).catch((err) => say(err.message, 'error'));
  }));
  $('page-prev').addEventListener('click', () => { view.before = page.previous; view.after = ''; loadQueue({ keepItem: true }).then(() => { markActive(); syncUrl(); }).catch((err) => say(err.message, 'error')); });
  $('page-next').addEventListener('click', () => { view.after = page.next; view.before = ''; loadQueue({ keepItem: true }).then(() => { markActive(); syncUrl(); }).catch((err) => say(err.message, 'error')); });

  /* ---------- Phím tắt: bỏ qua khi đang gõ hoặc đang xem frame gốc ---------- */
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.repeat || !item) return;
    const target = e.target instanceof Element ? e.target : document.body;
    if (target.closest('input, select, textarea, dialog')) return;
    const player = $('player'), list = segs(), i = list.findIndex((s) => s.segment_number === current);
    switch (e.key.toLowerCase()) {
      case ' ':
        if (player && target !== player) { e.preventDefault(); if (player.paused) { setMode('video'); player.play(); } else player.pause(); }
        break;
      case 'f': setMode('frames'); break;
      case 'v': if (player) setMode('video'); break;
      case 'j': if (i < list.length - 1) select(list[i + 1].segment_number, { seek: true }); break;
      case 'k': if (i > 0) select(list[i - 1].segment_number, { seek: true }); break;
    }
  });

  /* ---------- Xem frame gốc ---------- */
  const viewer = $('frame-viewer');
  let fv = { n: 0, k: 1, count: 0 };
  function showFrame(k) {
    fv.k = k;
    $('fv-title').textContent = `Segment ${fv.n} · frame ${k} of ${fv.count}`;
    $('fv-prev').disabled = k === 1;
    $('fv-next').disabled = k === fv.count;
    $('fv-status').textContent = 'Loading…';
    $('fv-img').src = `${backend}/frame/${encodeURIComponent(item.xru_id)}/${fv.n}/${k}`;
    viewer.querySelector('.fv-stage').scrollTo(0, 0);
  }
  $('fv-img').addEventListener('load', (e) => { $('fv-status').textContent = `${e.target.naturalWidth} × ${e.target.naturalHeight} px · original`; });
  $('fv-img').addEventListener('error', () => { $('fv-status').textContent = 'Cannot load this original frame.'; });
  $('stage-frames').addEventListener('click', (e) => {
    const button = e.target.closest('.frame');
    if (!button) return;
    chooseFrame(button);
    const s = segs().find((x) => x.segment_number === current);
    fv = { n: current, k: Number(button.dataset.k), count: s.frame_count };
    viewer.classList.remove('native');
    $('fv-zoom').textContent = 'Zoom 100%';
    viewer.showModal();
    showFrame(fv.k);
  });
  $('fv-prev').addEventListener('click', () => showFrame(fv.k - 1));
  $('fv-next').addEventListener('click', () => showFrame(fv.k + 1));
  $('fv-zoom').addEventListener('click', () => { const native = viewer.classList.toggle('native'); $('fv-zoom').setAttribute('aria-pressed', String(native)); $('fv-zoom').textContent = native ? 'Fit to screen' : 'Zoom 100%'; });
  $('fv-close').addEventListener('click', () => viewer.close());
  viewer.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); viewer.close(); }
    else if (e.key === 'ArrowLeft' && fv.k > 1) { e.preventDefault(); showFrame(fv.k - 1); }
    else if (e.key === 'ArrowRight' && fv.k < fv.count) { e.preventDefault(); showFrame(fv.k + 1); }
  });

  /* ---------- Backend tắt / bật lại ---------- */
  setInterval(async () => {
    if (!backend || document.hidden) return;
    try {
      await api('/api/health');
      if (down) { down = false; say(''); await loadQueue({ keepItem: !!item }); markActive(); }
    } catch {
      down = true;
      say(t('lb_down'), 'error', true);
    }
  }, 5000);
  window.addEventListener('xru-lang-applied', () => { if (page) paintQueue(); if (item) { markActive(); renderDossier(); } });

  fetch('/ui-config', { cache: 'no-store' }).then((r) => r.json()).then((config) => {
    backend = config.label_backend;
    return loadQueue();
  }).catch((err) => {
    down = true;
    $('empty').textContent = t('lb_down') + ' ' + err.message;
    say(t('lb_down'), 'error', true);
  });
})();
