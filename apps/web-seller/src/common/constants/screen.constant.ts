/**
 * 사장님 웹 화면 폭 구간(기획 I-54, 2026-11-19). 폭은 여기서 한 번만 정하고 화면·부품은 이 값만 쓴다.
 *
 * | 폭         | 이름    | 틀                                   | 주문·채팅 목록과 상세 |
 * | ---------- | ------- | ------------------------------------ | --------------------- |
 * | ~767       | phone   | 휴대폰 화면(아래 탭 5개)             | 한 칸                 |
 * | 768~1199   | tablet  | PC 틀, 왼쪽 아이콘 줄                | 840부터 두 칸         |
 * | 1200~      | desktop | PC 틀, 이름이 보이는 왼쪽 메뉴       | 두 칸                 |
 *
 * 근거: Material 3 window size classes(medium 600~839 한 창, expanded 840~ 두 창, large 1200~ 펼친 레일),
 * Shopify Polaris 768. tailwind `md`(768)·`split`(840)·`nav`(1200)는 tailwind.config.ts가 이 값을 가져다 쓴다.
 * 휴대폰 화면과 PC 화면은 같은 주소를 쓰고, 기능은 같거나 PC가 더 많다(운영자 결정 2026-11-19).
 */
export const PHONE_MAX_WIDTH_PX = 767;
/** 목록과 상세를 나란히 두는 폭 */
export const TWO_PANE_MIN_WIDTH_PX = 840;
/** 왼쪽 메뉴에 이름까지 보이는 폭 */
export const NAV_EXPANDED_MIN_WIDTH_PX = 1200;

/** 지금 휴대폰 폭인지(훅 밖에서 한 번 읽을 때) */
export function isPhoneWidthNow(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia(`(max-width: ${PHONE_MAX_WIDTH_PX}px)`).matches;
}
