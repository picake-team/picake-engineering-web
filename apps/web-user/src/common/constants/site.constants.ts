/** 공개 웹 사이트 기본 URL (OG·canonical). staging은 Vercel env로 override */
export const SITE_BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://picakes.com";

/**
 * 공유 미리보기(카카오톡·인스타그램·페이스북) 그림. 이 메신저들은 SVG를 보여 주지 않아 PNG(1200×630)를 쓴다.
 * 로고 SVG를 흰 바탕 가운데에 둔 그림(2026-11-12)
 */
export const SITE_OG_IMAGE = {
  url: `${SITE_BASE_URL}/images/og/picake.png`,
  width: 1200,
  height: 630,
  alt: "픽케이크",
  type: "image/png",
} as const;

/** 검색 결과·공유 미리보기에 보이는 이름. 사람들이 검색하는 한글 이름으로 쓰고 영문 Picake는 설명·구조화 데이터에 같이 둔다(정보 사이트와 같은 표기) */
export const SITE_NAME = "픽케이크";

/** 영문 이름(구조화 데이터 alternateName) */
export const SITE_NAME_EN = "Picake";

/**
 * 운영사 정보(전자상거래법 제10조 사이버몰 표시, 2026-11-17 네이버 로그인 검수 반려로 화면에 넣음).
 * 값의 정본은 skill picake-legal-terms "사업자 기본정보"(통신판매업신고증 기준)와 이용약관 제4조. 바뀌면 같이 고친다.
 */
export const BUSINESS_INFO = {
  name: "두루랩스",
  representative: "유한진",
  registrationNumber: "347-57-01033",
  mailOrderNumber: "제2026-전북김제-0088호",
  address: "전북특별자치도 김제시 금구면 봉두4길 40, 104동 1902호",
  phone: "010-3007-5647",
  email: "picakeee@gmail.com",
} as const;
