// Sổ tay của một màn (nền Preact, kit/vendor/preact). Màn giữ mọi thứ đang hiện trong một sổ; component đọc sổ,
// sổ đổi thì Preact vẽ lại và chỉ sửa đúng chỗ khác.
//   const store = createStore({ ... });  store.s (đọc) · store.set(patch | s => patch) · store.subs.add(fn) (việc phụ: URL, rail)
//   function Screen() { const s = useStore(store); ... }
import { useEffect, useRef, useState } from 'preact/hooks';

export function createStore(initial) {
  return {
    s: initial,
    subs: new Set(),
    set(patch) { this.s = { ...this.s, ...(typeof patch === 'function' ? patch(this.s) : patch) }; this.subs.forEach((f) => f()); },
  };
}

// Đăng ký ngay lúc vẽ lần đầu (không chờ effect): dữ liệu về trước khi effect chạy thì vẫn không lỡ.
export function useStore(store) {
  const [, tick] = useState(0), sub = useRef(null);
  if (!sub.current) { sub.current = () => tick((x) => x + 1); store.subs.add(sub.current); }
  useEffect(() => () => store.subs.delete(sub.current), []);
  return store.s;
}
