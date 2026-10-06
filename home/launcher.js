// Cổng của land là link trực tiếp. Sảnh không bật hoặc nhúng app.
window.CONTINENTAL_DATA = {
  xru: { continents: [
    {id:'euramerika', name:'EURAMERIKA', code:'CON-01'},
    {id:'eurasia', name:'EURASIA', code:'CON-02'},
    {id:'euruska', name:'EURUSKA', code:'CON-03'},
    {id:'europa', name:'EUROPA', code:'CON-04'}
  ]},
  euramerika: {lands:[{code:'SECTOR-1',name:'Grid'},{code:'SECTOR-2',name:'Incubator'}]},
  eurasia: {lands:[
    {code:'SECTOR-1',name:'Crawler',mods:[{label:'Nguồn đã thêm',url:'http://127.0.0.1:5055/'}]},
    {code:'SECTOR-2',name:'Gate',mods:[{label:'Duyệt ảnh',url:'http://127.0.0.1:5059/'},{label:'Duyệt video',url:'http://127.0.0.1:5058/'}]},
    {code:'SECTOR-3',name:'Foundry'},
    {code:'SECTOR-4',name:'Label',mods:[{label:'Duyệt video',url:'http://127.0.0.1:5057/'}]}
  ]},
  euruska: {lands:[{code:'SECTOR-1',name:'Processing'},{code:'SECTOR-2',name:'Manufacturing'}]},
  europa: {lands:[{code:'SECTOR-1',name:'Interface'},{code:'SECTOR-2',name:'Delivery'},{code:'SECTOR-3',name:'Tenant Interaction'}]}
};
const stage = document.querySelector('.stage');
stage.innerHTML = `<header class="hud-header federal-header"><h1>XRU FEDERAL</h1><a href="/account/">Tài khoản ↗</a></header>
  ${LauncherGlobe.markup(CONTINENTAL_DATA.xru.continents)}
  <footer class="page-foot"><div class="key-hints"><span>1 Euramerika</span><span>2 Eurasia</span><span>3 Euruska</span><span>4 Europa</span></div><span>Sảnh Liên Bang</span></footer>`;
LauncherGlobe.mount(stage.querySelector('.federal-map'), () => {});
LauncherGlobe.setActive(new URLSearchParams(location.search).get('continent') || 'eurasia');
window.addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey || e.target.closest('input,textarea,select')) return;
  const id = {1:'euramerika',2:'eurasia',3:'euruska',4:'europa'}[e.key];
  if (id) LauncherGlobe.setActive(id);
});
