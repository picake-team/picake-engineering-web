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
