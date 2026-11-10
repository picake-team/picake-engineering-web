/**
 * 판매자 앱 휴대폰 화면 디자인 값. 어느 부품에 어떤 값을 쓰는지는 docs/web-seller/판매자 앱 디자인 기준.md.
 *
 * - 색은 Picake 공통 색(`@picake/design-tokens`, 손님 웹과 같은 값)을 가져다 쓰고, 판매자 앱에서 정한 값
 *   (예시 글씨 #767672, 아이콘·꺼짐 #8C8C88, 작은 주황 글씨 #B5401C)만 여기에 둔다.
 * - 지금 PC 화면(shadcn 테마: primary·muted 등 CSS 변수)과 겹치지 않게 이름을 따로 둔다
 *   (`ink-*`, `brand-*`, `text-title` …). PC 화면은 출시 때 이 값으로 바뀐 휴대폰 화면을 가운데에 띄운다.
 * - 글자 크기·모서리·높이는 손님 화면보다 한 단계 작게 정한 판매자 앱 값이라 공통으로 꺼내지 않는다.
 */
import { colors } from "@picake/design-tokens";

export const appColors = {
  ink: {
    900: colors.gray[900], // 본문·제목
    700: colors.gray[700], // 칸 이름
    600: colors.gray[600], // 보조·설명
    500: "#767672", // 예시 글씨(플레이스홀더), 다음 단계 — 판매자 앱 값
    400: "#8C8C88", // 아이콘·꺼짐 — 판매자 앱 값
    200: colors.gray[200], // 입력 칸·보조 버튼 테두리
    100: colors.gray[100], // 나누는 선
    50: colors.gray[50], // 회색 띠·검색 칸
  },
  brand: {
    DEFAULT: colors.primary.DEFAULT, // 주 버튼·고른 것·할 일
    ink: "#B5401C", // 작은 주황 글씨(대비 5.6:1) — 판매자 앱 값
    // 연한 주황 바탕은 두지 않는다(분홍으로 보인다). 바탕은 흰색·회색(ink-50)만
  },
  kakao: "#FFEB00",
} as const;

/**
 * 글자 스타일. 굵기는 화면에서 font-bold(700)·font-semibold(600)·font-normal(400)로.
 * 손님 웹(본문 14·제목 18~20)에 맞춰 한 단계씩 작게 정했다.
 */
export const appFontSize = {
  title: ["20px", { lineHeight: "1.4", letterSpacing: "-0.02em" }], // 화면 제목(아래 탭 화면)·큰 숫자
  heading: ["18px", { lineHeight: "1.4", letterSpacing: "-0.01em" }], // 창 제목·할 일 한 줄
  group: ["16px", { lineHeight: "1.4" }], // 묶음 제목
  body: ["15px", { lineHeight: "1.5" }], // 본문·목록 이름·버튼
  sub: ["13px", { lineHeight: "1.5" }], // 칸 이름·보조 정보·작은 버튼
  caption: ["12px", { lineHeight: "1.5" }], // 설명 글·도움말·고칠 곳
  badge: ["11px", { lineHeight: "1.4" }], // 배지
  tab: ["11px", { lineHeight: "1.3" }], // 아래 탭 이름·단계 이름(손님 웹 아래 탭과 같음)
} as const;

/** 모서리: 체크 6, 위쪽 안내 띠 8, 버튼·입력 12, 카드·칸·안내 16, 창 22, 칩·배지·토글은 rounded-full */
export const appRadius = {
  check: "6px",
  control: "12px",
  card: "16px",
  sheet: "22px",
} as const;

/** 높이: 주 버튼·입력·위쪽 줄 48(h-12), 작은 버튼·검색 40(h-10), 칩·동그라미 36(h-9), 목록 한 줄 52(min-h-13). 누르는 영역은 44(size-11·min-h-11) 유지 */
export const appSpacing = {
  13: "3.25rem",
} as const;

export const appFontFamily = [
  '"Pretendard Variable"',
  "Pretendard",
  "-apple-system",
  "BlinkMacSystemFont",
  '"Apple SD Gothic Neo"',
  '"Noto Sans KR"',
  "sans-serif",
];
