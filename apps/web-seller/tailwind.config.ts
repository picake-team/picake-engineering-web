import type { Config } from "tailwindcss";
import { motionPreset } from "@picake/design-tokens";
import {
  appColors,
  appFontFamily,
  appFontSize,
  appMaxWidth,
  appRadius,
  appShadow,
  appSpacing,
} from "./src/common/ui/tokens";
import {
  NAV_EXPANDED_MIN_WIDTH_PX,
  PHONE_MAX_WIDTH_PX,
  TWO_PANE_MIN_WIDTH_PX,
} from "./src/common/constants/screen.constant";

const config: Config = {
  // 움직임 시간·곡선·프리셋은 공용 기초(packages/design-tokens). 손님 앱과 같은 값
  presets: [motionPreset],
  // hover: 꾸밈은 마우스가 있는 기기에서만. 휴대폰은 누른 뒤에도 hover가 남아 버튼이 회색으로 보인다(2026-11-10)
  future: { hoverOnlyWhenSupported: true },
  // 어두운 화면은 쓰지 않는다. "class"로 두어 PC 부품의 dark: 값이 휴대폰 어두운 모드에서 켜지지 않게 한다
  darkMode: ["class"],
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    // 폭 구간은 common/constants/screen.constant.ts 한 곳에서 정한다. 작은 것부터 순서대로 둬야 넓은 쪽이 이긴다
    screens: {
      sm: "640px",
      md: `${PHONE_MAX_WIDTH_PX + 1}px`, // PC 틀(휴대폰 화면 다음)
      split: `${TWO_PANE_MIN_WIDTH_PX}px`, // 목록과 상세를 나란히
      lg: "1024px",
      nav: `${NAV_EXPANDED_MIN_WIDTH_PX}px`, // 왼쪽 메뉴에 이름까지
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        // 휴대폰 화면(디자인 기준 B)
        ...appRadius,
      },
      fontSize: { ...appFontSize },
      fontFamily: { app: appFontFamily },
      spacing: { ...appSpacing },
      boxShadow: { ...appShadow },
      maxWidth: { ...appMaxWidth },
      colors: {
        // 휴대폰 화면(디자인 기준 B): ink-*, brand-*, kakao
        ...appColors,
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
