// XRU SHELL — ô giữa của vỏ (launcher.py). Nhúng module của land; app đang tắt thì hiện "Bật lại".
// window.XRU_VIEW = { land, mod, key (khóa app, null nếu là trang của Launcher), url, title }
(() => {
  const V = window.XRU_VIEW;
  const $ = (id) => document.getElementById(id);
  const t = (k) => (window.XRU_I18N ? window.XRU_I18N.t(k) : k);
  const frame = $('sh-frame'), down = $('sh-down'), btn = $('sh-start');
  let up = null;

  // Nút nằm trên rail của vỏ; màn của land tự đóng/mở cột danh sách của nó.
  window.toggleGatePanel = () => {
    if (up) frame.contentWindow?.postMessage({ type: 'xru-toggle-sidebar' }, new URL(V.url, location.href).origin);
  };

  function show(isUp) {
    if (isUp === up) return;
    up = isUp;
    frame.hidden = !isUp;
    down.hidden = isUp;
    if (isUp && frame.getAttribute('src') !== V.url) frame.src = V.url;
    if (!isUp) frame.removeAttribute('src');
    if (isUp) frame.focus();
  }

  async function check() {
    if (!V.key) return show(true);
    try { show(Boolean((await (await fetch('/status')).json())[V.key])); } catch { /* vỏ đang khởi động lại */ }
  }

  $('sh-port').textContent = V.url.replace('http://', '');
  $('sh-log').textContent = `Xru_Launcher/logs/${V.key}.log`;
  btn.addEventListener('click', async () => {
    btn.disabled = true;
    btn.textContent = t('sh_starting');
    await fetch('/start', { method: 'POST', body: new URLSearchParams({ app: V.key }) });
    for (let i = 0; i < 60 && !up; i++) { await new Promise((r) => setTimeout(r, 1000)); await check(); }
    btn.disabled = false;
    btn.textContent = up ? t('sh_start') : t('sh_not_up');
  });

  check();
  if (V.key) setInterval(check, 4000);
})();
