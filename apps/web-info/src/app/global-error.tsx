"use client";

import { useEffect } from "react";
import { captureSentryException } from "@/apps/web-info/common/utils/sentry.util";

/**
 * 루트 레이아웃에서 발생한 렌더링 에러를 캡처하는 전역 에러 바운더리.
 * (일반 컴포넌트 트리 에러는 ErrorBoundaryProvider가 처리)
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureSentryException(error);
  }, [error]);

  return (
    <html lang="ko">
      <body>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            gap: "16px",
            padding: "24px",
            textAlign: "center",
          }}
        >
          <h2 style={{ fontSize: "18px", fontWeight: 600 }}>예상치 못한 오류가 발생했습니다</h2>
          <button
            onClick={() => reset()}
            style={{
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            다시 시도
          </button>
        </div>
      </body>
    </html>
  );
}
