import { useEffect, useRef, useState } from "react";

/** 키보드가 올라온 것으로 간주할 뷰포트 축소 임계값(px) */
const KEYBOARD_THRESHOLD = 150;
/** 입력 요소 간 포커스 이동 시 깜빡임을 막기 위한 대기 시간(ms) */
const BLUR_SETTLE_MS = 120;

/** 소프트 키보드를 띄우는 입력 요소인지 판단 */
function isTextEntryElement(el: Element | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  if (el.isContentEditable) return true;
  if (el instanceof HTMLTextAreaElement) return true;
  if (el instanceof HTMLInputElement) {
    // 키보드가 뜨지 않는 타입은 제외
    const noKeyboardTypes = ["checkbox", "radio", "button", "submit", "reset", "file", "range"];
    return !noKeyboardTypes.includes(el.type);
  }
  return false;
}

/**
 * 모바일 소프트 키보드가 올라와 있는지 감지하는 훅(손님 웹 `web-user/src/common/hooks/useKeyboardOpen.ts`와 같은 코드).
 * 아래 붙은 버튼·아래 탭을 입력 중에 숨길 때 쓴다(I-48 "키보드": 손님 앱과 같게).
 *
 * 두 가지 신호를 쓰되, 1)이 동작하는 기기에서는 1)만 신뢰한다.
 *
 * 1) 뷰포트 축소: 키보드가 닫힌 상태에서 관측된 최대 뷰포트 높이를 기준선으로 잡고,
 *    현재 보이는 영역이 그보다 충분히 줄어들면 열린 것으로 본다.
 *    현재 window.innerHeight를 기준으로 삼지 않는 이유는, Android WebView(adjustResize)에서
 *    키보드가 올라올 때 innerHeight도 함께 줄어들어 차이가 0에 수렴하기 때문이다.
 *
 * 2) 입력 요소 포커스: Activity가 adjustPan/adjustNothing으로 설정된 Android WebView에서는
 *    키보드가 올라와도 WebView가 리사이즈되지 않아 1)이 전혀 반응하지 않는다.
 *    이 경우를 위한 폴백이며, 물리 키보드 환경에서의 오탐을 막기 위해
 *    포인터가 coarse(터치)인 기기에서만 적용한다.
 *
 * VisualViewport를 지원하지 않고 터치 기기도 아니면 항상 false를 반환한다.
 */
export function useKeyboardOpen(): boolean {
  const [byViewport, setByViewport] = useState(false);
  const [byFocus, setByFocus] = useState(false);
  /** 키보드가 닫힌 상태의 기준 뷰포트 높이 */
  const baselineRef = useRef(0);
  /** 뷰포트 신호가 한 번이라도 키보드를 감지했는지 (= 이 기기에서 신뢰 가능한지) */
  const [viewportWorks, setViewportWorks] = useState(false);

  // 1) 뷰포트 축소 감지
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      const height = vv.height;
      if (height > baselineRef.current) baselineRef.current = height;
      // adjustPan 환경에서는 높이 대신 시각 뷰포트가 위로 밀리므로 offsetTop도 함께 본다
      const open =
        baselineRef.current - height > KEYBOARD_THRESHOLD || vv.offsetTop > KEYBOARD_THRESHOLD;
      if (open) setViewportWorks(true);
      setByViewport(open);
    };

    // 화면 회전 시에는 기준 높이를 다시 잡는다
    const resetBaseline = () => {
      baselineRef.current = 0;
      update();
    };

    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    window.addEventListener("orientationchange", resetBaseline);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      window.removeEventListener("orientationchange", resetBaseline);
    };
  }, []);

  // 2) 입력 요소 포커스 감지 (터치 기기 한정)
  useEffect(() => {
    if (!window.matchMedia?.("(pointer: coarse)").matches) return;

    let blurTimer: ReturnType<typeof setTimeout> | undefined;

    const handleFocusIn = (e: FocusEvent) => {
      if (!isTextEntryElement(e.target as Element)) return;
      clearTimeout(blurTimer);
      setByFocus(true);
    };

    // 다른 입력으로 옮겨가는 중일 수 있으므로 잠깐 기다렸다 판단한다
    const handleFocusOut = () => {
      clearTimeout(blurTimer);
      blurTimer = setTimeout(() => {
        setByFocus(isTextEntryElement(document.activeElement));
      }, BLUR_SETTLE_MS);
    };

    setByFocus(isTextEntryElement(document.activeElement));
    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusout", handleFocusOut);
    return () => {
      clearTimeout(blurTimer);
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", handleFocusOut);
    };
  }, []);

  // 뷰포트 신호가 동작하는 기기에서는 그쪽만 믿는다.
  // 포커스 폴백은 키보드만 내리고 포커스가 남은 상태를 구분하지 못하기 때문이다.
  return viewportWorks ? byViewport : byFocus;
}
