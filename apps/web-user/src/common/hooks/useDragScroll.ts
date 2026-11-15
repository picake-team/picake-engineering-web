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
    // 왼쪽 버튼만(오른쪽 클릭 메뉴가 mouseup을 가져가면 누르지 않았는데 줄이 따라온다)
    if (e.button !== 0) return;
    drag.current.isDown = true;
    drag.current.hasDragged = false;
    drag.current.startX = e.pageX - (ref.current?.offsetLeft ?? 0);
    drag.current.scrollLeft = ref.current?.scrollLeft ?? 0;
    setIsDragging(true);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!drag.current.isDown) return;
    // 줄 밖에서 버튼을 놓고 돌아온 경우
    if (!(e.buttons & 1)) {
      onMouseUp();
      return;
    }
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
    // 키보드 Enter로 누른 클릭(detail 0)은 막지 않는다(줄 밖에서 놓아 hasDragged가 남아 있어도)
    if (!drag.current.hasDragged || e.detail === 0) return;
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
      // 사진·링크를 브라우저가 따로 끌어 가지 않게(유령 그림 대신 줄이 넘어가게)
      onDragStart: (e: React.DragEvent) => e.preventDefault(),
    },
  };
}
