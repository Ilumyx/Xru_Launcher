// Mặt chép từ mockup Crawler (js/crawler.js); số thật lấy từ /api/board. Chỉ đọc.
// Sidebar trái = lọc (lọc nhanh, platform, tag) và sắp xếp; bộ lọc nằm trên URL để Dash và Nguồn dùng chung.
(() => {
  let backend, board=null, sources=[], shown=[], disconnected=false;
  const params=new URLSearchParams(location.search), list=(k)=>new Set((params.get(k)||'').split(',').filter(Boolean));
  const f={ plat:list('plat'), tag:list('tag'), quick:params.get('quick')||'', sort:params.get('sort')||'issue', q:'' };
  const LANE = { image: 'Ảnh', video: 'Video' };
  const PLATFORM = { facebook: 'Facebook', dvids: 'DVIDS', waralbum: 'War Album', reddit: 'Reddit', x: 'X', telegram: 'Telegram', youtube: 'YouTube', vk: 'VK', tiktok: 'TikTok', bilibili: 'Bilibili', direct: 'Direct' };
  const SWATCH = ['var(--accent)', 'var(--m-11)', 'var(--m-8)', 'var(--m-6)', 'var(--m-5)'];
  const $ = (id) => document.getElementById(id);
  const n = (v) => v == null ? '—' : Number(v).toLocaleString('en-US');
  const platformName = (p) => PLATFORM[p] || (p ? p[0].toUpperCase() + p.slice(1) : '—');
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const two = (v) => String(v).padStart(2, '0');
  const dm = (d) => `${two(d.getDate())}/${two(d.getMonth() + 1)}`;
  const day = (iso) => (iso ? `${dm(new Date(iso))}/${new Date(iso).getFullYear()}` : '—');
  const ago = (iso) => (iso ? `${Math.max(0, Math.floor((Date.now() - new Date(iso)) / 864e5))} ngày` : '—');
  const isToday = (iso) => iso && new Date(iso).toDateString() === new Date().toDateString();
  const stateText = (r) => (r.state === 'broken' ? 'Hỏng' : r.active ? 'Đang bật' : 'Đang tắt');

  // Một nguồn = một tên hiển thị; mỗi làn (ảnh/video) là một ô.
  function toSources(data) {
    return data.rows.map((row) => {
      const lanes = Object.fromEntries(Object.entries(row.lanes).map(([lane, cell]) => [lane, { name: row.name, lane, ...cell, platform: cell.adapter }]));
      const first = Object.values(lanes)[0];
      return { name: row.name, tags: row.tags || [], lanes, platform: first.platform, locator: (first.locator || '').replace(/^https?:\/\/(www\.)?/, '').replace(/\/(reels|photos|videos)\/?$/, '') };
    });
  }
  const laneList = (srcs) => srcs.flatMap((s) => Object.values(s.lanes));
  const issue = (s) => Object.values(s.lanes).some((l) => l.state === 'broken' || (l.active && !l.urls_found));
  const QUICK = { noimage: ['Thiếu ảnh', (s) => !s.lanes.image], novideo: ['Thiếu video', (s) => !s.lanes.video], issue: ['Có vấn đề', issue] };
  function match(s, skip) {
    if (f.q && !`${s.name} ${s.locator}`.toLocaleLowerCase('vi').includes(f.q)) return false;
    if (skip !== 'plat' && f.plat.size && !f.plat.has(s.platform)) return false;
    if (skip !== 'tag' && [...f.tag].some((t) => !s.tags.includes(t))) return false;
    if (skip !== 'quick' && f.quick && !QUICK[f.quick][1](s)) return false;
    return true;
  }
  const newest = (s) => Math.max(0, ...Object.values(s.lanes).map((l) => l.last_crawl_at ? +new Date(l.last_crawl_at) : 0));
  const SORT = {
    issue: null,
    name: (a, b) => a.name.localeCompare(b.name),
    pending: (a, b) => laneList([b]).reduce((x, l) => x + (l.urls_pending || 0), 0) - laneList([a]).reduce((x, l) => x + (l.urls_pending || 0), 0),
    recent: (a, b) => newest(b) - newest(a),
  };
  // Bấm đầu cột Ảnh / Video: nhiều nhất trước, bấm lần nữa thì ít nhất trước. Nguồn chưa add lane đó luôn nằm cuối.
  for (const lane of ['image', 'video']) {
    const count = (s) => s.lanes[lane]?.assets;
    SORT[lane] = (a, b) => (count(b) ?? -1) - (count(a) ?? -1);
    SORT[lane + '_asc'] = (a, b) => (count(a) ?? Infinity) - (count(b) ?? Infinity);
  }

  // URL giữ bộ lọc để Dash và Nguồn dùng chung.
  function keepFilters() {
    const url = new URL(location.href), q = new URLSearchParams();
    if (f.plat.size) q.set('plat', [...f.plat].join(','));
    if (f.tag.size) q.set('tag', [...f.tag].join(','));
    if (f.quick) q.set('quick', f.quick);
    if (f.sort !== 'issue') q.set('sort', f.sort);
    const qs = q.toString() ? '?' + q : '';
    history.replaceState(null, '', url.pathname + qs);
    document.querySelectorAll('[data-keep-scope], .rail a.rail-icon-btn').forEach((a) => { a.href = a.getAttribute('href').split('?')[0] + qs; });
    return qs;
  }

  // Sidebar = lọc: vấn đề nhanh · platform · tag (tag cố định từ Crawler để thấy domain chưa có nguồn).
  function renderFilters() {
    const row = (attr, key, on, label, nums, empty) => `<button type="button" class="f-row${nums.length > 1 ? '' : ' plat'}${on ? ' on' : ''}${empty ? ' empty' : ''}" ${attr}="${esc(key)}"><span>${esc(label)}</span>${nums.join('')}</button>`;
    const num = (v, warn) => `<b class="${warn ? 'gap' : ''}">${v}</b>`;
    let html = '<div class="f-head"><span>LỌC NHANH</span></div>';
    const qpool = sources.filter((s) => match(s, 'quick'));
    html += Object.entries(QUICK).map(([k, [label, test]]) => { const c = qpool.filter(test).length; return row('data-quick', k, f.quick === k, label, [num(c, k !== 'noimage' && k !== 'novideo' ? c > 0 : false)], !c); }).join('');
    const plats = {}; for (const s of sources.filter((s) => match(s, 'plat'))) plats[s.platform] = (plats[s.platform] || 0) + 1;
    const known = [...new Set([...sources.map((s) => s.platform)])].sort((a, b) => (plats[b] || 0) - (plats[a] || 0));
    html += '<div class="f-head"><span>PLATFORM</span></div>' + known.map((p) => row('data-plat', p, f.plat.has(p), platformName(p), [num(plats[p] || 0)], !plats[p])).join('');
    const pool = sources.filter((s) => match(s, 'tag'));
    const groups = { ...(board.tag_groups || {}) };
    const extra = [...new Set(sources.flatMap((s) => s.tags))].filter((t) => !Object.values(groups).flat().includes(t));
    if (extra.length) groups['Khác'] = extra;
    html += '<div class="f-head"><span>TAG</span><span><span>NGUỒN</span><span>ẢNH</span><span>VIDEO</span></span></div>';
    for (const [group, tags] of Object.entries(groups)) {
      html += `<div class="f-sub">${esc(group)}</div>`;
      html += tags.map((t) => {
        const hit = pool.filter((s) => s.tags.includes(t)), img = hit.filter((s) => s.lanes.image).length, vid = hit.filter((s) => s.lanes.video).length;
        return row('data-tag', t, f.tag.has(t), t, hit.length ? [num(hit.length), num(img, !img), num(vid, !vid)] : [num(0, true), '<b>—</b>', '<b>—</b>'], !hit.length);
      }).join('');
    }
    $('cr-filters').innerHTML = html;
    $('cr-count').textContent = n(sources.length);
  }

  function render() {
    if (!board) return;
    shown = sources.filter((s) => match(s));
    if (SORT[f.sort]) shown = [...shown].sort(SORT[f.sort]);
    renderFilters();
    keepFilters();
    const chips = [...[...f.plat].map(platformName), ...f.tag, ...(f.quick ? [QUICK[f.quick][0]] : [])];
    $('cr-active').textContent = chips.length ? 'Đang lọc: ' + chips.join(' + ') : '';
    $('cr-clear').hidden = !chips.length;
    if ($('cr-chart')) renderDash(laneList(shown));
    if (document.querySelector('[data-source-table]')) renderSources(shown);
  }

  function renderDash(rows) {
    if(!board.complete) {
      for(const id of ['m-today','m-on','m-all','m-total','m-latest','cr-donut-total']) $(id).textContent='—';
      for(const id of ['m-today-split','m-off','m-total-split','m-latest-src']) $(id).textContent='';
      $('cr-chart').replaceChildren();$('cr-platforms').replaceChildren();$('cr-donut').style.background='var(--panel)';return;
    }
    const last = (lane) => rows.filter((r) => r.lane === lane).reduce((a, r) => a + (r.by_day.at(-1) || 0), 0);
    const total = (lane) => rows.filter((r) => r.lane === lane).reduce((a, r) => a + r.assets, 0);
    const on = rows.filter((r) => r.active).length, all = rows.length;

    $('m-today').textContent = n(last('image') + last('video'));
    $('m-today-split').textContent = `${n(last('image'))} ảnh · ${n(last('video'))} video`;
    $('m-on').textContent = on; $('m-all').textContent = all;
    $('m-off').textContent = `${all - on} nguồn đang tắt`;
    $('m-total').textContent = n(total('image') + total('video'));
    $('m-total-split').textContent = `${n(total('image'))} ảnh · ${n(total('video'))} video`;
    const latest = rows.filter((r) => r.last_crawl_at).sort((a, b) => new Date(b.last_crawl_at) - new Date(a.last_crawl_at))[0];
    $('m-latest').textContent='—';$('m-latest-src').textContent='';
    if (latest) {
      const t = new Date(latest.last_crawl_at);
      $('m-latest').textContent = isToday(latest.last_crawl_at)
        ? `${two(t.getHours())}:${two(t.getMinutes())}`
        : dm(t);
      $('m-latest-src').textContent = `${latest.name} · ${LANE[latest.lane]}`;
    }

    // Biểu đồ: cùng khung toạ độ với mockup (x 48→678, y 330→32).
    const days = board.days;
    if(days.length) {
    const perDay = (lane) => days.map((_, i) => rows.filter((r) => r.lane === lane).reduce((a, r) => a + (r.by_day[i] || 0), 0));
    const img = perDay('image'), vid = perDay('video'), tot = img.map((v, i) => v + vid[i]);
    const step = [5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000].find((v) => v * 3 >= Math.max(...tot, 1)) || 10000;
    const max = step * 3, X = (i) => 48 + i * (630 / Math.max(days.length - 1, 1)), Y = (v) => 330 - (v / max) * 298;
    const pts = (a) => a.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
    const k = (v) => (v >= 1000 ? `${v / 1000}k` : v);
    const end = (a) => `<circle cx="${X(a.length - 1)}" cy="${Y(a.at(-1)).toFixed(1)}" r="3"/><text class="cr-chart-value" x="${X(a.length - 1) - 12}" y="${(Y(a.at(-1)) - 12).toFixed(1)}" text-anchor="end">${n(a.at(-1))}</text>`;
    let svg = [3, 2, 1, 0].map((g) => `<path class="grid" d="M48 ${Y(g * step).toFixed(1)}H678"/><text x="8" y="${(Y(g * step) + 4).toFixed(1)}">${k(g * step)}</text>`).join('');
    svg += `<g id="cr-series-total" class="cr-series total"${hiddenSeries('total')}><polygon class="area" points="48,330 ${pts(tot)} 678,330"/><polyline class="line" points="${pts(tot)}"/>${end(tot)}</g>`;
    svg += `<g id="cr-series-video" class="cr-series video"${hiddenSeries('video')}><polyline class="line" points="${pts(vid)}"/>${end(vid)}</g>`;
    svg += `<g id="cr-series-image" class="cr-series image"${hiddenSeries('image')}><polyline class="line" points="${pts(img)}"/>${end(img)}</g>`;
    svg += days.map((d, i) => `<text x="${X(i).toFixed(1)}" y="360" text-anchor="middle">${d.slice(8, 10)}/${d.slice(5, 7)}</text>`).join('');
    $('cr-chart').innerHTML = svg;
    } else $('cr-chart').replaceChildren();

    // Donut theo nền tảng.
    const byPlat = {};
    for (const r of rows) byPlat[r.platform] = (byPlat[r.platform] || 0) + r.assets;
    const plats = Object.entries(byPlat).sort((a, b) => b[1] - a[1]), total2 = plats.reduce((a, [, v]) => a + v, 0);
    let at = 0;
    const stops = plats.map(([, v], i) => { const from = at; at += (total2 ? v / total2 : 0) * 100; return `${SWATCH[Math.min(i, SWATCH.length - 1)]} ${from}% ${at}%`; });
    $('cr-donut').style.background = total2 ? `conic-gradient(${stops.join(', ')})` : 'var(--panel)';
    $('cr-donut-total').textContent = n(total2);
    $('cr-platforms').innerHTML = plats.map(([p, v], i) =>
      `<div><span><i style="background:${SWATCH[Math.min(i, SWATCH.length - 1)]}"></i>${esc(platformName(p))}</span><b>${n(v)}</b><small>${((total2 ? v / total2 : 0) * 100).toFixed(1)}%</small></div>`).join('');
  }
  const hiddenSeries = (key) => document.querySelector(`[data-chart-series="${key}"]`)?.getAttribute('aria-pressed') === 'false' ? ' hidden' : '';

  // Ô một làn: hạng · đã tải / URL đã quét · thanh tỷ lệ · bao lâu chưa nhận mới.
  function laneCard(l) {
    if (!l) return '<div class="cr-card missing">+ Chưa add</div>';
    const nodisc = l.active && !l.urls_found, pct = l.urls_found ? Math.min(100, (l.assets / l.urls_found) * 100) : 0;
    const cls = l.state === 'broken' ? 'broken' : !l.active ? 'off' : nodisc ? 'nodisc' : '';
    const st = l.state === 'broken' ? `hỏng · ${ago(l.last_crawl_at)}` : !l.active ? `tắt · ${ago(l.last_crawl_at)}` : nodisc ? 'chưa discovery' : ago(l.last_crawl_at);
    return `<button type="button" class="cr-card ${cls}" data-lane="${l.lane}"><span class="tier">${esc(l.tier || '–')}</span><span class="num">${n(l.assets)} <small>/ ${n(l.urls_found)}</small></span><span class="bar"><i style="width:${pct}%"></i></span><span class="st">${st}${l.urls_pending ? ` · <span class="pend">${n(l.urls_pending)} chờ</span>` : ''}</span></button>`;
  }

  function renderSources(list) {
    const body = document.querySelector('[data-source-table] tbody');
    document.querySelectorAll('[data-sort-lane]').forEach((th) => {
      const lane = th.dataset.sortLane, on = f.sort.startsWith(lane);
      th.classList.toggle('on', on);
      th.dataset.arrow = on ? (f.sort.endsWith('_asc') ? '↑' : '↓') : '↕';
    });
    body.innerHTML = list.map((s, i) => `<tr data-i="${i}"><td><div class="cr-name">${esc(s.name)}</div><div class="cr-loc">${esc(s.locator)}</div></td><td>${esc(platformName(s.platform))}</td><td><div class="cr-tags">${s.tags.map((t) => `<button type="button" class="cr-tag${f.tag.has(t) ? ' on' : ''}" data-tag="${esc(t)}">${esc(t)}</button>`).join('')}</div></td><td>${laneCard(s.lanes.image)}</td><td>${laneCard(s.lanes.video)}</td></tr>`).join('');
    $('source-result-count').textContent = board.complete ? `${list.length} / ${sources.length} nguồn` : `${list.length} nguồn đã đọc được · tổng chưa xác định`;
    $('source-empty').hidden = list.length !== 0 || !board.complete;
  }

  // Sự kiện gắn một lần.
  const flip = (set, v) => (set.has(v) ? set.delete(v) : set.add(v));
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-plat],[data-tag],[data-quick],#cr-clear');
    if (!el) return;
    if (el.id === 'cr-clear') { f.plat.clear(); f.tag.clear(); f.quick = ''; }
    else if (el.dataset.plat) flip(f.plat, el.dataset.plat);
    else if (el.dataset.tag) flip(f.tag, el.dataset.tag);
    else f.quick = f.quick === el.dataset.quick ? '' : el.dataset.quick;
    render();
  });
  $('cr-q').addEventListener('input', () => { f.q = $('cr-q').value.trim().toLocaleLowerCase('vi'); render(); });
  document.querySelectorAll('[data-sort-lane]').forEach((th) => th.addEventListener('click', () => {
    const lane = th.dataset.sortLane;
    f.sort = f.sort === lane ? lane + '_asc' : lane;
    $('cr-sort').value = f.sort; render();
  }));
  $('cr-sort').value = f.sort;
  $('cr-sort').addEventListener('change', () => { f.sort = $('cr-sort').value; render(); });
  const dialog = $('source-detail');
  if (dialog) {
    document.querySelector('[data-source-table] tbody').addEventListener('click', (e) => {
      const tr = e.target.closest('tr');
      if (!tr || e.target.closest('[data-tag]')) return;
      const s = shown[tr.dataset.i], card = e.target.closest('[data-lane]');
      const r = card ? s.lanes[card.dataset.lane] : Object.values(s.lanes)[0];
      $('source-detail-name').textContent = s.name;
      $('source-detail-url').textContent = r.locator || '—';
      $('source-detail-kind').textContent = LANE[r.lane];
      $('source-detail-state').textContent = stateText(r);
      $('source-detail-platform').textContent = platformName(r.platform);
      $('source-detail-tier').textContent = r.tier || '—';
      $('source-detail-found').textContent = n(r.urls_found);
      $('source-detail-assets').textContent = n(r.assets);
      $('source-detail-pending').textContent = n(r.urls_pending);
      $('source-detail-last').textContent = day(r.last_crawl_at);
      $('source-detail-error').textContent = r.error ? `${r.error.short} (${day(r.error.at)})` : '—';
      $('source-detail-note').textContent = r.po_note || '—';
      dialog.showModal();
    });
    $('source-detail-close').addEventListener('click', () => dialog.close());
  }

  for (const button of document.querySelectorAll('[data-chart-series]')) {
    button.addEventListener('click', () => {
      const visible = button.getAttribute('aria-pressed') !== 'true';
      button.setAttribute('aria-pressed', String(visible));
      $(button.getAttribute('aria-controls'))?.toggleAttribute('hidden', !visible);
    });
  }
  window.addEventListener('keydown', (event) => {
    if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(document.activeElement.tagName) || document.querySelector('dialog[open]')) return;
    const q = keepFilters();
    if (event.key === '1') location.href = '/crawler/dash' + q;
    if (event.key === '2') location.href = '/crawler/sources' + q;
  });

  function error(message) { $('cr-error').textContent=message;$('cr-error').hidden=!message;$('cr-foot').textContent=message||'CHỈ ĐỌC · ẢNH + VIDEO'; }
  async function readBoard() {
    try {
      const r=await fetch(backend+'/api/board',{cache:'no-store',signal:AbortSignal.timeout(20000)}), data=await r.json();
      if(!Array.isArray(data.rows)) throw Error(data.error||'Backend chưa trả được dữ liệu.');
      board=data; sources=toSources(data);
      render();
      const failures=Object.entries(data.lane_errors).map(([lane,reason])=>`${LANE[lane]}: ${reason}`);
      error(failures.length?'THIẾU DỮ LIỆU — '+failures.join(' · '):'');disconnected=!data.complete;
    } catch(e) { disconnected=true;error('BACKEND CRAWLER ĐANG TẮT HOẶC ĐỌC LỖI — số đang hiện chưa được cập nhật. '+e.message); }
  }
  window.addEventListener('focus',()=>{if(backend)readBoard();});
  let polling=false;
  async function health() {
    if(!backend||polling||document.hidden)return;polling=true;
    try { const r=await fetch(backend+'/api/health',{cache:'no-store',signal:AbortSignal.timeout(3000)});if(!r.ok)throw Error('HTTP '+r.status);if(disconnected)await readBoard(); }
    catch(e) {disconnected=true;error('BACKEND CRAWLER ĐANG TẮT — số đang hiện chưa được cập nhật.');}
    finally {polling=false;}
  }
  setInterval(health,5000);
  fetch('/ui-config',{cache:'no-store'}).then(r=>r.json()).then(config=>{backend=config.crawler_backend;readBoard();}).catch(()=>error('Không đọc được cấu hình UI.'));
})();
