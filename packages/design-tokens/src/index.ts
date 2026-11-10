/*
 * Picake 공통 디자인 값(색·움직임·그림자·겹침 순서 — 두 앱의 기초. 부품은 앱마다 따로). 한 파일에 둔다: Storybook이 tailwind 설정을 Node로 읽을 때
 * 이 패키지 안의 확장자 없는 상대 import("./colors")를 경고하므로 파일을 나누지 않는다.
 */
import type { Config } from "tailwindcss";

// ── Picake 색 ──────────────────────────────────────────────────────────────

/**
 * Picake 색 (모든 웹 앱이 같이 쓰는 원본 값).
 *
 * - 손님 웹(web-user)·정보 사이트(web-info) tailwind 색 이름(`gray-900`, `primary` …)이 이 값 그대로다.
 * - 판매자 휴대폰 화면(web-seller `common/ui/tokens.ts`)의 `ink-*`·`brand`도 이 값을 가져다 쓴다.
 * - 값을 바꾸면 세 앱 화면이 모두 바뀐다. 한 앱만 다른 색이 필요하면 그 앱 디자인 값에 따로 둔다.
 */
export const colors = {
  white: {
    DEFAULT: "#FFFFFF",
  },
  black: {
    DEFAULT: "#000000",
    900: "#1F1F1E",
  },
  gray: {
    50: "#F5F5F5",
    100: "#EBEBEA",
    200: "#D4D4D3",
    300: "#BDBFC0",
    400: "#9B9B97",
    500: "#808386",
    600: "#686864",
    700: "#4E4E4B",
    800: "#343432",
    900: "#1F1F1E",
  },
  primary: {
    DEFAULT: "#FF653E",
    50: "#FFEFEB",
    100: "#FFD2C7",
    200: "#FFAD99",
    300: "#FF896B",
  },
  blue: {
    50: "#EBF8FF",
    100: "#B8E5FF",
    200: "#80D0FF",
    300: "#2EB2FF",
    400: "#009BF5",
  },
  green: {
    50: "#ECF9F1",
    100: "#C9EED8",
    200: "#9BDFB7",
    300: "#57CB87",
    400: "#27A55B",
  },
  red: {
    50: "#FEECEC",
    100: "#FCCACB",
    200: "#F99FA1",
    300: "#F67476",
    400: "#F23A3E",
  },
  yellow: {
    400: "#FFC83B",
  },
} as const;

// ── 손님 화면 (web-user, web-info) ─────────────────────────────────────────

/**
 * 손님 화면 디자인 값 (web-user 손님 웹, web-info 정보 사이트).
 *
 * 두 앱의 tailwind 설정에 같은 값이 복사돼 있던 것을 여기로 모았다(2026-11-08). 값은 옮기기 전과 같다.
 * 판매자 휴대폰 화면은 이 값보다 한 단계 작은 자기 값을 쓴다(web-seller `common/ui/tokens.ts`).
 */

/** 글자 크기 [크기, 줄 높이]. tailwind 기본 글자 크기(text-3xl 등)는 쓰지 않고 이 8개만 둔다 */
export const customerFontSize = {
  "2xs": ["11px", "14px"],
  xs: ["12px", "16px"],
  "2sm": ["13px", "18px"],
  sm: ["14px", "20px"],
  base: ["16px", "24px"],
  lg: ["18px", "28px"],
  xl: ["20px", "28px"],
  "2xl": ["24px", "32px"],
} satisfies Record<string, [string, string]>;

/** 모서리 */
export const customerRadius = {
  none: "0px",
  sm: "2px",
  DEFAULT: "4px",
  md: "6px",
  lg: "8px",
  "2lg": "10px",
  xl: "12px",
  "2xl": "16px",
  "3xl": "24px",
  "4xl": "32px",
  full: "9999px",
};

const customerKeyframes = {
  "accordion-down": {
    from: {
      height: "0",
    },
    to: {
      height: "var(--radix-accordion-content-height)",
    },
  },
  "accordion-up": {
    from: {
      height: "var(--radix-accordion-content-height)",
    },
    to: {
      height: "0",
    },
  },
  "slide-up": {
    from: {
      transform: "translateY(100%)",
    },
    to: {
      transform: "translateY(0)",
    },
  },
  // 탭 전환: 진행 방향 쪽에서 살짝 밀려 들어오며 나타남
  "tab-in-forward": {
    from: {
      opacity: "0",
      transform: "translateX(16px)",
    },
    to: {
      opacity: "1",
      transform: "translateX(0)",
    },
  },
  "tab-in-backward": {
    from: {
      opacity: "0",
      transform: "translateX(-16px)",
    },
    to: {
      opacity: "1",
      transform: "translateX(0)",
    },
  },
};

