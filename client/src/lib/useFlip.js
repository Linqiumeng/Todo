import { useCallback, useLayoutEffect, useRef } from 'react';

// 列表重新排序时让条目滑到新位置，而不是一下跳过去。
// 在改顺序的 setState 之前调用 prime()：先记下每个 [data-flip] 元素的位置，
// 渲染完再量一次，把差值做成一段位移动画（FLIP）。只有 prime 过的那次渲染才会动。
export default function useFlip(containerRef) {
  const before = useRef(null);

  const measure = useCallback(() => {
    const container = containerRef.current;
    const positions = new Map();
    if (!container) return positions;
    const top = container.getBoundingClientRect().top;
    for (const el of container.querySelectorAll('[data-flip]')) {
      positions.set(el.dataset.flip, el.getBoundingClientRect().top - top);
    }
    return positions;
  }, [containerRef]);

  const prime = useCallback(() => {
    before.current = measure();
  }, [measure]);

  useLayoutEffect(() => {
    const previous = before.current;
    if (!previous) return;
    before.current = null;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const after = measure();
    for (const el of containerRef.current.querySelectorAll('[data-flip]')) {
      const from = previous.get(el.dataset.flip);
      const to = after.get(el.dataset.flip);
      if (from == null || from === to) continue;
      el.animate([{ transform: `translateY(${from - to}px)` }, { transform: 'none' }], {
        duration: 380,
        easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      });
    }
  });

  return prime;
}
