// Launcher owns this map. The only outbound action is selecting a continent.
window.LauncherGlobe = (() => {
  const REGIONS = [
    { id: 'euramerika', area: 'Bắc Mỹ', color: 0x78b5db, countries: 'CA US MX GL BM GT BZ HN SV NI CR PA CU HT DO JM BS TT BB AG DM GD KN LC VC PR' },
    { id: 'eurasia', area: 'Châu Á', color: 0x62c8b5, countries: 'AF AM AZ BH BD BT BN KH CN CY GE IN ID IR IQ IL JP JO KZ KW KG LA LB MY MV MN MM NP KP OM PK PS PH QA SA SG KR LK SY TW TJ TH TL TR TM AE UZ VN YE' },
    { id: 'euruska', area: 'Nga', color: 0xd9aa73, countries: 'RU' },
    { id: 'europa', area: 'Châu Âu', color: 0xb3a3d9, countries: 'AL AD AT BY BE BA BG HR CZ DK EE FI FR DE GR HU IS IE IT XK LV LI LT LU MT MD MC ME NL MK NO PL PT RO SM RS SK SI ES SE CH UA GB VA' }
  ];
  let libraries;
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
    return `<section class="federal-map" aria-label="Bản đồ chọn lục địa">
      <div class="globe-side">
        <div class="globe-eyebrow">01 — FEDERAL MAP</div>
        <h2>Một Liên Bang.<br>Bốn lục địa.</h2>
        <p class="globe-intro">Chọn lục địa để bắt đầu.<br>Mỗi lục địa, một nhiệm vụ riêng.</p>
        <div class="globe-destinations">${REGIONS.map(region => {
          const continent = continents.find(c => c.id === region.id);
          return `<button class="globe-destination" data-destination="${region.id}" style="--region-color:#${region.color.toString(16).padStart(6, '0')}">
            <span class="globe-region-dot"></span><span><b>${continent.name}</b><small>${region.area} · ${continent.role}</small></span><span class="globe-arrow">↗</span>
          </button>`;
        }).join('')}</div>
        <div class="globe-side-note">Kéo để khám phá · Bấm vùng để đi vào</div>
      </div>
      <div class="globe-scene">
        <canvas class="globe-chart" role="img" aria-label="Địa cầu tương tác. Dùng các nút bên cạnh để chọn lục địa bằng bàn phím."></canvas>
        <div class="globe-loading" role="status">Đang mở bản đồ…</div>
        <div class="globe-tools"><button data-spin aria-label="Tạm dừng xoay">Ⅱ</button><button data-home aria-label="Đưa bản đồ về góc ban đầu">↺</button></div>
        <div class="globe-caption"><span class="globe-caption-dot"></span><span data-globe-caption>LIÊN BANG XRU</span></div>
      </div>
    </section>`;
  }
  function mount(container, onSelect) {
    const canvas = container.querySelector('.globe-chart');
    const context = canvas.getContext('2d');
    const spinButton = container.querySelector('[data-spin]');
    const homeButton = container.querySelector('[data-home]');
    const caption = container.querySelector('[data-globe-caption]');
    const loading = container.querySelector('.globe-loading');
    const regionByCountry = new Map(REGIONS.flatMap(region => region.countries.split(' ').map(id => [id, region])));
    let disposed = false, frame = 0, lastFrame = 0;
    let spinning = false;
    let hovered = false, activeRegion = null, drag = null;
    let rotation = [-65, -18], width = 0, height = 0, radius = 0;
    let projection, path, countries, groups, grid;
    function updateButton() {
      spinButton.textContent = spinning ? 'Ⅱ' : '▷';
      spinButton.setAttribute('aria-label', spinning ? 'Tạm dừng xoay' : 'Tiếp tục xoay');
      spinButton.setAttribute('aria-pressed', String(!spinning));
    }
    function setRegion(region) {
      if (region === activeRegion) return;
      activeRegion = region;
      caption.textContent = region ? region.id.toUpperCase() + ' ↗' : 'LIÊN BANG XRU';
      canvas.style.cursor = drag?.moved ? 'grabbing' : region ? 'pointer' : 'grab';
      container.querySelectorAll('[data-destination]').forEach(button => button.classList.toggle('is-hovered', button.dataset.destination === region?.id));
      requestDraw();
    }
    function draw() {
      context.clearRect(0, 0, width, height);
      projection.rotate(rotation);
      context.beginPath(); path({ type: 'Sphere' });
      context.fillStyle = '#101b20'; context.fill();
      for (const group of groups) {
        const region = group.region;
        context.beginPath(); path(group.geometry);
        context.fillStyle = region ? '#' + region.color.toString(16).padStart(6, '0') : '#29383d';
        context.globalAlpha = region ? region === activeRegion ? 1 : 0.75 : 1;
        context.fill();
        context.globalAlpha = 1;
        context.strokeStyle = '#17252b'; context.lineWidth = 0.6; context.stroke();
      }
      context.beginPath(); path(grid);
      context.strokeStyle = 'rgba(138,161,168,.12)'; context.lineWidth = 0.5; context.stroke();
      const shade = context.createRadialGradient(width / 2 + radius * .4, height / 2 - radius * .5, radius * .1, width / 2, height / 2, radius);
      shade.addColorStop(0, 'rgba(5,12,16,0)'); shade.addColorStop(1, 'rgba(5,12,16,.28)');
      context.beginPath(); path({ type: 'Sphere' });
      context.fillStyle = shade; context.fill();
      context.strokeStyle = 'rgba(80,122,134,.3)'; context.lineWidth = 1; context.stroke();
    }
    function tick(time) {
      frame = 0;
      if (disposed || document.hidden || !projection) return;
      if (time - lastFrame >= 1000 / 12) {
        if (spinning && !hovered) rotation[0] = (rotation[0] + Math.min(time - lastFrame, 150) * .0015) % 360;
        lastFrame = time;
        draw();
      }
      if (spinning && !hovered) frame = requestAnimationFrame(tick);
    }
    function requestDraw() {
      if (disposed || document.hidden || !projection || frame) return;
      // A single frame for interaction; a loop only while the globe is spinning.
      frame = requestAnimationFrame(time => { frame = 0; lastFrame = time; draw(); if (spinning && !hovered) frame = requestAnimationFrame(tick); });
    }
    function stopFrames() { cancelAnimationFrame(frame); frame = 0; lastFrame = 0; }
    function resize() {
      if (!projection || disposed) return;
      width = canvas.clientWidth; height = canvas.clientHeight;
      const ratio = Math.min(devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      radius = Math.max(1, Math.min(width, height) / 2 - 26);
      projection.scale(radius).translate([width / 2, height / 2]);
      requestDraw();
    }
    function point(event) {
      const rect = canvas.getBoundingClientRect();
      return [(event.clientX - rect.left) * width / rect.width, (event.clientY - rect.top) * height / rect.height];
    }
    function regionAt(position) {
      if (!projection || Math.hypot(position[0] - width / 2, position[1] - height / 2) > radius) return null;
      const coordinate = projection.invert(position);
      const country = countries.find(country => regionByCountry.has(country.id) && d3.geoContains(country, coordinate));
      return country ? regionByCountry.get(country.id) : null;
    }
    function pointerEnter() { hovered = true; stopFrames(); }
    function pointerLeave() { hovered = false; if (!drag) { setRegion(null); requestDraw(); } }
    function pointerDown(event) {
      if (!projection || (event.pointerType === 'mouse' && event.button !== 0)) return;
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
          setRegion(null); requestDraw();
        }
      } else setRegion(regionAt(position));
    }
    function pointerUp(event) {
      if (!drag || drag.pointerId !== event.pointerId) return;
      const region = !drag.moved && event.type === 'pointerup' ? regionAt(point(event)) : null;
      drag = null;
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
      if (event.pointerType !== 'mouse') hovered = false;
      if (region) onSelect(region.id); else requestDraw();
    }
    function visibilityChanged() { stopFrames(); if (!document.hidden) requestDraw(); }
    function select(event) { const button = event.target.closest('[data-destination]'); if (button) onSelect(button.dataset.destination); }
    function toggleSpin() { spinning = !spinning; hovered = false; updateButton(); stopFrames(); requestDraw(); }
    function reset() { rotation = [-65, -18]; setRegion(null); requestDraw(); }
    const events = [['pointerenter', pointerEnter], ['pointerleave', pointerLeave], ['pointerdown', pointerDown], ['pointermove', pointerMove], ['pointerup', pointerUp], ['pointercancel', pointerUp]];
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
      groups = [null, ...REGIONS].map(region => ({ region, geometry: { type: 'FeatureCollection', features: countries.filter(country => (regionByCountry.get(country.id) || null) === region) } }));
      projection = d3.geoOrthographic().precision(.7);
      path = d3.geoPath(projection, context);
      grid = d3.geoGraticule10();
      loading.hidden = true;
      resize();
    }).catch(error => {
      if (disposed) return;
      loading.textContent = 'Chưa mở được bản đồ. Chọn lục địa bằng các nút bên cạnh.';
      console.error(error);
    });
    return () => {
      disposed = true; stopFrames(); observer.disconnect();
      for (const [name, handler] of events) canvas.removeEventListener(name, handler);
      container.removeEventListener('click', select);
      spinButton.removeEventListener('click', toggleSpin);
      homeButton.removeEventListener('click', reset);
      document.removeEventListener('visibilitychange', visibilityChanged);
      window.removeEventListener('pagehide', stopFrames);
      window.removeEventListener('pageshow', visibilityChanged);
    };
  }
  return { markup, mount };
})();
