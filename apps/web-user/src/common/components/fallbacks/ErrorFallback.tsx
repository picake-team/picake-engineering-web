"use client";

import { FallbackProps } from "react-error-boundary";

interface ErrorFallbackProps extends FallbackProps {
  error: unknown;
  resetErrorBoundary: () => void;
}

export function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  const handleRetry = () => {
    resetErrorBoundary();
  };

  // error를 Error 타입으로 안전하게 변환
  // 화면에는 영어 원문(Error.message)을 보이지 않는다(손님 앱 디자인 기준 "오류에 영어 원문 X", 11-18 검토).
  // 원문은 Sentry가 받는다.
  void error;
  const errorMessage = "화면을 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요.";

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "32px",
          borderRadius: "12px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
          maxWidth: "400px",
          width: "90%",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: "48px",
            marginBottom: "16px",
          }}
        >
          ⚠️
        </div>
        <h2
          style={{
            fontSize: "20px",
            fontWeight: "600",
            marginBottom: "12px",
            color: "#dc2626",
          }}
        >
          예상치 못한 오류가 생겼어요
        </h2>
        <p
          style={{
            fontSize: "14px",
            color: "#666",
            marginBottom: "24px",
            lineHeight: "1.5",
          }}
        >
          {errorMessage}
        </p>
        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "center",
          }}
        >
          <button
            onClick={handleRetry}
            style={{
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
            }}
          >
            다시 시도
          </button>
          <button
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: "#6b7280",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
            }}
          >
            페이지 새로고침
          </button>
        </div>
      </div>
    </div>
  );
}
