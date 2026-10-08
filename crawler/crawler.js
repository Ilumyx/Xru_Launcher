// Mặt chép từ mockup Crawler (js/crawler.js); số thật lấy từ /api/board. Chỉ đọc.
(() => {
  let backend, sourceComplete=true, sourceRows=[], sourceStatus=new URLSearchParams(location.search).get('status')||'all', disconnected=false;
  const LANE = { image: 'Ảnh', video: 'Video' };
  const PLATFORM = { facebook: 'Facebook', dvids: 'DVIDS', waralbum: 'War Album', reddit: 'Reddit', x: 'X', telegram: 'Telegram', rss: 'RSS' };
  const SWATCH = ['var(--accent)', 'var(--m-11)', 'var(--m-8)', 'var(--m-6)', 'var(--m-5)'];
  const $ = (id) => document.getElementById(id);
  const n = (v) => v == null ? '—' : Number(v).toLocaleString('en-US');
  const platformName = (p) => PLATFORM[p] || (p ? p[0].toUpperCase() + p.slice(1) : '—');
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const two = (v) => String(v).padStart(2, '0');
  const dm = (d) => `${two(d.getDate())}/${two(d.getMonth() + 1)}`;
  const day = (iso) => (iso ? `${dm(new Date(iso))}/${new Date(iso).getFullYear()}` : '—');
  const isToday = (iso) => iso && new Date(iso).toDateString() === new Date().toDateString();

  // Mỗi nguồn × mỗi làn thành một dòng, như bảng mockup.
  function laneRows(board) {
    const out = [];
    for (const row of board.rows) {
      for (const [lane, cell] of Object.entries(row.lanes)) out.push({ name: row.name, lane, ...cell, platform: cell.adapter });
    }
    return out;
  }

  function renderDash(board) {
    if(!board.complete) {
      for(const id of ['m-today','m-on','m-all','m-total','m-latest','cr-donut-total']) $(id).textContent='—';
      for(const id of ['m-today-split','m-off','m-total-split','m-latest-src']) $(id).textContent='';
      $('cr-chart').replaceChildren();$('cr-platforms').replaceChildren();$('cr-donut').style.background='var(--panel)';return;
    }
    const s = board.summary, rows = laneRows(board);
    const last = (lane) => rows.filter((r) => r.lane === lane).reduce((a, r) => a + (r.by_day.at(-1) || 0), 0);
    const total = (lane) => rows.filter((r) => r.lane === lane).reduce((a, r) => a + r.assets, 0);
    const on = (s.active.image || 0) + (s.active.video || 0), all = (s.total.image || 0) + (s.total.video || 0);

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
    svg += `<g id="cr-series-total" class="cr-series total"><polygon class="area" points="48,330 ${pts(tot)} 678,330"/><polyline class="line" points="${pts(tot)}"/>${end(tot)}</g>`;
    svg += `<g id="cr-series-video" class="cr-series video"><polyline class="line" points="${pts(vid)}"/>${end(vid)}</g>`;
    svg += `<g id="cr-series-image" class="cr-series image"><polyline class="line" points="${pts(img)}"/>${end(img)}</g>`;
    svg += days.map((d, i) => `<text x="${X(i).toFixed(1)}" y="360" text-anchor="middle">${d.slice(8, 10)}/${d.slice(5, 7)}</text>`).join('');
    $('cr-chart').innerHTML = svg;
    } else $('cr-chart').replaceChildren();

    // Donut theo nền tảng.
    const byPlat = {};
    for (const r of rows) byPlat[r.platform] = (byPlat[r.platform] || 0) + r.assets;
    const plats = Object.entries(byPlat).sort((a, b) => b[1] - a[1]), sum = plats.reduce((a, [, v]) => a + v, 0);
    let at = 0;
    const stops = plats.map(([, v], i) => { const from = at; at += (sum ? v / sum : 0) * 100; return `${SWATCH[Math.min(i, SWATCH.length - 1)]} ${from}% ${at}%`; });
    $('cr-donut').style.background = sum ? `conic-gradient(${stops.join(', ')})` : 'var(--panel)';
    $('cr-donut-total').textContent = n(sum);
    $('cr-platforms').innerHTML = plats.map(([p, v], i) =>
      `<div><span><i style="background:${SWATCH[Math.min(i, SWATCH.length - 1)]}"></i>${esc(platformName(p))}</span><b>${n(v)}</b><small>${((sum ? v / sum : 0) * 100).toFixed(1)}%</small></div>`).join('');
  }

  // Mỗi nguồn hiện tên một lần; làn ảnh và video của nó là các dòng sát nhau ngay bên cạnh.
  function renderSources(board) {
    const table = document.querySelector('[data-source-table]'), body = table.querySelector('tbody');
    sourceComplete=board.complete;sourceRows=laneRows(board); const rows=sourceRows;
    rows.forEach((r, i) => { r.i = i; });
    const stateText = (r) => (r.state === 'broken' ? 'Hỏng' : r.active ? 'Đang bật' : 'Đang tắt');
    const stateClass = (r) => (r.state === 'broken' ? 'cr-warn' : r.active ? 'cr-good' : 'cr-dim');
    const initials = (s) => s.replace(/[^\p{L}\p{N} ]/gu, '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '··';
    const sources = board.rows.map((row) => rows.filter((r) => r.name === row.name && row.lanes[r.lane]));

    const filters = [...document.querySelectorAll('[data-status-filter]')], search = $('source-search');
    const count = { all: rows.length, on: rows.filter((r) => r.active).length, off: rows.filter((r) => !r.active).length };
    const label = { all: 'Tất cả', on: 'Đang bật', off: 'Đang tắt' };
    for (const b of filters) b.textContent = `${label[b.dataset.statusFilter]} · ${sourceComplete?count[b.dataset.statusFilter]:'—'}`;

    function filter() {
      const q = search.value.trim().toLocaleLowerCase('vi');
      const keep = (r) => (sourceStatus === 'all' || (sourceStatus === 'on') === r.active)
        && `${r.name} ${platformName(r.platform)} ${LANE[r.lane]}`.toLocaleLowerCase('vi').includes(q);
      let shown = 0, html = '';
      for (const lanes of sources) {
        const seen = lanes.filter(keep);
        shown += seen.length;
        html += seen.map((r, k) => `<tr data-i="${r.i}" class="${k ? 'cr-lane-next' : 'cr-lane-first'}">${k ? '' : `<td rowspan="${seen.length}"><span class="cr-source-icon">${esc(initials(r.name))}</span><button class="cr-source-button">${esc(r.name)}</button></td><td rowspan="${seen.length}">${esc(platformName(r.platform))}</td>`}<td>${LANE[r.lane]}</td><td><span class="cr-health ${stateClass(r)}">${stateText(r)}</span></td><td>${esc(r.tier || '—')}</td><td>${n(r.assets)}</td><td>${day(r.last_crawl_at)}</td></tr>`).join('');
      }
      body.innerHTML = html;
      for (const b of filters) b.setAttribute('aria-pressed', String(b.dataset.statusFilter === sourceStatus));
      $('source-result-count').textContent = sourceComplete?`${shown} / ${rows.length} nguồn`:`${shown} nguồn đã đọc được · tổng chưa xác định`;
      $('source-empty').hidden = shown !== 0 || !sourceComplete;
    }
    if(!table.dataset.bound) {
    table.dataset.bound='1';
    search.addEventListener('input', filter);
    for (const b of filters) b.addEventListener('click', () => { sourceStatus = b.dataset.statusFilter; filter(); });

    const dialog = $('source-detail');
    body.addEventListener('click', (e) => {
      const tr = e.target.closest('tr');
      if (!tr) return;
      const r = sourceRows[tr.dataset.i];
      $('source-detail-name').textContent = r.name;
      $('source-detail-url').textContent = r.locator || '—';
      $('source-detail-kind').textContent = LANE[r.lane];
      $('source-detail-state').textContent = stateText(r);
      $('source-detail-tier').textContent = r.tier || '—';
      $('source-detail-assets').textContent = n(r.assets);
      $('source-detail-last').textContent = day(r.last_crawl_at);
      $('source-detail-error').textContent = r.error ? `${r.error.short} (${day(r.error.at)})` : '—';
      $('source-detail-note').textContent = r.po_note || '—';
      dialog.showModal();
    });
    $('source-detail-close').addEventListener('click', () => dialog.close());
    }
    filter();
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
    if (event.key === '1') location.href = '/crawler/dash';
    if (event.key === '2') location.href = '/crawler/sources';
  });

  function error(message) { $('cr-error').textContent=message;$('cr-error').hidden=!message;$('cr-foot').textContent=message||'CHỈ ĐỌC · ẢNH + VIDEO'; }
  async function readBoard() {
    try {
      const r=await fetch(backend+'/api/board',{cache:'no-store',signal:AbortSignal.timeout(20000)}), board=await r.json();
      if(!Array.isArray(board.rows)) throw Error(board.error||'Backend chưa trả được dữ liệu.');
      if ($('cr-chart')) renderDash(board);
      if (document.querySelector('[data-source-table]')) renderSources(board);
      const failures=Object.entries(board.lane_errors).map(([lane,reason])=>`${LANE[lane]}: ${reason}`);
      error(failures.length?'THIẾU DỮ LIỆU — '+failures.join(' · '):'');disconnected=!board.complete;
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
