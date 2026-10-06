// XRU GATE DASH — mockup, số liệu minh hoạ. Bản thật: lõi Gate xuất các số này, trang chỉ vẽ.
// Ba câu hỏi: (1) hồ sơ đang nằm ở cửa nào, (2) máy bắt đúng/lộn/hụt bao nhiêu, (3) ca nào sai để soi lại.
(() => {
  const TYPES = { music: 'Nhạc', dup: 'Trùng', wm: 'Watermark', text: 'Chữ chèn' };

  const DATA = {
    video: {
      funnel: { wait: 2410, flag: 36, detain: 2226, machineDetain: 1840, accept: 880, purge: 74 },
      // [loại, máy bắt, PO đã xem, đúng, bắt lộn, hụt]
      score: [['music', 849, 312, 241, 71, 18], ['dup', 213, 120, 112, 8, 31], ['wm', 186, 150, 96, 54, 12], ['text', 36, 36, 30, 6, 44]],
      sources: [['Tankers', 650, 18, 350, 130, 5, 12], ['F-35 Lightning II JPO', 480, 10, 420, 180, 30, 9], ['MIKN', 120, 8, 90, 30, 7, 6], ['Các nguồn video khác', 1160, 0, 1366, 540, 32, 8]],
      quality: { main: '18:42:36', label: 'TỔNG THỜI LƯỢNG', bars: [['Dưới 1 phút', 62], ['1–5 phút', 29], ['Trên 5 phút', 9]], facts: [['Đọc được độ phân giải', '5,602 / 5,626'], ['Thiếu tiêu đề', '128'], ['Thiếu chú thích', '462']] },
      page: 'gate_video.html',
    },
    image: {
      funnel: { wait: 548, flag: 12, detain: 24, machineDetain: 9, accept: 308, purge: 12 },
      score: [['music', null], ['dup', 4, 4, 4, 0, 2], ['wm', 9, 9, 7, 2, 5], ['text', 3, 3, 3, 0, 1]],
      sources: [['1st Slaughterhouse', 406, 6, 12, 140, 8, 4], ['MIKN', 87, 4, 8, 100, 2, 3], ['War Album', 50, 2, 4, 60, 2, 4], ['Tom Whitworth Photography', 5, 0, 0, 8, 0, 2]],
      quality: { main: '904', label: 'HỒ SƠ ẢNH', bars: [['Ngang', 58], ['Dọc', 34], ['Vuông', 8]], facts: [['Đọc được độ phân giải', '898 / 904'], ['Thiếu tiêu đề', '42'], ['Thiếu chú thích', '116']] },
      page: 'gate_image.html',
    },
  };

  // Ca sai: fp = máy cắm cờ nhưng PO cho qua (bắt lộn); fn = máy cho qua nhưng PO giữ (hụt).
  const CASES = [
    { kind: 'video', wrong: 'fp', type: 'wm', title: 'Logo đơn vị trên quân phục', source: 'MIKN', meta: '1080 × 1920 · 00:28', machine: 'Watermark 0.71 · góc dưới phải', po: 'Accept — logo in trên áo, không phải watermark', when: '19:42', ev: 'BADGE' },
    { kind: 'video', wrong: 'fp', type: 'music', title: 'Tiếng động cơ bị nghe thành nhạc', source: 'F-35 Lightning II JPO', meta: '1920 × 1080 · 01:12', machine: 'Nhạc 0.64 · 00:18–00:46', po: 'Accept — âm thanh gốc, tiếng máy bay', when: '19:30', ev: 'WAVE' },
    { kind: 'video', wrong: 'fp', type: 'wm', title: 'Đồng hồ góc màn hình camera', source: 'Tankers', meta: '1280 × 720 · 00:51', machine: 'Watermark 0.58 · góc trên trái', po: 'Accept — dấu giờ của camera', when: '18:55', ev: 'TIME' },
    { kind: 'video', wrong: 'fp', type: 'dup', title: 'Hai góc quay cùng một cuộc diễu hành', source: 'Các nguồn khác', meta: '1920 × 1080 · 00:40', machine: 'Trùng 0.81 · với clip 0417', po: 'Accept — cảnh giống nhưng là hai clip khác', when: '18:20', ev: 'PAIR' },
    { kind: 'video', wrong: 'fn', type: 'text', title: 'Phụ đề cháy chữ ở nửa dưới', source: 'The North Star Air Show', meta: '1920 × 1080 · 00:52', machine: 'Cho qua · chữ 0.22', po: 'Detain — phụ đề che nửa khung hình', when: '19:38', ev: 'TEXT' },
    { kind: 'video', wrong: 'fn', type: 'dup', title: 'Bản re-up đã cắt 2 giây đầu', source: 'Tankers', meta: '720 × 1280 · 00:32', machine: 'Cho qua · trùng 0.41', po: 'Detain — trùng clip 1183', when: '19:02', ev: 'PAIR' },
    { kind: 'video', wrong: 'fn', type: 'music', title: 'Nhạc nền rất nhỏ dưới tiếng súng', source: 'MIKN', meta: '1080 × 1920 · 01:05', machine: 'Cho qua · nhạc 0.31', po: 'Detain — có nhạc nền suốt clip', when: '17:44', ev: 'WAVE' },
    { kind: 'image', wrong: 'fp', type: 'wm', title: 'Chữ ký tác giả trên ảnh lưu trữ', source: 'War Album', meta: '4195 × 2796', machine: 'Watermark 0.66 · góc dưới phải', po: 'Accept — chữ ký gốc trên bản in', when: '16:10', ev: 'SIGN' },
    { kind: 'image', wrong: 'fn', type: 'wm', title: 'Logo mờ giữa ảnh', source: '1st Slaughterhouse', meta: '4056 × 2738', machine: 'Cho qua · watermark 0.18', po: 'Detain — logo trong suốt giữa khung', when: '15:32', ev: 'LOGO' },
    { kind: 'image', wrong: 'fn', type: 'dup', title: 'Bản scan khác của cùng một ảnh', source: 'MIKN', meta: '2533 × 4063', machine: 'Cho qua · trùng 0.37', po: 'Detain — đã có bản rõ hơn', when: '14:05', ev: 'PAIR' },
  ];

  const $ = (id) => document.getElementById(id);
  const n = (v) => v.toLocaleString('en-US');
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : null);
  const state = { kind: 'video', wrong: 'fp', type: null, pick: 0 };

  function press(selector, value, attr) {
    document.querySelectorAll(selector).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset[attr] === value)));
  }

  function funnel(d) {
    const f = d.funnel;
    const total = f.wait + f.flag + f.detain + f.accept + f.purge;
    const cols = [
      ['WAIT', f.wait, 'chờ PO xem', 'wait'],
      ['MACHINE FLAG', f.flag, 'máy cắm cờ, chờ PO', 'flag'],
      ['DETAIN', f.detain, `máy giữ ${n(f.machineDetain)} · PO giữ ${n(f.detain - f.machineDetain)}`, 'detain'],
      ['ACCEPT', f.accept, 'qua cửa', 'accept'],
      ['PURGE', f.purge, 'loại bỏ', 'purge'],
    ];
    $('gd-funnel').innerHTML = cols.map(([label, v, sub, key]) =>
      `<div class="gd-step${key === 'wait' ? ' is-wait' : ''}"><span class="gd-label">${label}</span>` +
      `<b>${n(v)}</b><p>${sub}</p><small>${pct(v, total)}%</small></div>`).join('');
    $('gd-flow').innerHTML = `<span class="gd-label">${n(total)} HỒ SƠ · ĐANG NẰM Ở CỬA NÀO</span><div>` +
      cols.map(([, v, , key]) => `<i class="f-${key}" style="flex:${v}"></i>`).join('') + '</div>';
  }

  function score(d) {
    const rows = d.score.filter((r) => r[1] !== null);
    const precisions = rows.map((r) => pct(r[3], r[2]));
    const recalls = rows.map((r) => pct(r[3], r[3] + r[5]));
    const worstP = Math.min(...precisions), worstR = Math.min(...recalls);
    $('gd-score').innerHTML = d.score.map((r) => {
      const [type] = r;
      if (r[1] === null) return `<tr class="is-na"><td>${TYPES[type]}</td><td colspan="7">không áp dụng cho ${state.kind === 'image' ? 'ảnh' : 'video'}</td></tr>`;
      const [, caught, seen, right, fp, fn] = r;
      const p = pct(right, seen), rc = pct(right, right + fn);
      const meter = (v, worst) => `<span class="gd-pct${v === worst ? ' is-worst' : ''}"><b>${v}%</b><i><s style="width:${v}%"></s></i></span>`;
      return `<tr data-type="${type}" class="${state.type === type ? 'is-on' : ''}"><td>${TYPES[type]}</td><td>${n(caught)}</td>` +
        `<td>${n(seen)}<small> / ${n(caught)}</small></td><td>${n(right)}</td><td>${n(fp)}</td><td>${n(fn)}</td>` +
        `<td>${meter(p, worstP)}</td><td>${meter(rc, worstR)}</td></tr>`;
    }).join('');
    $('gd-score').querySelectorAll('tr[data-type]').forEach((tr) => tr.addEventListener('click', () => {
      state.type = state.type === tr.dataset.type ? null : tr.dataset.type;
      state.pick = 0;
      render();
    }));
  }

  function cases(d) {
    const list = CASES.filter((c) => c.kind === state.kind && c.wrong === state.wrong && (!state.type || c.type === state.type));
    $('gd-filter').innerHTML = state.type
      ? `Đang lọc: <b>${TYPES[state.type]}</b> <button id="gd-clear">bỏ lọc ×</button>`
      : 'Bấm một dòng ở bảng trên để lọc theo loại cờ.';
    $('gd-clear')?.addEventListener('click', () => { state.type = null; state.pick = 0; render(); });
    $('gd-cases').innerHTML = list.length
      ? list.map((c, i) => `<button class="gd-case-row${i === state.pick ? ' is-on' : ''}" data-i="${i}">` +
          `<span class="gd-case-type">${TYPES[c.type]}</span><span class="gd-case-title">${c.title}</span>` +
          `<span class="gd-case-src">${c.source}</span><time>${c.when}</time></button>`).join('')
      : '<p class="gd-empty">Không có ca nào.</p>';
    $('gd-cases').querySelectorAll('[data-i]').forEach((b) => b.addEventListener('click', () => { state.pick = +b.dataset.i; render(); }));
    const c = list[state.pick];
    $('gd-case').innerHTML = !c ? '' : `
      <div class="gd-case-head"><div><span class="gd-label">${state.wrong === 'fp' ? 'MÁY BẮT LỘN' : 'MÁY HỤT'} · ${TYPES[c.type].toUpperCase()}</span>
        <h3>${c.title}</h3><p>${c.source} · ${c.meta}</p></div><a href="${d.page}">Mở duyệt ↗</a></div>
      <div class="gd-pair ev-${c.ev.toLowerCase()}">
        <div><div class="gd-frame"><span>BẢN ĐANG XEM</span><div class="gd-scene"><i></i><i></i><i></i></div></div></div>
        <div><div class="gd-frame frame-1"><span>CHỖ MÁY NHÌN</span><em>${c.ev}</em></div></div>
      </div>
      <dl class="gd-verdict"><dt>Máy nói</dt><dd>${c.machine}</dd><dt>PO nói</dt><dd>${c.po}</dd></dl>`;
  }

  function sources(d) {
    $('gd-source-rows').innerHTML = d.sources.map(([name, ...v]) =>
      `<tr><td>${name}</td>${v.slice(0, 5).map((x) => `<td>${n(x)}</td>`).join('')}` +
      `<td class="${v[5] >= 9 ? 'is-old' : ''}">${v[5]} ngày</td></tr>`).join('');
  }

  function quality(d) {
    const q = d.quality;
    $('gd-quality').innerHTML = `<span class="gd-label">${q.label}</span><b class="gd-quality-main">${q.main}</b>` +
      `<div class="gd-distribution">${q.bars.map(([name, v]) => `<div><span>${name}</span><b>${v}%</b><div class="gd-meter"><i style="width:${v}%"></i></div></div>`).join('')}</div>` +
      q.facts.map(([name, v]) => `<div class="gd-fact"><span>${name}</span><b>${v}</b></div>`).join('');
  }

  function render() {
    const d = DATA[state.kind];
    press('[data-kind]', state.kind, 'kind');
    press('[data-wrong]', state.wrong, 'wrong');
    funnel(d); score(d); cases(d); sources(d); quality(d);
  }

  document.querySelectorAll('[data-kind]').forEach((b) => b.addEventListener('click', () => {
    Object.assign(state, { kind: b.dataset.kind, type: null, pick: 0 });
    render();
  }));
  document.querySelectorAll('[data-wrong]').forEach((b) => b.addEventListener('click', () => {
    Object.assign(state, { wrong: b.dataset.wrong, pick: 0 });
    render();
  }));
  window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() !== 'v' || ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
    Object.assign(state, { kind: state.kind === 'video' ? 'image' : 'video', type: null, pick: 0 });
    render();
  });
  render();
})();
