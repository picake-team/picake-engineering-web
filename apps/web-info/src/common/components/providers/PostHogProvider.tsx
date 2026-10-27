"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import { initPostHog, isPostHogEnabled } from "@/apps/web-info/common/config/posthog.config";

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

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initPostHog();
  }, []);

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </PHProvider>
  );
}
