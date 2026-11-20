import type { Config } from "tailwindcss";
import { customerPreset } from "@picake/design-tokens";
import { PHONE_MAX_WIDTH_PX, WIDE_MIN_WIDTH_PX } from "./src/common/constants/screen.constants";

// 색·글자 크기·모서리·움직임은 공통 디자인 값(packages/design-tokens, 손님 화면)에 있다. web-user와 같이 쓴다
const config: Config = {
  presets: [customerPreset],
  // hover 꾸밈은 마우스가 있는 기기에서만(휴대폰에서 누른 뒤 색이 남지 않게, 사장님 웹과 같음)
  future: { hoverOnlyWhenSupported: true },
  darkMode: ["class"],
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    // 폭 구간은 src/common/constants/screen.constants.ts 한 곳에서 정한다. 작은 것부터 순서대로 둬야 넓은 쪽이 이긴다
    screens: {
      sm: "640px",
      md: `${PHONE_MAX_WIDTH_PX + 1}px`,
      lg: `${WIDE_MIN_WIDTH_PX}px`,
      xl: "1280px",
    },
  },
  safelist: ["rounded-t-lg", "rounded-b-lg", "rounded-lg", "border-b-0", "border-t-0"],
  plugins: [require("tailwindcss-animate")],
};

export default config;
