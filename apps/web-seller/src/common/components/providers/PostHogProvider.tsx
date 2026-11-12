import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  initPostHog,
  syncPostHogUser,
  withPostHog,
} from "@/apps/web-seller/common/config/posthog.config";
import { useAuthStore } from "@/apps/web-seller/features/auth/store/auth.store";
import { getAccessToken } from "@/apps/web-seller/common/utils/token.util";

/**
 * 라우트 변경 시 $pageview 이벤트를 수동 캡처합니다.
 * (react-router SPA 전환이라 자동 페이지뷰가 잡히지 않음)
 * 반드시 Router 내부에서 렌더링해야 합니다.
 */
export function PostHogPageView() {
  const location = useLocation();

  useEffect(() => {
    const url = window.origin + location.pathname + location.search;
    withPostHog((ph) => ph.capture("$pageview", { $current_url: url }));
  }, [location.pathname, location.search]);

  // /auth/* 는 OAuth 콜백·가입 플로우라 화면 녹화(세션 리플레이) 자체를 꺼서
  // 이메일 등 화면에 노출되는 정보가 리플레이로 남지 않게 한다.
  useEffect(() => {
    const blocked = location.pathname.startsWith("/auth");
    withPostHog((ph) => {
      if (blocked) {
        ph.stopSessionRecording();
      } else {
        ph.startSessionRecording();
      }
    });
  }, [location.pathname]);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    initPostHog();
  }, []);

  // 로그인한 판매자를 사람 하나로 묶고, 로그아웃하면 끊는다.
  // 로그아웃은 isAuthenticated·isInitialized를 둘 다 false로 바꾸므로 "로그인돼 있었는지"를 따로 기억한다.
  const wasAuthenticated = useRef(false);
  useEffect(() => {
    if (isAuthenticated) {
      wasAuthenticated.current = true;
      syncPostHogUser(getAccessToken());
    } else if (wasAuthenticated.current || isInitialized) {
      wasAuthenticated.current = false;
      syncPostHogUser(null);
    }
  }, [isInitialized, isAuthenticated]);

  return <>{children}</>;
}
