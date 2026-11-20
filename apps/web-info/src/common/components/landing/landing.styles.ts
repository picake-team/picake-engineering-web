/**
 * 소개 페이지(손님 쪽 `/`, 사장님 쪽 `/seller/about`)가 같이 쓰는 모양 값(2026-11-20 소개 페이지 PC·휴대폰).
 * 색은 공통 디자인 값(`@picake/design-tokens` 손님 preset: primary·gray)을 먼저 쓰고, 소개 페이지에만 있는 바탕색만 여기 둔다.
 * 글자 크기는 손님 preset이 24px까지라 큰 제목은 여기 값을 쓴다.
 */

/** 본문 칸: 휴대폰 좌우 20px, PC 40px, 가장 넓을 때 글·화면 1200px */
export const WRAP = "mx-auto w-full max-w-[1280px] px-5 md:px-10";

/** 바탕색. 따뜻한 밝은색(사진과 어울림)과 어두운 초콜릿색(홈 배너 MK-13 어두운 바탕과 같은 값) */
export const PAPER = "bg-[#F6F3EE]";
export const PANEL = "bg-[#F4F2EE]";
export const COCOA = "bg-[#1B1512]";
export const LINE = "border-[#E3DED6]";

/** 칸 위아래 여백: 휴대폰 64, PC 112 */
export const SECTION_Y = "py-16 md:py-28";

/** 칸 머리말(작은 주황 글자). 메인 주황은 운영자 2026-11-17 결정(흰 바탕 대비 2.9:1을 알리고 정함) */
export const KICKER = "text-[14px] font-bold text-primary md:text-base";

/** 칸 제목: 휴대폰 26~28, PC 40~42 */
export const TITLE =
  "text-[clamp(24px,7vw,28px)] leading-[1.32] font-extrabold tracking-[-0.03em] text-balance md:text-[40px] md:leading-[1.3] lg:text-[42px]";

/** 칸 설명 한 줄 */
export const LEAD = "text-base leading-[1.6] text-gray-600 md:text-lg";

/** 큰 칸 안 제목(해결 줄·카드) */
export const CARD_TITLE =
  "text-[22px] leading-[1.38] font-extrabold tracking-[-0.025em] md:text-[28px] lg:text-[30px]";

/** 큰 칸 안 본문 */
export const CARD_BODY = "text-[15px] leading-[1.65] text-gray-700 md:text-[17px]";
