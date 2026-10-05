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
    return `<section class="federal-map" aria-label="Bản đồ chỉ huy Liên Bang">
      <!-- CỘT 1: MENU LỤC ĐỊA -->
      <div class="globe-side">
        <div class="globe-eyebrow">XRU // 4 CONTINENTS</div>
        <div class="globe-destinations">${REGIONS.map(region => {
          const continent = continents.find(c => c.id === region.id);
          const name = continent ? continent.name : region.id.toUpperCase();
          const code = continent ? continent.code : '';
          const isAlert = region.id === 'eurasia';
          return `<button class="globe-destination" data-destination="${region.id}" style="--region-color:#${region.color.toString(16).padStart(6, '0')}">
            <span class="globe-region-dot"></span>
            <span class="globe-dest-info">
              <b>${name}</b>
              <small>${code} · ${region.area}</small>
            </span>
            ${isAlert ? '<span class="globe-dest-alert" title="548 ảnh chờ duyệt">548</span>' : ''}
            <span class="globe-arrow">↗</span>
          </button>`;
        }).join('')}</div>
        <div class="globe-side-note">Kéo để xoay · Bấm để chọn</div>
      </div>

      <!-- CỘT 2: QUẢ CẦU 3D TRUNG TÂM -->
      <div class="globe-scene">
        <canvas class="globe-chart" role="img" aria-label="Địa cầu tương tác 3D"></canvas>
        <div class="globe-loading" role="status">Đang mở bản đồ…</div>
        <div class="globe-tools">
          <button data-spin aria-label="Tạm dừng xoay">Ⅱ</button>
          <button data-home aria-label="Đưa bản đồ về góc ban đầu">↺</button>
        </div>
      </div>

      <!-- CỘT 3: THẺ LANDS + ẢNH (BÊN PHẢI) -->
      <aside class="globe-lands-panel" id="globe-lands-panel" aria-label="Phân khu trực thuộc">
        <!-- Render động qua renderLandsPanel -->
      </aside>
    </section>`;
  }

  function renderLandsPanel(continentId, container) {
    const data = window.CONTINENTAL_DATA ? window.CONTINENTAL_DATA[continentId] : null;
    const panel = container ? container.querySelector('#globe-lands-panel') : document.getElementById('globe-lands-panel');
    if (!data || !panel) return;

    const lands = data.lands || [];
    const region = REGIONS.find(r => r.id === continentId);
    const colorHex = region ? '#' + region.color.toString(16).padStart(6, '0') : '#00d2b4';

    panel.innerHTML = `
      <div class="lands-panel-head">
        <div class="lands-eyebrow">
          <span class="globe-region-dot" style="background:${colorHex};"></span>
          <span>${continentId.toUpperCase()}</span>
          <span class="lands-count">${lands.length} LANDS</span>
        </div>
        <p class="lands-role">${data.sub || ''}</p>
      </div>
      <div class="lands-list">
        ${lands.map(land => {
          const storedImg = localStorage.getItem('xru-land-img-' + land.name);
          const imgSrc = storedImg || land.image || 'data/crawler_thumbs/01a0e65c-350d-7138-a0e8-3968873eb450.webp';
          return `
            <article class="land-card" data-land="${land.name}">
              <div class="land-thumb" title="Bấm để đổi ảnh" onclick="LauncherGlobe.changeLandImage('${land.name}')">
                <img src="${imgSrc}" alt="${land.name}" loading="lazy" onerror="this.src='data/crawler_thumbs/01a0e65c-350d-7138-a0e8-3968873eb450.webp'" />
                <span class="land-thumb-edit" title="Đổi ảnh đại diện">✎</span>
                ${land.statusType === 'alert' ? '<span class="land-badge-alert">548 CHỜ</span>' : ''}
              </div>
              <div class="land-content">
                <div class="land-head">
                  <span class="land-code">${land.code}</span>
                  <b class="land-title">${land.name}</b>
                </div>
                <p class="land-tagline">${land.tagline}</p>
                <div class="land-actions">
                  ${land.mods ? land.mods.slice(0, 2).map(m => `
                    <a href="${m.url}" class="land-act-btn ${m.isAlert ? 'is-alert' : ''}" ${m.url.startsWith('http') ? 'target="_blank"' : ''}>
                      ${m.label} ↗
                    </a>
                  `).join('') : ''}
                </div>
              </div>
            </article>
          `;
        }).join('')}
      </div>
    `;
  }

  function changeLandImage(landName) {
    const current = localStorage.getItem('xru-land-img-' + landName) || '';
    const newUrl = prompt(`Đổi ảnh đại diện cho phân khu [${landName}]:\n(Dán đường dẫn ảnh mới hoặc để trống để khôi phục ảnh mặc định)`, current);
    if (newUrl === null) return;
    if (newUrl.trim() === '') {
      localStorage.removeItem('xru-land-img-' + landName);
    } else {
      localStorage.setItem('xru-land-img-' + landName, newUrl.trim());
    }
    if (activeInstance && activeInstance.activeContinent) {
      renderLandsPanel(activeInstance.activeContinent, activeInstance.container);
    }
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
      spinButton.textContent = spinning ? 'Ⅱ' : '▷';
      spinButton.setAttribute('aria-label', spinning ? 'Tạm dừng xoay' : 'Tiếp tục xoay');
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

    function draw() {
      context.clearRect(0, 0, width, height);
      projection.rotate(rotation);

      // Đáy biển quả cầu
      context.beginPath(); path({ type: 'Sphere' });
      context.fillStyle = '#0a1215'; context.fill();

      // Vẽ từng nhóm quốc gia
      if (groups) {
        for (const group of groups) {
          const region = group.region;
          const isSelected = region && region.id === selectedContinent;
          const isHovered = region && region === activeHoverRegion;

          context.beginPath(); path(group.geometry);
          context.fillStyle = region ? '#' + region.color.toString(16).padStart(6, '0') : '#202b30';

          if (region) {
            context.globalAlpha = isSelected ? 1.0 : (isHovered ? 0.75 : 0.35);
          } else {
            context.globalAlpha = 0.6;
          }
          context.fill();

          // Viền của lục địa
          if (isSelected) {
            context.globalAlpha = 1.0;
            context.strokeStyle = '#ffffff';
            context.lineWidth = 1.1;
            context.stroke();
          } else {
            context.globalAlpha = 0.8;
            context.strokeStyle = '#121d21';
            context.lineWidth = 0.5;
            context.stroke();
          }
        }
      }

      // Lưới kinh vĩ độ
      if (grid) {
        context.beginPath(); path(grid);
        context.globalAlpha = 1.0;
        context.strokeStyle = 'rgba(138,161,168,.1)';
        context.lineWidth = 0.5;
        context.stroke();
      }

      // Đổ bóng 3D hình cầu
      const shade = context.createRadialGradient(width / 2 + radius * .35, height / 2 - radius * .45, radius * .1, width / 2, height / 2, radius);
      shade.addColorStop(0, 'rgba(5,12,16,0)');
      shade.addColorStop(1, 'rgba(5,12,16,.36)');
      context.beginPath(); path({ type: 'Sphere' });
      context.fillStyle = shade; context.fill();
      context.strokeStyle = 'rgba(80,122,134,.35)'; context.lineWidth = 1; context.stroke();
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
      loading.textContent = 'Chưa mở được bản đồ. Chọn lục địa bằng các nút bên cạnh.';
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
