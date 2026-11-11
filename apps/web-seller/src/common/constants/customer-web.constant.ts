import { isProduction } from "@/apps/web-seller/common/utils/environment.util";

/**
 * 손님 웹(web-user) 주소. 스토어·상품 링크 보내기(SC-89)와 문의하기(SC-88)에 쓴다.
 * production 판매자 웹은 손님 웹 production, 그 밖(개발·staging)은 손님 웹 staging.
 */
export const CUSTOMER_WEB_ORIGIN = isProduction(import.meta.env.VITE_PUBLIC_NODE_ENV)
  ? "https://picakes.com"
  : "https://staging.picakes.com";

/**
 * 링크 보내기로 보내는 주소에 붙는 표시(기획 I-45 링크 효과). 손님 웹이 이 표시로 열리면
 * "링크로 온 손님"으로 세고, 그 손님이 예약하면 "링크로 온 예약"으로 센다. 손님 웹 store-link.util과 같은 값
 */
export const STORE_LINK_QUERY = "from=link";

export function customerStoreUrl(storeId: string): string {
  return `${CUSTOMER_WEB_ORIGIN}/store/${encodeURIComponent(storeId)}?${STORE_LINK_QUERY}`;
}

export function customerProductUrl(productId: string): string {
  return `${CUSTOMER_WEB_ORIGIN}/product/${encodeURIComponent(productId)}?${STORE_LINK_QUERY}`;
}

/** 문의하기 = 손님 앱 고객센터(로그인 없이 열림, 앱 심사 지원 주소와 같음) */
export const CUSTOMER_SUPPORT_URL = "https://picakes.com/mypage/support";
