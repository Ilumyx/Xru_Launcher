// Mặt chép từ mockup Crawler (js/crawler.js); số thật lấy từ /api/board. Chỉ đọc.
// Sidebar trái = lọc (lọc nhanh, platform) và sắp xếp; bộ lọc nằm trên URL để Dash và Nguồn dùng chung.
(() => {
  let backend, board=null, sources=[], shown=[], disconnected=false;
  const params=new URLSearchParams(location.search), list=(k)=>new Set((params.get(k)||'').split(',').filter(Boolean));
  const f={ plat:list('plat'), quick:params.get('quick')||'', sort:params.get('sort')||'issue', q:'' };
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

  // Một dòng là một cụm; ảnh/video chỉ là số khai sinh theo loại.
  const toSources = (data) => data.rows.map((row) => ({ ...row, name: row.display_name }));
  // Cờ lấy từ tag quốc gia trong nhãn nguồn; tag không hiện thành chip.
  const FLAG = { US: '🇺🇸', UK: '🇬🇧', Germany: '🇩🇪', France: '🇫🇷', Poland: '🇵🇱', Australia: '🇦🇺', Japan: '🇯🇵', Korea: '🇰🇷', Taiwan: '🇹🇼', China: '🇨🇳', Russia: '🇷🇺', USSR: '☭', Ukraine: '🇺🇦', Israel: '🇮🇱', NATO: '✪' };
  const flags = (s) => (s.tags || []).filter((t) => FLAG[t]).map((t) => `<i title="${esc(t)}">${FLAG[t]}</i>`).join('');
  const issue = (s) => s.state === 'broken';
  const QUICK = { issue: ['Có vấn đề', issue] };
  if (!(f.quick in QUICK)) f.quick = '';
  function match(s, skip) {
    if (f.q && !`${s.name} ${s.platform}`.toLocaleLowerCase('vi').includes(f.q)) return false;
    if (skip !== 'plat' && f.plat.size && !f.plat.has(s.platform)) return false;
    if (skip !== 'quick' && f.quick && !QUICK[f.quick][1](s)) return false;
    return true;
  }
  const newest = (s) => s.last_born_at ? +new Date(s.last_born_at) : 0;
  const SORT = {
    issue: null,
    name: (a, b) => a.name.localeCompare(b.name),
    pending: (a, b) => b.links_pending - a.links_pending,
    recent: (a, b) => newest(b) - newest(a),
    recent_asc: (a, b) => (newest(a) || Infinity) - (newest(b) || Infinity),
    platform: (a, b) => platformName(a.platform).localeCompare(platformName(b.platform)) || a.name.localeCompare(b.name),
    platform_asc: (a, b) => platformName(b.platform).localeCompare(platformName(a.platform)) || a.name.localeCompare(b.name),
  };
  // Bấm đầu cột Platform / Ảnh / Video / Ngày: bấm lần nữa để đảo chiều.
  for (const kind of ['image', 'video']) {
    const count = (s) => s[kind === 'image' ? 'images' : 'videos'];
    SORT[kind] = (a, b) => (count(b) ?? -1) - (count(a) ?? -1);
    SORT[kind + '_asc'] = (a, b) => (count(a) ?? Infinity) - (count(b) ?? Infinity);
  }

  // URL giữ bộ lọc để Dash và Nguồn dùng chung.
  function keepFilters() {
    const url = new URL(location.href), q = new URLSearchParams();
    if (f.plat.size) q.set('plat', [...f.plat].join(','));
    if (f.quick) q.set('quick', f.quick);
    if (f.sort !== 'issue') q.set('sort', f.sort);
    const qs = q.toString() ? '?' + q : '';
    history.replaceState(null, '', url.pathname + qs);
    document.querySelectorAll('[data-keep-scope], .rail a.rail-icon-btn').forEach((a) => { a.href = a.getAttribute('href').split('?')[0] + qs; });
    return qs;
  }

  // Sidebar = lọc vấn đề và nền tảng.
  function renderFilters() {
    const row = (attr, key, on, label, count, empty) => `<button type="button" class="f-row${on ? ' on' : ''}${empty ? ' empty' : ''}" ${attr}="${esc(key)}"><span>${esc(label)}</span>${count}</button>`;
    const num = (v, warn) => `<b class="${warn ? 'gap' : ''}">${v}</b>`;
    let html = '<div class="f-head"><span>LỌC NHANH</span></div>';
    const qpool = sources.filter((s) => match(s, 'quick'));
    html += Object.entries(QUICK).map(([k, [label, test]]) => { const c = qpool.filter(test).length; return row('data-quick', k, f.quick === k, label, num(c, c > 0), !c); }).join('');
    const plats = {}; for (const s of sources.filter((s) => match(s, 'plat'))) plats[s.platform] = (plats[s.platform] || 0) + 1;
    const known = [...new Set([...sources.map((s) => s.platform)])].sort((a, b) => (plats[b] || 0) - (plats[a] || 0));
    html += '<div class="f-head"><span>PLATFORM</span></div>' + known.map((p) => row('data-plat', p, f.plat.has(p), platformName(p), num(plats[p] || 0), !plats[p])).join('');
    $('cr-filters').innerHTML = html;
    $('cr-count').textContent = n(sources.length);
  }

  function render() {
    if (!board) return;
    shown = sources.filter((s) => match(s));
    if (SORT[f.sort]) shown = [...shown].sort(SORT[f.sort]);
    renderFilters();
    keepFilters();
    const chips = [...[...f.plat].map(platformName), ...(f.quick ? [QUICK[f.quick][0]] : [])];
    $('cr-active').textContent = chips.length ? 'Đang lọc: ' + chips.join(' + ') : '';
    $('cr-clear').hidden = !chips.length;
    if ($('cr-chart')) renderDash(shown);
    if (document.querySelector('[data-source-table]')) renderSources(shown);
  }

  function renderDash(rows) {
    if(!board.complete) {
      for(const id of ['m-today','m-on','m-all','m-total','m-latest','cr-donut-total']) $(id).textContent='—';
      for(const id of ['m-today-split','m-off','m-total-split','m-latest-src']) $(id).textContent='';
      $('cr-chart').replaceChildren();$('cr-platforms').replaceChildren();$('cr-donut').style.background='var(--panel)';return;
    }
    const last = (kind) => rows.reduce((a, r) => a + r.by_day[kind].at(-1), 0);
    const total = (kind) => rows.reduce((a, r) => a + r[kind === 'image' ? 'images' : 'videos'], 0);
    const on = rows.filter((r) => r.enabled).length, all = rows.length;

    $('m-today').textContent = n(last('image') + last('video'));
    $('m-today-split').textContent = `${n(last('image'))} ảnh · ${n(last('video'))} video`;
    $('m-on').textContent = on; $('m-all').textContent = all;
    $('m-off').textContent = `${all - on} nguồn đang tắt`;
    $('m-total').textContent = n(total('image') + total('video'));
    $('m-total-split').textContent = `${n(total('image'))} ảnh · ${n(total('video'))} video`;
    const latest = rows.filter((r) => r.last_born_at).sort((a, b) => new Date(b.last_born_at) - new Date(a.last_born_at))[0];
    $('m-latest').textContent='—';$('m-latest-src').textContent='';
    if (latest) {
      const t = new Date(latest.last_born_at);
      $('m-latest').textContent = isToday(latest.last_born_at)
        ? `${two(t.getHours())}:${two(t.getMinutes())}`
        : dm(t);
      $('m-latest-src').textContent = latest.name;
    }

    // Biểu đồ: cùng khung toạ độ với mockup (x 48→678, y 330→32).
    const days = board.days;
    if(days.length) {
    const perDay = (kind) => days.map((_, i) => rows.reduce((a, r) => a + r.by_day[kind][i], 0));
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

  // Hạng PO chấm riêng cho ảnh/video (labels.json → media), hiện ở góc ô; rê chuột xem ghi chú.
  const tier = (s, kind) => { const m = (s.media || {})[kind]; return m && m.tier ? `<b class="cr-tier t-${esc(m.tier)}" title="${esc(m.note || '')}">${esc(m.tier)}</b>` : ''; };
  function mediaCard(s, kind) {
    const born = s[kind === 'image' ? 'images' : 'videos'], total = s[kind + '_total'];
    const number = (value) => value == null ? '—' : Number(value);
    const fill = total ? Math.min(100, born / total * 100) : 0;
    return `<button type="button" class="cr-card ${s.state === 'broken' ? 'broken' : born ? '' : 'none'}"><span class="num">${number(born)}<small>/${number(total)}</small></span>${tier(s, kind)}<span class="cr-bar"><i style="width:${fill}%"></i></span></button>`;
  }

  function renderSources(list) {
    const body = document.querySelector('[data-source-table] tbody');
    document.querySelectorAll('[data-sort-col]').forEach((th) => {
      const kind = th.dataset.sortCol, on = f.sort === kind || f.sort === kind + '_asc';
      th.classList.toggle('on', on);
      th.dataset.arrow = on ? (f.sort.endsWith('_asc') ? '↑' : '↓') : '↕';
    });
    body.innerHTML = list.map((s, i) => `<tr data-i="${i}" class="${s.enabled ? '' : 'off'}"><td><div class="cr-name"><span class="cr-mark p-${esc(s.platform)}"></span>${esc(s.name)}<span class="cr-flags">${flags(s)}</span></div></td><td class="cr-plat p-${esc(s.platform)}">${esc(platformName(s.platform))}</td><td>${mediaCard(s, 'image')}</td><td>${mediaCard(s, 'video')}</td><td class="cr-date">${day(s.last_born_at)}</td></tr>`).join('');
    $('source-result-count').textContent = board.complete ? `${list.length} / ${sources.length} nguồn` : `${list.length} nguồn đã đọc được · tổng chưa xác định`;
    $('source-empty').hidden = list.length !== 0 || !board.complete;
  }

  // Sự kiện gắn một lần.
  const flip = (set, v) => (set.has(v) ? set.delete(v) : set.add(v));
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-plat],[data-quick],#cr-clear');
    if (!el) return;
    if (el.id === 'cr-clear') { f.plat.clear(); f.quick = ''; }
    else if (el.dataset.plat) flip(f.plat, el.dataset.plat);
    else f.quick = f.quick === el.dataset.quick ? '' : el.dataset.quick;
    render();
  });
  $('cr-q').addEventListener('input', () => { f.q = $('cr-q').value.trim().toLocaleLowerCase('vi'); render(); });
  document.querySelectorAll('[data-sort-col]').forEach((th) => th.addEventListener('click', () => {
    const kind = th.dataset.sortCol;
    f.sort = f.sort === kind ? kind + '_asc' : kind;
    $('cr-sort').value = f.sort; render();
  }));
  $('cr-sort').value = f.sort;
  $('cr-sort').addEventListener('change', () => { f.sort = $('cr-sort').value; render(); });
  const dialog = $('source-detail');
  if (dialog) {
    document.querySelector('[data-source-table] tbody').addEventListener('click', (e) => {
      const tr = e.target.closest('tr');
      if (!tr) return;
      const r = shown[tr.dataset.i];
      $('source-detail-name').textContent = r.name;
      $('source-detail-platform').textContent = platformName(r.platform);
      $('source-detail-found').textContent = n(r.links_found);
      $('source-detail-assets').textContent = `${n(r.images)} ảnh · ${n(r.videos)} video`;
      $('source-detail-pending').textContent = n(r.links_pending);
      $('source-detail-last').textContent = day(r.last_born_at);
      $('source-detail-error').textContent = r.last_error ? `${r.last_error.reason}: ${r.last_error.detail} (${day(r.last_error.at)})` : '—';
      const media = r.media || {}, graded = ['image', 'video'].filter((k) => media[k]).map((k) => `${k === 'image' ? 'Ảnh' : 'Video'} ${media[k].tier || ''}: ${media[k].note || ''}`);
      $('source-detail-note').textContent = [r.note, ...graded].filter(Boolean).join(' · ') || '—';
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
      const failures=Object.values(data.errors);
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
