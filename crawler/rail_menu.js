// Menu rail của Crawler, một bản cho mọi màn Crawler. Chữ là khóa trong crawler/crawler_text.js (nạp trước file này).
// Hai màn mang bộ lọc sang nhau bằng cách sửa href ở đây rồi báo rail vẽ lại (rail.js nghe 'xru-rail-changed').
window.XRU_RAILS = {
  crawler: {
    label: 'cr_rail_label', home: '/?continent=eurasia', homeTip: 'cr_rail_home',
    groups: [[
      {key: 'dash', href: '/crawler/dash.html', icon: 'bars', tip: 'cr_rail_dash'},
      {key: 'sources', href: '/crawler/sources.html', icon: 'table', tip: 'cr_rail_sources'},
    ]],
  },
};
// queryOf(key) trả chuỗi query ('' hoặc '?plat=…') cho mỗi mục rail.
window.XRU_RAILS.crawler.carry = (queryOf) => {
  let changed = false;
  for (const entry of window.XRU_RAILS.crawler.groups[0]) {
    const href = entry.href.split('?')[0] + queryOf(entry.key);
    if (entry.href !== href) { entry.href = href; changed = true; }
  }
  if (changed) window.dispatchEvent(new Event('xru-rail-changed'));
};
