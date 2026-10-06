// ==========================================================================
// XRU I18N — BỘ CHUYỂN ĐỔI NGÔN NGỮ LIÊN BANG (VI / EN)
// Hỗ trợ dịch textContent ([data-i18n]) và thuộc tính ([data-i18n-attr])
// ==========================================================================
(() => {
  const DICT = {
    vi: {
      // Menu & Settings
      settings_title: 'CÀI ĐẶT GIAO DIỆN',
      profile_lbl: 'PROFILE',
      mode_lbl: 'CHẾ ĐỘ',
      font_lbl: 'FONT CHỮ',
      accent_lbl: 'MÀU NHẤN',
      zoom_lbl: 'CỠ GIAO DIỆN',
      lang_lbl: 'NGÔN NGỮ',
      btn_reset: 'VỀ MẶC ĐỊNH',
      btn_done: 'XONG',
      menu_settings: 'Cài đặt giao diện',
      menu_logout: 'Đăng xuất',
      mode_system: 'Hệ thống',
      mode_light: 'Sáng',
      mode_dark: 'Tối',
      accent_profile: 'Theo profile',
      close_tip: 'Đóng',

      // Launcher & HUD
      system_lbl: 'Hệ Thống',
      online_val: 'ONLINE',
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
      zoom_out: 'Thu nhỏ',
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
      po_pending_lbl: 'PO Pending',
      active_lands_lbl: 'Active Lands',
      system_state_lbl: 'System State',
      sectors_stat_lbl: 'Lục Địa',
      countries_stat_lbl: 'Tổng Quốc Gia',
      status_stat_lbl: 'Tình Trạng',
      rendering_stat_lbl: 'Đang Render',
      format_stat_lbl: 'Định Dạng',
      tenants_stat_lbl: 'Active Tenants',
      channels_stat_lbl: 'Kênh Phân Phối',
      env_stat_lbl: 'Môi Trường',

      itinerary_code: 'Mã',
      itinerary_sector: 'Phân Khu (Sector)',
      itinerary_module: 'Module Khả Dụng',
      itinerary_last_active: 'Hoạt Động Cuối',
      itinerary_status: 'Trạng Thái',

      crawler_tagline: 'Vòi bạch tuộc thu thập nguyên liệu thô',
      gate_tagline: 'Kiểm định đầu vào & Duyệt thông quan',
      foundry_tagline: 'Tiền xử lý & Đóng gói Work Item',
      division_tagline: 'Bầy AI gán nhãn & Định danh thực thể',

      photos_pending: 'ảnh chờ',
      videos_pending: 'video chờ',
      waiting_count: 'chờ',
      inspect_photos: 'Duyệt ảnh',
      inspect_videos: 'Duyệt video',
      sources_added: 'Nguồn đã thêm',
      live_labeling: 'Trực chiến Gán nhãn',

      // Thời gian & Trạng thái
      just_now: 'Vừa xong',
      days_ago: 'ngày trước',
      hours_ago: 'giờ trước',
      ready_status: '● SẴN SÀNG',
      active_status: '● HOẠT ĐỘNG',
      pending_status: '▲ CHỜ ĐỢT MỚI',
      planned_status: '■ DỰ KIẾN',

      // Gate Inspection (Image / Video)
      gate_img: 'Gate Image',
      gate_vid: 'Gate Video',
      gate_dash: 'Gate Dash',
      toggle_list: 'Đóng / mở danh sách',
      waiting_po: 'Chờ PO xem',
      approved: 'Đã thông quan',
      detained: 'Tạm giữ',
      rejected: 'Đã từ chối',
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
      machine_scoring: 'Máy chấm điểm',
      entire_lane: 'TOÀN LANE',
      unsplit_source: 'LÕI CHƯA TÁCH THEO NGUỒN',
      machine_verdict: 'Máy kết luận',
      mach_detain: 'MÁY GIỮ',
      mach_flag: 'MÁY CẮM CỜ',
      mach_keep: 'MÁY CHO GIỮ LẠI',
      mach_none: 'KHÔNG THẤY GÌ',
      po_decisions_head: 'PO đã bấm (số lượt, kể cả bấm lại)',
      po_last_decision: 'lần cuối',
      po_rescue: 'CỨU LẠI',
      po_keep_dup: 'GIỮ BẢN TRÙNG',
      po_marks: 'PO đánh dấu',
      th_flag_type: 'LOẠI CỜ',
      th_detected: 'MÁY BẮT',
      th_correct: 'ĐÚNG',
      th_false_pos: 'BẮT LỘN',
      th_missed: 'HỤT',
      th_precision: 'BẮT TRÚNG',
      th_recall: 'BẮT ĐỦ',
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
      rail_video_watch: 'Gate Video — Xem to (thử)'
    },
    en: {
      // Menu & Settings
      settings_title: 'UI SETTINGS',
      profile_lbl: 'PROFILE',
      mode_lbl: 'THEME',
      font_lbl: 'FONT',
      accent_lbl: 'ACCENT COLOR',
      zoom_lbl: 'UI SCALE',
      lang_lbl: 'LANGUAGE',
      btn_reset: 'RESET DEFAULT',
      btn_done: 'DONE',
      menu_settings: 'UI Settings',
      menu_logout: 'Log Out',
      mode_system: 'System',
      mode_light: 'Light',
      mode_dark: 'Dark',
      accent_profile: 'From Profile',
      close_tip: 'Close',

      // Launcher & HUD
      system_lbl: 'System',
      online_val: 'ONLINE',
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
      zoom_out: 'Zoom Out',
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
      po_pending_lbl: 'PO Pending',
      active_lands_lbl: 'Active Lands',
      system_state_lbl: 'System State',
      sectors_stat_lbl: 'Continents',
      countries_stat_lbl: 'Total Lands',
      status_stat_lbl: 'Status',
      rendering_stat_lbl: 'Rendering',
      format_stat_lbl: 'Format',
      tenants_stat_lbl: 'Active Tenants',
      channels_stat_lbl: 'Distribution Channels',
      env_stat_lbl: 'Environment',

      itinerary_code: 'Code',
      itinerary_sector: 'Sector',
      itinerary_module: 'Available Modules',
      itinerary_last_active: 'Last Active',
      itinerary_status: 'Status',

      crawler_tagline: 'Octopus collector for raw media intake',
      gate_tagline: 'Inbound verification & customs clearance',
      foundry_tagline: 'Preprocessing & packaging work items',
      division_tagline: 'Labeling platoon & entity identification',

      photos_pending: 'photos pending',
      videos_pending: 'videos pending',
      waiting_count: 'pending',
      inspect_photos: 'Inspect Images',
      inspect_videos: 'Inspect Videos',
      sources_added: 'Sources added',
      live_labeling: 'Live Labeling',

      // Thời gian & Trạng thái
      just_now: 'Just now',
      days_ago: 'days ago',
      hours_ago: 'hours ago',
      ready_status: '● READY',
      active_status: '● ACTIVE',
      pending_status: '▲ PENDING',
      planned_status: '■ PLANNED',

      // Gate Inspection (Image / Video)
      gate_img: 'Gate Image',
      gate_vid: 'Gate Video',
      gate_dash: 'Gate Dash',
      toggle_list: 'Toggle Sidebar',
      waiting_po: 'Waiting PO',
      approved: 'Approved',
      detained: 'Detained',
      rejected: 'Rejected',
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
      machine_scoring: 'Machine Scoring',
      entire_lane: 'ENTIRE LANE',
      unsplit_source: 'CORE NOT SPLIT BY SOURCE',
      machine_verdict: 'Machine Verdict',
      mach_detain: 'MACHINE DETAINED',
      mach_flag: 'MACHINE FLAGGED',
      mach_keep: 'MACHINE CLEARED',
      mach_none: 'NO FINDINGS',
      po_decisions_head: 'PO Decisions (actions count, re-clicks included)',
      po_last_decision: 'last action',
      po_rescue: 'RESCUED',
      po_keep_dup: 'KEEP DUPLICATE',
      po_marks: 'PO marks',
      th_flag_type: 'FLAG TYPE',
      th_detected: 'DETECTED',
      th_correct: 'CORRECT',
      th_false_pos: 'FALSE POSITIVE',
      th_missed: 'MISSED',
      th_precision: 'PRECISION',
      th_recall: 'RECALL',
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
      rail_video_watch: 'Gate Video — Expanded (Preview)'
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
    return document.documentElement.lang || document.documentElement.dataset.lang || 'vi';
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
