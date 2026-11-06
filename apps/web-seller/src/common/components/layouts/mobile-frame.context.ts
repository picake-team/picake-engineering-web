/**
 * 휴대폰 틀(MobileFrame) 안에 담긴 PC 화면이 버튼 모양을 앱 디자인 기준에 맞출 때 쓰는 값.
 * 아래 저장 줄은 앱의 아래 버튼 줄처럼 가득 찬 버튼(48)으로, 갈색 글자 버튼 없이 그린다(운영자 의견 2026-11-06).
 */
import { createContext, useContext } from "react";

export const InMobileFrame = createContext(false);

/** 휴대폰 틀 안에서 그려지는지 */
export function useInMobileFrame(): boolean {
  return useContext(InMobileFrame);
}

/** 아래 저장 줄(흰 바탕 + 위 선, 안전 영역만큼 띄움) */
export const FRAME_SUBMIT_BAR_CLASS =
  "sticky bottom-0 z-10 mt-6 flex flex-col gap-2 border-t border-ink-100 bg-white pb-[max(12px,env(safe-area-inset-bottom))] pt-3 font-app";

/** 저장 줄 버튼(가득 찬 48, 15/700, 모서리 12). 주 버튼은 주황, 보조는 흰 바탕 + 테두리(variant="outline") */
export const FRAME_SUBMIT_BUTTON_CLASS = "h-12 flex-1 rounded-control text-[15px] font-bold";

/** 저장 줄 위 "고칠 곳 n개 보기"(진한 글씨 + 오른쪽 꺾쇠, 갈색 글자 버튼 대신) */
export const FRAME_REASON_CLASS =
  "flex min-h-11 items-center gap-1 self-start text-[12px] font-semibold text-ink-900";
