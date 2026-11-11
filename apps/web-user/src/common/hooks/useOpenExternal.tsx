"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Toast } from "@/apps/web-user/common/components/toast/Toast";
import { openExternalUrl } from "@/apps/web-user/common/utils/external-link.util";
import { isWebViewEnvironment } from "@/apps/web-user/common/utils/webview.bridge";

/** 이 시간 안에 화면이 내려가지 않으면 바깥 앱이 열리지 않은 것으로 본다(간편 입금과 같음) */
const LEAVE_TIMEOUT_MS = 1500;

export interface ExternalFallback {
  /** 열리지 않았을 때 손님이 붙여 넣을 값(채널 이름·번호·주소) */
  copyText: string;
  /** 복사한 뒤 보일 짧은 안내 */
  message: string;
}

function copyQuietly(text: string) {
  try {
    void navigator.clipboard?.writeText(text).catch(() => undefined);
  } catch {
    // 복사가 막힌 환경: 안내만 보인다
  }
}

/**
 * 카카오톡 채팅·인스타·메일·전화 같은 바깥 앱 열기 + 열리지 않았을 때 대신할 길.
 * 2026-11-11 안드로이드 손님 앱이 `apps://`의 https·mailto·tel을 넘기지 않는 것을 확인(판매자 앱은 됨, 앱담당자에게 요청).
 * 앱에서는 누를 때 값을 미리 복사해 두고(누른 순간에만 복사가 허용됨), 1.5초 안에 화면이 내려가지 않으면 안내를 띄운다.
 */
export function useOpenExternal() {
  const [message, setMessage] = useState<string | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => () => cleanupRef.current?.(), []);

  const open = useCallback((url: string, fallback?: ExternalFallback) => {
    cleanupRef.current?.();
    if (fallback && isWebViewEnvironment()) copyQuietly(fallback.copyText);

    let left = false;
    const markHidden = () => {
      if (document.hidden) left = true;
    };
    const markLeft = () => {
      left = true;
    };
    document.addEventListener("visibilitychange", markHidden);
    window.addEventListener("pagehide", markLeft);
    window.addEventListener("blur", markLeft);

    const cleanup = () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", markHidden);
      window.removeEventListener("pagehide", markLeft);
      window.removeEventListener("blur", markLeft);
      cleanupRef.current = null;
    };
    const timer = window.setTimeout(() => {
      cleanup();
      if (left || document.hidden || !fallback) return;
      if (!isWebViewEnvironment()) copyQuietly(fallback.copyText);
      setMessage(fallback.message);
    }, LEAVE_TIMEOUT_MS);
    cleanupRef.current = cleanup;

    openExternalUrl(url);
  }, []);

  const toast = message ? (
    <Toast
      message={message}
      iconName="copy"
      iconClassName="text-gray-500"
      duration={3500}
      onClose={() => setMessage(null)}
    />
  ) : null;

  return { open, toast };
}
