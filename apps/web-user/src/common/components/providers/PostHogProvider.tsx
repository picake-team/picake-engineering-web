"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import {
  initPostHog,
  isPostHogEnabled,
  syncPostHogUser,
} from "@/apps/web-user/common/config/posthog.config";
import { useAuthHasHydrated, useAuthStore } from "@/apps/web-user/common/store/auth.store";

/**
 * 라우트 변경 시 $pageview 이벤트를 수동 캡처합니다.
 * (App Router는 SPA 전환이라 자동 페이지뷰가 잡히지 않음)
 */
function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ph = usePostHog();

  useEffect(() => {
    if (!pathname || !ph || !isPostHogEnabled()) {
      return;
    }

    let url = window.origin + pathname;
    const queryString = searchParams?.toString();
    if (queryString) {
      url += `?${queryString}`;
    }

    ph.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams, ph]);

  // /auth/* 는 OAuth 콜백·가입 플로우라 화면 녹화(세션 리플레이) 자체를 꺼서
  // 이메일 등 화면에 노출되는 정보가 리플레이로 남지 않게 한다.
  useEffect(() => {
    if (!ph || !isPostHogEnabled()) return;
    if (pathname?.startsWith("/auth")) {
      ph.stopSessionRecording();
    } else {
      ph.startSessionRecording();
    }
  }, [pathname, ph]);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const authHydrated = useAuthHasHydrated();
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    initPostHog();
  }, []);

  // 로그인한 회원을 사람 하나로 묶고, 로그아웃하면 끊는다(초기화 다음에 돈다)
  useEffect(() => {
    if (!authHydrated) return;
    syncPostHogUser(accessToken);
  }, [authHydrated, accessToken]);

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </PHProvider>
  );
}
