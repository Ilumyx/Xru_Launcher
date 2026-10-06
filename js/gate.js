// XRU GATE — chỉ để nhìn: đóng/mở cột danh sách, chọn mục để xem bên phải, phím tắt chuyển trang.

// Nút đóng/mở trên rail
function toggleGatePanel() {
  document.body.classList.toggle('panel-collapsed');
}

// Bấm 1 mục (ở gallery hoặc danh sách) -> sáng lên + hiện ở cột phải.
// Mọi data-xxx trên ô gallery sẽ được đổ vào phần tử có id="insp-xxx" (nếu có).
function pickItem(el) {
  const id = el.dataset.pick;
  document.querySelectorAll('[data-pick]').forEach(t => t.classList.toggle('is-active', t.dataset.pick === id));
  // Lấy dữ liệu từ ô gallery; trang Xem to không có gallery thì lấy từ mục danh sách
  const d = (document.querySelector(`.g-tile[data-pick="${id}"]`) || document.querySelector(`.side-item[data-pick="${id}"]`)).dataset;
  const big = document.getElementById('insp-img');
  big.className = `ph ph-${d.ph}`;
  big.dataset.label = d.label;
  for (const [k, v] of Object.entries(d)) {
    const box = document.getElementById(`insp-${k}`);
    if (box && k !== 'img') box.textContent = v;
  }
  const frame = document.getElementById('watch-frame');
  if (frame) frame.classList.toggle('is-portrait', (d.res || '').includes('9:16'));
  document.getElementById('insp-num').textContent = `${id} / ${document.body.dataset.total || 548}`;
}

// Ô đánh dấu (NOISE / WATERMARK ...) bật tắt cho vui mắt
function toggleChip(el) {
  el.classList.toggle('is-on');
}

// ---- Trang Xem to: chuyển clip, phát/dừng giả, chấm xong tự sang clip kế ----
function stepItem(dir) {
  const items = [...document.querySelectorAll('.side-item')];
  const i = items.findIndex(x => x.classList.contains('is-active'));
  const next = items[Math.min(items.length - 1, Math.max(0, i + dir))];
  if (!next || next === items[i]) return;
  pickItem(next);
  next.scrollIntoView({ block: 'nearest' });
}
function togglePlay() {
  document.querySelector('.watch')?.classList.toggle('is-playing');
}
function judge(kind) {
  const stamp = document.getElementById('watch-stamp');
  if (!stamp) return;
  stamp.textContent = kind.toUpperCase();
  stamp.className = `watch-stamp ${kind} show`;
  setTimeout(() => { stamp.classList.remove('show'); stepItem(1); }, 350);
}

// ESC -> Launcher | 1/2/3 -> Image/Video/Dash
window.addEventListener('keydown', (e) => {
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
  if (document.body.dataset.mode === 'watch') {
    const k = e.key.toLowerCase();
    if (k === 'arrowright' || k === 'arrowdown') { e.preventDefault(); return stepItem(1); }
    if (k === 'arrowleft' || k === 'arrowup') { e.preventDefault(); return stepItem(-1); }
    if (k === ' ') { e.preventDefault(); return togglePlay(); }
    if (k === 'a') return judge('accept');
    if (k === 'd') return judge('detain');
    if (k === 's') return judge('skip');
  }
  if (e.key === 'Escape') window.location.href = 'launcher_mockup.html';
  if (e.key === '1') window.location.href = 'gate_image.html';
  if (e.key === '2') window.location.href = 'gate_video.html';
  if (e.key === '3') window.location.href = 'gate_dash.html';
});

