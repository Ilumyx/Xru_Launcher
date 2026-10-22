// Màn Nguồn Crawler theo bản vẽ PO (design/ORDER_crawler_sources.md). Chỉ đọc /api/board; mọi thao tác cập nhật tại chỗ.
// Một nguồn một dòng, chia nhóm theo trạng thái; bấm dòng mở sidebar phải chi tiết (được phép đè lên bảng).
(() => {
  let backend, board = null, sources = [], shown = [], picked = null, disconnected = false, readAt = '', fault = null;
  const params = new URLSearchParams(location.search);
  const f = { plat: new Set((params.get('plat') || '').split(',').filter(Boolean)), quick: params.get('quick') || '', sort: params.get('sort') || 'tier', q: '' };
  const open = { look: true, run: true, ok: false, new: false };
  const KINDS = ['image', 'video'];
  const $ = (id) => document.getElementById(id);
  const t = (key, fill) => { const text = window.XRU_I18N.t(key); return fill ? text.replace(/\{(\w+)\}/g, (_, name) => fill[name]) : text; };
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
    ['stuck', 'cr_st_stuck', 'look', (s) => KINDS.some((k) => (s.errors || {})[k])],
    ['run', 'cr_g_run', 'run', (s) => runs(s).some((r) => r.state === 'running')],
    ['wait', 'cr_st_wait', 'look', (s) => s.waiting],
    ['new', 'cr_g_new', 'new', (s) => !runs(s).length && !s.last_born_at],
    ['stale', 'cr_st_stale', 'look', (s) => s.last_born_at && daysSince(s.last_born_at) > staleLimit(s)],
    ['scout', 'cr_st_scout', 'look', (s) => KINDS.some((k) => noScout(s, k))],
    ['ok', 'cr_st_ok', 'ok', () => true],
  ];
  const stateOf = (s) => STATES.find(([, , , test]) => test(s));
  // PO 22/10: Ổn trên cùng, Cần nhìn dưới cùng.
  const GROUPS = [['ok', 'cr_g_ok'], ['run', 'cr_g_run'], ['new', 'cr_g_new'], ['look', 'cr_g_look']];
  const QUICK = { look: ['cr_q_look', (s) => s.st[2] === 'look'], stuck: ['cr_q_stuck', (s) => s.st[0] === 'stuck'], stale: ['cr_q_stale', (s) => s.st[0] === 'stale'], scout: ['cr_q_scout', (s) => s.st[0] === 'scout'], wait: ['cr_q_waiting', (s) => s.st[0] === 'wait'] };
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
    const tier = m.tier ? `<b class="tier t-${esc(m.tier)}" title="${esc(m.note || t('cr_tier', { tier: m.tier }))}">${esc(m.tier)}</b>` : `<b class="tier none" title="${t('cr_unrated')}"></b>`;
    if (o.supported === false) return `<div class="mc off">${tier}<span class="dim">—</span><span class="dim">—</span><span class="dim">—</span></div>`;
    const plan = o.supports_count && o.total != null ? n(o.total) : '—';
    const scout = never ? '—' : scoutText(o), down = never ? '—' : n(s[k === 'image' ? 'images' : 'videos']);
    return `<div class="mc${on ? '' : ' off'}">${tier}<span class="plan${plan === '—' ? ' dim' : ''}">${plan}</span><span class="scout${noScout(s, k) && s.st[0] === 'scout' ? ' red' : ''}${never ? ' dim' : ''}">${scout}</span><span class="down${never ? ' dim' : ''}">${down}</span></div>`;
  }

  function row(s) {
    const d = daysSince(s.last_born_at), [key, label] = s.st;
    const id = `${s.platform}|${s.cluster_key}`;
    return `<tr data-id="${esc(id)}" class="${s.enabled ? '' : 'off'}${picked === id ? ' picked' : ''}"><td>${arm(s)}</td><td class="nm" title="${esc(s.name)}">${esc(s.name)}</td><td class="code">${country(s)}</td><td class="code">${platCode(s.platform)}</td><td>${mediaCell(s, 'image')}</td><td class="split">${mediaCell(s, 'video')}</td><td class="age${key === 'stale' ? ' red' : ''}">${d == null ? '—' : d + t('cr_day_abbr')}</td><td><span class="badge b-${key}">${key === 'run' ? '<i class="live"></i>' : ''}${t(label)}</span></td></tr>`;
  }

  function renderFilters() {
    const btn = (attr, key, on, label, c, red) => `<button type="button" class="f-row${on ? ' on' : ''}${c ? '' : ' empty'}" ${attr}="${esc(key)}"><span>${esc(label)}</span><b class="${red && c ? 'red' : ''}">${c}</b></button>`;
    const qpool = sources.filter((s) => match(s, 'quick'));
    let html = `<div class="f-head">${t('cr_f_quick')}</div>` + Object.entries(QUICK).map(([k, [label, test]]) => btn('data-quick', k, f.quick === k, t(label), qpool.filter(test).length, k !== 'wait')).join('');
    const plats = {};
    for (const s of sources.filter((s) => match(s, 'plat'))) plats[s.platform] = (plats[s.platform] || 0) + 1;
    const all = [...new Set(sources.map((s) => s.platform))].sort((a, b) => (plats[b] || 0) - (plats[a] || 0));
    html += `<div class="f-head">${t('cr_f_platform_n', { n: all.length })}</div>` + all.map((p) => btn('data-plat', p, f.plat.has(p), platName(p), plats[p] || 0)).join('');
    $('src-filters').innerHTML = html;
    $('src-count').textContent = n(sources.length);
  }

  function render() {
    if (!board) return;
    renderFilters();
    keepFilters();
    $('src-stamp').textContent = readAt && t('cr_updated') + ' ' + readAt;
    const scope = sources.filter((s) => match(s, 'quick'));
    for (const [g, id] of [['look', 't-look'], ['run', 't-run'], ['ok', 't-ok'], ['new', 't-new']]) $(id).textContent = board.complete ? n(scope.filter((s) => s.st[2] === g).length) : '—';
    shown = sources.filter((s) => match(s));
    const filtering = !!(f.q || f.plat.size || f.quick), order = STATES.map(([k]) => k);
    let html = '';
    for (const [g, label] of GROUPS) {
      const list = shown.filter((s) => s.st[2] === g).sort((a, b) => (g === 'look' ? order.indexOf(a.st[0]) - order.indexOf(b.st[0]) : 0) || SORT[f.sort](a, b));
      if (!list.length) continue;
      const isOpen = filtering || open[g];
      html += `<tr class="grp g-${g}" data-group="${g}" tabindex="0"><td colspan="8"><span class="chev">${isOpen ? '▾' : '▸'}</span>${t(label)} <b>${list.length}</b></td></tr>`;
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

  // Bộ lọc nằm trên URL; Dash dùng chung nền tảng. Link rail sửa ở menu XRU_RAILS (rail vẽ lại cả khi đổi ngôn ngữ); link trong trang sửa tại chỗ.
  function keepFilters() {
    const q = new URLSearchParams();
    if (f.plat.size) q.set('plat', [...f.plat].join(','));
    if (f.quick) q.set('quick', f.quick);
    if (f.sort !== 'tier') q.set('sort', f.sort);
    const qs = q.toString() ? '?' + q : '';
    history.replaceState(null, '', location.pathname + qs);
    const plat = f.plat.size ? `?plat=${encodeURIComponent([...f.plat].join(','))}` : '';
    document.querySelectorAll('[data-keep]').forEach((a) => { a.href = a.getAttribute('href').split('?')[0] + plat; });
    window.XRU_RAILS.crawler.carry((key) => (key === 'dash' ? plat : qs));
    return qs;
  }

  // Sidebar phải: mọi chi tiết của nguồn. Đè lên bảng cũng được.
  const RUN_STATE = { running: 'cr_rs_running', done: 'cr_rs_done', failed: 'cr_rs_failed', interrupted: 'cr_rs_interrupted', waiting_links: 'cr_rs_waiting_links' };
  const op = (r) => (r ? `${stamp(r.started_at)} → ${r.ended_at ? stamp(r.ended_at) : '…'} · ${RUN_STATE[r.state] ? t(RUN_STATE[r.state]) : r.state}${r.added != null ? ` · +${n(r.added)}` : ''}` : '—');
  function showDetail(s) {
    picked = s ? `${s.platform}|${s.cluster_key}` : null;
    $('src-detail').hidden = !s;
    document.querySelectorAll('#src-rows tr[data-id]').forEach((tr) => tr.classList.toggle('picked', tr.dataset.id === picked));
    if (!s) return;
    $('d-plat').textContent = `${platName(s.platform)} · ${country(s)}`;
    $('d-name').textContent = s.name;
    $('d-sub').innerHTML = `<span class="badge b-${s.st[0]}">${t(s.st[1])}</span>${s.enabled ? '' : `<span class="badge b-off">${t('cr_d_off')}</span>`}${(s.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join('')}`;
    const limit = staleLimit(s);
    const kinds = KINDS.map((k) => {
      const o = s.operations?.[k] || {}, m = (s.media || {})[k] || {}, on = onKinds(s).includes(k), kind = t('cr_k_' + k);
      if (o.supported === false) return `<section class="d-kind off"><h3>${t('cr_k_none', { kind })}</h3></section>`;
      const delta = o.total_delta == null ? '—' : `${o.total_delta >= 0 ? '+' : ''}${n(o.total_delta)}`;
      const pause = o.rest_until ? t('cr_rest_until', { t: stamp(o.rest_until) }) : o.wait_until ? t('cr_wait_until', { t: stamp(o.wait_until) }) : t('cr_none');
      return `<section class="d-kind${on ? '' : ' off'}"><h3>${kind} · ${t(on ? 'cr_on' : 'cr_off')}${m.tier ? ` <b class="tier t-${esc(m.tier)}">${esc(m.tier)}</b>` : ''}</h3>
        <div class="d-nums"><div><span>plan</span><b>${o.supports_count && o.total != null ? n(o.total) : '—'}</b></div><div><span>scout</span><b>${o.found == null ? '—' : scoutText(o)}</b></div><div><span>download</span><b>${n(s[k === 'image' ? 'images' : 'videos'])}</b></div><div><span>${t('cr_pending')}</span><b>${n(o.pending)}</b></div></div>
        <dl><dt>${t('cr_d_last_scout')}</dt><dd>${op(o.last_scout)}</dd><dt>${t('cr_d_delta')}</dt><dd>${delta}${o.bottom_reached ? t('cr_bottom') : ''}</dd><dt>${t('cr_d_last_run')}</dt><dd>${op(o.last_run)}</dd><dt>${t('cr_d_today7')}</dt><dd>${n(o.today)} · ${n(o.new_7d)}</dd><dt>${t('cr_d_error')}</dt><dd class="${o.error ? 'red' : ''}">${o.error ? esc(`[E] ${o.last_error?.reason || ''} ${o.last_error?.detail || ''}`) : t('cr_none')}</dd><dt>${t('cr_d_rest')}</dt><dd>${pause}</dd></dl>
        ${m.note ? `<p class="d-note">${esc(m.note)}</p>` : ''}</section>`;
    }).join('');
    const shots = s.shots || [], link = sourceUrl(s);
    $('d-body').innerHTML = `<dl class="d-facts"><dt>${t('cr_d_last_crawl')}</dt><dd>${s.last_born_at ? `${stamp(s.last_born_at)} · ${t('cr_days_ago', { n: daysSince(s.last_born_at) })}` : '—'}</dd><dt>${t('cr_d_stale_limit')}</dt><dd>${limit === Infinity ? t('cr_not_counted') : t('cr_n_days', { n: limit })}</dd></dl>
      ${kinds}
      ${s.note ? `<section><h3>${t('cr_d_note')}</h3><p class="d-note">${esc(s.note)}</p></section>` : ''}
      ${shots.length ? `<section><h3>${t('cr_d_shots')}</h3><div class="d-shots">${shots.map((name) => `<button type="button" data-shot><img loading="lazy" src="${backend}/api/shots/${encodeURIComponent(name)}" alt=""></button>`).join('')}</div></section>` : ''}
      ${link ? `<a class="d-link" href="${esc(link)}" target="_blank" rel="noopener noreferrer">${t('cr_d_open')}</a>` : ''}`;
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
    const el = e.target.closest('[data-plat],[data-quick],[data-sort],[data-group],#src-rows tr[data-id],[data-shot]');
    if (!el) return;
    if (el.dataset.plat) flip(f.plat, el.dataset.plat);
    else if (el.dataset.quick) f.quick = f.quick === el.dataset.quick ? '' : el.dataset.quick;
    else if (el.dataset.sort) { const k = el.dataset.sort; f.sort = f.sort === k ? k + '_asc' : k; $('src-sort').value = SORT[f.sort] && $('src-sort').querySelector(`[value="${f.sort}"]`) ? f.sort : $('src-sort').value; }
    else if (el.dataset.group) { if (f.q || f.plat.size || f.quick) return; open[el.dataset.group] = !open[el.dataset.group]; }
    else if (el.hasAttribute('data-shot')) { $('shot-view-img').src = el.querySelector('img').src; return $('shot-view').showModal(); }
    else { const s = sources.find((x) => `${x.platform}|${x.cluster_key}` === el.dataset.id); return showDetail(picked === el.dataset.id ? null : s); }
    render();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.dataset?.group) e.target.click(); });
  $('shot-view').addEventListener('click', () => $('shot-view').close());
  $('src-q').addEventListener('input', () => { f.q = $('src-q').value.trim().toLocaleLowerCase('vi'); render(); });
  $('src-sort').value = $('src-sort').querySelector(`[value="${f.sort}"]`) ? f.sort : 'tier';
  $('src-sort').addEventListener('change', () => { f.sort = $('src-sort').value; render(); });

  // Câu lỗi lưu dạng khóa chữ + phần Backend trả (không dịch) để vẽ lại được khi đổi ngôn ngữ.
  function paintError() { const message = fault ? t(fault.key) + fault.extra : ''; $('src-error').textContent = message; $('src-error').hidden = !message; }
  function error(key, extra = '') { fault = key ? { key, extra } : null; paintError(); }
  async function readBoard() {
    try {
      const r = await fetch(backend + '/api/board', { cache: 'no-store', signal: AbortSignal.timeout(20000) }), data = await r.json();
      if (!Array.isArray(data.rows)) throw Error(data.error || t('cr_err_nodata'));
      board = data;
      sources = data.rows.map((row) => { const s = { ...row, name: row.display_name }; s.st = stateOf(s); return s; });
      readAt = stamp(new Date().toISOString());
      render();
      const failures = Object.values(data.errors || {});
      failures.length ? error('cr_err_missing', failures.join(' · ')) : error();
      disconnected = !data.complete;
    } catch (e) { disconnected = true; error('cr_err_down_read', e.message); }
  }
  window.addEventListener('focus', () => { if (backend) readBoard(); });
  let polling = false;
  setInterval(async () => {
    if (!backend || polling || document.hidden) return;
    polling = true;
    try { const r = await fetch(backend + '/api/health', { cache: 'no-store', signal: AbortSignal.timeout(3000) }); if (!r.ok) throw Error('HTTP ' + r.status); if (disconnected) await readBoard(); }
    catch { disconnected = true; error('cr_err_down'); }
    finally { polling = false; }
  }, 5000);
  fetch('/ui-config', { cache: 'no-store' }).then((r) => r.json()).then((c) => { backend = c.crawler_backend; readBoard(); }).catch(() => error('cr_err_config'));
  // Đổi ngôn ngữ: chữ do JS vẽ (bảng, lọc, chi tiết, câu lỗi) vẽ lại theo; chữ tĩnh trong HTML do kit/i18n lo.
  window.addEventListener('xru-lang-applied', () => { paintError(); render(); });
})();
