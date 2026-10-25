import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * 요소가 화면에 보이면 href 페이지를 미리 받아두는(prefetch) 훅.
 *
 * next/link의 뷰포트 prefetch와 같은 동작을 router.push로 이동하는 카드에 붙이기 위한 것이다.
 * 상품 카드는 안에 찜·스토어 버튼이 있어 <Link>(<a>)로 감쌀 수 없고, 웹뷰에서 <a>를 길게 누르면
 * 링크 미리보기가 떠서 div + router.push를 유지한다. prefetch 없이 router.push만 하면
 * 누른 뒤 서버 응답이 올 때까지 화면이 멈춰 있어 "눌렀는데 늦게 넘어가는" 체감이 생긴다.
 *
 * prefetch 캐시는 쿼리스트링까지 포함한 URL로 찾으므로, 실제 이동할 href를 그대로 넘겨야 한다.
 * (예: `/product/123?entry_point=home`으로 이동한다면 그 문자열 그대로)
 */
export function usePrefetchOnVisible<T extends Element>(href: string) {
  const ref = useRef<T>(null);
  const router = useRouter();

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      router.prefetch(href);
      observer.disconnect();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [href, router]);

  return ref;
}