// ---- Kéo giãn cột phải theo khấc (chỉ trang có gallery: Image, Video lưới) ----
// Mỗi khấc = 1 cột ảnh chuyển sang cột phải → ô ảnh giữ nguyên cỡ, cột phải to dần.
(function initInspGrip() {
  const ws = document.querySelector('.ws');
  const main = document.querySelector('.ws-main');
  const gallery = document.querySelector('.gallery');
  if (!ws || !main || !gallery) return;

  const BASE_W = 360, BASE_COLS = 5, MAX_STEP = 2, GAP = 14, LIST_W = 260;
  const KEY = 'xru-insp-step-' + location.pathname.split('/').pop();
  let step = Math.min(MAX_STEP, +localStorage.getItem(KEY) || 0);

  const grip = document.createElement('div');
  grip.className = 'insp-grip';
  grip.title = window.XRU_I18N ? window.XRU_I18N.t('grip_tip') : 'Kéo để giãn cột phải · bấm đúp để về mặc định';
  grip.setAttribute('data-i18n-attr', 'title:grip_tip');
  grip.innerHTML = '<span class="insp-grip-tip"></span>';
  ws.appendChild(grip);
  const tip = grip.firstChild;

  // Bề rộng 1 cột ảnh khi đang ở 5 cột (tính bằng phép cộng trừ, không phụ thuộc animation)
  function colWidth() {
    const listW = document.body.classList.contains('panel-collapsed') ? 0 : LIST_W;
    const extra = main.clientWidth - gallery.clientWidth;              // padding cột giữa
    const free = ws.offsetWidth - listW - BASE_W - extra - (BASE_COLS - 1) * GAP;
    return free / BASE_COLS;
  }
  function apply() {
    ws.style.setProperty('--insp-w', Math.floor(BASE_W + step * (colWidth() + GAP)) + 'px');
    gallery.style.setProperty('--g-cols', BASE_COLS - step);
    const colWord = window.XRU_I18N && window.XRU_I18N.getActiveLang() === 'en' ? 'cols' : 'cột';
    tip.textContent = `${BASE_COLS - step} ${colWord}`;
  }
  function setStep(n) {
    n = Math.max(0, Math.min(MAX_STEP, n));
    if (n === step) return;
    step = n;
    localStorage.setItem(KEY, step);
    morph(() => {
      ws.style.transition = grip.style.transition = 'none';
      apply();
      ws.offsetWidth;
    });
  }

  // Đổi khấc: từng ô ảnh tự trôi về chỗ mới (~0.18s) để mắt bám theo được,
  // thay vì cả lưới nhảy rụp. Trình duyệt không hỗ trợ / người dùng tắt hiệu ứng → nhảy gọn như cũ.
  function morph(update) {
    const done = () => {
      document.documentElement.classList.remove('vt-notch');
      named.forEach((el) => (el.style.viewTransitionName = ''));
      ws.style.transition = grip.style.transition = '';
      document.querySelector('.g-tile.is-active')?.scrollIntoView({ block: 'nearest' });
    };
    // Chỉ đặt tên cho ô đang nhìn thấy (ô khuất không bay đè lên header) — và chỉ trong lúc trôi,
    // để chuyển trang Image ↔ Video vẫn đổi gọn, không bị các ô bay giữa hai trang.
    const view = main.getBoundingClientRect();
    const named = [...gallery.querySelectorAll('.g-tile')].filter((t) => {
      const r = t.getBoundingClientRect();
      return r.bottom > view.top && r.top < view.bottom;
    });
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!document.startViewTransition || reduce) { update(); requestAnimationFrame(done); return; }
    named.forEach((el, i) => (el.style.viewTransitionName = `g-tile-${i}`));
    document.querySelector('.ws-insp').style.viewTransitionName = 'ws-insp';
    named.push(document.querySelector('.ws-insp'));
    document.documentElement.classList.add('vt-notch');
    document.startViewTransition(update).finished.finally(done);
  }

  grip.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    document.body.classList.add('is-gripping');
    const unit = colWidth() + GAP;
    const move = (ev) => {
      const r = ws.getBoundingClientRect();
      const scale = r.width / ws.offsetWidth;                     // bù zoom giao diện
      const want = (r.right - ev.clientX) / scale;                // bề rộng cột phải muốn có
      setStep(Math.round((want - BASE_W) / unit));
    };
    const up = () => {
      document.body.classList.remove('is-gripping');
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  });
  grip.addEventListener('dblclick', () => setStep(0));

  // Đóng/mở danh sách hoặc đổi cỡ cửa sổ → tính lại bề rộng khấc
  window.addEventListener('resize', apply);
  new MutationObserver(apply).observe(document.body, { attributes: true, attributeFilter: ['class'] });

  // Lúc mở trang: đặt ngay bề rộng đã nhớ, KHÔNG chạy hiệu ứng (tránh cột phải "trượt" mỗi lần chuyển trang)
  ws.style.transition = grip.style.transition = 'none';
  apply();
  ws.offsetWidth; // ép trình duyệt vẽ xong trạng thái này trước khi bật lại hiệu ứng
  requestAnimationFrame(() => requestAnimationFrame(() => { ws.style.transition = grip.style.transition = ''; }));
})();
