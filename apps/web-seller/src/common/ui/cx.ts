import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";
import { appFontSize, appRadius } from "@/apps/web-seller/common/ui/tokens";

/**
 * 휴대폰 화면용 클래스 합치기.
 * tailwind-merge는 모르는 `text-*`를 글자색으로 보고 `text-ink-900`과 겹치면 지워 버린다.
 * 디자인 기준의 글자 크기(`text-title` 등)·모서리(`rounded-control` 등) 이름을 알려 둔다.
 */
const mergeAppClasses = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: Object.keys(appFontSize) }],
      rounded: [{ rounded: Object.keys(appRadius) }],
    },
  },
});

export function cx(...inputs: ClassValue[]) {
  return mergeAppClasses(clsx(inputs));
}
