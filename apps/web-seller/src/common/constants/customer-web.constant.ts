import { isProduction } from "@/apps/web-seller/common/utils/environment.util";

/**
 * 손님 웹(web-user) 주소. 스토어·상품 링크 보내기(SC-89)와 문의하기(SC-88)에 쓴다.
 * production 판매자 웹은 손님 웹 production, 그 밖(개발·staging)은 손님 웹 staging.
 */
export const CUSTOMER_WEB_ORIGIN = isProduction(import.meta.env.VITE_PUBLIC_NODE_ENV)
  ? "https://picakes.com"
  : "https://staging.picakes.com";

export function customerStoreUrl(storeId: string): string {
  return `${CUSTOMER_WEB_ORIGIN}/store/${encodeURIComponent(storeId)}`;
}

export function customerProductUrl(productId: string): string {
  return `${CUSTOMER_WEB_ORIGIN}/product/${encodeURIComponent(productId)}`;
}

/** 문의하기 = 손님 앱 고객센터(로그인 없이 열림, 앱 심사 지원 주소와 같음) */
export const CUSTOMER_SUPPORT_URL = "https://picakes.com/mypage/support";
