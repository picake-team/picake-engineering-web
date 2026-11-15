"use client";

import { usePathname } from "next/navigation";

/**
 * 화면 주소(usePathname). Vercel이 홈(/)을 1분마다 다시 만들 때 서버 쪽 주소가 "/index"로 들어와
 * 홈에 공통 머리줄(위치 줄)이 그려지고 손님 기기에서는 "/"라 그림이 어긋났다(11-15 밤 hydration 오류 #418).
 * 머리줄·아래 탭처럼 주소로 모양을 정하는 곳은 이것을 쓴다
 */
export function normalizeAppPathname(pathname: string | null | undefined): string {
  if (!pathname || pathname === "/index") return "/";
  return pathname;
}

export function useAppPathname(): string {
  return normalizeAppPathname(usePathname());
}
