// UI talks only to Image Gate HTTP API. Business facts and actions belong to Backend.
(() => {
  const $ = id => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  const states = ['WAITING_PO', 'DETAINED', 'ACCEPT_APPROVED', 'PURGE_APPROVED'];
  const view = {
    state: states.includes(params.get('state')) ? params.get('state') : 'WAITING_PO',
    source: params.get('source') || '', sort: params.get('sort') === 'newest' ? 'newest' : 'oldest',
    query: params.get('q') || '', grid: params.get('view') === 'grid', selected: params.get('selected'),
  };
  const CHUNK = 100;
  let backend, page, selected, pending = false, reading = false, writing = false, readId = 0, detailId = 0;
  const drafts = new Map();
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
    const p = new URLSearchParams({state:view.state, view:view.grid ? 'grid' : 'single'});
    for (const [key, value] of Object.entries({source:view.source, sort:view.sort, q:view.query, selected:selected?.xru_id || ''})) if (value) p.set(key, value);
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
    for (const control of document.querySelectorAll('[data-state], #source_filter, #sort_filter, .side-search input')) control.disabled = writing;
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
    $('insp-num').textContent = `${String(index + 1).padStart(3,'0')} / ${page.total}`;
    $('po_note_input').value = drafts.has(item.xru_id) ? drafts.get(item.xru_id) : item.po_note || '';
    for (const node of document.querySelectorAll('[data-id]')) node.classList.toggle('is-active', node.dataset.id === item.xru_id);
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
  // Một món = một dòng sidebar + một ô tường ảnh. Cuộn thêm chỉ nối món mới, không vẽ lại món cũ.
  function paintItem(item, index) {
    const row = element('a','side-item ig-row'); row.href = '#'; row.dataset.id = item.xru_id;
    row.append(element('span','n',String(index+1).padStart(2,'0')));
    const labels = element('div',''); labels.append(element('div','t',item.title || ''), element('div','s',`${sourceName(item)}${resolution(item) ? ' · '+resolution(item) : ''}`)); row.append(labels); rows.append(row);
    const tile = element('a','g-tile gr-tile'); tile.href = '#'; tile.dataset.id = item.xru_id;
    const thumb = element('div','g-thumb'); thumb.append(element('span','g-num',String(index+1).padStart(3,'0')));
    const image = document.createElement('img'); image.loading='lazy'; image.decoding='async'; image.src=backend+'/thumb/'+encodeURIComponent(item.xru_id); image.alt=''; thumb.append(image);
    tile.append(thumb); $('tiles').append(tile);
    for (const node of [row,tile]) node.addEventListener('click',event => {event.preventDefault(); select(index); if (event.detail === 2) openPeek();});
  }
  function countLabel() { $('page-count').textContent = page.total ? `${format(page.items.length)} / ${format(page.total)}` : '0'; }
  function paintPage() {
    rows.replaceChildren(); $('tiles').replaceChildren();
    page.items.forEach(paintItem);
    $('total').textContent = format(page.total); $('lane-label').textContent = view.state;
    for (const button of document.querySelectorAll('[data-state]')) { button.classList.toggle('is-active',button.dataset.state===view.state); button.querySelector('.count').textContent=format(page.counts[button.dataset.state]); }
    const options = [new Option(`${window.XRU_I18N.t('all_sources')} (${page.counts[view.state]})`,'')];
    for (const source of page.sources) options.push(new Option(`${sourceName(source)} (${source.total})`,`${source.source_platform}:${source.source_name || ''}`));
    $('source_filter').replaceChildren(...options); $('source_filter').value = view.source;
    // Keep a deleted source visible until the operator clears their filter.
    if (view.source && !$('source_filter').value) { $('source_filter').add(new Option(view.source,view.source)); $('source_filter').value=view.source; }
    $('sort_filter').value = view.sort;
    countLabel(); controls();
  }
  const query = (offset) => '/api/queue?' + new URLSearchParams({state:view.state, sort:view.sort, source:view.source, q:view.query, limit:CHUNK, offset});
  // Cuộn gần đáy thì hỏi thêm một lượt; lõi trả tối đa 100 món mỗi lượt.
  async function more() {
    if (!page || reading || writing || pending || page.items.length >= page.total) return;
    pending = true; const id = readId;
    try {
      const result = await json(query(page.items.length));
      if (id !== readId) return;
      const start = page.items.length, fresh = result.items.filter(item => !page.items.some(row => row.xru_id === item.xru_id));
      page.items.push(...fresh); page.total = result.total; page.counts = result.counts;
      fresh.forEach((item, i) => paintItem(item, start + i));
      countLabel();
    } catch (error) { notice('Chưa tải thêm được ảnh. '+error.message); return; }
    finally { if (id === readId) pending = false; }
    nearEnd();
  }
  // Cuộn tới gần đáy tường (dưới 1200px) thì tải thêm; đọc xong một lượt cũng tự kiểm lại.
  function nearEnd() {
    const main = document.querySelector('.ws-main'), end = $('tiles-end').getBoundingClientRect();
    if (end.top - main.getBoundingClientRect().bottom < 1200 * (main.getBoundingClientRect().height / main.offsetHeight || 1)) more();
  }
  // keep: số món đang có trên màn; đọc lại đủ chừng đó để không mất chỗ đang cuộn.
  async function load(preferred = view.selected, keep = CHUNK) {
    if (writing) return;
    saveDraft(); reading=true; pending=true; const id=++readId; ++detailId; controls();
    if (!backend) return;
    try {
      const result = await json(query(0));
      while (id === readId && result.items.length < Math.min(keep, result.total)) {
        const next = await json(query(result.items.length));
        if (!next.items.length) break;
        result.items.push(...next.items); result.total = next.total; result.counts = next.counts;
      }
      if (id !== readId) return;
      page=result; reading=false;
      paintPage(); notice('');
      const index = page.items.findIndex(item=>item.xru_id===preferred);
      if (page.items.length) await select(index>=0 ? index : 0);
      else { clearSelection(); notice('Không có ảnh khớp bộ lọc.'); syncUrl(); }
    } catch (error) {
      if (id !== readId) return;
      reading=true; controls();
      notice('Backend Gate ảnh đang tắt hoặc đọc lỗi. Số đang hiện, nếu có, chưa được cập nhật. '+error.message);
    } finally { if (id === readId) pending=false; }
    if (id === readId && !reading) nearEnd();
  }
  async function act(action) {
    if (!selected || reading || writing) return;
    const button=actions.find(button=>button.dataset.act===action); if (!button || button.disabled) return;
    saveDraft(); const item=selected; const index=page.items.findIndex(row=>row.xru_id===item.xru_id);
    const next=page.items[index+1]?.xru_id || page.items[index-1]?.xru_id;
    writing=true; controls();
    try {
      await json('/api/assets/'+encodeURIComponent(item.xru_id)+'/decisions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action, expected_state:item.state, po_note:drafts.get(item.xru_id) ?? item.po_note})});
      drafts.delete(item.xru_id); writing=false; await load(next, page.items.length);
    } catch (error) { writing=false; notice('Chưa xác nhận lưu. Ghi chú được giữ. '+error.message); controls(); }
  }
  function closePeek() { $('peek').classList.remove('is-open'); $('peek').removeAttribute('aria-modal'); }
  function openPeek() { if (!selected || reading) return; $('peek-img').src=backend+'/media/'+encodeURIComponent(selected.xru_id); $('peek-img').alt=selected.title || ''; $('peek').classList.add('is-open'); $('peek').setAttribute('aria-modal','true'); }
  $('peek-close').addEventListener('click',closePeek);
  $('insp-img').addEventListener('dblclick',openPeek);
  for (const button of actions) button.addEventListener('click',()=>act(button.dataset.act));
  $('po_note_input').addEventListener('input',saveDraft);
  $('source_filter').addEventListener('change',()=>{view.source=$('source_filter').value; load();});
  $('sort_filter').addEventListener('change',()=>{view.sort=$('sort_filter').value; load();});
  let searchTimer;
  search.value=view.query;
  search.addEventListener('input',()=>{clearTimeout(searchTimer); view.query=search.value.trim(); ++readId; pending=false; clearSelection(); reading=true; controls(); searchTimer=setTimeout(()=>load(),180);});
  search.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault(); search.value=''; view.query=''; load(); search.blur();} event.stopPropagation();});
  let scrolling = 0;
  document.querySelector('.ws-main').addEventListener('scroll',()=>{clearTimeout(scrolling); scrolling=setTimeout(nearEnd,60);},{passive:true});
  for (const button of document.querySelectorAll('[data-state]')) button.addEventListener('click',()=>{view.state=button.dataset.state; view.source=''; view.selected=null; load();});
  document.addEventListener('click',event=>{const button=event.target.closest('.rail a[aria-current="page"]'); if(!button)return; event.preventDefault(); if(writing)return; view.grid=!view.grid; document.body.dataset.grid=String(view.grid); load();});
  document.addEventListener('keydown',event=>{
    if (event.ctrlKey || event.metaKey || event.altKey || event.target.closest('input,textarea,select')) return;
    const key=event.key.toLowerCase();
    if (key==='escape' && $('peek').classList.contains('is-open')) {event.preventDefault(); closePeek(); return;}
    if (key==='a' || key==='d') {event.preventDefault(); act(key==='a'?'ACCEPT':'DETAIN'); return;}
    if (key==='enter') {event.preventDefault(); openPeek(); return;}
    if (key==='1') document.querySelector('.rail a[aria-current="page"]')?.click();
    if (key==='2') location.href='/gate/video/?view=grid';
    if (key==='3') location.href='/gate/dash/';
    if (!selected || reading || writing || !page) return;
    const columns=view.grid ? (document.querySelectorAll('.g-tile').length ? [...document.querySelectorAll('.g-tile')].filter(tile=>tile.offsetTop===document.querySelector('.g-tile').offsetTop).length : 1) : 1;
    const moves={arrowright:1,l:1,arrowleft:-1,h:-1,arrowdown:columns,arrowup:-columns,k:-columns};
    if (!(key in moves)) return;
    event.preventDefault(); const index=page.items.findIndex(item=>item.xru_id===selected.xru_id);
    const target=Math.max(0,Math.min(page.items.length-1,index+moves[key]));
    select(target);
    (view.grid ? $('tiles').children[target] : rows.children[target])?.scrollIntoView({block:'nearest'});
  });
  window.addEventListener('focus',()=>{if(backend&&!writing)load(view.selected, page?.items.length);});
  // Retry disconnected reads; do not redraw a healthy working screen on a timer.
  setInterval(()=>{if(reading&&!pending&&!writing&&!document.hidden&&backend)load();},5000);
  document.body.dataset.grid=String(view.grid);
  controls();
  fetch('/ui-config',{cache:'no-store'}).then(response=>response.json()).then(config=>{backend=config.image_backend; load();}).catch(()=>notice('Không đọc được cấu hình UI. Hãy tải lại trang.'));
})();
