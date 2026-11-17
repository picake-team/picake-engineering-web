import type { ReactNode } from "react";
import { AuthCardLayout } from "@/apps/web-seller/common/components/layouts/AuthCardLayout";
import { SellerAppLogo } from "@/apps/web-seller/common/components/branding/SellerAppLogo";

interface AuthBrandedCardProps {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /** 카드 아래 작은 글(PC 로그인의 운영사 정보) */
  belowCard?: ReactNode;
}

/** 로그인·계정 찾기·OAuth 가입 등 인증 플로우 공통 카드(로고 + 헤더 + 본문 + 푸터) */
export function AuthBrandedCard({
  title,
  description,
  children,
  footer,
  belowCard,
}: AuthBrandedCardProps) {
  const hasDescription = description != null && description !== "";

  return (
    <AuthCardLayout className="overflow-hidden p-0 sm:p-0" belowCard={belowCard}>
      <div className="flex flex-col">
        <header className="border-b border-zinc-100 bg-zinc-50/80 px-8 pb-8 pt-9 sm:px-10 sm:pb-9 sm:pt-10">
          <div className="mx-auto flex max-w-[280px] flex-col items-center text-center">
            <SellerAppLogo width={152} className="select-none" />
            <h1 className="mt-5 text-[1.125rem] font-semibold leading-snug tracking-tight text-zinc-900 sm:text-xl">
              {title}
            </h1>
            {hasDescription ? (
              <div className="mt-2 max-w-[280px] text-[13px] leading-relaxed text-zinc-500 sm:text-sm">
                {description}
              </div>
            ) : null}
          </div>
        </header>

        <div className="px-8 py-8 sm:px-10 sm:py-9">{children}</div>

        {footer ? (
          <footer className="border-t border-zinc-100 bg-zinc-50/60 px-8 py-4 sm:px-10">
            {footer}
          </footer>
        ) : null}
      </div>
    </AuthCardLayout>
  );
}
