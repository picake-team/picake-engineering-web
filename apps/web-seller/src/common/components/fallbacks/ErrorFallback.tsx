"use client";

import { FallbackProps } from "react-error-boundary";
import { BaseButton as Button } from "@/apps/web-seller/common/components/buttons/BaseButton";
import { Card, CardContent } from "@/apps/web-seller/common/components/cards/Card";
import {
  BaseAlert as Alert,
  AlertTitle,
  AlertDescription,
} from "@/apps/web-seller/common/components/alerts/BaseAlert";
import { AlertCircle, RotateCcw, RotateCw } from "lucide-react";
import { useEffect } from "react";
import { LoadErrorState } from "@/apps/web-seller/common/ui/Surface";
import { useShowMobileScreens } from "@/apps/web-seller/common/hooks/useShowMobileScreens";
import {
  isChunkLoadError,
  reloadForChunkError,
} from "@/apps/web-seller/common/utils/chunk-reload.util";

interface ErrorFallbackProps extends FallbackProps {
  error: unknown;
  resetErrorBoundary: () => void;
}

/**
 * 휴대폰(앱): PC 오류 창 대신 앱 빈 화면 모양. 개발용 오류 글은 보이지 않는다(Sentry로 간다).
 * 인터넷이 끊겨 화면 조각을 못 받았으면 "인터넷 연결을 확인해 주세요"이고, 연결되면 저절로 다시 연다.
 */
function MobileErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
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
      <LoadErrorState big title="화면을 보여 주지 못했어요" onRetry={retry} />
    </div>
  );
}

export function ErrorFallback(props: ErrorFallbackProps) {
  const showMobile = useShowMobileScreens();
  return showMobile ? <MobileErrorFallback {...props} /> : <DesktopErrorFallback {...props} />;
}

function DesktopErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  const handleRetry = () => {
    resetErrorBoundary();
  };

  const handleReload = () => {
    window.location.reload();
  };

  // error를 Error 타입으로 안전하게 변환
  const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
      <Card className="max-w-md w-full text-center">
        <CardContent className="p-8">
          <div className="flex flex-col items-center gap-6">
            <AlertCircle className="h-12 w-12 text-destructive" />

            <h2 className="text-2xl font-semibold text-destructive">
              예상치 못한 오류가 발생했습니다
            </h2>

            <Alert variant="destructive" className="w-full">
              <AlertTitle>오류 상세</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>

            <div className="flex gap-2 w-full">
              <Button onClick={handleRetry} className="flex-1 gap-2">
                <RotateCcw className="h-4 w-4" />
                다시 시도
              </Button>
              <Button variant="outline" onClick={handleReload} className="flex-1 gap-2">
                <RotateCw className="h-4 w-4" />
                페이지 새로고침
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
