import {
  INSTAGRAM_URL,
  KAKAO_CHANNEL_URL,
  SITE_OG_IMAGE,
} from "@/apps/web-info/common/constants/site.constants";

/** 운영사 구조화 데이터의 id. 페이지마다 WebPage·Service의 publisher·provider가 이 id를 가리킨다 */
export const ORGANIZATION_ID = "https://picakes.com/#organization";

/**
 * 운영사(Organization) 구조화 데이터. 손님 소개(`/`)·사장님 소개(`/seller/about`)가 같이 쓴다.
 * 한글·영문 이름을 둘 다 적어 검색·AI가 "픽케이크"와 "Picake"를 같은 서비스로 잇게 한다.
 */
export const ORGANIZATION_JSON_LD = {
  "@type": "Organization",
  "@id": ORGANIZATION_ID,
  name: "Picake",
  alternateName: ["픽케이크"],
  url: "https://picakes.com",
  logo: SITE_OG_IMAGE.url,
  sameAs: [INSTAGRAM_URL, KAKAO_CHANNEL_URL],
} as const;
