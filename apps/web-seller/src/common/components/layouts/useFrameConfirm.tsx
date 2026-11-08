/**
 * 휴대폰 틀(MobileFrame) 안의 PC 화면에서 쓰는 확인 창.
 * - 휴대폰 틀 안: 앱과 같은 아래에서 올라오는 창(BottomSheet). 브라우저 기본 창(window.confirm)은 앱 웹뷰에서
 *   주소가 제목으로 붙은 휴대폰 기본 창으로 뜨거나(안드로이드) 아예 뜨지 않을 수 있다(아이폰)
 * - PC 화면: 지금처럼 브라우저 기본 창(PC 모양은 바꾸지 않음)
 */
import React, { useCallback, useRef, useState } from "react";
import { useInMobileFrame } from "@/apps/web-seller/common/components/layouts/mobile-frame.context";
import { BottomSheet } from "@/apps/web-seller/common/ui/Sheet";
import { Button, ButtonPair } from "@/apps/web-seller/common/ui/Button";

export function useFrameConfirm({
  pcMessage,
  title,
  confirmLabel,
}: {
  /** PC 브라우저 기본 창 문구(지금 문구 그대로) */
  pcMessage: string;
  /** 휴대폰 틀 안 창 제목 */
  title: string;
  /** 휴대폰 틀 안 주 버튼 이름 */
  confirmLabel: string;
}): { confirm: () => Promise<boolean>; sheet: React.ReactNode } {
  const inFrame = useInMobileFrame();
  const [open, setOpen] = useState(false);
  const resolveRef = useRef<((ok: boolean) => void) | null>(null);

  const confirm = useCallback((): Promise<boolean> => {
    if (!inFrame) return Promise.resolve(window.confirm(pcMessage));
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setOpen(true);
    });
  }, [inFrame, pcMessage]);

  const close = (ok: boolean) => {
    resolveRef.current?.(ok);
    resolveRef.current = null;
    setOpen(false);
  };

  const sheet = inFrame ? (
    <BottomSheet
      open={open}
      onClose={() => close(false)}
      title={title}
      footer={
        <ButtonPair>
          <Button variant="secondary" onClick={() => close(false)}>
            돌아가기
          </Button>
          <Button onClick={() => close(true)}>{confirmLabel}</Button>
        </ButtonPair>
      }
    />
  ) : null;

  return { confirm, sheet };
}
