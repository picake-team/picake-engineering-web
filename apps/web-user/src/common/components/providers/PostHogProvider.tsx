"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  initPostHog,
  isReplayBlockedPath,
  syncPostHogUser,
  withPostHog,
} from "@/apps/web-user/common/config/posthog.config";
import { useAuthHasHydrated, useAuthStore } from "@/apps/web-user/common/store/auth.store";

/**
 * 라우트 변경 시 $pageview 이벤트를 수동 캡처합니다.
 * (App Router는 SPA 전환이라 자동 페이지뷰가 잡히지 않음)
 */
function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;
    let url = window.origin + pathname;
    const queryString = searchParams?.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
    withPostHog((ph) => ph.capture("$pageview", { $current_url: url }));
  }, [pathname, searchParams]);

  // 로그인·가입(/auth)과 사장님 견적 링크(/q)는 화면 녹화(세션 리플레이)를 끈다.
  // startSessionRecording()은 처음 설정(disable_session_recording)을 덮어쓰므로 화면마다 다시 판단한다.
  useEffect(() => {
    const blocked = isReplayBlockedPath(pathname);
    withPostHog((ph) => {
      if (blocked) {
        ph.stopSessionRecording();
      } else {
        ph.startSessionRecording();
      }
    });
  }, [pathname]);

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
    <>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </>
  );
}
