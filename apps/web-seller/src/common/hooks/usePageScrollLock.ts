import { useEffect } from "react";

/**
 * 창(아래 창·가운데 창·사진 크게 보기·약관 보기)이 열린 동안 뒤 화면 스크롤을 막는다.
 *
 * body가 아니라 html(문서 스크롤)을 잠근다. html·body에 `overflow-x: clip`(globals.css)이 있어 body에 `overflow: hidden`을
 * 걸면 body가 따로 스크롤 상자가 되고, 위에 붙여 둔(sticky) PC 왼쪽 메뉴·상품 미리보기가 스크롤한 만큼 위로 튀었다
 * (2026-11-24 소개 사이트 영상 검토에서 찾음, 스크롤한 채 상품 등록의 사이즈 창을 열 때). html을 잠그면 문서가 그대로
 * 스크롤 상자라 sticky가 제자리에 있고 스크롤 자리도 그대로 남는다.
 * 스크롤 막대가 자리를 차지하는 PC(Windows 등)에서는 막대가 사라진 만큼 오른쪽을 채워 화면이 가로로 밀리지 않게 한다.
 * 창이 겹쳐 열려도 마지막 창이 닫힐 때 한 번만 푼다(손님 웹 usePageScrollLock과 같은 방식).
 */
let lockCount = 0;
let saved: { overflow: string; paddingRight: string } | null = null;

/** 잠그고, 푸는 함수를 돌려준다(두 번 불러도 한 번만 푼다) */
export function lockPageScroll(): () => void {
  const root = document.documentElement;
  if (lockCount === 0) {
    const scrollbar = window.innerWidth - root.clientWidth;
    saved = { overflow: root.style.overflow, paddingRight: root.style.paddingRight };
    root.style.overflow = "hidden";
    if (scrollbar > 0) root.style.paddingRight = `${scrollbar}px`;
  }
  lockCount += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    lockCount = Math.max(0, lockCount - 1);
    if (lockCount > 0 || !saved) return;
    root.style.overflow = saved.overflow;
    root.style.paddingRight = saved.paddingRight;
    saved = null;
  };
}

/** `active`인 동안 뒤 화면 스크롤을 막는다 */
export function usePageScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    return lockPageScroll();
  }, [active]);
}
