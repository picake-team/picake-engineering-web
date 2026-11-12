/** 공개 웹 사이트 기본 URL (OG·canonical). staging은 Vercel env로 override */
export const SITE_BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://picakes.com";

export const SITE_LOGO_URL = `${SITE_BASE_URL}/images/logo/logo_picake.svg`;

/**
 * 공유 미리보기(카카오톡·인스타그램·페이스북) 그림. 이 메신저들은 SVG를 보여 주지 않아 PNG(1200×630)를 쓴다.
 * 로고 SVG를 흰 바탕 가운데에 둔 그림(2026-11-12)
 */
export const SITE_OG_IMAGE = {
  url: `${SITE_BASE_URL}/images/og/picake.png`,
  width: 1200,
  height: 630,
  alt: "Picake",
  type: "image/png",
} as const;

export const SITE_NAME = "Picake";
