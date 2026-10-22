// Màn Nguồn Crawler theo bản vẽ PO (design/ORDER_crawler_sources.md). Chỉ đọc /api/board; mọi thao tác cập nhật tại chỗ.
// Một nguồn một dòng, chia nhóm theo trạng thái; bấm dòng mở sidebar phải chi tiết (được phép đè lên bảng).
(() => {
  let backend, board = null, sources = [], shown = [], picked = null, disconnected = false;
  const params = new URLSearchParams(location.search);
  const f = { plat: new Set((params.get('plat') || '').split(',').filter(Boolean)), quick: params.get('quick') || '', sort: params.get('sort') || 'tier', q: '' };
  const open = { look: true, run: true, ok: false, new: false };
  const KINDS = ['image', 'video'];
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const n = (v) => (v == null ? '—' : Number(v).toLocaleString('en-US'));
  const two = (v) => String(v).padStart(2, '0');
  const stamp = (iso) => { if (!iso) return '—'; const d = new Date(iso); return `${two(d.getDate())}/${two(d.getMonth() + 1)} ${two(d.getHours())}:${two(d.getMinutes())}`; };
  const daysSince = (iso) => (iso ? Math.max(0, Math.floor((Date.now() - new Date(iso)) / 864e5)) : null);

  const PLATFORM = { facebook: ['Facebook', 'FB'], telegram: ['Telegram', 'TG'], waralbum: ['War Album', 'WAR'], dvids: ['DVIDS', 'DVIDS'], x: ['X', 'X'], reddit: ['Reddit', 'RDT'], youtube: ['YouTube', 'YT'], vk: ['VK', 'VK'], tiktok: ['TikTok', 'TT'], direct: ['Direct', 'DIR'], bilibili: ['Bilibili', 'BILI'], instagram: ['Instagram', 'IG'] };
  const platName = (p) => PLATFORM[p]?.[0] || p;
  const platCode = (p) => PLATFORM[p]?.[1] || String(p).slice(0, 4).toUpperCase();
  // Nước và loại khí tài suy từ tag PO dán trong labels.json (sticker của UI).
  const COUNTRY = { US: 'US', UK: 'UK', Germany: 'DE', France: 'FR', Poland: 'PL', Australia: 'AU', Japan: 'JP', Korea: 'KR', Taiwan: 'TW', Thailand: 'TH', China: 'CN', Russia: 'RU', USSR: 'SU', Ukraine: 'UA', Israel: 'IL', NATO: 'NATO' };
  const country = (s) => { const c = (s.tags || []).filter((t) => COUNTRY[t]); return COUNTRY[c.find((t) => t !== 'NATO') || c[0]] || '—'; };
  const ARM = { Tank: 'ground', Gun: 'ground', Infantry: 'ground', Artillery: 'ground', Missile: 'ground', Air: 'air', Heli: 'air', Drone: 'air', Navy: 'navy', Ship: 'navy', Submarine: 'navy' };
  const ICON = {
    ground: '<path d="M3 15h18l-2 3H5zM6 15l1-4h9l2 4M10 11V8h5M15 9h6"/>',
    air: '<path d="M12 3v18M4 13l8-4 8 4M8 20l4-2 4 2"/>',
    navy: '<path d="M3 15h18l-3 4H6zM7 15V11h10v4M11 11V7h3"/>',
  };
  const arm = (s) => { const k = (s.tags || []).map((t) => ARM[t]).find(Boolean); return k ? `<svg class="src-arm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-label="${k}"><title>${esc((s.tags || []).filter((t) => ARM[t]).join(', '))}</title>${ICON[k]}</svg>` : ''; };

  // Trạng thái: mỗi dòng một badge, xét theo thứ tự; cái đầu tiên khớp là badge.
  const STALE = { A: 3, B: 7, C: 14, D: 30 };
  const TIER_RANK = { A: 0, B: 1, C: 2, D: 3 };
  const onKinds = (s) => KINDS.filter((k) => s[k + '_enabled'] && s.operations?.[k]?.supported !== false);
  const tierOf = (s, k) => (s.media || {})[k]?.tier || '';
  const staleLimit = (s) => Math.min(...onKinds(s).map((k) => { const t = tierOf(s, k); return t === 'F' ? Infinity : STALE[t] || 7; }), Infinity);
  const runs = (s) => KINDS.flatMap((k) => [s.operations?.[k]?.last_scout, s.operations?.[k]?.last_run]).filter(Boolean);
  const noScout = (s, k) => { const o = s.operations?.[k] || {}; return onKinds(s).includes(k) && !o.last_scout && !o.found; };
  const STATES = [
    ['stuck', 'KẸT', 'look', (s) => KINDS.some((k) => (s.errors || {})[k])],
    ['run', 'ĐANG CÀO', 'run', (s) => runs(s).some((r) => r.state === 'running')],
    ['wait', 'WAITING', 'look', (s) => s.waiting],
    ['new', 'CHƯA CÀO', 'new', (s) => !runs(s).length && !s.last_born_at],
    ['stale', 'CŨ', 'look', (s) => s.last_born_at && daysSince(s.last_born_at) > staleLimit(s)],
    ['scout', 'THIẾU SCOUT', 'look', (s) => KINDS.some((k) => noScout(s, k))],
    ['ok', 'OK', 'ok', () => true],
  ];
  const stateOf = (s) => STATES.find(([, , , test]) => test(s));
  // PO 22/10: Ổn trên cùng, Cần nhìn dưới cùng.
  const GROUPS = [['ok', 'ỔN'], ['run', 'ĐANG CÀO'], ['new', 'CHƯA CÀO'], ['look', 'CẦN NHÌN']];
  const QUICK = { look: ['Cần nhìn', (s) => s.st[2] === 'look'], stuck: ['Kẹt', (s) => s.st[0] === 'stuck'], stale: ['Cũ', (s) => s.st[0] === 'stale'], scout: ['Thiếu scout', (s) => s.st[0] === 'scout'], wait: ['Waiting', (s) => s.st[0] === 'wait'] };
  if (!(f.quick in QUICK)) f.quick = '';

  const bestTier = (s) => Math.min(...KINDS.map((k) => TIER_RANK[tierOf(s, k)] ?? 9));
  const newest = (s) => (s.last_born_at ? +new Date(s.last_born_at) : 0);
  const count = (k) => (s) => s[k === 'image' ? 'images' : 'videos'] ?? -1;
  const SORT = {
    tier: (a, b) => bestTier(a) - bestTier(b) || a.name.localeCompare(b.name),
    name: (a, b) => a.name.localeCompare(b.name),
    name_asc: (a, b) => b.name.localeCompare(a.name),
    platform: (a, b) => platName(a.platform).localeCompare(platName(b.platform)) || a.name.localeCompare(b.name),
    platform_asc: (a, b) => platName(b.platform).localeCompare(platName(a.platform)) || a.name.localeCompare(b.name),
    recent: (a, b) => newest(b) - newest(a),
    recent_asc: (a, b) => (newest(a) || Infinity) - (newest(b) || Infinity),
    pending: (a, b) => (b.links_pending || 0) - (a.links_pending || 0),
    image: (a, b) => count('image')(b) - count('image')(a),
    image_asc: (a, b) => count('image')(a) - count('image')(b),
    video: (a, b) => count('video')(b) - count('video')(a),
    video_asc: (a, b) => count('video')(a) - count('video')(b),
  };
  if (!(f.sort in SORT)) f.sort = 'tier';

  function match(s, skip) {
    if (f.q && !`${s.name} ${platName(s.platform)}`.toLocaleLowerCase('vi').includes(f.q)) return false;
    if (skip !== 'plat' && f.plat.size && !f.plat.has(s.platform)) return false;
    if (skip !== 'quick' && f.quick && !QUICK[f.quick][1](s)) return false;
    return true;
  }

  // Scout chưa dò tới đáy thì thêm +: đã thấy 1,160 mà nguồn còn sâu.
  const scoutText = (o) => n(o.found ?? 0) + (o.bottom_reached ? '' : '+');

  // Ô ảnh/video: [hạng] plan │ scout │ download. Không chữ chú thích; số chờ chỉ hiện ở chi tiết.
  function mediaCell(s, k) {
    const o = s.operations?.[k] || {}, m = (s.media || {})[k] || {};
    const on = onKinds(s).includes(k), never = s.st[0] === 'new';
    const tier = m.tier ? `<b class="tier t-${esc(m.tier)}" title="${esc(m.note || 'Hạng ' + m.tier)}">${esc(m.tier)}</b>` : '<b class="tier none" title="Chưa chấm"></b>';
    if (o.supported === false) return `<div class="mc off">${tier}<span class="dim">—</span><span class="dim">—</span><span class="dim">—</span></div>`;
    const plan = o.supports_count && o.total != null ? n(o.total) : '—';
    const scout = never ? '—' : scoutText(o), down = never ? '—' : n(s[k === 'image' ? 'images' : 'videos']);
    return `<div class="mc${on ? '' : ' off'}">${tier}<span class="plan${plan === '—' ? ' dim' : ''}">${plan}</span><span class="scout${noScout(s, k) && s.st[0] === 'scout' ? ' red' : ''}${never ? ' dim' : ''}">${scout}</span><span class="down${never ? ' dim' : ''}">${down}</span></div>`;
  }

  function row(s) {
    const d = daysSince(s.last_born_at), [key, label] = s.st;
    const id = `${s.platform}|${s.cluster_key}`;
    return `<tr data-id="${esc(id)}" class="${s.enabled ? '' : 'off'}${picked === id ? ' picked' : ''}"><td>${arm(s)}</td><td class="nm" title="${esc(s.name)}">${esc(s.name)}</td><td class="code">${country(s)}</td><td class="code">${platCode(s.platform)}</td><td>${mediaCell(s, 'image')}</td><td class="split">${mediaCell(s, 'video')}</td><td class="age${key === 'stale' ? ' red' : ''}">${d == null ? '—' : d + 'n'}</td><td><span class="badge b-${key}">${key === 'run' ? '<i class="live"></i>' : ''}${label}</span></td></tr>`;
  }

  function renderFilters() {
    const btn = (attr, key, on, label, c, red) => `<button type="button" class="f-row${on ? ' on' : ''}${c ? '' : ' empty'}" ${attr}="${esc(key)}"><span>${esc(label)}</span><b class="${red && c ? 'red' : ''}">${c}</b></button>`;
    const qpool = sources.filter((s) => match(s, 'quick'));
    let html = '<div class="f-head">LỌC NHANH</div>' + Object.entries(QUICK).map(([k, [label, test]]) => btn('data-quick', k, f.quick === k, label, qpool.filter(test).length, k !== 'wait')).join('');
    const plats = {};
    for (const s of sources.filter((s) => match(s, 'plat'))) plats[s.platform] = (plats[s.platform] || 0) + 1;
    const all = [...new Set(sources.map((s) => s.platform))].sort((a, b) => (plats[b] || 0) - (plats[a] || 0));
    html += `<div class="f-head">NỀN TẢNG · ${all.length}</div>` + all.map((p) => btn('data-plat', p, f.plat.has(p), platName(p), plats[p] || 0)).join('');
    $('src-filters').innerHTML = html;
    $('src-count').textContent = n(sources.length);
  }

  function render() {
    if (!board) return;
    renderFilters();
    keepFilters();
    const scope = sources.filter((s) => match(s, 'quick'));
    for (const [g, id] of [['look', 't-look'], ['run', 't-run'], ['ok', 't-ok'], ['new', 't-new']]) $(id).textContent = board.complete ? n(scope.filter((s) => s.st[2] === g).length) : '—';
    shown = sources.filter((s) => match(s));
    const filtering = !!(f.q || f.plat.size || f.quick), order = STATES.map(([k]) => k);
    let html = '';
    for (const [g, label] of GROUPS) {
      const list = shown.filter((s) => s.st[2] === g).sort((a, b) => (g === 'look' ? order.indexOf(a.st[0]) - order.indexOf(b.st[0]) : 0) || SORT[f.sort](a, b));
      if (!list.length) continue;
      const isOpen = filtering || open[g];
      html += `<tr class="grp g-${g}" data-group="${g}" tabindex="0"><td colspan="8"><span class="chev">${isOpen ? '▾' : '▸'}</span>${label} <b>${list.length}</b></td></tr>`;
      if (isOpen) html += list.map(row).join('');
    }
    $('src-rows').innerHTML = html;
    $('src-empty').hidden = shown.length !== 0 || !board.complete;
    document.querySelectorAll('[data-sort]').forEach((th) => {
      const k = th.dataset.sort, on = f.sort === k || f.sort === k + '_asc';
      th.classList.toggle('on', on);
      th.dataset.arrow = on ? (f.sort.endsWith('_asc') ? '↑' : '↓') : '';
    });
    if (picked) showDetail(sources.find((s) => `${s.platform}|${s.cluster_key}` === picked) || null);
  }

  // Bộ lọc nằm trên URL; Dash dùng chung nền tảng.
  function keepFilters() {
    const q = new URLSearchParams();
    if (f.plat.size) q.set('plat', [...f.plat].join(','));
    if (f.quick) q.set('quick', f.quick);
    if (f.sort !== 'tier') q.set('sort', f.sort);
    const qs = q.toString() ? '?' + q : '';
    history.replaceState(null, '', location.pathname + qs);
    const plat = f.plat.size ? `?plat=${encodeURIComponent([...f.plat].join(','))}` : '';
    document.querySelectorAll('[data-keep], .rail a.rail-icon-btn').forEach((a) => { a.href = a.getAttribute('href').split('?')[0] + (a.href.includes('/dash') ? plat : qs); });
    return qs;
  }

  // Sidebar phải: mọi chi tiết của nguồn. Đè lên bảng cũng được.
  const STATE_NAME = { running: 'đang chạy', done: 'xong', failed: 'lỗi', interrupted: 'đã ngắt', waiting_links: 'cần scout thêm' };
  const op = (r) => (r ? `${stamp(r.started_at)} → ${r.ended_at ? stamp(r.ended_at) : '…'} · ${STATE_NAME[r.state] || r.state}${r.added != null ? ` · +${n(r.added)}` : ''}` : '—');
  function showDetail(s) {
    picked = s ? `${s.platform}|${s.cluster_key}` : null;
    $('src-detail').hidden = !s;
    document.querySelectorAll('#src-rows tr[data-id]').forEach((tr) => tr.classList.toggle('picked', tr.dataset.id === picked));
    if (!s) return;
    $('d-plat').textContent = `${platName(s.platform)} · ${country(s)}`;
    $('d-name').textContent = s.name;
    $('d-sub').innerHTML = `<span class="badge b-${s.st[0]}">${s.st[1]}</span>${s.enabled ? '' : '<span class="badge b-off">ĐANG TẮT</span>'}${(s.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join('')}`;
    const limit = staleLimit(s);
    const kinds = KINDS.map((k) => {
      const o = s.operations?.[k] || {}, m = (s.media || {})[k] || {}, on = onKinds(s).includes(k);
      if (o.supported === false) return `<section class="d-kind off"><h3>${k === 'image' ? 'ẢNH' : 'VIDEO'} · nguồn không có</h3></section>`;
      const delta = o.total_delta == null ? '—' : `${o.total_delta >= 0 ? '+' : ''}${n(o.total_delta)}`;
      const pause = o.rest_until ? `nghỉ tới ${stamp(o.rest_until)}` : o.wait_until ? `chờ tới ${stamp(o.wait_until)}` : 'không';
      return `<section class="d-kind${on ? '' : ' off'}"><h3>${k === 'image' ? 'ẢNH' : 'VIDEO'} · ${on ? 'BẬT' : 'TẮT'}${m.tier ? ` <b class="tier t-${esc(m.tier)}">${esc(m.tier)}</b>` : ''}</h3>
        <div class="d-nums"><div><span>plan</span><b>${o.supports_count && o.total != null ? n(o.total) : '—'}</b></div><div><span>scout</span><b>${o.found == null ? '—' : scoutText(o)}</b></div><div><span>download</span><b>${n(s[k === 'image' ? 'images' : 'videos'])}</b></div><div><span>chờ</span><b>${n(o.pending)}</b></div></div>
        <dl><dt>Scout cuối</dt><dd>${op(o.last_scout)}</dd><dt>Tổng lệch</dt><dd>${delta}${o.bottom_reached ? ' · đã tới đáy' : ''}</dd><dt>Run cuối</dt><dd>${op(o.last_run)}</dd><dt>Hôm nay · 7 ngày</dt><dd>${n(o.today)} · ${n(o.new_7d)}</dd><dt>Lỗi thật</dt><dd class="${o.error ? 'red' : ''}">${o.error ? esc(`[E] ${o.last_error?.reason || ''} ${o.last_error?.detail || ''}`) : 'không'}</dd><dt>Nghỉ / chờ</dt><dd>${pause}</dd></dl>
        ${m.note ? `<p class="d-note">${esc(m.note)}</p>` : ''}</section>`;
    }).join('');
    const shots = s.shots || [], link = sourceUrl(s);
    $('d-body').innerHTML = `<dl class="d-facts"><dt>Cào cuối</dt><dd>${s.last_born_at ? `${stamp(s.last_born_at)} · ${daysSince(s.last_born_at)} ngày trước` : '—'}</dd><dt>Ngưỡng cũ</dt><dd>${limit === Infinity ? 'không tính' : limit + ' ngày'}</dd></dl>
      ${kinds}
      ${s.note ? `<section><h3>GHI CHÚ</h3><p class="d-note">${esc(s.note)}</p></section>` : ''}
      ${shots.length ? `<section><h3>ẢNH CHỤP</h3><div class="d-shots">${shots.map((name) => `<button type="button" data-shot><img loading="lazy" src="${backend}/api/shots/${encodeURIComponent(name)}" alt=""></button>`).join('')}</div></section>` : ''}
      ${link ? `<a class="d-link" href="${esc(link)}" target="_blank" rel="noopener noreferrer">Mở nguồn ↗</a>` : ''}`;
  }
  // Link mở được trên trình duyệt; từ khoá DVIDS mở trang tìm, Telegram mở t.me.
  function sourceUrl(s) {
    const first = String(s.link || '').split(' · ')[0];
    if (/^https?:\/\//.test(first)) return first;
    if (s.platform === 'dvids') return 'https://www.dvidshub.net/search/?q=' + encodeURIComponent(first);
    if (s.platform === 'telegram') return 'https://t.me/' + encodeURIComponent(first);
    return '';
  }

  // Sự kiện.
  const flip = (set, v) => (set.has(v) ? set.delete(v) : set.add(v));
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-plat],[data-quick],[data-sort],[data-group],#src-rows tr[data-id],#d-close,[data-shot]');
    if (!el) return;
    if (el.dataset.plat) flip(f.plat, el.dataset.plat);
    else if (el.dataset.quick) f.quick = f.quick === el.dataset.quick ? '' : el.dataset.quick;
    else if (el.dataset.sort) { const k = el.dataset.sort; f.sort = f.sort === k ? k + '_asc' : k; $('src-sort').value = SORT[f.sort] && $('src-sort').querySelector(`[value="${f.sort}"]`) ? f.sort : $('src-sort').value; }
    else if (el.dataset.group) { if (f.q || f.plat.size || f.quick) return; open[el.dataset.group] = !open[el.dataset.group]; }
    else if (el.id === 'd-close') return showDetail(null);
    else if (el.hasAttribute('data-shot')) { $('shot-view-img').src = el.querySelector('img').src; return $('shot-view').showModal(); }
    else { const s = sources.find((x) => `${x.platform}|${x.cluster_key}` === el.dataset.id); return showDetail(picked === el.dataset.id ? null : s); }
    render();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.dataset?.group) e.target.click(); });
  $('shot-view').addEventListener('click', () => $('shot-view').close());
  $('src-q').addEventListener('input', () => { f.q = $('src-q').value.trim().toLocaleLowerCase('vi'); render(); });
  $('src-sort').value = $('src-sort').querySelector(`[value="${f.sort}"]`) ? f.sort : 'tier';
  $('src-sort').addEventListener('change', () => { f.sort = $('src-sort').value; render(); });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !$('src-detail').hidden && !$('shot-view').open) { e.stopPropagation(); e.preventDefault(); showDetail(null); return; }
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName) || document.querySelector('dialog[open]')) return;
    if (e.key === '1') location.href = '/crawler/dash' + (f.plat.size ? `?plat=${encodeURIComponent([...f.plat].join(','))}` : '');
    if (e.key === '2') location.href = '/crawler/sources' + keepFilters();
  }, true);

  function error(message) { $('src-error').textContent = message; $('src-error').hidden = !message; }
  async function readBoard() {
    try {
      const r = await fetch(backend + '/api/board', { cache: 'no-store', signal: AbortSignal.timeout(20000) }), data = await r.json();
      if (!Array.isArray(data.rows)) throw Error(data.error || 'Backend chưa trả được dữ liệu.');
      board = data;
      sources = data.rows.map((row) => { const s = { ...row, name: row.display_name }; s.st = stateOf(s); return s; });
      $('src-stamp').textContent = 'CẬP NHẬT ' + stamp(new Date().toISOString());
      render();
      const failures = Object.values(data.errors || {});
      error(failures.length ? 'THIẾU DỮ LIỆU — ' + failures.join(' · ') : '');
      disconnected = !data.complete;
    } catch (e) { disconnected = true; error('BACKEND CRAWLER ĐANG TẮT HOẶC ĐỌC LỖI — số đang hiện chưa được cập nhật. ' + e.message); }
  }
  window.addEventListener('focus', () => { if (backend) readBoard(); });
  let polling = false;
  setInterval(async () => {
    if (!backend || polling || document.hidden) return;
    polling = true;
    try { const r = await fetch(backend + '/api/health', { cache: 'no-store', signal: AbortSignal.timeout(3000) }); if (!r.ok) throw Error('HTTP ' + r.status); if (disconnected) await readBoard(); }
    catch { disconnected = true; error('BACKEND CRAWLER ĐANG TẮT — số đang hiện chưa được cập nhật.'); }
    finally { polling = false; }
  }, 5000);
  // Kéo mép phải sidebar để giãn; bấm đúp về mặc định. Chung bề ngang và chỗ nhớ với Dashboard.
  (() => {
    const ws = document.querySelector('.src-ws'), KEY = 'xru-crawler-left-w', VAR = '--cr-side', MIN = 200, MAX = 480;
    const set = (w) => { if (w == null) ws.style.removeProperty(VAR); else ws.style.setProperty(VAR, Math.round(Math.max(MIN, Math.min(MAX, w))) + 'px'); };
    try { const saved = +localStorage.getItem(KEY); if (saved) set(saved); } catch { /* không nhớ được thì dùng mặc định */ }
    const el = document.createElement('div');
    el.className = 'src-grip';
    el.title = 'Kéo để giãn · bấm đúp để về mặc định';
    ws.appendChild(el);
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      document.body.classList.add('is-gripping');
      const move = (ev) => { const r = ws.getBoundingClientRect(); set((ev.clientX - r.left) / (r.width / ws.offsetWidth)); };
      const up = () => {
        document.body.classList.remove('is-gripping');
        window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up);
        try { localStorage.setItem(KEY, parseInt(ws.style.getPropertyValue(VAR)) || ''); } catch { /* bỏ qua */ }
      };
      window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
    });
    el.addEventListener('dblclick', () => { set(null); try { localStorage.removeItem(KEY); } catch { /* bỏ qua */ } });
  })();
  fetch('/ui-config', { cache: 'no-store' }).then((r) => r.json()).then((c) => { backend = c.crawler_backend; readBoard(); }).catch(() => error('Không đọc được cấu hình UI.'));
})();
