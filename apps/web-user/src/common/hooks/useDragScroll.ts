"use client";

import { useRef, useState } from "react";

/**
 * 가로로 넘기는 줄을 PC에서 마우스로 끌어 넘기게 한다(손가락·트랙패드는 원래대로 스크롤).
 * 끌고 난 직후의 클릭은 칸 이동으로 치지 않는다(캡처 단계에서 막음).
 */
export function useDragScroll<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const drag = useRef({ isDown: false, hasDragged: false, startX: 0, scrollLeft: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const onMouseDown = (e: React.MouseEvent) => {
    drag.current.isDown = true;
    drag.current.hasDragged = false;
    drag.current.startX = e.pageX - (ref.current?.offsetLeft ?? 0);
    drag.current.scrollLeft = ref.current?.scrollLeft ?? 0;
    setIsDragging(true);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!drag.current.isDown) return;
    e.preventDefault();
    const x = e.pageX - (ref.current?.offsetLeft ?? 0);
    const walk = x - drag.current.startX;
    if (Math.abs(walk) > 5) drag.current.hasDragged = true;
    if (ref.current) ref.current.scrollLeft = drag.current.scrollLeft - walk;
  };

  const onMouseUp = () => {
    drag.current.isDown = false;
    setIsDragging(false);
  };

  const onClickCapture = (e: React.MouseEvent) => {
    if (!drag.current.hasDragged) return;
    // 링크의 기본 이동까지 막아야 끌고 놓은 칸으로 넘어가지 않는다
    e.preventDefault();
    e.stopPropagation();
    // 한 번만 막는다(다음 키보드 Enter 같은 클릭은 그대로)
    drag.current.hasDragged = false;
  };

  return {
    ref,
    isDragging,
    dragProps: {
      onMouseDown,
      onMouseMove,
      onMouseUp,
      onMouseLeave: onMouseUp,
      onClickCapture,
    },
  };
}
