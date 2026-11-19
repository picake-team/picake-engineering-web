"use client";

import { FallbackProps } from "react-error-boundary";
import { useEffect } from "react";
import { LoadErrorState } from "@/apps/web-seller/common/ui/Surface";
import {
  isChunkLoadError,
  reloadForChunkError,
} from "@/apps/web-seller/common/utils/chunk-reload.util";

interface ErrorFallbackProps extends FallbackProps {
  error: unknown;
  resetErrorBoundary: () => void;
}

/**
 * 화면을 그리다 멈췄을 때(휴대폰·PC 같음, 기획 I-54). 앱 빈 화면 모양이고 개발용 오류 글은 보이지 않는다(Sentry로 간다).
 * 인터넷이 끊겨 화면 조각을 못 받았으면 "인터넷 연결을 확인해 주세요"이고, 연결되면 저절로 다시 연다.
 * 예전 PC는 검은 덮개에 오류 원문(영어)을 보였고 배포 직후 옛 조각 오류도 다시 열지 않았다.
 */
export function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  const chunk = isChunkLoadError(error);

  useEffect(() => {
    if (!chunk) return;
    // 배포 뒤 옛 조각이면 한 번 새로고침(main의 이벤트를 못 탄 경우의 대비, 10초 안 반복은 안 함)
    if (reloadForChunkError()) return;
    const onOnline = () => window.location.reload();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [chunk]);

  const retry = () => {
    // 인터넷이 되면 새로 불러오는 게 가장 확실하다(조각 실패는 다시 그려도 같은 실패)
    if (navigator.onLine) window.location.reload();
    else resetErrorBoundary();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-white px-5 pt-[env(safe-area-inset-top)] font-app">
      <div className="mx-auto flex w-full max-w-column flex-1 flex-col">
        <LoadErrorState big title="화면을 보여 주지 못했어요" onRetry={retry} />
      </div>
    </div>
  );
}
