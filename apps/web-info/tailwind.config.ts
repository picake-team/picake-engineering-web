import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  safelist: ["rounded-t-lg", "rounded-b-lg", "rounded-lg", "border-b-0", "border-t-0"],
  theme: {
    fontSize: {
      "2xs": ["11px", "14px"],
      xs: ["12px", "16px"],
      "2sm": ["13px", "18px"],
      sm: ["14px", "20px"],
      base: ["16px", "24px"],
      lg: ["18px", "28px"],
      xl: ["20px", "28px"],
      "2xl": ["24px", "32px"],
    },
    extend: {
      borderRadius: {
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
      },
      colors: {
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
      },
      keyframes: {
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
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
        "tab-in-forward": "tab-in-forward 0.22s ease-out",
        "tab-in-backward": "tab-in-backward 0.22s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
