import { useEffect, useLayoutEffect } from "react";

/** RootWrapperLayout의 실제 스크롤 영역 id (window가 아닌 내부 컨테이너가 스크롤됨) */
export const SCROLL_CONTAINER_ID = "root-scroll-container";

/** 화면(내부 스크롤 상자)을 맨 위로. 동작 줄이기면 바로 */
export function scrollAppToTop() {
  const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document
    .getElementById(SCROLL_CONTAINER_ID)
    ?.scrollTo({ top: 0, behavior: smooth ? "smooth" : "auto" });
}

/** 뒤로·앞으로 가기로 돌아온 화면인지 가리는 시간(popstate 뒤 이 안에 그려진 화면만 자리를 되돌린다) */
const POPSTATE_WINDOW_MS = 1500;
let lastPopStateAt = 0;
if (typeof window !== "undefined") {
  window.addEventListener("popstate", () => {
    lastPopStateAt = Date.now();
  });
}

/** SSR 환경에서 useLayoutEffect 경고를 피하기 위한 분기 */
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * 스크롤 위치를 sessionStorage에 저장하고 복원하는 훅.
 *
 * 이 앱은 window가 아니라 RootWrapperLayout의 overflow-y-auto 컨테이너가 스크롤되기 때문에
 * 브라우저/Next.js 기본 스크롤 복원이 동작하지 않는다. 그래서 직접 컨테이너의 scrollTop을 관리한다.
 *
 * 앱처럼 뒤로·앞으로 가기(popstate)로 돌아온 화면만 보던 자리로 되돌리고, 새로 들어온 화면은 맨 위부터 보인다.
 *
 * @param key 페이지를 구분하는 저장 키. 생략하면 지금 주소(pathname + 검색어)를 쓴다
 * @param enabled 데이터 로딩 등으로 복원 시점을 늦추고 싶을 때 사용. false면 복원/저장하지 않음.
 */
export function useScrollRestoration(key?: string, enabled = true) {
  useIsomorphicLayoutEffect(() => {
    if (!enabled) return;

    const container = document.getElementById(SCROLL_CONTAINER_ID);
    if (!container) return;

    const storageKey = `scroll-position:${key ?? window.location.pathname + window.location.search}`;
    const cameBack = Date.now() - lastPopStateAt < POPSTATE_WINDOW_MS;
    const saved = cameBack ? Number(sessionStorage.getItem(storageKey)) : 0;

    // 복원: 데이터·로그인 상태가 늦게 들어와 높이가 늘어날 수 있으므로, 목표 위치에 닿을 때까지
    // 최대 2초 동안 프레임마다 맞춘다. 그 사이 손가락으로 스크롤하면 바로 멈춘다.
    let rafId = 0;
    let stopped = false;
    const stop = () => {
      stopped = true;
    };
    if (saved > 0) {
      const startedAt = performance.now();
      // 화면을 그린 뒤 Next.js가 스스로 스크롤을 옮기는 일이 있어, 닿은 뒤에도 0.6초는 자리를 지킨다
      const restore = () => {
        if (stopped) return;
        if (Math.abs(container.scrollTop - saved) > 1) container.scrollTop = saved;
        const elapsed = performance.now() - startedAt;
        const reached = Math.abs(container.scrollTop - saved) <= 2;
        if (elapsed < 2000 && !(reached && elapsed > 600)) {
          rafId = requestAnimationFrame(restore);
        }
      };
      rafId = requestAnimationFrame(restore);
      container.addEventListener("touchstart", stop, { passive: true, once: true });
      container.addEventListener("wheel", stop, { passive: true, once: true });
    }

    // 저장: 누르는 순간(다른 화면으로 가기 직전)의 자리를 바로 기록하고, 손가락·휠로 직접 움직인 스크롤만
    // 0.15초 뒤에 기록한다(관성 스크롤까지 3초). 내용이 줄어 밀리거나 Next.js가 옮긴 스크롤은 저장하지 않는다.
    let saveTimer = 0;
    let lastUserScrollAt = 0;
    const markUserScroll = () => {
      lastUserScrollAt = performance.now();
    };
    const save = () => sessionStorage.setItem(storageKey, String(container.scrollTop));
    // 누르면 스크롤은 끝난 것: 지금 자리를 바로 저장하고, 그 뒤 화면 바뀜으로 생기는 스크롤은 저장하지 않는다
    const saveOnTap = () => {
      lastUserScrollAt = 0;
      window.clearTimeout(saveTimer);
      save();
    };
    const handleScroll = () => {
      if (performance.now() - lastUserScrollAt > 3000) return;
      window.clearTimeout(saveTimer);
      saveTimer = window.setTimeout(save, 150);
    };
    container.addEventListener("scroll", handleScroll, { passive: true });
    // 아래 탭처럼 스크롤 칸 밖을 눌러 떠나는 경우도 있어 화면 전체에서 듣는다
    window.addEventListener("pointerdown", saveOnTap, { capture: true, passive: true });
    container.addEventListener("touchmove", markUserScroll, { passive: true });
    container.addEventListener("wheel", markUserScroll, { passive: true });
    window.addEventListener("keydown", markUserScroll);

    return () => {
      cancelAnimationFrame(rafId);
      window.clearTimeout(saveTimer);
      container.removeEventListener("scroll", handleScroll);
      window.removeEventListener("pointerdown", saveOnTap, { capture: true });
      container.removeEventListener("touchmove", markUserScroll);
      container.removeEventListener("wheel", markUserScroll);
      window.removeEventListener("keydown", markUserScroll);
      container.removeEventListener("touchstart", stop);
      container.removeEventListener("wheel", stop);
    };
  }, [key, enabled]);
}
