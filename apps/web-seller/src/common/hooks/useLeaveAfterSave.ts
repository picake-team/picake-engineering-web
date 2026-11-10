import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useInMobileFrame } from "@/apps/web-seller/common/components/layouts/mobile-frame.context";

/** 이 앱 안에서 앞 화면이 있는지(앱을 켜자마자 연 화면이면 없다). react-router가 history.state.idx에 순번을 둔다 */
export function canGoBackInApp(): boolean {
  const state = window.history.state as { idx?: number } | null;
  return (state?.idx ?? 0) > 0;
}

/**
 * 저장·등록·삭제 뒤 화면을 떠나는 방법.
 * - 휴대폰: 들어온 곳으로 돌아간다(뒤로를 눌러도 방금 저장한 입력 화면이 다시 열리지 않게). 앞 화면이 없으면 목록으로 바꿔 연다
 * - PC: 지금처럼 목록으로
 */
export function useLeaveAfterSave() {
  const navigate = useNavigate();
  const inFrame = useInMobileFrame();
  return useCallback(
    (fallback: string) => {
      if (inFrame && canGoBackInApp()) navigate(-1);
      else navigate(fallback, { replace: inFrame });
    },
    [inFrame, navigate],
  );
}
