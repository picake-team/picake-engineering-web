import { useLayoutEffect, useState, type RefObject } from "react";

/**
 * 요소의 지금 넓이(화면 폭이 아니라 놓인 칸의 넓이, 기획 I-54).
 * 같은 조각이 PC 넓은 칸에서는 표로, 좁은 칸(태블릿·옆 칸)에서는 두 줄로 바뀔 때 쓴다(Polaris 표 "auto"와 같은 생각).
 * 요소가 바뀌면(한 칸 화면에서 상세로 갔다가 목록으로 돌아와 새로 그림, 주소로 바로 연 상세) 새 요소를 다시 잰다 —
 * 처음 요소만 보면 넓이가 0에 머물러 넓은 칸에서도 두 줄로 남았다(11-19 검토).
 */
export function useElementWidth<T extends HTMLElement>(ref: RefObject<T | null>): number {
  const [width, setWidth] = useState(0);
  const [el, setEl] = useState<T | null>(null);
  // 그릴 때마다 지금 요소를 본다(바뀌었을 때만 다시 그림)
  useLayoutEffect(() => {
    if (ref.current !== el) setEl(ref.current);
  });
  useLayoutEffect(() => {
    if (!el) return;
    setWidth(el.getBoundingClientRect().width);
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (typeof w === "number") setWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [el]);
  return width;
}
