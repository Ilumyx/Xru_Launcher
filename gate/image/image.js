// UI talks only to Image Gate HTTP API. Business facts and actions belong to Backend.
(() => {
  const $ = id => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  const states = ['WAITING_PO', 'DETAINED', 'ACCEPT_APPROVED', 'PURGE_APPROVED'];
  const view = {
    state: states.includes(params.get('state')) ? params.get('state') : 'WAITING_PO',
    platform: params.get('platform') || '', source: params.get('source') || '', sort: params.get('sort') || 'oldest',
    query: params.get('q') || '', page: Math.max(1, +params.get('page') || 1), selected: params.get('selected'),
  };
  // Trang 250 ảnh (PO 22/10): đủ lướt bắt pattern, máy không gồng. Lõi trả tối đa 250 món một lượt (Gate Order 55): một trang một lượt.
  const SIZE = 250;
  let backend, page, selected, pending = false, reading = false, writing = false, readId = 0, detailId = 0;
  const drafts = new Map();
  // Sort theo lane: hai sort "PO quyết định" chỉ có nghĩa ở lane đã quyết.
  const sorts = () => [['oldest','sort_oldest'],['newest','sort_newest'],...(view.state === 'WAITING_PO' ? [] : [['po_newest','sort_po_newest'],['po_oldest','sort_po_oldest']])];
  const search = document.querySelector('.side-search input');
  const rows = document.querySelector('.side-items');
  const actions = [...document.querySelectorAll('[data-act]')];
  const format = n => n.toLocaleString('en-US');
  const sourceName = item => item.source_name || item.source_platform;
  const resolution = item => item.resolution_readable ? `${item.width}×${item.height}` : '';
  const element = (tag, className, text) => { const node = document.createElement(tag); node.className = className; if (text != null) node.textContent = text; return node; };
  function notice(message) { $('err').textContent = message; $('err').hidden = !message; }
  function saveDraft() { if (selected && !$('po_note_input').disabled) drafts.set(selected.xru_id, $('po_note_input').value); }
  function syncUrl() {
    const p = new URLSearchParams({state:view.state});
    for (const [key, value] of Object.entries({platform:view.platform, source:view.source, sort:view.sort, q:view.query, page:view.page > 1 ? view.page : '', selected:selected?.xru_id || ''})) if (value) p.set(key, value);
    history.replaceState(null, '', `/gate/image/?${p}`);
  }
  function controls() {
    const valid = selected && !reading && !writing && selected.state === view.state;
    for (const button of actions) {
      const enabledIn = ['ACCEPT', 'DETAIN'].includes(button.dataset.act) ? 'WAITING_PO' : 'DETAINED';
      button.hidden = enabledIn !== view.state && button.dataset.act !== 'PURGE';
      button.disabled = !valid || selected.state !== enabledIn;
    }
    $('po_note_input').disabled = !valid || view.state !== 'WAITING_PO';
    $('po_note_input').hidden = view.state !== 'WAITING_PO';
    $('insp-note').hidden = view.state === 'WAITING_PO';
    $('readonly').hidden = !selected || ['WAITING_PO','DETAINED'].includes(view.state);
    for (const control of document.querySelectorAll('[data-state], .side-search input')) control.disabled = writing;
  }
  function clearSelection() {
    saveDraft(); selected = null; ++detailId;
    $('insp-img').hidden = true; $('insp-img').removeAttribute('src');
    for (const id of ['insp-title','insp-cap','insp-src','insp-res','insp-state','insp-lane','insp-num','insp-note']) $(id).textContent = '';
    $('po_note_input').value = '';
    document.querySelector('.duplicate-evidence')?.remove();
    closePeek();
    controls();
  }
  async function json(path, options = {}) {
    const response = await fetch(backend + path, {...options, cache:'no-store', signal:AbortSignal.timeout(20000)});
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || 'Backend Gate ảnh chưa sẵn sàng.');
    return body;
  }
  function paintSelection(item, index) {
    selected = item; view.selected = item.xru_id;
    $('insp-img').src = backend + '/media/' + encodeURIComponent(item.xru_id); $('insp-img').hidden = false;
    $('insp-img').alt = item.title || '';
    for (const [id, value] of Object.entries({'insp-title':item.title, 'insp-cap':item.description, 'insp-src':sourceName(item), 'insp-res':resolution(item), 'insp-state':item.state, 'insp-lane':item.state, 'insp-note':item.po_note})) $(id).textContent = value || '';
    $('insp-num').textContent = `${String(page.offset + index + 1).padStart(3,'0')} / ${page.total}`;
    $('po_note_input').value = drafts.has(item.xru_id) ? drafts.get(item.xru_id) : item.po_note || '';
    for (const node of rows.children) {
      const on = node.dataset.id === item.xru_id; node.classList.toggle('is-active', on);
      if (on) node.scrollIntoView({block:'nearest'});
    }
    wall.active(item.xru_id);
    controls(); syncUrl();
    if ($('peek').classList.contains('is-open')) openPeek();
  }
  async function select(index) {
    if (!page || reading || writing || !page.items[index]) return;
    saveDraft(); const id = ++detailId;
    paintSelection(page.items[index], index);
    // Queue already contains light detail; confirm current persisted state separately.
    try {
      const detail = await json('/api/assets/' + encodeURIComponent(page.items[index].xru_id));
      if (id !== detailId) return;
      saveDraft(); paintSelection(detail.item, index);
      document.querySelector('.duplicate-evidence')?.remove();
      const duplicate=detail.duplicate_inspection;
      if(duplicate){
        const section=element('section','duplicate-evidence');
        section.append(element('p','insp-cap',duplicate.status==='COMPLETE'
          ? (detail.related.length ? 'Nghi trùng · DINO · PO quyết định' : 'Trạm DINO đã chạy; không có cặp vượt ngưỡng')
          : (duplicate.status==='ERROR' ? 'Trạm trùng chưa chạy xong · Grid/media lỗi; bằng chứng cũ nếu có vẫn giữ' : 'Ảnh này chưa được trạm trùng soi')));
        for(const row of detail.related){
          const link=element('a','insp-cap',row.xru_id+' · DINO '+row.similarity.toFixed(4));
          link.href=backend+'/media/'+encodeURIComponent(row.xru_id);link.target='_blank';link.rel='noopener';
          const image=document.createElement('img');image.src=backend+'/thumb/'+encodeURIComponent(row.xru_id);image.alt=row.xru_id;image.style.maxWidth='100%';image.loading='lazy';
          link.append(image);section.append(link);
        }
        $('insp-cap').parentElement.after(section);
      }
      if (detail.item.state !== view.state) { notice('Ảnh đã chuyển trạng thái. Đang đọc lại hàng chờ…'); await load(); }
    } catch (error) {
      if (id !== detailId) return;
      notice('Backend Gate ảnh đang tắt hoặc đọc lỗi. ' + error.message);
      reading = true; controls();
    }
  }
  // Một món = một dòng sidebar; ô tường do kit/wall vẽ.
  function paintRow(item, index) {
    const row = element('a','side-item ig-row'); row.href = '#'; row.dataset.id = item.xru_id;
    row.append(element('span','n',String(page.offset+index+1).padStart(2,'0')));
    const labels = element('div',''); labels.append(element('div','t',item.title || ''), element('div','s',`${sourceName(item)}${resolution(item) ? ' · '+resolution(item) : ''}`)); row.append(labels); rows.append(row);
    row.addEventListener('click',event => {event.preventDefault(); select(index);});
  }
  const wall = window.XRU_WALL({
    grid: $('tiles'), pager: $('page-count'), next: $('tiles-end'), size: SIZE,
    thumb: (item, width) => backend+'/thumb/'+encodeURIComponent(item.xru_id)+'?w='+width,
    onSelect: (index, double) => { select(index); if (double) openPeek(); },
    onPage: n => { if (writing) return; view.page = n; view.selected = null; load(); },
  });
  function paintPage() {
    rows.replaceChildren(); page.items.forEach(paintRow);
    wall.render(page.items, page.offset, page.total);
    $('total').textContent = format(page.total); $('lane-label').textContent = view.state;
    for (const button of document.querySelectorAll('[data-state]')) { button.classList.toggle('is-active',button.dataset.state===view.state); button.querySelector('.count').textContent=format(page.counts[button.dataset.state]); }
    paintFilters(); controls();
  }
  // Nhóm lọc bấm thẳng (kit/sidebar/filters.js) nằm trên danh sách: nguồn dạng cây nền tảng → kênh, sắp xếp theo lane.
  const filters = window.XRU_FILTERS($('filters'), change => { if (writing) return; Object.assign(view, change); view.page = 1; load(); });
  function paintFilters() {
    if (!page) return; const t = window.XRU_I18N.t;
    filters.render([
      {key:'source', title:t('source_lbl'), tree:{all:t('all_sources'), total:page.counts[view.state], sources:page.sources, platform:view.platform, source:view.source}},
      {key:'sort', title:t('sort_lbl'), rows:sorts().map(([key, label]) => ({pick:{sort:key}, name:t(label), on:view.sort === key}))},
    ]);
  }
  window.addEventListener('xru-lang-applied', paintFilters);
  const query = (offset) => '/api/queue?' + new URLSearchParams({state:view.state, sort:view.sort, platform:view.platform, source:view.source, q:view.query, limit:SIZE, offset});
  // Đọc một trang. Trang vượt cuối (món vừa rời lane) thì lõi trả trang cuối; số trang theo offset lõi trả.
  // preferred: id muốn chọn; không còn trên trang thì chọn ô số slot (kẹp ở ô cuối).
  async function load(preferred = view.selected, slot = 0) {
    if (writing) return;
    if (!sorts().some(([key]) => key === view.sort)) view.sort = 'oldest';
    saveDraft(); reading=true; pending=true; const id=++readId; ++detailId; controls();
    if (!backend) return;
    try {
      const result = await json(query((view.page - 1) * SIZE));
      if (id !== readId) return;
      view.page = Math.floor(result.offset / SIZE) + 1; page = result; reading=false;
      paintPage(); notice('');
      const index = page.items.findIndex(item=>item.xru_id===preferred);
      if (page.items.length) await select(index>=0 ? index : Math.min(slot, page.items.length-1));
      else { clearSelection(); notice('Không có ảnh khớp bộ lọc.'); syncUrl(); }
    } catch (error) {
      if (id !== readId) return;
      reading=true; controls();
      notice('Backend Gate ảnh đang tắt hoặc đọc lỗi. Số đang hiện, nếu có, chưa được cập nhật. '+error.message);
    } finally { if (id === readId) pending=false; }
  }
  async function act(action) {
    if (!selected || reading || writing) return;
    const button=actions.find(button=>button.dataset.act===action); if (!button || button.disabled) return;
    saveDraft(); const item=selected; const index=page.items.findIndex(row=>row.xru_id===item.xru_id);
    writing=true; controls();
    try {
      await json('/api/assets/'+encodeURIComponent(item.xru_id)+'/decisions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action, expected_state:item.state, po_note:drafts.get(item.xru_id) ?? item.po_note})});
      drafts.delete(item.xru_id); writing=false; await load(null, index);
    } catch (error) { writing=false; notice('Chưa xác nhận lưu. Ghi chú được giữ. '+error.message); controls(); }
  }
  function closePeek() { $('peek').classList.remove('is-open'); $('peek').removeAttribute('aria-modal'); }
  function openPeek() { if (!selected || reading) return; $('peek-img').src=backend+'/media/'+encodeURIComponent(selected.xru_id); $('peek-img').alt=selected.title || ''; $('peek').classList.add('is-open'); $('peek').setAttribute('aria-modal','true'); }
  $('peek-close').addEventListener('click',closePeek);
  $('insp-img').addEventListener('dblclick',openPeek);
  for (const button of actions) button.addEventListener('click',()=>act(button.dataset.act));
  $('po_note_input').addEventListener('input',saveDraft);
  let searchTimer;
  search.value=view.query;
  search.addEventListener('input',()=>{clearTimeout(searchTimer); view.query=search.value.trim(); view.page=1; ++readId; pending=false; reading=true; controls(); searchTimer=setTimeout(()=>load(),250);});
  search.addEventListener('keydown',event=>event.stopPropagation());
  for (const button of document.querySelectorAll('[data-state]')) button.addEventListener('click',()=>{view.state=button.dataset.state; view.platform=''; view.source=''; view.page=1; view.selected=null; load();});
  document.addEventListener('keydown',event=>{
    if (event.ctrlKey || event.metaKey || event.altKey || event.target.closest('input,textarea,select')) return;
    const key=event.key.toLowerCase();
    if (key==='escape' && $('peek').classList.contains('is-open')) {event.preventDefault(); closePeek(); return;}
    if (key==='a' || key==='d') {event.preventDefault(); act(key==='a'?'ACCEPT':'DETAIN'); return;}
    if (key==='enter') {event.preventDefault(); openPeek(); return;}
    if (!selected || reading || writing || !page) return;
    const columns=wall.columns(), moves={arrowright:1,arrowleft:-1,arrowdown:columns,arrowup:-columns};
    if (!(key in moves)) return;
    event.preventDefault(); const index=page.items.findIndex(item=>item.xru_id===selected.xru_id);
    const target=Math.max(0,Math.min(page.items.length-1,index+moves[key]));
    select(target);
  });
  // Không vẽ lại tường khi cửa sổ được bấm vào; chỉ đọc lại khi Backend từng mất kết nối.
  window.addEventListener('focus',()=>{if(reading&&backend&&!writing&&!pending)load();});
  setInterval(()=>{if(reading&&!pending&&!writing&&!document.hidden&&backend)load();},5000);
  controls();
  fetch('/ui-config',{cache:'no-store'}).then(response=>response.json()).then(config=>{backend=config.image_backend; load();}).catch(()=>notice('Không đọc được cấu hình UI. Hãy tải lại trang.'));
})();
