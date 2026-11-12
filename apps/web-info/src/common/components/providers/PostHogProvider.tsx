"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { initPostHog, withPostHog } from "@/apps/web-info/common/config/posthog.config";

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

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initPostHog();
  }, []);

  return (
    <>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </>
  );
}
