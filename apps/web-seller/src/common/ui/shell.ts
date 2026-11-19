/**
 * 지금 화면을 그리는 틀(기획 I-54).
 *
 * - phone: 휴대폰 화면 틀(MobileLayout). 화면마다 아래 탭을 그린다.
 * - desktop: PC 틀(DesktopLayout). 왼쪽 메뉴가 있어 아래 탭을 그리지 않고, 아래 창은 가운데 창이 된다.
 *
 * PC 나란히 보기의 한 칸(주문 상세·채팅방)에 휴대폰 화면을 그대로 넣을 때는 PaneContext로 알린다.
 * 그러면 화면 틀(AppScreen)이 칸 높이 안에서 스크롤하고, 목록과 나란히 있으면 뒤로를 그리지 않는다.
 */
import { createContext, useContext } from "react";

export type Shell = "phone" | "desktop";

export const ShellContext = createContext<Shell>("phone");

export function useShell(): Shell {
  return useContext(ShellContext);
}

export function useIsDesktopShell(): boolean {
  return useContext(ShellContext) === "desktop";
}

export interface PaneInfo {
  /** 목록과 나란히 있어 뒤로가 필요 없다(두 칸). 한 칸일 때는 false */
  besideList: boolean;
  /** 뒤로 대신 칸을 닫는다(두 칸에서 고른 것 지우기 등). 없으면 기본 뒤로 */
  onBack?: () => void;
}

export const PaneContext = createContext<PaneInfo | null>(null);

export function usePane(): PaneInfo | null {
  return useContext(PaneContext);
}

/** PC 틀 안 휴대폰 화면 칸 너비(가운데). 휴대폰 640보다 조금 넓게 */
export const DESKTOP_COLUMN_CLASS = "mx-auto w-full max-w-[720px]";
