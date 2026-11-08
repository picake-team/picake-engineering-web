import type { Config } from "tailwindcss";
import { customerPreset } from "@picake/design-tokens";

// 색·글자 크기·모서리·움직임은 공통 디자인 값(packages/design-tokens, 손님 화면)에 있다. web-info와 같이 쓴다
const config: Config = {
  presets: [customerPreset],
  darkMode: ["class"],
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  safelist: ["rounded-t-lg", "rounded-b-lg", "rounded-lg", "border-b-0", "border-t-0"],
  plugins: [require("tailwindcss-animate")],
};

export default config;
