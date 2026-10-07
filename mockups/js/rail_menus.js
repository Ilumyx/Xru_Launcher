// Menu rail của các trang mockup (kit/rail/rail.js vẽ). Tới lượt land nào thì menu đó đi theo land.
window.XRU_RAILS = {
  array: {
    label: 'rail_fed_continents', home: '../index.html?continent=xru', homeTip: 'rail_esc_launcher',
    groups: [[{ key: 'array', href: 'array_search.html', icon: 'search', tip: 'Array — blind test (/)' }],
             [{ key: 'kit', href: '../kit/index.html', icon: 'table', tip: 'XRU Kit' }]],
  },
  gate: {
    label: 'rail_gate_nav', home: '../index.html', homeTip: 'rail_esc_launcher',
    groups: [
      [{ key: 'image', href: 'gate_image.html', icon: 'image', tip: 'gate_img' },
       { key: 'video', href: 'gate_video.html', icon: 'video', tip: 'gate_vid' },
       { key: 'watch', href: 'gate_video_watch.html', icon: 'watch', tip: 'rail_video_watch' },
       { key: 'dash', href: 'gate_dash.html', icon: 'stats', tip: 'gate_dash' }],
    ],
  },
};
