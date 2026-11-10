/**
 * 휴대폰 틀(MobileFrame) 안 긴 입력 화면의 아래 저장 줄.
 * 앱 화면의 아래 버튼 띠(AppScreen footer + BottomActionBar)와 같게, 내용이 짧아도 늘 화면 맨 아래에 붙고
 * 버튼은 가득 찬 48이다. 키보드가 올라와 있는 동안은 숨긴다(AppScreen과 같음).
 * 폼 안에 두므로 type="submit" 버튼을 그대로 넣는다. 버튼은 FRAME_SUBMIT_BUTTON_CLASS(가로를 나눠 갖는 48).
 * 고칠 곳이 있으면 "고칠 곳 n개"(보조) | 주 버튼(flex-[2]) — 디자인 6-E·8-F.
 * 삭제처럼 약한 행동은 below에 회색 글자 버튼(Button variant="quiet")으로 주 버튼 바로 아래에 둔다
 * (네이버 가져오기 창의 "다른 상품 고르기"와 같은 모양).
 */
import React from "react";
import { APP_COLUMN_CLASS, BottomActionBar } from "@/apps/web-seller/common/ui/Screen";
import { useKeyboardOpen } from "@/apps/web-seller/common/hooks/useKeyboardOpen";
import { cx } from "@/apps/web-seller/common/ui/cx";

export function FrameSubmitBar({
  children,
  below,
}: {
  children: React.ReactNode;
  /** 주 버튼 아래 회색 글자 버튼(예: 상품 삭제) */
  below?: React.ReactNode;
}) {
  const keyboardOpen = useKeyboardOpen();
  return (
    <>
      {/* 아래에 붙은 줄이 마지막 칸을 가리지 않게 같은 높이만큼 비워 둔다 */}
      <div
        aria-hidden="true"
        className={cx(
          "shrink-0",
          below
            ? "h-[calc(104px+max(20px,env(safe-area-inset-bottom)))]"
            : "h-[calc(64px+max(20px,env(safe-area-inset-bottom)))]",
        )}
      />
      {keyboardOpen ? null : (
        <div className={cx(APP_COLUMN_CLASS, "fixed inset-x-0 bottom-0 z-20")}>
          <BottomActionBar>
            <div className="flex gap-2">{children}</div>
            {below ? <div className="-mb-3 flex justify-center">{below}</div> : null}
          </BottomActionBar>
        </div>
      )}
    </>
  );
}
