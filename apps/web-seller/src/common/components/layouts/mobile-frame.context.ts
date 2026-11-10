/**
 * 휴대폰 틀(MobileFrame) 안에 담긴 PC 화면이 버튼 모양을 앱 디자인 기준에 맞출 때 쓰는 값.
 * 아래 저장 줄(FrameSubmitBar)은 앱의 아래 버튼 줄처럼 늘 화면 맨 아래, 가득 찬 버튼(48)으로 그린다.
 */
import { createContext, useContext } from "react";

export const InMobileFrame = createContext(false);

/** 휴대폰 틀 안에서 그려지는지 */
export function useInMobileFrame(): boolean {
  return useContext(InMobileFrame);
}

/**
 * 아래 저장 줄(FrameSubmitBar) 버튼: 가로를 나눠 갖는 48(BaseButton size="lg"와 같은 높이·글자).
 * 주 버튼은 주황, 보조는 흰 바탕 + 테두리(variant="outline").
 */
export const FRAME_SUBMIT_BUTTON_CLASS = "h-12 min-w-0 flex-1 rounded-control text-body font-bold";