const customerAnimation = {
  "accordion-down": "accordion-down 0.2s ease-out",
  "accordion-up": "accordion-up 0.2s ease-out",
  "slide-up": "slide-up 0.3s ease-out",
  "tab-in-forward": "tab-in-forward 0.22s ease-out",
  "tab-in-backward": "tab-in-backward 0.22s ease-out",
};

// ── 움직임·그림자·겹침 순서 (공용 기초, 손님 앱·판매자 앱이 같이 씀) ─────────────

/**
 * 움직임 시간(ms). 화면마다 0.15·0.2·0.3초를 직접 적던 것을 이 이름으로 모은다(2026-11-11 운영자 결정).
 * instant 눌림 · fast 나가기·작은 변화 · base 페이드·팝업 · medium 스낵바 · slow 아래 창 · slower 펼치기·그리기
 */
export const motionDuration = {
  instant: 100,
  fast: 150,
  base: 200,
  medium: 250,
  slow: 300,
  slower: 400,
} as const;

/**
 * 움직임 곡선. 들어올 때는 빨리 시작해 부드럽게 멈추고(enter), 나갈 때는 천천히 시작해 빨리 사라진다(exit).
 * move는 선 그리기·자리 이동, spring은 살짝 넘쳤다 돌아오는 튕김(좋아요), linear는 로딩처럼 일정하게.
 */
export const motionEasing = {
  enter: "cubic-bezier(0.2, 0, 0, 1)",
  exit: "cubic-bezier(0.4, 0, 1, 1)",
  move: "cubic-bezier(0.4, 0, 0.2, 1)",
  spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  linear: "linear",
} as const;

const ms = (key: keyof typeof motionDuration) => `${motionDuration[key]}ms`;

/**
 * 움직임 프리셋(운영자가 정한 8가지 + 제안). tailwind `animate-<이름>`으로 쓴다.
 * - 토스트: 제자리에서 fade(들어올 때 base·enter, 나갈 때 fast·exit)
 * - 스낵바: 아래에서 위로 slide in(medium·enter), 나갈 때 아래로(base·exit)
 * - 팝업: 살짝 커지며(scale .92→1, base·enter), 나갈 때 살짝 작아지며 흐려짐(fast·exit)
 * - 아래 창: 아래에서 slide in(slow·enter), 닫힐 때 내려감(medium·exit). 뒤 배경은 scrim(base)로 어두워짐
 * - 좋아요: 톡 튕김(scale 1→1.3→1, slower·spring)
 * - 체크: 선이 그려짐(stroke-dashoffset → 0, slow·move). path에 pathLength="1"을 주고 쓴다
 * - 로딩: 일정한 속도로 한 바퀴 800ms(linear)
 * - 제목·설명 순서대로: rise(fade + 8px 위로, slow·enter) + 줄마다 animation-delay 80ms
 * - 제안: 입력 오류 흔들림(shake), 스켈레톤 흐르는 빛(shimmer)
 * 휴대폰 "동작 줄이기"를 켠 사람에게는 `motion-reduce:animate-fade-in|out`으로 이동·확대 없이 나타나고 사라지게 한다.
 *
 * 나가는 움직임(-out)은 시작점을 적지 않는다: 손으로 끌어내리던 아래 창처럼 지금 자리에서 그대로 이어서 나간다.
 * 들어오는 움직임(-in)은 끝난 뒤 값을 남기지 않는다(backwards): 끝난 뒤 손으로 끄는 움직임(inline transform)을 막지 않게.
 */
const motionKeyframes = {
  "motion-fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
  "motion-fade-out": { to: { opacity: "0" } },
  "motion-snackbar-in": {
    from: { opacity: "0", transform: "translateY(100%)" },
    to: { opacity: "1", transform: "translateY(0)" },
  },
  "motion-snackbar-out": { to: { opacity: "0", transform: "translateY(100%)" } },
  "motion-popup-in": {
    from: { opacity: "0", transform: "scale(0.92)" },
    to: { opacity: "1", transform: "scale(1)" },
  },
  "motion-popup-out": { to: { opacity: "0", transform: "scale(0.96)" } },
  "motion-sheet-in": {
    from: { transform: "translateY(100%)" },
    to: { transform: "translateY(0)" },
  },
  "motion-sheet-out": { to: { transform: "translateY(100%)" } },
  "motion-like-pop": {
    "0%": { transform: "scale(1)" },
    "40%": { transform: "scale(1.3)" },
    "100%": { transform: "scale(1)" },
  },
  "motion-check-draw": { from: { strokeDashoffset: "1" }, to: { strokeDashoffset: "0" } },
  "motion-spin": { from: { transform: "rotate(0deg)" }, to: { transform: "rotate(360deg)" } },
  "motion-rise": {
    from: { opacity: "0", transform: "translateY(8px)" },
    to: { opacity: "1", transform: "translateY(0)" },
  },
  "motion-shake": {
    "0%, 100%": { transform: "translateX(0)" },
    "20%, 60%": { transform: "translateX(-6px)" },
    "40%, 80%": { transform: "translateX(6px)" },
  },
  "motion-shimmer": {
    from: { backgroundPosition: "100% 0" },
    to: { backgroundPosition: "-100% 0" },
  },
};

