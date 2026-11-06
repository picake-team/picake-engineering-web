import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";
import { appFontSize, appRadius } from "@/apps/web-seller/common/ui/tokens";

/**
 * 판매자 앱 디자인 값(tokens.ts)의 글자 크기(text-body 등)와 모서리(rounded-control 등)를 tailwind-merge에 알려 준다.
 * 모르면 text-sub를 글자색으로 보고 text-[15px]·text-base와 겹쳐도 정리하지 못한다(휴대폰 틀 안 PC 부품 버튼 글자가 작아짐).
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: Object.keys(appFontSize) }],
      rounded: [{ rounded: Object.keys(appRadius) }],
    },
  },
});

/**
 * 조건부 클래스명을 병합하고 Tailwind CSS 클래스 충돌을 해결하는 유틸리티 함수
 *
 * @param inputs - 병합할 클래스명들 (문자열, 객체, 배열, 조건부 표현식 등)
 * @returns 병합되고 충돌이 해결된 클래스명 문자열
 *
 * @example
 * // 기본 사용
 * cn("px-4", "py-2") // "px-4 py-2"
 *
 * // 조건부 클래스
 * cn("px-4", isActive && "bg-blue-500") // "px-4 bg-blue-500" 또는 "px-4"
 *
 * // Tailwind 클래스 충돌 해결
 * cn("px-4", "px-8") // "px-8" (나중 값이 우선)
 *
 * // 객체 형태
 * cn({ "px-4": true, "py-2": false }) // "px-4"
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
