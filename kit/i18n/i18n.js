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
      sort_shortest: 'Ngắn nhất trước',
      flag_lbl: 'Trạm flag',
      all_flags: 'Mọi trạm',
      sort_po_newest: 'PO quyết định: mới nhất',
      sort_po_oldest: 'PO quyết định: cũ nhất',
      pager_prev: '← Trước',
      pager_next: 'Sau →',
      wall_next: 'Trang sau ›',
      wall_prev: 'Trang trước',
      no_match: 'Không có mục khớp.',
      caption_lbl: 'Chú thích',
      desc_lbl: 'Mô tả',
      res_lbl: 'Khổ',
      note_ph: 'Ghi chú (tùy chọn)...',
      btn_approve: 'Duyệt',
      btn_detain: 'Giữ',
      btn_purge: 'Hủy',
      btn_skip: 'Bỏ qua',
      frame_grip_tip: 'Kéo để giãn · bấm đúp để về mặc định',
      frame_insp_open: 'Mở cột phải',
      frame_insp_fold: 'Gập cột phải',

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
      rail_home: 'Về Launcher',
      rail_gate_nav: 'Điều hướng Gate',
      rail_added_sources: 'Nguồn đã thêm',
      rail_video_watch: 'Gate Video — Xem to (thử)',
      // Crawler · Array · Gate (bổ sung)
      sector_save_err: 'Không lưu được ảnh: hãy mở trang qua Launcher (python3 launcher.py).',
      label_video: 'Label Video',
      sh_down_title: 'Module đang tắt',
      sh_down_text: 'App của land không trả lời. Rail và các module khác vẫn chạy.',
      sh_start: 'Bật lại',
      sh_starting: 'Đang bật…',
      sh_not_up: 'Chưa lên — xem nhật ký',
      sh_log: 'Nhật ký',
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
      kind_image: 'Ảnh',
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
      ax_foot: 'Mockup · chụp thật từ Array · chỉ đọc',
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
      sort_shortest: 'Shortest first',
      flag_lbl: 'Flag station',
      all_flags: 'All stations',
      sort_po_newest: 'PO decision: newest',
      sort_po_oldest: 'PO decision: oldest',
      pager_prev: '← Prev',
      pager_next: 'Next →',
      wall_next: 'Next page ›',
      wall_prev: 'Previous page',
      no_match: 'No matching items.',
      caption_lbl: 'Caption',
      desc_lbl: 'Description',
      res_lbl: 'Resolution / Aspect',
      note_ph: 'Note (optional)...',
      btn_approve: 'Approve',
      btn_detain: 'Detain',
      btn_purge: 'Purge',
      btn_skip: 'Skip',
      frame_grip_tip: 'Drag to resize · double-click to reset',
      frame_insp_open: 'Open right column',
      frame_insp_fold: 'Fold right column',

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
      rail_home: 'Return to Launcher',
      rail_gate_nav: 'Gate Navigation',
      rail_added_sources: 'Added Sources',
      rail_video_watch: 'Gate Video — Expanded (Preview)',
      // Crawler · Array · Gate (bổ sung)
      sector_save_err: 'Could not save the image: open the page through the Launcher (python3 launcher.py).',
      label_video: 'Label Video',
      sh_down_title: 'Module is off',
      sh_down_text: 'The land\'s app is not answering. The rail and other modules keep running.',
      sh_start: 'Start',
      sh_starting: 'Starting…',
      sh_not_up: 'Not up yet — check the log',
      sh_log: 'Log',
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
      kind_image: 'Image',
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
      ax_foot: 'Mockup · real Array snapshot · read-only',
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

    applied = true;
    // Bắn sự kiện để các view (Launcher, Globe, Gate) tự re-render nếu cần
    window.dispatchEvent(new CustomEvent('xru-lang-applied', { detail: l }));
  }

  // Land mang từ điển riêng (chữ của màn land, không nhét vào kit):
  //   XRU_I18N.add({ vi: { khoa: '...' }, en: { khoa: '...' } })  — gọi trước khi trang vẽ xong; gọi muộn thì tự áp lại.
  let applied = false;
  function add(more) {
    for (const lang of Object.keys(more)) DICT[lang] = { ...(DICT[lang] || {}), ...more[lang] };
    if (applied) apply();
  }

  window.XRU_I18N = {
    dict: DICT,
    t,
    apply,
    add,
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
