"use client";

import { useEffect, useState } from "react";
import LogoPicake from "@/apps/web-info/common/assets/logo-picake.svg";
import { WRAP } from "@/apps/web-info/common/components/landing/landing.styles";

export interface HeaderLink {
  label: string;
  href: string;
  /** 다른 사이트로 나가는 링크(새 탭) */
  external?: boolean;
  /** 페이지의 다른 부품이 이 링크 누름을 알아야 할 때(손님 쪽 "앱 받기" → 첫 화면 QR 열기) */
  id?: string;
}

interface SiteHeaderProps {
  /** 로고 옆 작은 글자(사장님 쪽 "사장님") */
  brandSuffix?: string;
  /** 페이지 안 칸 이동(`#quote` 등). 넓은 PC(lg)에서만 보이고, 지금 보는 칸에 주황 밑줄 */
  menu: HeaderLink[];
  /** 오른쪽 작은 링크(손님 쪽 "사장님이세요?", 사장님 쪽 "카카오톡 문의"). 휴대폰에서도 보인다 */
  secondary: HeaderLink;
  /** 주 버튼. PC(md)부터 위쪽 줄에 늘 보이고, 휴대폰은 아래 따라오는 버튼(StickyCta)이 대신한다 */
  cta: HeaderLink;
}

/**
 * 소개 페이지 위쪽 줄(2026-11-20). 휴대폰 56px: 로고 · 오른쪽 작은 링크. PC 72px: 로고 · 칸 이동 메뉴(lg) · 작은 링크 · 주 버튼.
 * 내려도 위에 남는다(sticky). 칸 이동 때 가리지 않게 globals.css의 scroll-padding-top이 이 높이보다 8px 크다.
 */
export function SiteHeader({ brandSuffix, menu, secondary, cta }: SiteHeaderProps) {
  const active = useActiveSection(menu.map((m) => m.href));

  return (
    <header className="sticky top-0 z-40 border-b border-[#EFEDE9] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90">
      <div className={`${WRAP} flex h-14 items-center justify-between gap-4 md:h-[72px]`}>
        {/* 로고는 페이지 맨 위로 간다(소개 페이지에서 손님 화면으로 바로 나가지 않게) */}
        <a
          href="#top"
          className="flex shrink-0 items-center gap-1.5 rounded-md text-[18px] font-extrabold tracking-[-0.03em] text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 md:gap-2 md:text-[20px]"
        >
          <LogoPicake aria-hidden className="size-7 md:size-[34px]" />
          픽케이크
          {brandSuffix && (
            <span className="text-[14px] font-semibold text-gray-600 md:text-[15px]">
              {brandSuffix}
            </span>
          )}
        </a>

        <nav aria-label="페이지 안 바로가기" className="hidden lg:block">
          <ul className="flex items-center gap-7">
            {menu.map((m) => {
              const on = active === m.href;
              return (
                <li key={m.href}>
                  <a
                    href={m.href}
                    aria-current={on ? "location" : undefined}
                    className={`rounded-md py-2 text-base font-semibold underline-offset-[10px] transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:outline-gray-900 ${
                      on
                        ? "text-primary underline decoration-2"
                        : "text-gray-800 hover:text-gray-900"
                    }`}
                  >
                    {m.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex shrink-0 items-center gap-3 md:gap-4">
          <a
            href={secondary.href}
            {...(secondary.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="rounded-full border border-[#E3DED6] px-3 py-1.5 text-[13px] font-semibold text-gray-800 transition-colors duration-fast hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gray-900 md:px-4 md:py-2 md:text-[15px]"
          >
            {secondary.label}
          </a>
          <a
            id={cta.id}
            href={cta.href}
            {...(cta.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            // 주황 바탕 + 흰 글자(운영자 2026-11-17 결정, 대비 2.9:1을 알리고 정함)
            className="hidden h-11 items-center rounded-full bg-primary px-5 text-base font-bold text-white transition-transform duration-fast active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 md:inline-flex"
          >
            {cta.label}
          </a>
        </div>
      </div>
    </header>
  );
}

/** 화면 가운데쯤 걸친 칸을 지금 보는 칸으로 본다. 맨 위(첫 화면)에서는 아무것도 고르지 않는다 */
function useActiveSection(hrefs: string[]) {
  const [active, setActive] = useState<string | null>(null);
  const key = hrefs.join("|");

  useEffect(() => {
    const targets = key
      .split("|")
      .map((href) => document.getElementById(href.replace(/^#/, "")))
      .filter((el): el is HTMLElement => el !== null);
    if (targets.length === 0) return;

    const visible = new Map<string, boolean>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => visible.set(`#${e.target.id}`, e.isIntersecting));
        // 문서 순서대로 처음 보이는 칸
        const first = targets.find((t) => visible.get(`#${t.id}`));
        setActive(first ? `#${first.id}` : null);
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, [key]);

  return active;
}
