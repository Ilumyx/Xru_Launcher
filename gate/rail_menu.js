// Menu rail của Gate, một bản cho mọi màn Gate (ảnh, video, xem to, dash).
window.XRU_RAILS = {
  gate: {
    label: 'rail_gate_nav', home: '/', homeTip: 'rail_home',
    groups: [[
      {key: 'image', href: '/gate/image/', icon: 'image', tip: 'gate_img'},
      {key: 'video', href: '/gate/video/?view=grid', icon: 'video', tip: 'gate_vid'},
      {key: 'watch', href: '/gate/video/?view=watch', icon: 'watch', tip: 'rail_video_watch'},
      {key: 'dash', href: '/gate/dash/', icon: 'stats', tip: 'gate_dash'},
    ]],
  },
};
