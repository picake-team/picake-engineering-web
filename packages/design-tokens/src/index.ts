/*
 * Picake 공통 디자인 값. 한 파일에 둔다: Storybook이 tailwind 설정을 Node로 읽을 때
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

/**
 * 손님 화면 tailwind preset. 앱 tailwind 설정에서 `presets: [customerPreset]`로 쓴다.
 * 어떤 파일을 읽을지(content)·safelist·plugins는 앱마다 다르니 앱 설정에 둔다.
 */
export const customerPreset = {
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
