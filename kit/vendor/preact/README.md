# Preact 10.27.2

Nền vẽ màn UI (PO 23/10): màn khai "trông thế nào theo dữ liệu", Preact so cũ với mới và chỉ sửa đúng chỗ khác. Bản gốc MIT, chép nguyên `dist/preact.module.js` và `hooks/dist/hooks.module.js` (chỉ bỏ chú thích sourcemap). Màn nạp qua import map:

```html
<script type="importmap">{"imports":{"preact":"/kit/vendor/preact/preact.module.js","preact/hooks":"/kit/vendor/preact/hooks.module.js"}}</script>
```
