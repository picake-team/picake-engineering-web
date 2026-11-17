import type { ReactNode } from "react";
import { cn } from "@/apps/web-seller/common/utils/classname.util";

interface AuthCardLayoutProps {
  children: ReactNode;
  className?: string;
  /** 카드 위 브랜딩(로고 등). 로그인 등에서만 사용 */
  aboveCard?: ReactNode;
  /** 카드 아래 작은 글(PC 로그인의 운영사 정보) */
  belowCard?: ReactNode;
}

/** 로그인·계정 찾기 등 비로그인 인증 화면 공통 래퍼 */
export function AuthCardLayout({ children, className, aboveCard, belowCard }: AuthCardLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-100 px-4 py-10 sm:px-5 sm:py-12">
      <div
        className={cn(
          "flex w-full max-w-[420px] flex-col items-stretch",
          aboveCard ? "gap-8 sm:gap-9" : "",
        )}
      >
        {aboveCard ? (
          <div className="flex w-full flex-col items-center text-center">{aboveCard}</div>
        ) : null}
        <div
          className={cn(
            "w-full rounded-2xl border border-zinc-200/90 bg-white p-8 shadow-[0_1px_3px_rgba(15,23,42,0.06),0_12px_40px_-12px_rgba(15,23,42,0.12)] sm:p-10",
            className,
          )}
        >
          {children}
        </div>
        {belowCard ? <div className="mt-6 w-full">{belowCard}</div> : null}
      </div>
    </div>
  );
}