const motionAnimation = {
  "fade-in": `motion-fade-in ${ms("base")} ${motionEasing.enter} backwards`,
  "fade-out": `motion-fade-out ${ms("fast")} ${motionEasing.exit} forwards`,
  "toast-in": `motion-fade-in ${ms("base")} ${motionEasing.enter} backwards`,
  "toast-out": `motion-fade-out ${ms("fast")} ${motionEasing.exit} forwards`,
  "snackbar-in": `motion-snackbar-in ${ms("medium")} ${motionEasing.enter} backwards`,
  "snackbar-out": `motion-snackbar-out ${ms("base")} ${motionEasing.exit} forwards`,
  "popup-in": `motion-popup-in ${ms("base")} ${motionEasing.enter} backwards`,
  "popup-out": `motion-popup-out ${ms("fast")} ${motionEasing.exit} forwards`,
  "sheet-in": `motion-sheet-in ${ms("slow")} ${motionEasing.enter} backwards`,
  "sheet-out": `motion-sheet-out ${ms("medium")} ${motionEasing.exit} forwards`,
  "scrim-in": `motion-fade-in ${ms("base")} ${motionEasing.enter} backwards`,
  "scrim-out": `motion-fade-out ${ms("medium")} ${motionEasing.exit} forwards`,
  "like-pop": `motion-like-pop ${ms("slower")} ${motionEasing.spring}`,
  "check-draw": `motion-check-draw ${ms("slow")} ${motionEasing.move} backwards`,
  "spin-steady": `motion-spin 800ms ${motionEasing.linear} infinite`,
  rise: `motion-rise ${ms("slow")} ${motionEasing.enter} backwards`,
  shake: `motion-shake ${ms("slow")} ${motionEasing.enter}`,
  shimmer: `motion-shimmer 1.2s ${motionEasing.linear} infinite`,
};

/** 제목·설명을 한 줄씩 차례로 띄울 때 줄 사이 간격(ms). `animate-rise`와 같이 쓴다 */
export const motionStaggerMs = 80;

/** 그림자(지금 화면에서 쓰는 값을 이름으로 모음. 화면에는 아직 이 이름으로 바꾸지 않았다) */
export const shadow = {
  card: "0 1px 2px rgba(31, 31, 30, 0.06)",
  float: "0 6px 20px rgba(31, 31, 30, 0.14)",
  bar: "0 -4px 12px rgba(31, 31, 30, 0.06)",
  sheet: "0 -8px 24px rgba(31, 31, 30, 0.12)",
} as const;

/**
 * 겹침 순서(z-index). 위에 올 것일수록 크다. 지금 화면 값(헤더 50, 안내 띠 60, 확인 창 100, 오류 창 9999)을
 * 이름으로 모아 둔 기준이며, 화면에는 아직 이 이름으로 바꾸지 않았다.
 */
export const zIndex = {
  sticky: 30,
  header: 50,
  banner: 60,
  sheet: 70,
  snackbar: 80,
  modal: 100,
  alert: 9999,
} as const;

/**
 * 움직임 tailwind preset. 손님 화면은 customerPreset 안에 들어 있고, 판매자 앱은 `presets: [motionPreset]`로 쓴다.
 * 이름: `duration-instant|fast|base|medium|slow|slower`, `ease-enter|exit|move|spring`, `animate-toast-in` 등.
 * tailwind 기본 이름(duration-200, ease-out, animate-spin)은 그대로 둔다.
 */
export const motionPreset = {
  theme: {
    extend: {
      transitionDuration: Object.fromEntries(
        Object.entries(motionDuration).map(([k, v]) => [k, `${v}ms`]),
      ),
      transitionTimingFunction: {
        enter: motionEasing.enter,
        exit: motionEasing.exit,
        move: motionEasing.move,
        spring: motionEasing.spring,
      },
      keyframes: motionKeyframes,
      animation: motionAnimation,
    },
  },
} satisfies Partial<Config>;

/**
 * 손님 화면 tailwind preset. 앱 tailwind 설정에서 `presets: [customerPreset]`로 쓴다.
 * 어떤 파일을 읽을지(content)·safelist·plugins는 앱마다 다르니 앱 설정에 둔다.
 */
export const customerPreset = {
  presets: [motionPreset],
  theme: {
    fontSize: customerFontSize,
    extend: {
      borderRadius: customerRadius,
      colors,
      keyframes: customerKeyframes,
      animation: customerAnimation,
    },
  },
} satisfies Partial<Config>;
