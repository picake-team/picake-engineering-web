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

export function focusElementById(id: string) {
  document.getElementById(id)?.focus();
}
