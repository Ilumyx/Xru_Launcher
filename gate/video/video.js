// Video UI owns interaction; the lane Backend owns every fact and decision.
(() => {
  const $ = id => document.getElementById(id), p = new URLSearchParams(location.search);
  const lanes = ['WAITING_PO','MACHINE_FLAGGED','DETAINED','ACCEPT_APPROVED','PURGE_APPROVED'];
  const view = {state:lanes.includes(p.get('state'))?p.get('state'):'WAITING_PO',source:p.get('source')||'',platform:p.get('platform')||'ALL',sort:p.get('sort')||'oldest',q:p.get('q')||'',page:Math.max(1,+p.get('page')||1),mode:p.get('view')==='grid'?'grid':'watch',selected:p.get('selected')};
  let backend, page, selected, reading=true, writing=false, pending=false, readId=0, detailId=0;
  const drafts=new Map(), list=document.querySelector('.queue-list'), search=document.querySelector('.side-search input');
  const source=document.querySelector('select[name="source"]'), sort=document.querySelector('select[name="sort"]');
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const n=v=>Number(v).toLocaleString('en-US'), time=v=>Number.isFinite(v)?`${Math.floor(v/60)}:${String(Math.floor(v%60)).padStart(2,'0')}`:'';
  const media=id=>backend+'/media/'+encodeURIComponent(id);
  const actions={WAITING_PO:[['ACCEPT','Accept','a'],['DETAIN','Detain','d']],MACHINE_FLAGGED:[['KEEP','YES · KEEP','a'],['DETAIN','NO · DETAIN','d']],DETAINED:[['RESCUE','RESCUE TO WAIT','r'],['PURGE','PURGE','p']],PURGE_APPROVED:[['RESTORE_PURGE','RESTORE TO DETAIN','r']],ACCEPT_APPROVED:[['RESCUE_ACCEPT','RESCUE TO WAIT','r'],['DETAIN_ACCEPT','DETAIN','d']]};
  function notice(message){$('api-error').textContent=message;$('api-error').hidden=!message;}
  const itemLink=id=>'/gate/video/?'+new URLSearchParams({state:view.state,view:view.mode,sort:view.sort,source:view.source,platform:view.platform,q:view.q,page:view.page,selected:id});
  function sync(){const q=new URLSearchParams({state:view.state,view:view.mode,sort:view.sort});for(const[k,v]of Object.entries({source:view.source,platform:view.platform!=='ALL'?view.platform:'',q:view.q,page:view.page>1?view.page:'',selected:selected?.xru_id||''}))if(v)q.set(k,v);history.replaceState(null,'','/gate/video/?'+q);for(const entry of window.XRU_RAILS.gate.groups[0])if(['video','watch'].includes(entry.key)){const target=new URLSearchParams(q);target.set('view',entry.key==='video'?'grid':'watch');entry.href='/gate/video/?'+target;}document.querySelectorAll('.rail a').forEach(a=>{const u=new URL(a.href);if(u.pathname==='/gate/video/'){const target=new URLSearchParams(q);target.set('view',u.searchParams.get('view'));a.href='/gate/video/?'+target;}});}
  function controls(){const valid=selected&&!reading&&!writing&&selected.lane===view.state;
    document.querySelectorAll('#decision-controls button,#decision-controls input,#decision-controls textarea').forEach(e=>e.disabled=!valid);
    document.querySelectorAll('[data-state],.queue-controls select,.side-search input').forEach(e=>e.disabled=writing);
    document.querySelector('[data-page="-1"]').disabled=reading||writing||!page||page.offset===0;
    document.querySelector('[data-page="1"]').disabled=reading||writing||!page||page.offset+page.items.length>=page.total;
    const skip=$('skip-review-item');if(skip)skip.disabled=!valid||page.total<2;
    document.querySelectorAll('[data-step]').forEach(e=>e.disabled=!valid);
  }
  async function json(path,options={}){const r=await fetch(backend+path,{...options,cache:'no-store',signal:AbortSignal.timeout(20000)});const d=await r.json();if(!r.ok)throw Error(d.error||'Backend chưa sẵn sàng.');return d;}
  function remember(){if(!selected||!$('po-note'))return;drafts.set(selected.xru_id,{po_note:$('po-note').value,noise_present:$('noise-present').checked,watermark_present:$('watermark-present').checked});refreshTokens();}
  function refreshTokens(){const note=$('po-note');if(!note)return;document.querySelectorAll('[data-note-token]').forEach(b=>{const on=note.value.split('\n').some(line=>line.trim()===b.dataset.noteToken);b.classList.toggle('active',on);b.setAttribute('aria-pressed',on);});}
  function token(word){if(!$('po-note')||$('po-note').disabled)return;const note=$('po-note'),lines=note.value.split('\n'),at=lines.findIndex(x=>x.trim()===word);if(at>=0){lines.splice(at,1);note.value=lines.join('\n').replace(/^\n+|\n+$/g,'');}else note.value=note.value.trimEnd()+(note.value.trimEnd()?'\n':'')+word;remember();}
  function stopPlayer(){const video=$('review-video-player');if(video){video.pause();video.removeAttribute('src');video.load();}$('watch-area').replaceChildren();$('inspector-player').replaceChildren();}
  function renderPlayer(item){const old=$('review-video-player');if(old?.dataset.id===item.xru_id&&old.dataset.mode===view.mode){if(old.error)old.load();return;}
    const same=old?.dataset.id===item.xru_id,position=same?old.currentTime:0,playing=same&&!old.paused;
    if(!same)stopPlayer();
    const video=`<video id="review-video-player" preload="metadata" src="${esc(media(item.xru_id))}" data-id="${esc(item.xru_id)}" data-mode="${view.mode}"></video>`;
    const track='<span data-player="seek" role="slider" aria-label="Vị trí video" tabindex="0"><span data-progress></span></span>';
    if(view.mode==='watch'){
      $('watch-area').innerHTML=`<section class="watch"><div class="watch-stage"><div class="video-container"><div class="watch-frame ${item.orientation==='portrait'?'is-portrait':''}" id="watch-frame">${video}<span class="g-play" data-player="play"></span><div class="watch-stamp"></div></div></div><button class="watch-nav prev" data-step="-1" aria-label="Clip trước">‹</button><button class="watch-nav next" data-step="1" aria-label="Clip sau">›</button></div><div class="watch-ctrl"><button class="watch-btn" data-player="play" aria-label="Phát / dừng"></button><span class="watch-time"><span data-time>0:00</span> / <span id="insp-dur">${time(item.duration_seconds)}</span></span>${track.replace('<span data-player','<span class="watch-track" data-player')}<button class="watch-ic" data-player="rate">1×</button><button class="watch-ic" data-player="mute" aria-label="Âm thanh">🔊</button><button class="watch-ic" data-player="fullscreen" aria-label="Toàn màn hình">⛶</button></div></section>`;
      $('inspector-player').replaceChildren();
    }else{
      $('inspector-player').innerHTML=`<div class="insp-img is-video"><div class="video-container">${video}</div><span class="g-play" data-player="play"></span></div><div class="insp-bar"><span data-time>0:00</span>${track.replace('<span data-player','<span class="track" data-player')}<span id="insp-dur">${time(item.duration_seconds)}</span></div>`;
      $('watch-area').replaceChildren();
    }
    let current=$('review-video-player');
    if(same){current.replaceWith(old);current=old;current.dataset.mode=view.mode;try{current.currentTime=position;}catch{}if(playing)current.play().catch(()=>{});}
    if(!current.dataset.bound){current.dataset.bound='1';current.addEventListener('click',play);['play','pause','timeupdate','loadedmetadata','ended'].forEach(e=>current.addEventListener(e,updatePlayer));}
    updatePlayer();
  }
  function updatePlayer(){const v=$('review-video-player');if(!v)return;document.querySelector('.watch')?.classList.toggle('is-playing',!v.paused&&!v.ended);document.querySelector('.insp-img')?.classList.toggle('is-playing',!v.paused&&!v.ended);document.querySelector('[data-time]').textContent=time(v.currentTime);const ratio=Number.isFinite(v.duration)&&v.duration>0?v.currentTime/v.duration:0;document.querySelector('[data-progress]').style.width=(ratio*100)+'%';const track=document.querySelector('[data-player="seek"]');track.setAttribute('aria-valuemin','0');track.setAttribute('aria-valuemax',Number.isFinite(v.duration)?v.duration:0);track.setAttribute('aria-valuenow',v.currentTime);if(Number.isFinite(v.duration))$('insp-dur').textContent=time(v.duration);}
  function play(){const v=$('review-video-player');if(!v)return;if(v.paused||v.ended)v.play().catch(()=>notice('Chưa phát được video.'));else v.pause();}
  const gridHints=document.querySelector('.key-hints').innerHTML;
  const watchHints='<span><span class="key">←</span><span class="key">→</span> <span>±5s · Shift: ±15%</span></span><span><span class="key">Space</span> <span data-i18n="w_play_pause">Phát / dừng</span></span><span><span class="key">A</span><span class="key">D</span><span class="key">S</span> <span data-i18n="w_auto_next">Chấm xong tự sang clip kế</span></span><span><span class="key">ESC</span> <span data-i18n="esc_launcher">Về Launcher</span></span>';
  function mode(){if(view.mode==='watch')document.querySelector('.ws').style.removeProperty('--insp-w');document.querySelector('.key-hints').innerHTML=view.mode==='watch'?watchHints:gridHints;document.body.dataset.mode=view.mode;$('video-gallery').hidden=view.mode!=='grid';$('watch-area').hidden=view.mode!=='watch';const nav=document.querySelector('.rail');nav.dataset.active=view.mode==='grid'?'video':'watch';window.XRU_I18N.apply();if(selected){renderPlayer(selected);for(const[act,label]of actions[selected.lane]){const b=document.querySelector('[data-action="'+act+'"]');if(b?.firstChild)b.firstChild.textContent=(act==='ACCEPT'&&view.mode==='grid'?window.XRU_I18N.t('btn_approve'):act==='DETAIN'&&view.state!=='MACHINE_FLAGGED'&&view.mode==='grid'?window.XRU_I18N.t('btn_detain'):label)+' ';}}controls();sync();}
  function paintDetail(item,index){selected=item;view.selected=item.xru_id;
    for(const[id,value]of Object.entries({'insp-title':item.title,'insp-cap':item.description,'insp-xid':item.xru_id,'insp-src':item.source_platform+(item.source_name?' / '+item.source_name:''),'insp-res':item.resolution_readable?`${item.width}×${item.height} (${item.aspect_ratio||''})`:'','insp-lane':item.lane}))$(id).textContent=value||'';
    document.querySelector('.insp-tag').textContent=item.lane;document.querySelector('.insp-tag').title=item.gate_flag_reason||'';$('insp-num').textContent=`${String(page.offset+index+1).padStart(3,'0')} / ${page.total}`;
    document.querySelectorAll('[data-id]').forEach(e=>{const on=e.dataset.id===item.xru_id;e.classList.toggle('active',on);e.classList.toggle('is-active',on);});
    const editable=item.state==='WAITING_PO';
    $('decision-controls').innerHTML=`<div class="actions-bar">${editable?'<div class="finding-row"><label class="finding-control"><input id="noise-present" type="checkbox"> NOISE<kbd>1</kbd></label><label class="finding-control"><input id="watermark-present" type="checkbox"> WMARK<kbd>2</kbd></label><button class="finding-control" data-note-token="EVENT">EVENT <kbd>3</kbd></button><button class="finding-control" data-note-token="CAUTION">CAUTION <kbd>4</kbd></button></div><textarea id="po-note" class="insp-note" placeholder="Note (optional)..."></textarea>':''}<div class="decision-row">${actions[item.lane].map(([act,label,key])=>`<button class="btn btn-${key==='a'?'accept':key==='d'?'detain':key==='p'?'purge':'rescue'}" data-action="${act}">${act==='ACCEPT'&&view.mode==='grid'?window.XRU_I18N.t('btn_approve'):act==='DETAIN'&&view.state!=='MACHINE_FLAGGED'&&view.mode==='grid'?window.XRU_I18N.t('btn_detain'):label} <kbd>${key.toUpperCase()}</kbd></button>`).join('')}<button class="btn btn-skip" id="skip-review-item">Skip <kbd>S</kbd></button></div></div>`;
    if(editable){const d=drafts.get(item.xru_id)||item;$('po-note').placeholder=window.XRU_I18N.t('note_ph');$('po-note').value=d.po_note||'';$('noise-present').checked=!!d.noise_present;$('watermark-present').checked=!!d.watermark_present;refreshTokens();}
    document.querySelectorAll('.related-videos,.po-note-display').forEach(e=>e.remove());
    if(!editable){const note=document.createElement('p');note.className='po-note-display';note.textContent=item.po_note||'';document.querySelector('.evidence-grid').append(note);}
    renderPlayer(item);controls();sync();
  }
  function clear(){selected=null;++detailId;stopPlayer();$('decision-controls').replaceChildren();document.querySelectorAll('.related-videos,.po-note-display').forEach(e=>e.remove());document.querySelector('.insp-tag').textContent='';['insp-title','insp-cap','insp-xid','insp-src','insp-res','insp-lane','insp-num'].forEach(id=>$(id).textContent='');controls();}
  async function select(index){if(reading||writing||!page?.items[index])return;const id=++detailId;const item=page.items[index];paintDetail({...item,lane:view.state},index);
    try{const detail=await json('/api/assets/'+encodeURIComponent(item.xru_id));if(id!==detailId)return;if(detail.item.lane!==view.state){notice('Clip đã chuyển lane. Đang đọc lại…');await load();return;}paintDetail(detail.item,index);
      if(view.state==='MACHINE_FLAGGED'&&detail.related.length){const related=document.createElement('div');related.className='related-videos';related.innerHTML='<div class="insp-label">RELATED VIDEOS</div>'+detail.related.map(row=>`<a href="#" class="dupe-link" data-related="${esc(row.xru_id)}" data-lane="${row.lane}">${esc(row.xru_id)}</a> <span class="state-chip">${row.lane}</span>`).join('');document.querySelector('.evidence-grid').append(related);}
    }catch(e){if(id!==detailId)return;reading=true;notice('Backend Gate video đang tắt hoặc đọc lỗi. '+e.message);controls();}
  }
  function paintPage(){list.replaceChildren();$('video-gallery').querySelectorAll('video').forEach(v=>{v.removeAttribute('src');v.load();});$('video-gallery').replaceChildren();
    page.items.forEach((item,i)=>{const row=document.createElement('a');row.href=itemLink(item.xru_id);row.className='side-item queue-item';row.dataset.id=item.xru_id;row.innerHTML=`<span class="n">${String(page.offset+i+1).padStart(2,'0')}</span><div><div class="t">${esc(item.title)}</div><div class="s">${esc(item.source_name||item.source_platform)}${item.duration_seconds!=null?' · '+time(item.duration_seconds):''}</div></div>`;list.append(row);row.addEventListener('click',e=>{if(e.button!==0||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;e.preventDefault();select(i);});
      const tile=document.createElement('a');tile.href=itemLink(item.xru_id);tile.className='g-tile';tile.dataset.id=item.xru_id;tile.innerHTML=`<div class="g-thumb"><video preload="none" muted loop playsinline aria-hidden="true" poster="${esc(backend+'/thumb/'+encodeURIComponent(item.xru_id))}" data-media="${esc(media(item.xru_id))}"></video><span class="g-num">${String(page.offset+i+1).padStart(3,'0')}</span>${item.duration_seconds!=null?`<span class="g-dur">${time(item.duration_seconds)}</span>`:''}</div>`;$('video-gallery').append(tile);tile.addEventListener('click',e=>{if(e.button!==0||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;e.preventDefault();select(i);});
    });
    // Ô video đứng yên bằng ảnh bìa; rê chuột thì phát không tiếng, rời chuột thì dừng.
    $('video-gallery').querySelectorAll('.g-tile').forEach(tile=>{const v=tile.querySelector('video');
      tile.addEventListener('mouseenter',()=>{if(!v.getAttribute('src'))v.src=v.dataset.media;v.play().catch(()=>{});});
      tile.addEventListener('mouseleave',()=>{v.pause();});});
    document.querySelector('.queue-count').textContent=n(page.total);document.querySelector('.side-count span').textContent=view.state;
    document.querySelectorAll('[data-state]').forEach(b=>{b.classList.toggle('is-active',b.dataset.state===view.state);b.querySelector('.count').textContent=n(page.counts[b.dataset.state]);});
    source.replaceChildren(new Option(`${window.XRU_I18N.t('all_sources')} (${page.sources.reduce((sum,s)=>sum+s.total,0)})`,''),...page.sources.map(s=>new Option(`${s.label} (${s.total})`,s.label)));if(view.source&&!page.sources.some(s=>s.label===view.source))source.add(new Option(view.source,view.source));source.value=view.source;sort.value=view.sort;
    $('page-range').textContent=page.total?`${page.offset+1}–${page.offset+page.items.length} / ${n(page.total)}`:'0';controls();
  }
  async function load(preferred=view.selected,locate=false,pickLast=false){if(writing||!backend)return;reading=true;pending=true;const id=++readId;++detailId;controls();const q=new URLSearchParams({state:view.state,platform:view.platform,source:view.source,q:view.q,sort:view.sort,limit:100,offset:(view.page-1)*100});if(locate&&preferred)q.set('selected',preferred);
    try{const result=await json('/api/queue?'+q);if(id!==readId)return;page=result;view.page=Math.floor(result.offset/result.limit)+1;reading=false;paintPage();notice('');if(page.items.length){const at=page.items.findIndex(row=>row.xru_id===preferred);await select(at>=0?at:pickLast?page.items.length-1:0);}else{clear();notice('Không có clip khớp bộ lọc.');sync();}}
    catch(e){if(id!==readId)return;reading=true;notice('Backend Gate video đang tắt hoặc đọc lỗi. Số đang hiện chưa được cập nhật. '+e.message);controls();}finally{if(id===readId)pending=false;}
  }
  async function act(action){if(!selected||reading||writing)return;const item=selected,at=page.items.findIndex(x=>x.xru_id===item.xru_id),next=page.items[at+1]?.xru_id||page.items[at-1]?.xru_id;writing=true;controls();
    try{const d=drafts.get(item.xru_id)||item;await json('/api/assets/'+encodeURIComponent(item.xru_id)+'/decisions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,expected_lane:item.lane,po_note:d.po_note||null,noise_present:!!d.noise_present,watermark_present:!!d.watermark_present})});drafts.delete(item.xru_id);writing=false;await load(next);}
    catch(e){writing=false;notice('Chưa xác nhận lưu. Ghi chú và dấu chọn được giữ. '+e.message);controls();}
  }
  function step(delta,wrap=false){if(!selected||reading||writing)return;const at=page.items.findIndex(row=>row.xru_id===selected.xru_id);if(wrap&&delta>0&&page.offset+at===page.total-1){view.page=1;load(null);return;}if(delta>0&&at===page.items.length-1&&page.offset+page.items.length<page.total){view.page++;load(null);return;}if(delta<0&&at===0&&page.offset){view.page--;load(null,false,true);return;}select(Math.max(0,Math.min(page.items.length-1,at+delta)));}
  document.addEventListener('input',e=>{if(e.target.closest('#decision-controls'))remember();});
  document.addEventListener('change',e=>{if(e.target.closest('#decision-controls'))remember();});
  source.addEventListener('change',()=>{view.source=source.value;view.page=1;load();});sort.addEventListener('change',()=>{view.sort=sort.value;view.page=1;load();});
  let timer;search.value=view.q;search.addEventListener('input',()=>{clearTimeout(timer);view.q=search.value.trim();view.page=1;++readId;reading=true;pending=false;controls();timer=setTimeout(()=>load(),180);});
  search.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();search.value='';view.q='';view.page=1;load();search.blur();}e.stopPropagation();});
  document.addEventListener('click',e=>{const t=e.target.closest('[data-state],[data-action],[data-step],[data-page],[data-player],[data-related],[data-note-token],#skip-review-item,.rail a');if(!t)return;
    if(t.matches('.rail a')&&new URL(t.href).pathname==='/gate/video/'){if(e.button!==0||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;e.preventDefault();if(writing)return;view.mode=new URL(t.href).searchParams.get('view')==='grid'?'grid':'watch';mode();return;}
    if(t.dataset.state){view.state=t.dataset.state;view.source='';view.page=1;view.selected=null;load();}
    if(t.dataset.action)act(t.dataset.action);
    if(t.dataset.page){view.page+=+t.dataset.page;load();}
    if(t.dataset.step)step(+t.dataset.step);
    if(t.id==='skip-review-item')step(1,true);
    if(t.dataset.noteToken)token(t.dataset.noteToken);
    if(t.dataset.related){e.preventDefault();if(writing)return;view.state=t.dataset.lane;view.source='';view.q='';search.value='';view.page=1;load(t.dataset.related,true);}
    const v=$('review-video-player');if(!v)return;
    if(t.dataset.player==='play')play();if(t.dataset.player==='mute'){v.muted=!v.muted;t.textContent=v.muted?'🔇':'🔊';}if(t.dataset.player==='rate'){v.playbackRate=v.playbackRate>=2?.5:v.playbackRate+.5;t.textContent=v.playbackRate+'×';}if(t.dataset.player==='fullscreen')v.requestFullscreen().catch(()=>{});
    if(t.dataset.player==='seek'&&Number.isFinite(v.duration)){const r=t.getBoundingClientRect();v.currentTime=Math.max(0,Math.min(v.duration,v.duration*(e.clientX-r.left)/r.width));}
  });
  document.addEventListener('keydown',e=>{if(e.repeat||e.ctrlKey||e.metaKey||e.altKey)return;const v=$('review-video-player'),key=e.key.toLowerCase(),typing=e.target.closest('textarea,select,input:not([type="checkbox"]),[contenteditable="true"]');if(key===' '&&v&&!typing&&!e.shiftKey){e.preventDefault();play();return;}if(typing)return;
    if((key==='arrowleft'||key==='arrowright')&&v){e.preventDefault();const delta=e.shiftKey&&Number.isFinite(v.duration)?v.duration*.15:5;v.currentTime=Math.max(0,Math.min(Number.isFinite(v.duration)?v.duration:Infinity,v.currentTime+(key==='arrowleft'?-delta:delta)));return;}if(e.shiftKey)return;
    if(['1','2'].includes(key)){const cb=$(key==='1'?'noise-present':'watermark-present');if(cb){e.preventDefault();cb.click();}return;}if(['3','4'].includes(key)){e.preventDefault();token(key==='3'?'EVENT':'CAUTION');return;}if(key==='e'&&$('po-note')){e.preventDefault();$('po-note').focus();return;}
    const button=key==='s'?$('skip-review-item'):document.querySelector('.btn-'+({a:'accept',d:'detain',p:'purge',r:'rescue'}[key]||'missing'));if(button){e.preventDefault();button.click();}
  });
  window.addEventListener('focus',()=>{if(reading&&backend&&!writing&&!pending)load();});
  setInterval(()=>{if(reading&&!pending&&!writing&&!document.hidden&&backend)load();},5000);
  setInterval(async()=>{if(!backend||pending||writing||document.hidden)return;try{await json('/api/health');}catch(e){reading=true;controls();notice('Backend Gate video đang tắt. Số đang hiện chưa được cập nhật.');}},5000);
  mode();controls();fetch('/ui-config',{cache:'no-store'}).then(r=>r.json()).then(c=>{backend=c.video_backend;load(view.selected,!!view.selected&&!p.has('page'));}).catch(()=>notice('Không đọc được cấu hình UI.'));
})();
