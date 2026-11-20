"use client";

import { useEffect, useState } from "react";

interface StickyCtaProps {
  label: string;
  href: string;
  external?: boolean;
  /** 이 요소들이 화면에 보이는 동안에는 숨긴다(같은 버튼이 두 개 보이지 않게) */
  watchIds: string[];
}

/**
 * 휴대폰에서 첫 화면 버튼이 화면 밖으로 나가면 아래에 붙는 주 버튼(사장님 쪽 "입점 신청하기", 손님 쪽 "앱 받기").
 * PC(md)는 위쪽 줄에 주 버튼이 늘 있어 쓰지 않는다. 문서 전체가 스크롤되므로 fixed로 붙인다.
 * 페이지에 사진·밝은 바탕·어두운 칸이 섞여 있어 바탕 띠 없이 버튼만 띄운다.
 */
export function StickyCta({ label, href, external, watchIds }: StickyCtaProps) {
  const [show, setShow] = useState(false);
  const key = watchIds.join("|");

  useEffect(() => {
    const targets = key
      .split("|")
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (targets.length === 0) return;

    const visible = new Set<Element>();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)));
      setShow(visible.size === 0);
    });
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [key]);

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 bottom-0 z-30 px-5 pt-4 pb-[calc(16px+env(safe-area-inset-bottom))] transition-[opacity,transform] duration-medium ease-enter motion-reduce:transition-none md:hidden ${
        show ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
      }`}
    >
      <a
        href={href}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        tabIndex={show ? 0 : -1}
        aria-hidden={!show}
        className={`flex h-[54px] w-full items-center justify-center rounded-xl bg-primary text-[17px] font-bold text-white shadow-[0_12px_28px_-12px_rgba(27,21,18,0.6)] transition-transform duration-fast active:scale-[0.98] ${
          show ? "pointer-events-auto" : ""
        }`}
      >
        {label}
      </a>
    </div>
  );
}
