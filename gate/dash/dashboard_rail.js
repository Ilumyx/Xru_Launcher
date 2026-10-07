// Dashboard thật: các cửa dẫn thẳng sang màn của land.
window.XRU_RAILS = {
  gate: {
    label: 'rail_gate_nav', home: '/', homeTip: 'rail_esc_launcher',
    groups: [[
      {key: 'image', href: '/gate/image/', icon: 'image', tip: 'gate_img'},
      {key: 'video', href: '/gate/video/?view=grid', icon: 'video', tip: 'gate_vid'},
      {key: 'watch', href: '/gate/video/?view=watch', icon: 'watch', tip: 'rail_video_watch'},
      {key: 'dash', href: '/gate/dash/', icon: 'stats', tip: 'gate_dash'},
    ]],
  },
};
window.addEventListener('keydown', (event) => {
  if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey || event.target.closest('input,textarea,select')) return;
  const links = {'1': '/gate/image/', '2': '/gate/video/?view=grid', '3': '/gate/dash/'};
  if (links[event.key]) location.href = links[event.key];
});
