// Mockup view only: source filtering, source details and navigation shortcuts.
(() => {
  const table = document.querySelector('[data-source-table]');
  if (table) {
    const search = document.getElementById('source-search');
    const filters = [...document.querySelectorAll('[data-status-filter]')];
    const rows = [...table.querySelectorAll('tbody tr')];
    let status = new URLSearchParams(location.search).get('status') || 'all';
    if (!filters.some(button => button.dataset.statusFilter === status)) status = 'all';
    function filter() {
      const query = search.value.trim().toLocaleLowerCase('vi');
      let count = 0;
      for (const row of rows) {
        row.hidden = !(status === 'all' || row.dataset.status === status) || !row.textContent.toLocaleLowerCase('vi').includes(query);
        if (!row.hidden) count++;
      }
      for (const button of filters) button.setAttribute('aria-pressed', String(button.dataset.statusFilter === status));
      const word = window.XRU_I18N ? window.XRU_I18N.t('cr_sources_word') : 'nguồn';
      document.getElementById('source-result-count').textContent = `${count} / ${rows.length} ${word}`;
      document.getElementById('source-empty').hidden = count !== 0;
    }
    search.addEventListener('input', filter);
    window.addEventListener('xru-lang-applied', filter);
    for (const button of filters) button.addEventListener('click', () => { status = button.dataset.statusFilter; filter(); });
    filter();

    const dialog = document.getElementById('source-detail');
    for (const button of table.querySelectorAll('[data-source-name]')) {
      button.addEventListener('click', () => {
        const row = button.closest('tr');
        document.getElementById('source-detail-name').textContent = button.dataset.sourceName;
        for (const key of ['url', 'kind', 'state', 'last', 'assets', 'tier', 'description', 'note']) {
          document.getElementById(`source-detail-${key}`).textContent = row.dataset[key];
        }
        dialog.showModal();
      });
    }
    document.getElementById('source-detail-close').addEventListener('click', () => dialog.close());
  }
  for (const button of document.querySelectorAll('[data-chart-series]')) {
    button.addEventListener('click', () => {
      const visible = button.getAttribute('aria-pressed') !== 'true';
      button.setAttribute('aria-pressed', String(visible));
      document.getElementById(button.getAttribute('aria-controls')).toggleAttribute('hidden', !visible);
    });
  }
  window.addEventListener('keydown', event => {
    if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(document.activeElement.tagName) || document.querySelector('dialog[open]')) return;
    if (event.key === 'Escape') location.href = 'launcher_mockup.html?continent=eurasia';
    if (event.key === '1') location.href = 'crawler_dash.html';
    if (event.key === '2') location.href = 'crawler_sources.html';
    if (event.key === '3') location.href = 'crawler_dash_activity.html';
  });
})();
