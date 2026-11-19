import { useLayoutEffect, useState, type RefObject } from "react";

/**
 * 요소의 지금 넓이(화면 폭이 아니라 놓인 칸의 넓이, 기획 I-54).
 * 같은 조각이 PC 넓은 칸에서는 표로, 좁은 칸(태블릿·옆 칸)에서는 두 줄로 바뀔 때 쓴다(Polaris 표 "auto"와 같은 생각).
 */
export function useElementWidth<T extends HTMLElement>(ref: RefObject<T | null>): number {
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.getBoundingClientRect().width);
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (typeof w === "number") setWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return width;
}
