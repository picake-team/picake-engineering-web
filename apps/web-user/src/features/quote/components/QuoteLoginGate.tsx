"use client";

import type { ReactNode } from "react";
import { Button } from "@/apps/web-user/common/components/buttons/Button";
import { useAuthHasHydrated, useAuthStore } from "@/apps/web-user/common/store/auth.store";
import { useLoginSheetStore } from "@/apps/web-user/common/store/login-sheet.store";

/**
 * 견적 요청은 내 것만 보이므로 로그인이 필요하다.
 * 알림톡·북마크로 로그인 전에 들어와도 "찾을 수 없어요" 대신 로그인으로 안내한다.
 */
export function QuoteLoginGate({
  children,
  fallbackHeader,
}: {
  children: ReactNode;
  fallbackHeader?: ReactNode;
}) {
  const hydrated = useAuthHasHydrated();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const openLoginSheet = useLoginSheetStore((s) => s.openLoginSheet);

  if (!hydrated) return null;
  if (isAuthenticated) return <>{children}</>;
  return (
    <div>
      {fallbackHeader}
      <div className="flex flex-col items-center gap-[16px] px-[20px] py-[60px]">
        <p className="text-center text-sm text-gray-700">로그인하면 내 견적 요청을 볼 수 있어요</p>
        <Button size="md" className="px-[20px]" onClick={() => openLoginSheet("quote_request")}>
          로그인 / 회원가입
        </Button>
      </div>
    </div>
  );
}
