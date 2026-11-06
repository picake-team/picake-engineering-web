/**
 * 판매자 앱 휴대폰 화면 디자인 값 (디자인 기준 B-1~B-6, 2026-11-06 확정).
 *
 * - 손님 웹(web-user tailwind)과 같은 색·글자 크기를 쓰고, 판매자 앱에서 정한 값(예시 글씨 #767672,
 *   아이콘·꺼짐 #8C8C88, 작은 주황 글씨 #B5401C)을 더했다.
 * - 지금 PC 화면(shadcn 테마: primary·muted 등 CSS 변수)과 겹치지 않게 이름을 따로 둔다
 *   (`ink-*`, `brand-*`, `text-title` …). PC 화면은 출시 때 이 값으로 바뀐 휴대폰 화면을 가운데에 띄운다.
 * - 손님 웹과 공통 패키지로 꺼내는 것은 나중에 한다(2026-11-06 운영자 결정).
 */

export const appColors = {
  ink: {
    900: "#1F1F1E", // 본문·제목
    700: "#4E4E4B", // 칸 이름
    600: "#686864", // 보조·설명
    500: "#767672", // 예시 글씨(플레이스홀더), 다음 단계
    400: "#8C8C88", // 아이콘·꺼짐
    200: "#D4D4D3", // 입력 칸·보조 버튼 테두리
    100: "#EBEBEA", // 나누는 선
    50: "#F5F5F5", // 회색 띠·검색 칸
  },
  brand: {
    DEFAULT: "#FF653E", // 주 버튼·고른 것·할 일
    ink: "#B5401C", // 작은 주황 글씨(대비 5.6:1)
    tint: "#FFEFEB", // 연한 주황 칸
  },
  kakao: "#FFEB00",
} as const;

/**
 * 글자 스타일 (B-2·B-6). 굵기는 화면에서 font-bold(700)·font-semibold(600)·font-normal(400)로.
 * 2026-11-06 운영자 의견("전체적으로 커 보인다, 손님 웹은 적당")으로 한 단계씩 줄였다(손님 웹 본문 14·제목 18~20에 맞춤).
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

/** 모서리 (B-1): 체크 6, 버튼·입력 12, 카드·칸·안내 16, 창 22, 칩·배지·토글은 rounded-full */
export const appRadius = {
  check: "6px",
  control: "12px",
  card: "16px",
  sheet: "22px",
} as const;

/** 높이 (B-1, 2026-11-06 한 단계 줄임): 주 버튼·입력·위쪽 줄 48(h-12), 작은 버튼·검색 40(h-10), 칩·동그라미 36(h-9), 목록 한 줄 52(min-h-13). 누르는 영역은 44(size-11·min-h-11) 유지 */
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
