import { isProduction } from "@/apps/web-seller/common/utils/environment.util";

/**
 * 사장님 소개 페이지(정보 사이트 web-info, 기획 I-49). 로그인 화면의 "처음이세요? 소개 보기"가 연다.
 * production 판매자 웹은 소개 사이트 production, 그 밖(개발·staging)은 소개 사이트 staging.
 */
export const SELLER_INTRO_URL = isProduction(import.meta.env.VITE_PUBLIC_NODE_ENV)
  ? "https://info.picakes.com/seller/about"
  : "https://info-staging.picakes.com/seller/about";
