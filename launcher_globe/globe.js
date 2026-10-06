// ==========================================================================
// XRU FEDERAL LAUNCHER — 3-COLUMN INTERACTIVE GLOBE & LANDS INSPECTOR
// ==========================================================================
window.LauncherGlobe = (() => {
  const REGIONS = [
    { id: 'euramerika', area: 'Bắc Mỹ', color: 0x78b5db, center: [100, -38], countries: 'CA US MX GL BM GT BZ HN SV NI CR PA CU HT DO JM BS TT BB AG DM GD KN LC VC PR' },
    { id: 'eurasia', area: 'Châu Á', color: 0x62c8b5, center: [-85, -28], countries: 'AF AM AZ BH BD BT BN KH CN CY GE IN ID IR IQ IL JP JO KZ KW KG LA LB MY MV MN MM NP KP OM PK PS PH QA SA SG KR LK SY TW TJ TH TL TR TM AE UZ VN YE' },
    { id: 'euruska', area: 'Nga', color: 0xd9aa73, center: [-90, -56], countries: 'RU' },
    { id: 'europa', area: 'Châu Âu', color: 0xb3a3d9, center: [-15, -50], countries: 'AL AD AT BY BE BA BG HR CZ DK EE FI FR DE GR HU IS IE IT XK LV LI LT LU MT MD MC ME NL MK NO PL PT RO SM RS SK SI ES SE CH UA GB VA' }
  ];

  let libraries;
  let activeInstance = null;

  function loadLibraries() {
    if (!libraries) {
      libraries = (async () => {
        for (const file of ['d3-array.min.js', 'd3-geo.min.js']) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `launcher_globe/vendor/${file}`;
            script.onload = resolve;
            script.onerror = () => { script.remove(); reject(new Error(`Could not load ${file}`)); };
            document.head.append(script);
          });
        }
        const response = await fetch('launcher_globe/world.json');
        if (!response.ok) throw new Error('Could not load world map');
        return response.json();
      })().catch(error => { libraries = null; throw error; });
    }
    return libraries;
  }

  function markup(continents) {
    return `<section class="federal-map" aria-label="Bản đồ chỉ huy Liên Bang" data-i18n-attr="aria-label:globe_cmd_map">
      <!-- CỘT 1: MENU LỤC ĐỊA -->
      <div class="globe-side">
        <div class="globe-eyebrow">XRU // 4 CONTINENTS</div>
        <div class="globe-destinations">${REGIONS.map(region => {
          const continent = continents.find(c => c.id === region.id);
          const name = continent ? continent.name : region.id.toUpperCase();
          const code = continent ? continent.code : '';
          return `<button class="globe-destination" data-destination="${region.id}">
            <span class="globe-dest-info">
              <b>${name}</b>
              <small>${code}</small>
            </span>
          </button>`;
        }).join('')}</div>
        <div class="globe-side-note" data-i18n="rotate_hint">Kéo để xoay · Bấm để chọn</div>
      </div>

      <!-- CỘT 2: QUẢ CẦU 3D TRUNG TÂM -->
      <div class="globe-scene">
        <canvas class="globe-chart" role="img" aria-label="Địa cầu tương tác 3D" data-i18n-attr="aria-label:globe_3d_aria"></canvas>
        <div class="globe-loading" role="status" data-i18n="loading_map">Đang mở bản đồ…</div>
        <div class="globe-tools">
          <button data-spin aria-label="Tạm dừng xoay" data-i18n-attr="aria-label:pause_spin">Ⅱ</button>
          <button data-home aria-label="Đưa bản đồ về góc ban đầu" data-i18n-attr="aria-label:reset_view">↺</button>
        </div>
      </div>

      <!-- CỘT 3: THẺ LANDS + ẢNH (BÊN PHẢI) -->
      <aside class="globe-lands-panel" id="globe-lands-panel" aria-label="Phân khu trực thuộc" data-i18n-attr="aria-label:sectors_lbl">
        <!-- Render động qua renderLandsPanel -->
      </aside>
    </section>`;
  }

  function renderLandsPanel(continentId, container) {
    const data = window.CONTINENTAL_DATA ? window.CONTINENTAL_DATA[continentId] : null;
    const panel = container ? container.querySelector('#globe-lands-panel') : document.getElementById('globe-lands-panel');
    if (!data || !panel) return;

    const editTip = window.XRU_I18N ? window.XRU_I18N.t('edit_img_tip') : 'Đổi ảnh';
    const lands = data.lands || [];
    const fallbackImg = 'data/placeholder.svg';
    panel.innerHTML = `
      <div class="lands-panel-head">${continentId.toUpperCase()}</div>
      <div class="lands-list">
        ${lands.map(land => {
          const storedImg = localStorage.getItem('xru-land-img-' + land.name);
          const imgSrc = storedImg || land.image || fallbackImg;
          const isPlaceholder = imgSrc === fallbackImg;
          // Link chính của card = module đầu tiên có URL thật ('#' = chưa có trang)
          const main = (land.mods || []).find(m => m.url && m.url !== '#');
          const href = main ? main.url : null;
          const external = href && href.startsWith('http') ? ' target="_blank" rel="noopener"' : '';
          const tag = href ? 'a' : 'div';
          const attrs = href ? ` href="${href}"${external}` : '';
          return `
            <${tag} class="land-card${href ? '' : ' is-idle'}${isPlaceholder ? ' is-empty' : ''}" data-land="${land.name}"${attrs}>
              <img src="${imgSrc}" alt="" loading="lazy" onerror="this.src='${fallbackImg}'" />
              <span class="land-code">${land.code}</span>
              <span class="land-edit" role="button" title="${editTip}" data-i18n-attr="title:edit_img_tip" onclick="event.preventDefault();event.stopPropagation();LauncherGlobe.changeLandImage('${land.name}')">✎</span>
              <span class="land-caption">
                <b class="land-title">${land.name}</b>
                ${href ? '<span class="land-arrow">→</span>' : ''}
              </span>
            </${tag}>
          `;
        }).join('')}
      </div>
    `;
  }

  // ---------------- SỬA ẢNH CARD: upload + kéo + zoom ----------------
  // Khung cắt cùng tỉ lệ card (16:7). Lưu ra JPEG đã cắt sẵn (~100KB) vào localStorage,
  // nên không cần server và card hiển thị đúng thứ bro đã chỉnh.
  const IMG_KEY = name => 'xru-land-img-' + name;
  const FRAME_RATIO = 16 / 7;
  const OUT_W = 1200;
  const MAX_ZOOM = 4;

  function findLand(landName) {
    const all = window.CONTINENTAL_DATA || {};
    for (const key of Object.keys(all)) {
      const land = (all[key].lands || []).find(l => l.name === landName);
      if (land) return land;
    }
    return null;
  }

  function changeLandImage(landName) {
    if (document.querySelector('.img-editor')) return;
    const land = findLand(landName);
    const startSrc = localStorage.getItem(IMG_KEY(landName)) || (land && land.image) || '';

    const t = (k, fallback) => (window.XRU_I18N ? window.XRU_I18N.t(k) : fallback);
    const root = document.createElement('div');
    root.className = 'img-editor';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.innerHTML = `
      <div class="img-editor-box">
        <div class="img-editor-title">${t('img_editor_title', 'ĐỔI ẢNH')} // ${landName.toUpperCase()}</div>
        <div class="img-editor-stage">
          <img alt="" draggable="false" hidden />
          <div class="img-editor-empty">${t('img_editor_empty', 'Chưa có ảnh · Bấm "Tải ảnh lên"')}</div>
          <div class="img-editor-crop-window">
            <div class="crop-grid"></div>
            <div class="crop-corner tl"></div>
            <div class="crop-corner tr"></div>
            <div class="crop-corner bl"></div>
            <div class="crop-corner br"></div>
          </div>
        </div>
        <div class="img-editor-zoom">
          <span>−</span>
          <input type="range" min="1" max="${MAX_ZOOM}" step="0.01" value="1" aria-label="${t('zoom_in', 'Phóng to')}" />
          <span>+</span>
        </div>
        <div class="img-editor-hint">${t('img_editor_hint', 'Nắm kéo ảnh để căn góc · Lăn chuột hoặc kéo thanh trượt để phóng to/thu nhỏ')}</div>
        <div class="img-editor-actions">
          <label class="ie-btn">${t('img_editor_upload', 'Tải ảnh lên')}<input type="file" accept="image/*" hidden /></label>
          <button type="button" class="ie-btn" data-reset>${t('img_editor_default', 'Mặc định')}</button>
          <span class="ie-spacer"></span>
          <button type="button" class="ie-btn" data-cancel>${t('img_editor_cancel', 'Hủy')}</button>
          <button type="button" class="ie-btn primary" data-save disabled>${t('img_editor_save', 'Lưu')}</button>
        </div>
      </div>`;
    document.body.append(root);

    const stage = root.querySelector('.img-editor-stage');
    const cropWindow = root.querySelector('.img-editor-crop-window');
    const img = stage.querySelector('img');
    const empty = stage.querySelector('.img-editor-empty');
    const slider = root.querySelector('input[type=range]');
    const fileInput = root.querySelector('input[type=file]');
    const saveBtn = root.querySelector('[data-save]');

    let objectUrl = null;
    let loaded = false;
    let minScale = 1, zoom = 1, ox = 0, oy = 0;
    let stageW = 0, stageH = 0, cropW = 0, cropH = 0, cropL = 0, cropT = 0;

    const scale = () => minScale * zoom;

    function updateBounds() {
      stageW = stage.clientWidth;
      stageH = stage.clientHeight;
      cropW = cropWindow.clientWidth;
      cropH = cropWindow.clientHeight;
      cropL = (stageW - cropW) / 2;
      cropT = (stageH - cropH) / 2;
    }

    function clamp() {
      // Ảnh luôn phủ kín hoàn toàn khung cắt ở giữa
      ox = Math.min(cropL, Math.max(cropL + cropW - img.naturalWidth * scale(), ox));
      oy = Math.min(cropT, Math.max(cropT + cropH - img.naturalHeight * scale(), oy));
    }

    function apply() {
      img.style.width = Math.round(img.naturalWidth * scale()) + 'px';
      img.style.height = Math.round(img.naturalHeight * scale()) + 'px';
      img.style.transform = `translate(${Math.round(ox)}px, ${Math.round(oy)}px)`;
    }

    function setZoom(next, cx, cy) {
      if (!loaded) return;
      if (cx === undefined || cy === undefined) {
        cx = cropL + cropW / 2;
        cy = cropT + cropH / 2;
      }
      next = Math.min(MAX_ZOOM, Math.max(1, next));
      const ix = (cx - ox) / scale(), iy = (cy - oy) / scale();
      zoom = next;
      ox = cx - ix * scale();
      oy = cy - iy * scale();
      clamp();
      slider.value = zoom;
      apply();
    }

    function fit() {
      updateBounds();
      // minScale: ảnh vừa khít khung crop ở giữa
      minScale = Math.max(cropW / img.naturalWidth, cropH / img.naturalHeight);
      zoom = 1;
      slider.value = 1;
      ox = cropL + (cropW - img.naturalWidth * minScale) / 2;
      oy = cropT + (cropH - img.naturalHeight * minScale) / 2;
      apply();
    }

    function show(src) {
      loaded = false; saveBtn.disabled = true;
      img.onload = () => {
        loaded = true; saveBtn.disabled = false;
        img.hidden = false; empty.hidden = true;
        fit();
      };
      img.onerror = () => { img.hidden = true; empty.hidden = false; };
      img.src = src;
    }

    // --- Kéo ảnh ---
    const k = () => stage.clientWidth / stage.getBoundingClientRect().width;
    let drag = null;
    stage.addEventListener('pointerdown', e => {
      if (!loaded) return;
      drag = { x: e.clientX, y: e.clientY, ox, oy };
      stage.setPointerCapture(e.pointerId);
      stage.classList.add('is-dragging');
    });
    stage.addEventListener('pointermove', e => {
      if (!drag) return;
      ox = drag.ox + (e.clientX - drag.x) * k();
      oy = drag.oy + (e.clientY - drag.y) * k();
      clamp(); apply();
    });
    const endDrag = () => { drag = null; stage.classList.remove('is-dragging'); };
    stage.addEventListener('pointerup', endDrag);
    stage.addEventListener('pointercancel', endDrag);

    // --- Zoom bằng chuột ---
    stage.addEventListener('wheel', e => {
      e.preventDefault();
      const rect = stage.getBoundingClientRect();
      const cx = (e.clientX - rect.left) * k(), cy = (e.clientY - rect.top) * k();
      setZoom(zoom * Math.exp(-e.deltaY * 0.0015), cx, cy);
    }, { passive: false });
    slider.addEventListener('input', () => setZoom(parseFloat(slider.value)));

    // --- Upload ---
    function loadFile(file) {
      if (!file || !file.type.startsWith('image/')) return;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      objectUrl = URL.createObjectURL(file);
      show(objectUrl);
    }
    fileInput.addEventListener('change', () => loadFile(fileInput.files[0]));
    stage.addEventListener('dragover', e => e.preventDefault());
    stage.addEventListener('drop', e => { e.preventDefault(); loadFile(e.dataTransfer.files[0]); });

    // --- Lưu / Hủy / Mặc định ---
    function refresh() {
      if (activeInstance && activeInstance.activeContinent) {
        renderLandsPanel(activeInstance.activeContinent, activeInstance.container);
      }
    }

    function close() {
      document.removeEventListener('keydown', onKey, true);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      root.remove();
    }

    function save() {
      if (!loaded) return;
      updateBounds();
      const s = scale();
      const sx = (cropL - ox) / s;
      const sy = (cropT - oy) / s;
      const sw = cropW / s;
      const sh = cropH / s;

      const canvas = document.createElement('canvas');
      canvas.width = OUT_W;
      canvas.height = Math.round(OUT_W / FRAME_RATIO);
      canvas.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
      let dataUrl;
      try { dataUrl = canvas.toDataURL('image/jpeg', 0.85); }
      catch (err) { alert(t('export_err', 'Không xuất được ảnh này (ảnh từ nguồn ngoài bị chặn). Hãy tải ảnh lên từ máy.')); return; }
      try { localStorage.setItem(IMG_KEY(landName), dataUrl); }
      catch (err) { alert(t('storage_full', 'Bộ nhớ trình duyệt đầy. Hãy đặt lại "Mặc định" ở vài card khác rồi lưu lại.')); return; }
      close(); refresh();
    }

    function onKey(e) {
      // Chặn phím tắt của trang (1-4, G, C) khi đang sửa ảnh
      e.stopPropagation();
      if (e.key === 'Escape') close();
    }
    document.addEventListener('keydown', onKey, true);

    saveBtn.addEventListener('click', save);
    root.querySelector('[data-cancel]').addEventListener('click', close);
    root.querySelector('[data-reset]').addEventListener('click', () => {
      localStorage.removeItem(IMG_KEY(landName));
      close(); refresh();
    });
    root.addEventListener('pointerdown', e => { if (e.target === root) close(); });

    if (startSrc) show(startSrc);
  }

  function mount(container, onSelect) {
    const canvas = container.querySelector('.globe-chart');
    const context = canvas.getContext('2d');
    const spinButton = container.querySelector('[data-spin]');
    const homeButton = container.querySelector('[data-home]');
    const loading = container.querySelector('.globe-loading');
    const regionByCountry = new Map(REGIONS.flatMap(region => region.countries.split(' ').map(id => [id, region])));

    let disposed = false, frame = 0, lastFrame = 0;
    let spinning = false;
    let hovered = false, activeHoverRegion = null, drag = null;
    let selectedContinent = 'eurasia'; // default active
    let rotation = [-85, -28], targetRotation = null;
    let width = 0, height = 0, radius = 0;
    let projection, path, countries, groups, grid;

    function updateButton() {
      const t = (k, fallback) => (window.XRU_I18N ? window.XRU_I18N.t(k) : fallback);
      spinButton.textContent = spinning ? 'Ⅱ' : '▷';
      spinButton.setAttribute('aria-label', spinning ? t('pause_spin', 'Tạm dừng xoay') : t('resume_spin', 'Tiếp tục xoay'));
      spinButton.setAttribute('aria-pressed', String(!spinning));
    }

    function selectContinent(continentId, smooth = true) {
      if (!continentId) return;
      selectedContinent = continentId;
      if (activeInstance) activeInstance.activeContinent = continentId;

      // Cập nhật trạng thái active trên danh sách nút bên trái
      container.querySelectorAll('[data-destination]').forEach(btn => {
        btn.classList.toggle('is-active', btn.dataset.destination === continentId);
      });

      // Cập nhật thanh Rail bên trái (nếu có)
      document.querySelectorAll('.rail-icon-btn[data-continent]').forEach(btn => {
        btn.classList.toggle('is-active', btn.getAttribute('data-continent') === continentId);
      });

      // Xoay quả cầu mượt tới trung tâm lục địa đó
      const reg = REGIONS.find(r => r.id === continentId);
      if (reg && reg.center) {
        if (smooth) {
          targetRotation = [...reg.center];
          spinning = false;
          updateButton();
        } else {
          rotation = [...reg.center];
          targetRotation = null;
        }
      }

      // Cập nhật panel Lands bên phải
      renderLandsPanel(continentId, container);
      requestDraw();

      if (typeof onSelect === 'function') onSelect(continentId);
    }

    function setHoverRegion(region) {
      if (region === activeHoverRegion) return;
      activeHoverRegion = region;
      canvas.style.cursor = drag?.moved ? 'grabbing' : region ? 'pointer' : 'grab';
      requestDraw();
    }

    // Bảng màu đơn sắc: chỉ độ sáng phân biệt trạng thái
    const TONE = {
      sea: '#1b1b1b',
      land: '#343434',      // quốc gia ngoài 4 khối
      region: '#484848',    // lục địa XRU, chưa chọn
      hover: '#6e6e6e',
      selected: '#b4b4b4',
      border: '#1b1b1b',
      borderSelected: '#ffffff'
    };

    function draw() {
      context.clearRect(0, 0, width, height);
      projection.rotate(rotation);

      // Đáy biển quả cầu
      context.beginPath(); path({ type: 'Sphere' });
      context.fillStyle = TONE.sea; context.fill();

      // Vẽ từng nhóm quốc gia
      if (groups) {
        for (const group of groups) {
          const region = group.region;
          const isSelected = region && region.id === selectedContinent;
          const isHovered = region && region === activeHoverRegion;

          context.beginPath(); path(group.geometry);
          context.fillStyle = !region ? TONE.land : isSelected ? TONE.selected : isHovered ? TONE.hover : TONE.region;
          context.fill();

          // Viền quốc gia
          context.strokeStyle = isSelected ? TONE.borderSelected : TONE.border;
          context.lineWidth = isSelected ? 0.8 : 0.5;
          context.stroke();
        }
      }

      // Lưới kinh vĩ độ
      if (grid) {
        context.beginPath(); path(grid);
        context.strokeStyle = 'rgba(255,255,255,.07)';
        context.lineWidth = 0.5;
        context.stroke();
      }

      // Đổ bóng 3D hình cầu
      const shade = context.createRadialGradient(width / 2 + radius * .35, height / 2 - radius * .45, radius * .1, width / 2, height / 2, radius);
      shade.addColorStop(0, 'rgba(0,0,0,0)');
      shade.addColorStop(1, 'rgba(0,0,0,.35)');
      context.beginPath(); path({ type: 'Sphere' });
      context.fillStyle = shade; context.fill();
      context.strokeStyle = 'rgba(255,255,255,.16)'; context.lineWidth = 1; context.stroke();
    }

    function tick(time) {
      frame = 0;
      if (disposed || document.hidden || !projection) return;

      let needRedraw = false;

      // Xoay chuyển động mượt tới targetRotation
      if (targetRotation && !drag) {
        let diffX = (targetRotation[0] - rotation[0]) % 360;
        if (diffX > 180) diffX -= 360;
        if (diffX < -180) diffX += 360;
        const diffY = targetRotation[1] - rotation[1];

        if (Math.hypot(diffX, diffY) < 0.25) {
          rotation[0] = targetRotation[0];
          rotation[1] = targetRotation[1];
          targetRotation = null;
        } else {
          rotation[0] += diffX * 0.16;
          rotation[1] += diffY * 0.16;
        }
        needRedraw = true;
      }

      // Tự động xoay nếu bật spin
      if (spinning && !hovered && !targetRotation) {
        if (time - lastFrame >= 1000 / 14) {
          rotation[0] = (rotation[0] + Math.min(time - lastFrame, 150) * .0015) % 360;
          lastFrame = time;
          needRedraw = true;
        }
      }

      if (needRedraw) draw();

      if (targetRotation || (spinning && !hovered)) {
        frame = requestAnimationFrame(tick);
      }
    }

    function requestDraw() {
      if (disposed || document.hidden || !projection || frame) return;
      frame = requestAnimationFrame(time => {
        frame = 0;
        lastFrame = time;
        draw();
        if (targetRotation || (spinning && !hovered)) frame = requestAnimationFrame(tick);
      });
    }

    function stopFrames() { cancelAnimationFrame(frame); frame = 0; lastFrame = 0; }

    function resize() {
      if (!projection || disposed) return;
      width = canvas.clientWidth; height = canvas.clientHeight;
      const ratio = Math.min(devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      radius = Math.max(1, Math.min(width, height) / 2 - 20);
      projection.scale(radius).translate([width / 2, height / 2]);
      requestDraw();
    }

    function point(event) {
      const rect = canvas.getBoundingClientRect();
      return [(event.clientX - rect.left) * width / rect.width, (event.clientY - rect.top) * height / rect.height];
    }

    function regionAt(position) {
      if (!projection || !countries || Math.hypot(position[0] - width / 2, position[1] - height / 2) > radius) return null;
      const coordinate = projection.invert(position);
      const country = countries.find(country => regionByCountry.has(country.id) && d3.geoContains(country, coordinate));
      return country ? regionByCountry.get(country.id) : null;
    }

    function pointerEnter() { hovered = true; stopFrames(); }
    function pointerLeave() { hovered = false; if (!drag) { setHoverRegion(null); requestDraw(); } }

    function pointerDown(event) {
      if (!projection || (event.pointerType === 'mouse' && event.button !== 0)) return;
      targetRotation = null;
      drag = { start: point(event), rotation: [...rotation], moved: false, pointerId: event.pointerId };
      canvas.setPointerCapture(event.pointerId);
    }

    function pointerMove(event) {
      if (!projection) return;
      const position = point(event);
      if (drag) {
        const dx = position[0] - drag.start[0], dy = position[1] - drag.start[1];
        if (Math.hypot(dx, dy) > 5) drag.moved = true;
        if (drag.moved) {
          spinning = false; updateButton();
          rotation = [drag.rotation[0] + dx * .35, Math.max(-80, Math.min(80, drag.rotation[1] - dy * .35))];
          setHoverRegion(null); requestDraw();
        }
      } else {
        setHoverRegion(regionAt(position));
      }
    }

    function pointerUp(event) {
      if (!drag || drag.pointerId !== event.pointerId) return;
      const clickedRegion = !drag.moved && event.type === 'pointerup' ? regionAt(point(event)) : null;
      drag = null;
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
      if (event.pointerType !== 'mouse') hovered = false;

      if (clickedRegion) {
        selectContinent(clickedRegion.id);
      } else {
        requestDraw();
      }
    }

    function visibilityChanged() { stopFrames(); if (!document.hidden) requestDraw(); }

    function select(event) {
      const button = event.target.closest('[data-destination]');
      if (button) selectContinent(button.dataset.destination);
    }

    function toggleSpin() {
      spinning = !spinning;
      targetRotation = null;
      hovered = false;
      updateButton();
      stopFrames();
      requestDraw();
    }

    function reset() {
      selectContinent('eurasia');
    }

    const events = [
      ['pointerenter', pointerEnter],
      ['pointerleave', pointerLeave],
      ['pointerdown', pointerDown],
      ['pointermove', pointerMove],
      ['pointerup', pointerUp],
      ['pointercancel', pointerUp]
    ];

    for (const [name, handler] of events) canvas.addEventListener(name, handler);
    container.addEventListener('click', select);
    spinButton.addEventListener('click', toggleSpin);
    homeButton.addEventListener('click', reset);
    document.addEventListener('visibilitychange', visibilityChanged);
    window.addEventListener('pagehide', stopFrames);
    window.addEventListener('pageshow', visibilityChanged);

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    updateButton();

    loadLibraries().then(world => {
      if (disposed) return;
      countries = world.features.filter(country => country.id !== 'AQ');
      groups = [null, ...REGIONS].map(region => ({
        region,
        geometry: { type: 'FeatureCollection', features: countries.filter(country => (regionByCountry.get(country.id) || null) === region) }
      }));
      projection = d3.geoOrthographic().precision(.7);
      path = d3.geoPath(projection, context);
      grid = d3.geoGraticule10();
      loading.hidden = true;
      resize();

      // Kích hoạt mặc định lục địa eurasia
      selectContinent(selectedContinent, false);
    }).catch(error => {
      if (disposed) return;
      const t = (k, fallback) => (window.XRU_I18N ? window.XRU_I18N.t(k) : fallback);
      loading.textContent = t('map_load_err', 'Chưa mở được bản đồ. Chọn lục địa bằng các nút bên cạnh.');
      console.error(error);
    });

    activeInstance = {
      container,
      activeContinent: selectedContinent,
      selectContinent
    };

    return () => {
      disposed = true;
      stopFrames();
      observer.disconnect();
      for (const [name, handler] of events) canvas.removeEventListener(name, handler);
      container.removeEventListener('click', select);
      spinButton.removeEventListener('click', toggleSpin);
      homeButton.removeEventListener('click', reset);
      document.removeEventListener('visibilitychange', visibilityChanged);
      window.removeEventListener('pagehide', stopFrames);
      window.removeEventListener('pageshow', visibilityChanged);
      if (activeInstance && activeInstance.container === container) activeInstance = null;
    };
  }

  function setActive(continentId) {
    if (activeInstance) {
      activeInstance.selectContinent(continentId);
    }
  }

  return { markup, mount, setActive, changeLandImage };
})();
