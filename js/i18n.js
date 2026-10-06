// ==========================================================================
// XRU I18N — BỘ CHUYỂN ĐỔI NGÔN NGỮ LIÊN BANG (VI / EN)
// Hỗ trợ dịch textContent ([data-i18n]) và thuộc tính ([data-i18n-attr])
// ==========================================================================
(() => {
  const DICT = {
    vi: {
      // Menu & Settings
      settings_title: 'CÀI ĐẶT GIAO DIỆN',
      mode_lbl: 'CHẾ ĐỘ',
      font_lbl: 'FONT CHỮ',
      accent_lbl: 'MÀU NHẤN',
      zoom_lbl: 'CỠ GIAO DIỆN',
      lang_lbl: 'NGÔN NGỮ',
      btn_reset: 'Về mặc định',
      btn_done: 'Xong',
      menu_settings: 'Cài đặt giao diện',
      menu_logout: 'Đăng xuất',
      mode_system: 'Hệ thống',
      mode_light: 'Sáng',
      mode_dark: 'Tối',
      accent_profile: 'Theo profile',
      acc_cyan: 'Cyan XRU',
      acc_blue: 'Xanh dương',
      acc_purple: 'Tím',
      acc_green: 'Xanh lá',
      acc_white: 'Trắng',
      acc_yellow: 'Vàng',
      acc_pink: 'Hồng',
      acc_orange: 'Cam',
      close_tip: 'Đóng',

      // Launcher & HUD
      system_lbl: 'Hệ Thống',
      rotate_hint: 'Kéo để xoay · Bấm để chọn',
      loading_map: 'Đang mở bản đồ…',
      map_load_err: 'Chưa mở được bản đồ. Chọn lục địa bằng các nút bên cạnh.',
      pause_spin: 'Tạm dừng xoay',
      resume_spin: 'Tiếp tục xoay',
      reset_view: 'Đưa bản đồ về góc ban đầu',
      globe_cmd_map: 'Bản đồ chỉ huy Liên Bang',
      globe_3d_aria: 'Địa cầu tương tác 3D',
      sectors_lbl: 'Phân khu trực thuộc',
      edit_img_tip: 'Đổi ảnh',
      zoom_in: 'Phóng to',
      export_err: 'Không xuất được ảnh này (ảnh từ nguồn ngoài bị chặn). Hãy tải ảnh lên từ máy.',
      storage_full: 'Bộ nhớ trình duyệt đầy. Hãy đặt lại "Mặc định" ở vài card khác rồi lưu lại.',
      img_editor_title: 'ĐỔI ẢNH',
      img_editor_upload: 'Tải ảnh lên',
      img_editor_default: 'Mặc định',
      img_editor_cancel: 'Hủy',
      img_editor_save: 'Lưu',
      img_editor_hint: 'Nắm kéo ảnh để căn góc · Lăn chuột hoặc kéo thanh trượt để phóng to/thu nhỏ',
      img_editor_empty: 'Chưa có ảnh · Bấm "Tải ảnh lên"',

      // HUD Stats & Itinerary



      waiting_count: 'chờ',

      // Thời gian & Trạng thái

      // Gate Inspection (Image / Video)
      gate_img: 'Gate Image',
      gate_vid: 'Gate Video',
      gate_dash: 'Gate Dash',
      toggle_list: 'Đóng / mở danh sách',
      waiting_po: 'Chờ PO xem',
      detained: 'Tạm giữ',
      search_title_src: 'Tìm tiêu đề, nguồn…',
      search_in_list: 'Tìm trong danh sách',
      source_lbl: 'Nguồn',
      all_sources: 'Mọi nguồn',
      sort_lbl: 'Sắp xếp',
      sort_oldest: 'Cũ nhất trước',
      sort_newest: 'Mới nhất trước',
      sort_longest: 'Dài nhất trước',
      pager_prev: '← Trước',
      pager_next: 'Sau →',
      no_match: 'Không có mục khớp.',
      caption_lbl: 'Chú thích',
      desc_lbl: 'Mô tả',
      res_lbl: 'Khổ',
      note_ph: 'Ghi chú (tùy chọn)...',
      btn_approve: 'Duyệt',
      btn_detain: 'Giữ',
      btn_purge: 'Hủy',
      btn_skip: 'Bỏ qua',
      grip_tip: 'Kéo để giãn cột phải · bấm đúp để về mặc định',
      esc_launcher: 'Về Launcher',

      // Gate Dash
      records_lbl: 'HỒ SƠ',
      records_video: 'HỒ SƠ VIDEO',
      records_image: 'HỒ SƠ ẢNH',
      search_channels: 'Tìm kênh…',
      sort_wait: 'Chờ nhiều nhất',
      sort_total: 'Nhiều hồ sơ nhất',
      sort_alpha: 'Tên A → Z',
      snapshot_at: 'Số chụp lúc',
      all_sources_head: 'TẤT CẢ NGUỒN',
      record_type_aria: 'Loại hồ sơ',
      funnel_aria: 'Phễu Gate',
      funnel_flow_lbl: 'ĐANG NẰM Ở CỬA NÀO',
      machine_flag_sub: 'máy cắm cờ, chờ PO',
      cleared_sub: 'qua cửa',
      purged_sub: 'loại bỏ',
      machine_head: 'Máy',
      entire_lane: 'TOÀN LANE',
      unsplit_source: 'LÕI CHƯA TÁCH THEO NGUỒN',
      mach_none: 'KHÔNG THẤY GÌ',
      real_read_only: 'SỐ THẬT · CHỈ ĐỌC',
      finding_music: 'Nhạc',
      finding_dup: 'Trùng',
      finding_text: 'Chữ chèn',
      finding_err: 'Máy đọc lỗi',
      finding_untagged: 'Chưa gắn loại',

      // Rail Navigation
      rail_fed_continents: 'Lục địa Liên Bang',
      rail_overview_tip: 'XRU FEDERAL // Bản đồ Toàn Cảnh Liên Bang',
      rail_esc_launcher: 'Về Launcher (ESC)',
      rail_crawler_nav: 'Điều hướng Crawler',
      rail_gate_nav: 'Điều hướng Gate',
      rail_added_sources: 'Nguồn đã thêm',
      rail_activity_feed: 'Dòng hoạt động',
      rail_video_watch: 'Gate Video — Xem to (thử)',
      // Crawler · Array · Gate (bổ sung)
      cr_sources_word: 'nguồn',
      ax_not_captured: 'Bản chụp chưa có câu “{q}”. Nối backend rồi bấm là chạy.',
      sort_clean_low: 'Kém sạch nhất',
      platform_lbl: 'Nền tảng',
      all_platforms: 'Mọi nền tảng',
      sort_clean_high: 'Sạch nhất',
      finding_wm: 'Watermark',
      gd_not_reviewed: 'chưa duyệt',
      gd_clean_word: 'sạch',
      gd_few: 'ít mẫu',
      gd_machine_head: 'Máy soi',
      gd_no_machine: 'Lane này chưa có máy soi, và PO chưa quyết hồ sơ nào. Có số thì phần này tự hiện.',
      gd_scanned: 'Máy đã soi',
      gd_found_issue: 'thấy vấn đề ở',
      gd_machine_wait_core: 'Máy bắt đúng hay sai thì chưa đo được: lõi Gate chưa ghép "máy nói" với "PO quyết" trên từng hồ sơ.',
      ax_not_yet: 'Wiki XRU, XRU DB chưa',
      ax_soon_tip: 'Chưa có ruột — bấm để xem sẽ là gì',
      cr_new_today: 'THU MỚI HÔM NAY',
      cr_new_today_lc: 'thu mới hôm nay',
      cr_m_today_split: '1,024 ảnh · 224 video',
      cr_sources_on: 'NGUỒN ĐANG BẬT',
      cr_sources_on_lc: 'nguồn đang bật',
      cr_m_two_off: '2 nguồn đang tắt',
      cr_collected: 'ĐÃ THU THẬP',
      cr_collected_lc: 'đã thu thập',
      cr_m_total_split: '2,215 ảnh · 5,627 video',
      cr_latest: 'NHẬN MỚI GẦN NHẤT',
      cr_rhythm: 'Nhịp thu thập',
      cr_last7: '7 NGÀY GẦN NHẤT',
      cr_chart_title: 'Lượng thu mới mỗi ngày: tổng, video và ảnh. Số liệu minh hoạ.',
      cr_total: 'Tổng',
      kind_image: 'Ảnh',
      cr_by_platform: 'Đã thu theo nền tảng',
      cr_all_link: 'Tất cả ↗',
      cr_img_vid: 'ẢNH + VIDEO',
      cr_activity: 'Hoạt động',
      cr_foot: 'MOCKUP · DỮ LIỆU MINH HOẠ · ẢNH + VIDEO',
      cr_recent_batches: 'Các lô gần đây',
      cr_today_date: 'HÔM NAY · 04/10',
      cr_ev1: 'Thu xong một lô Reels mới.',
      cr_ev1b: '36 lưu mới · 4 trùng',
      cr_ev2: 'Đã nhận lô video huấn luyện.',
      cr_ev2b: '58 lưu mới · 12 trùng',
      cr_ev3: 'Đã nhận ảnh từ các bài đăng mới.',
      cr_ev3a: '184 ảnh',
      cr_ev3b: '184 lưu mới · 26 trùng',
      cr_ev4: 'Đã thu xong lô video tiếp theo.',
      cr_ev4b: '24 lưu mới · 7 trùng',
      cr_ev5: 'Đã nhận bộ ảnh tư liệu mới.',
      cr_ev5a: '210 ảnh',
      cr_ev5b: '210 lưu mới · 43 trùng',
      cr_today: 'Hôm nay',
      cr_saved_today: 'Ảnh và video mới đã lưu',
      cr_top_sources: 'Nguồn đóng góp nhiều',
      cr_f_all: 'Tất cả · 8',
      cr_f_on: 'Đang bật · 6',
      cr_f_off: 'Đang tắt · 2',
      cr_th_source: 'NGUỒN',
      cr_th_kind: 'LOẠI',
      cr_th_state: 'TRẠNG THÁI',
      cr_th_tier: 'HẠNG',
      cr_th_downloaded: 'ĐÃ TẢI',
      cr_on: 'Đang bật',
      cr_off: 'Đang tắt',
      cr_no_source: 'Không có nguồn phù hợp.',
      cr_close: 'Đóng ×',
      cr_kind: 'Loại',
      cr_state: 'Trạng thái',
      cr_tier: 'Hạng',
      cr_collected_dt: 'Đã thu',
      cr_latest_dt: 'Nhận mới',
      cr_po_note: 'Ghi chú PO',
      cr_dialog_note: 'Hồ sơ và URL minh hoạ để thử bố cục.',
      w_switch_clip: 'Đổi clip',
      w_play_pause: 'Phát / dừng',
      w_auto_next: 'Chấm xong tự sang clip kế',
      ax_try_sample: 'Thử một câu mẫu',
      ax_captured: 'Câu đã chụp:',
      ax_tab_all: 'Tất cả',
      ax_tab_knowledge: 'Kiến thức',
      ax_tab_events: 'Sự kiện',
      ax_tab_ai: 'Chế độ AI',
      ax_k_type: 'gõ câu',
      ax_k_pick: 'chọn',
      ax_k_back: 'lùi một màn',
      ax_foot: 'Mockup · chụp thật từ Array · chỉ đọc',
      gd_k_kind: 'Video / Ảnh',
      cr_search_ph: 'Tìm tên hoặc nền tảng...',
      cr_cdn_tip: 'Số link CDN đã lấy được',
      ax_home_tip: 'Về trang đầu Array',
      ax_clear_tip: 'Xoá câu',
      ax_gen_tip: 'Thế hệ kho Array lúc chụp',
      rail_array_tip: 'Array (/ hoặc Ctrl+K)',
    
      // Crawler · Array · Gate (bổ sung)

    },
    en: {
      // Menu & Settings
      settings_title: 'UI SETTINGS',
      mode_lbl: 'THEME',
      font_lbl: 'FONT',
      accent_lbl: 'ACCENT COLOR',
      zoom_lbl: 'UI SCALE',
      lang_lbl: 'LANGUAGE',
      btn_reset: 'Reset',
      btn_done: 'Done',
      menu_settings: 'UI Settings',
      menu_logout: 'Log Out',
      mode_system: 'System',
      mode_light: 'Light',
      mode_dark: 'Dark',
      accent_profile: 'From Profile',
      acc_cyan: 'Cyan XRU',
      acc_blue: 'Blue',
      acc_purple: 'Purple',
      acc_green: 'Green',
      acc_white: 'White',
      acc_yellow: 'Yellow',
      acc_pink: 'Pink',
      acc_orange: 'Orange',
      close_tip: 'Close',

      // Launcher & HUD
      system_lbl: 'System',
      rotate_hint: 'Drag to rotate · Click to select',
      loading_map: 'Opening map…',
      map_load_err: 'Map failed to load. Select a continent from the menu.',
      pause_spin: 'Pause rotation',
      resume_spin: 'Resume rotation',
      reset_view: 'Reset view',
      globe_cmd_map: 'Federal Command Map',
      globe_3d_aria: '3D Interactive Globe',
      sectors_lbl: 'Subordinate Sectors',
      edit_img_tip: 'Change Image',
      zoom_in: 'Zoom In',
      export_err: 'Cannot export image (CORS blocked). Please upload from disk.',
      storage_full: 'Browser storage full. Reset some cards to default and retry.',
      img_editor_title: 'CHANGE IMAGE',
      img_editor_upload: 'Upload Image',
      img_editor_default: 'Default',
      img_editor_cancel: 'Cancel',
      img_editor_save: 'Save',
      img_editor_hint: 'Drag to pan · Scroll wheel or slider to zoom',
      img_editor_empty: 'No image · Click "Upload Image"',

      // HUD Stats & Itinerary



      waiting_count: 'pending',

      // Thời gian & Trạng thái

      // Gate Inspection (Image / Video)
      gate_img: 'Gate Image',
      gate_vid: 'Gate Video',
      gate_dash: 'Gate Dash',
      toggle_list: 'Toggle Sidebar',
      waiting_po: 'Waiting PO',
      detained: 'Detained',
      search_title_src: 'Search title, source…',
      search_in_list: 'Search in list',
      source_lbl: 'Source',
      all_sources: 'All sources',
      sort_lbl: 'Sort',
      sort_oldest: 'Oldest first',
      sort_newest: 'Newest first',
      sort_longest: 'Longest first',
      pager_prev: '← Prev',
      pager_next: 'Next →',
      no_match: 'No matching items.',
      caption_lbl: 'Caption',
      desc_lbl: 'Description',
      res_lbl: 'Resolution / Aspect',
      note_ph: 'Note (optional)...',
      btn_approve: 'Approve',
      btn_detain: 'Detain',
      btn_purge: 'Purge',
      btn_skip: 'Skip',
      grip_tip: 'Drag to resize panel · double click to reset',
      esc_launcher: 'Return to Launcher',

      // Gate Dash
      records_lbl: 'RECORDS',
      records_video: 'VIDEO RECORDS',
      records_image: 'IMAGE RECORDS',
      search_channels: 'Search channels…',
      sort_wait: 'Most pending',
      sort_total: 'Most records',
      sort_alpha: 'Name A → Z',
      snapshot_at: 'Snapshot taken at',
      all_sources_head: 'ALL SOURCES',
      record_type_aria: 'Record type',
      funnel_aria: 'Gate Funnel',
      funnel_flow_lbl: 'CURRENT PIPELINE STAGE',
      machine_flag_sub: 'machine flagged, waiting PO',
      cleared_sub: 'cleared',
      purged_sub: 'purged',
      machine_head: 'Machine',
      entire_lane: 'ENTIRE LANE',
      unsplit_source: 'CORE NOT SPLIT BY SOURCE',
      mach_none: 'NO FINDINGS',
      real_read_only: 'REAL METRICS · READ-ONLY',
      finding_music: 'Music',
      finding_dup: 'Duplicate',
      finding_text: 'Text overlay',
      finding_err: 'Engine error',
      finding_untagged: 'Untagged',

      // Rail Navigation
      rail_fed_continents: 'Federal Continents',
      rail_overview_tip: 'XRU FEDERAL // Federal Overview Map',
      rail_esc_launcher: 'Return to Launcher (ESC)',
      rail_crawler_nav: 'Crawler Navigation',
      rail_gate_nav: 'Gate Navigation',
      rail_added_sources: 'Added Sources',
      rail_activity_feed: 'Activity Feed',
      rail_video_watch: 'Gate Video — Expanded (Preview)',
      // Crawler · Array · Gate (bổ sung)
      cr_sources_word: 'sources',
      ax_not_captured: 'Snapshot has no query “{q}”. Connect the backend and it will run.',
      sort_clean_low: 'Least clean first',
      platform_lbl: 'Platform',
      all_platforms: 'All platforms',
      sort_clean_high: 'Cleanest first',
      finding_wm: 'Watermark',
      gd_not_reviewed: 'not reviewed',
      gd_clean_word: 'clean',
      gd_few: 'few samples',
      gd_machine_head: 'Machine check',
      gd_no_machine: 'This lane has no machine check yet and no PO decisions. This section appears once numbers exist.',
      gd_scanned: 'Machine scanned',
      gd_found_issue: 'found issues in',
      gd_machine_wait_core: 'Whether the machine was right is not measured yet: Gate core does not pair the machine verdict with the PO decision per record.',
      ax_not_yet: 'Wiki XRU, XRU DB not yet',
      ax_soon_tip: 'Not built yet — click to see what it will be',
      cr_new_today: 'NEW TODAY',
      cr_new_today_lc: 'new today',
      cr_m_today_split: '1,024 images · 224 videos',
      cr_sources_on: 'SOURCES ON',
      cr_sources_on_lc: 'sources on',
      cr_m_two_off: '2 sources off',
      cr_collected: 'COLLECTED',
      cr_collected_lc: 'collected',
      cr_m_total_split: '2,215 images · 5,627 videos',
      cr_latest: 'LATEST INTAKE',
      cr_rhythm: 'Collection rhythm',
      cr_last7: 'LAST 7 DAYS',
      cr_chart_title: 'New intake per day: total, video and image. Illustrative numbers.',
      cr_total: 'Total',
      kind_image: 'Image',
      cr_by_platform: 'Collected by platform',
      cr_all_link: 'All ↗',
      cr_img_vid: 'IMAGE + VIDEO',
      cr_activity: 'Activity',
      cr_foot: 'MOCKUP · ILLUSTRATIVE DATA · IMAGE + VIDEO',
      cr_recent_batches: 'Recent batches',
      cr_today_date: 'TODAY · 04/10',
      cr_ev1: 'Finished a new Reels batch.',
      cr_ev1b: '36 new · 4 duplicates',
      cr_ev2: 'Received a training video batch.',
      cr_ev2b: '58 new · 12 duplicates',
      cr_ev3: 'Received images from new posts.',
      cr_ev3a: '184 images',
      cr_ev3b: '184 new · 26 duplicates',
      cr_ev4: 'Finished the next video batch.',
      cr_ev4b: '24 new · 7 duplicates',
      cr_ev5: 'Received a new archive photo set.',
      cr_ev5a: '210 images',
      cr_ev5b: '210 new · 43 duplicates',
      cr_today: 'Today',
      cr_saved_today: 'New images and videos saved',
      cr_top_sources: 'Top contributing sources',
      cr_f_all: 'All · 8',
      cr_f_on: 'On · 6',
      cr_f_off: 'Off · 2',
      cr_th_source: 'SOURCE',
      cr_th_kind: 'TYPE',
      cr_th_state: 'STATUS',
      cr_th_tier: 'TIER',
      cr_th_downloaded: 'DOWNLOADED',
      cr_on: 'On',
      cr_off: 'Off',
      cr_no_source: 'No matching source.',
      cr_close: 'Close ×',
      cr_kind: 'Type',
      cr_state: 'Status',
      cr_tier: 'Tier',
      cr_collected_dt: 'Collected',
      cr_latest_dt: 'Latest',
      cr_po_note: 'PO note',
      cr_dialog_note: 'Illustrative records and URLs to test the layout.',
      w_switch_clip: 'Switch clip',
      w_play_pause: 'Play / pause',
      w_auto_next: 'Decide, then jump to next clip',
      ax_try_sample: 'Try a sample query',
      ax_captured: 'Captured queries:',
      ax_tab_all: 'All',
      ax_tab_knowledge: 'Knowledge',
      ax_tab_events: 'Events',
      ax_tab_ai: 'AI mode',
      ax_k_type: 'type query',
      ax_k_pick: 'pick',
      ax_k_back: 'go back',
      ax_foot: 'Mockup · real Array snapshot · read-only',
      gd_k_kind: 'Video / Image',
      cr_search_ph: 'Search name or platform...',
      cr_cdn_tip: 'CDN links fetched',
      ax_home_tip: 'Back to Array home',
      ax_clear_tip: 'Clear query',
      ax_gen_tip: 'Array store generation at snapshot',
      rail_array_tip: 'Array (/ or Ctrl+K)',
    
      // Crawler · Array · Gate (bổ sung)

    }
  };

  function getActiveLang() {
    try {
      const saved = localStorage.getItem('xru-ui-settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.lang) return parsed.lang;
      }
    } catch (_) {}
    return 'en'; // mặc định: tiếng Anh (PO dùng tiếng Anh là chính)
  }

  function t(key, lang) {
    const l = lang || getActiveLang();
    return (DICT[l] && DICT[l][key]) || (DICT.vi && DICT.vi[key]) || key;
  }

  function apply(lang) {
    const l = lang || getActiveLang();
    document.documentElement.lang = l;
    document.documentElement.dataset.lang = l;

    // 1. Text content
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const k = el.getAttribute('data-i18n');
      if (k) el.textContent = t(k, l);
    });

    // 2. Attribute bindings: data-i18n-attr="placeholder:search_title_src,aria-label:search_in_list"
    document.querySelectorAll('[data-i18n-attr]').forEach(el => {
      const raw = el.getAttribute('data-i18n-attr');
      if (!raw) return;
      raw.split(',').forEach(pair => {
        const [attr, key] = pair.split(':').map(s => s && s.trim());
        if (attr && key) {
          el.setAttribute(attr, t(key, l));
        }
      });
    });

    // Bắn sự kiện để các view (Launcher, Globe, Gate) tự re-render nếu cần
    window.dispatchEvent(new CustomEvent('xru-lang-applied', { detail: l }));
  }

  window.XRU_I18N = {
    dict: DICT,
    t,
    apply,
    getActiveLang
  };

  // Khởi chạy ngay khi nạp script
  const initLang = getActiveLang();
  document.documentElement.lang = initLang;
  document.documentElement.dataset.lang = initLang;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => apply(initLang));
  } else {
    apply(initLang);
  }
})();
