// Dashboard thật: các cửa dẫn thẳng sang màn của land.
window.XRU_RAILS = {
  gate: {
    label: 'rail_gate_nav', home: 'http://127.0.0.1:5050/', homeTip: 'rail_esc_launcher',
    groups: [[
      {key: 'image', href: 'http://127.0.0.1:5059/', icon: 'image', tip: 'gate_img'},
      {key: 'video', href: 'http://127.0.0.1:5058/', icon: 'video', tip: 'gate_vid'},
      {key: 'watch', href: 'http://127.0.0.1:5058/?view=watch', icon: 'watch', tip: 'rail_video_watch'},
      {key: 'dash', href: 'gate_dash.html', icon: 'stats', tip: 'gate_dash'},
    ]],
  },
};
window.addEventListener('keydown', (event) => {
  if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey || event.target.closest('input,textarea,select')) return;
  const links = {'1': 'http://127.0.0.1:5059/', '2': 'http://127.0.0.1:5058/', '3': 'gate_dash.html'};
  if (links[event.key]) location.href = links[event.key];
});
