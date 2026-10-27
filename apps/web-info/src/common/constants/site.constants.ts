/** 정보 사이트 기본 URL (OG·canonical). staging은 Vercel env로 override */
export const SITE_BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://info.picakes.com";

export const SITE_LOGO_URL = `${SITE_BASE_URL}/images/logo/logo_picake.svg`;

export const SITE_NAME = "Picake";
