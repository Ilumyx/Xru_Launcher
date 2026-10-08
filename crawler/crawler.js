// Mặt chép từ mockup Crawler (js/crawler.js); số thật lấy từ /api/board. Chỉ đọc.
// Sidebar trái như Gate Dash: tất cả → nền tảng → nguồn. Phạm vi đang chọn nằm trên URL (?scope=) để Dash và Nguồn dùng chung.
(() => {
  let backend, board=null, allRows=[], sourceRows=[], sourceStatus=new URLSearchParams(location.search).get('status')||'all', disconnected=false;
  let scope=new URLSearchParams(location.search).get('scope')||'all';
  const open={};
  const LANE = { image: 'Ảnh', video: 'Video' };
  const PLATFORM = { facebook: 'Facebook', dvids: 'DVIDS', waralbum: 'War Album', reddit: 'Reddit', x: 'X', telegram: 'Telegram', rss: 'RSS' };
  const SWATCH = ['var(--accent)', 'var(--m-11)', 'var(--m-8)', 'var(--m-6)', 'var(--m-5)'];
  const $ = (id) => document.getElementById(id);
  const n = (v) => v == null ? '—' : Number(v).toLocaleString('en-US');
  const platformName = (p) => PLATFORM[p] || (p ? p[0].toUpperCase() + p.slice(1) : '—');
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const two = (v) => String(v).padStart(2, '0');
  const dm = (d) => `${two(d.getDate())}/${two(d.getMonth() + 1)}`;
  const day = (iso) => (iso ? `${dm(new Date(iso))}/${new Date(iso).getFullYear()}` : '—');
  const isToday = (iso) => iso && new Date(iso).toDateString() === new Date().toDateString();
  const stateText = (r) => (r.state === 'broken' ? 'Hỏng' : r.active ? 'Đang bật' : 'Đang tắt');
  const stateClass = (r) => (r.state === 'broken' ? 'cr-warn' : r.active ? 'cr-good' : 'cr-dim');
  const sum = (rows, key) => rows.reduce((a, r) => a + (r[key] || 0), 0);

  // Mỗi nguồn × mỗi làn thành một dòng.
  function laneRows(data) {
    const out = [];
    for (const row of data.rows) {
      for (const [lane, cell] of Object.entries(row.lanes)) out.push({ name: row.name, lane, ...cell, platform: cell.adapter });
    }
    return out;
  }

  // Phạm vi: "all" | "p:<nền tảng>" | "s:<nền tảng>:<tên nguồn>".
  function inScope(r) {
    if (scope === 'all') return true;
    const [kind, platform, ...name] = scope.split(':');
    return r.platform === platform && (kind === 'p' || r.name === name.join(':'));
  }
  function scopeTitle() {
    if (scope === 'all') return 'TẤT CẢ NGUỒN';
    const [kind, platform, ...name] = scope.split(':');
    return kind === 'p' ? platformName(platform).toUpperCase() : name.join(':');
  }
  function keepScope() {
    const q = scope === 'all' ? '' : `?scope=${encodeURIComponent(scope)}`;
    document.querySelectorAll('[data-keep-scope], .rail a.rail-icon-btn').forEach((a) => { a.href = a.getAttribute('href').split('?')[0] + q; });
    const url = new URL(location.href);
    if (scope === 'all') url.searchParams.delete('scope'); else url.searchParams.set('scope', scope);
    history.replaceState(null, '', url);
  }

  // Cây nguồn bên trái. Mỗi nguồn có thể có làn ảnh và làn video.
  function renderTree() {
    const q = $('cr-q').value.trim().toLocaleLowerCase('vi');
    const groups = {};
    for (const r of allRows) ((groups[r.platform] ||= {})[r.name] ||= []).push(r);
    const order = Object.entries(groups).sort((a, b) => Object.keys(b[1]).length - Object.keys(a[1]).length);
    const broken = (rows) => rows.filter((r) => r.state === 'broken').length;
    const sub = (rows) => { const k = broken(rows); return `${n(sum(rows, 'assets'))} kiện${k ? ` · <span class="cr-warn">${k} hỏng</span>` : ''}`; };
    const item = (key, name, subHtml, cls, arrow = '') =>
      `<div class="side-item ${cls}${scope === key ? ' is-active' : ''}" data-scope="${esc(key)}"><span class="n">${arrow}</span><div><div class="t">${esc(name)}</div><div class="s">${subHtml}</div></div></div>`;
    let html = item('all', 'Tất cả nguồn', `${n(new Set(allRows.map((r) => r.name)).size)} nguồn · ${sub(allRows)}`, 'is-all');
    for (const [platform, sources] of order) {
      const names = Object.keys(sources).filter((s) => !q || s.toLocaleLowerCase('vi').includes(q) || platformName(platform).toLocaleLowerCase('vi').includes(q));
      if (!names.length) continue;
      const rows = Object.values(sources).flat();
      html += item(`p:${platform}`, platformName(platform), `${n(Object.keys(sources).length)} nguồn · ${sub(rows)}`, 'is-group', open[platform] === false && !q ? '▸' : '▾');
      if (open[platform] === false && !q) continue;
      html += names.map((s) => {
        const lanes = sources[s];
        const line = lanes.map((r) => `<span class="${r.state === 'broken' ? 'cr-warn' : r.active ? '' : 'cr-off'}">${LANE[r.lane]} ${n(r.assets)}</span>`).join(' · ');
        return item(`s:${platform}:${s}`, s, line, 'is-child');
      }).join('');
    }
    $('cr-tree').innerHTML = html;
    $('cr-count').textContent = n(new Set(allRows.map((r) => r.name)).size);
  }

  function render() {
    if (!board) return;
    const rows = allRows.filter(inScope);
    renderTree();
    $('cr-scope').textContent = scopeTitle();
    keepScope();
    if ($('cr-chart')) renderDash(rows);
    if (document.querySelector('[data-source-table]')) renderSources(rows);
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

  // Mỗi nguồn hiện tên một lần; làn ảnh và video của nó là các dòng sát nhau ngay bên cạnh.
  function renderSources(rows) {
    const table = document.querySelector('[data-source-table]'), body = table.querySelector('tbody');
    sourceRows = rows;
    const initials = (s) => s.replace(/[^\p{L}\p{N} ]/gu, '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '··';
    const sources = new Map();
    rows.forEach((r, i) => { r.i = i; const key = `${r.platform}:${r.name}`; sources.set(key, [...(sources.get(key) || []), r]); });

    const filters = [...document.querySelectorAll('[data-status-filter]')];
    const count = { all: rows.length, on: rows.filter((r) => r.active).length, off: rows.filter((r) => !r.active).length };
    const label = { all: 'Tất cả', on: 'Đang bật', off: 'Đang tắt' };
    for (const b of filters) b.textContent = `${label[b.dataset.statusFilter]} · ${board.complete?count[b.dataset.statusFilter]:'—'}`;

    const keep = (r) => sourceStatus === 'all' || (sourceStatus === 'on') === r.active;
    let shown = 0, html = '';
    for (const lanes of sources.values()) {
      const seen = lanes.filter(keep);
      shown += seen.length;
      html += seen.map((r, k) => `<tr data-i="${r.i}" class="${k ? 'cr-lane-next' : 'cr-lane-first'}">${k ? '' : `<td rowspan="${seen.length}"><span class="cr-source-icon">${esc(initials(r.name))}</span><button class="cr-source-button">${esc(r.name)}</button></td>`}<td>${LANE[r.lane]}</td><td><span class="cr-health ${stateClass(r)}">${stateText(r)}</span></td><td>${n(r.urls_found)}</td><td>${n(r.assets)}</td><td class="${r.urls_pending ? 'cr-warn' : ''}">${n(r.urls_pending)}</td><td>${day(r.last_crawl_at)}</td></tr>`).join('');
    }
    body.innerHTML = html;
    for (const b of filters) b.setAttribute('aria-pressed', String(b.dataset.statusFilter === sourceStatus));
    $('source-result-count').textContent = board.complete?`${shown} / ${rows.length} làn nguồn`:`${shown} làn đã đọc được · tổng chưa xác định`;
    $('source-empty').hidden = shown !== 0 || !board.complete;
  }

  // Sự kiện gắn một lần.
  $('cr-q').addEventListener('input', renderTree);
  $('cr-tree').addEventListener('click', (e) => {
    const el = e.target.closest('[data-scope]');
    if (!el) return;
    const key = el.dataset.scope;
    if (el.classList.contains('is-group') && e.target.classList.contains('n')) { const p = key.slice(2); open[p] = open[p] === false; renderTree(); return; }
    scope = key; render();
  });
  for (const b of document.querySelectorAll('[data-status-filter]')) b.addEventListener('click', () => { sourceStatus = b.dataset.statusFilter; render(); });
  const dialog = $('source-detail');
  if (dialog) {
    document.querySelector('[data-source-table] tbody').addEventListener('click', (e) => {
      const tr = e.target.closest('tr');
      if (!tr) return;
      const r = sourceRows[tr.dataset.i];
      $('source-detail-name').textContent = r.name;
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
    const q = scope === 'all' ? '' : `?scope=${encodeURIComponent(scope)}`;
    if (event.key === '1') location.href = '/crawler/dash' + q;
    if (event.key === '2') location.href = '/crawler/sources' + q;
  });

  function error(message) { $('cr-error').textContent=message;$('cr-error').hidden=!message;$('cr-foot').textContent=message||'CHỈ ĐỌC · ẢNH + VIDEO'; }
  async function readBoard() {
    try {
      const r=await fetch(backend+'/api/board',{cache:'no-store',signal:AbortSignal.timeout(20000)}), data=await r.json();
      if(!Array.isArray(data.rows)) throw Error(data.error||'Backend chưa trả được dữ liệu.');
      board=data; allRows=laneRows(data);
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
