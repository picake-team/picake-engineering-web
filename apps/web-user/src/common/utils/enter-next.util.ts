import type { KeyboardEvent } from "react";

/**
 * Enter(모바일 키보드의 "다음") 입력 시 지정한 동작을 실행한다.
 * 한글 IME 조합 중 Enter는 무시한다.
 */
export function onEnterKey(handler: () => void) {
  return (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
    e.preventDefault();
    handler();
  };
}

/**
 * 키보드가 열린 채 포커스를 옮길 때 iOS WebView가 입력창을 화면 중앙으로 다시 스크롤해
 * 헤더와 입력창이 함께 밀리는 현상이 있어, 기본 스크롤은 막고 가려질 때만 최소한으로 보정한다.
 */
export function focusElementById(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.focus({ preventScroll: true });
  el.scrollIntoView({ block: "nearest" });
}
