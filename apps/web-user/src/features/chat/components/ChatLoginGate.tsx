"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/apps/web-user/common/components/buttons/Button";
import { Icon } from "@/apps/web-user/common/components/icons";
import { PATHS } from "@/apps/web-user/common/constants/paths.constant";
import { navigateBack } from "@/apps/web-user/common/utils/navigate-back.util";
import { useAuthHasHydrated, useAuthStore } from "@/apps/web-user/common/store/auth.store";
import { useLoginSheetStore } from "@/apps/web-user/common/store/login-sheet.store";

/** 채팅은 로그인이 필요하다. 로그인 창을 닫고 돌아오면 같은 화면(방)이 그대로 열린다 */
export function ChatLoginGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const hydrated = useAuthHasHydrated();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const openLoginSheet = useLoginSheetStore((s) => s.openLoginSheet);

  if (!hydrated) return null;
  if (isAuthenticated) return <>{children}</>;
  return (
    <div>
      <header className="sticky top-0 z-10 flex h-[52px] items-center bg-white px-[16px]">
        <button
          type="button"
          aria-label="뒤로"
          onClick={() => navigateBack(router, { fallbackPath: PATHS.HOME })}
        >
          <Icon name="chevronLeft" width={24} height={24} />
        </button>
        <span className="flex-1 text-center text-sm font-bold text-gray-900">채팅</span>
        <span className="w-[24px]" />
      </header>
      <div className="flex flex-col items-center gap-[16px] px-[20px] py-[60px]">
        <p className="text-center text-sm text-gray-700">로그인하면 사장님과 채팅할 수 있어요</p>
        <Button size="md" className="px-[20px]" onClick={() => openLoginSheet("chat")}>
          로그인 / 회원가입
        </Button>
      </div>
    </div>
  );
}
