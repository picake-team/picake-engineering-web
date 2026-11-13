/** 정보 사이트 기본 URL (OG·canonical). staging은 Vercel env로 override */
export const SITE_BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://info.picakes.com";

/** 공유 미리보기 그림(카카오톡·인스타그램은 SVG를 보여 주지 않아 PNG 1200×630, 손님 웹과 같은 그림) */
export const SITE_OG_IMAGE = {
  url: `${SITE_BASE_URL}/images/og/picake.png`,
  width: 1200,
  height: 630,
  alt: "Picake",
  type: "image/png",
} as const;

export const SITE_NAME = "Picake";

/** 공식 채널(picake-hq marketing/channels.md와 같은 주소). 구조화 데이터의 sameAs에 쓴다 */
export const INSTAGRAM_URL = "https://www.instagram.com/picake_app/";
export const KAKAO_CHANNEL_URL = "https://pf.kakao.com/_MgxdPX";

/**
 * 운영사 정보(소개 페이지 맨 아래). 값의 정본은 skill picake-legal-terms "사업자 기본정보"(통신판매업신고증 기준).
 * 개인 휴대폰 번호는 소개 페이지에 넣지 않고 이메일·카카오톡으로 받는다.
 */
export const BUSINESS_INFO = {
  name: "두루랩스",
  representative: "유한진",
  registrationNumber: "347-57-01033",
  mailOrderNumber: "제2026-전북김제-0088호",
  email: "picakeee@gmail.com",
} as const;
