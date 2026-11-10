/**
 * 휴대폰 틀(MobileFrame) 안 긴 입력 화면의 아래 저장 줄.
 * 앱 화면의 아래 버튼 띠(AppScreen footer + BottomActionBar)와 같게, 내용이 짧아도 늘 화면 맨 아래에 붙고
 * 버튼은 가득 찬 48이다. 키보드가 올라와 있는 동안은 숨긴다(AppScreen과 같음).
 * 폼 안에 두므로 type="submit" 버튼을 그대로 넣는다. 버튼은 FRAME_SUBMIT_BUTTON_CLASS(가로를 나눠 갖는 48).
 * 고칠 곳이 있으면 "고칠 곳 n개"(보조) | 주 버튼(flex-[2]) — 디자인 6-E·8-F.
 */
import React from "react";
import { APP_COLUMN_CLASS, BottomActionBar } from "@/apps/web-seller/common/ui/Screen";
import { useKeyboardOpen } from "@/apps/web-seller/common/hooks/useKeyboardOpen";
import { cx } from "@/apps/web-seller/common/ui/cx";

export function FrameSubmitBar({ children }: { children: React.ReactNode }) {
  const keyboardOpen = useKeyboardOpen();
  return (
    <>
      {/* 아래에 붙은 줄이 마지막 칸을 가리지 않게 같은 높이만큼 비워 둔다 */}
      <div
        aria-hidden="true"
        className="h-[calc(61px+max(12px,env(safe-area-inset-bottom)))] shrink-0"
      />
      {keyboardOpen ? null : (
        <div className={cx(APP_COLUMN_CLASS, "fixed inset-x-0 bottom-0 z-20")}>
          <BottomActionBar>
            <div className="flex gap-2">{children}</div>
          </BottomActionBar>
        </div>
      )}
    </>
  );
}
