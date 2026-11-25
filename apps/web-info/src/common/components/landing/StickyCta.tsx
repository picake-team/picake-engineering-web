"use client";

import { useEffect, useState } from "react";
import { LINE, PANEL } from "@/apps/web-info/common/components/landing/landing.styles";

interface StickyCtaProps {
  label: string;
  href: string;
  external?: boolean;
  /** 주 버튼 옆 보조 버튼(사장님 쪽 "앱 받기"). 연한 회색 바탕, 주 버튼보다 좁게 */
  secondary?: { label: string; href: string; external?: boolean };
  /** 이 요소들이 화면에 보이는 동안에는 숨긴다(같은 버튼이 두 개 보이지 않게) */
  watchIds: string[];
}

/**
 * 휴대폰 아래에 붙는 주 버튼(사장님 쪽 "입점 신청하기" + "앱 받기", 손님 쪽 "앱 받기").
 * 2026-11-25부터 휴대폰 첫 화면에는 버튼을 두지 않고(운영자) 이 버튼만 쓴다 — 첫 화면 버튼은 PC에만 있어 휴대폰에서는 처음부터 보인다.
 * `watchIds`(마무리 칸·맨 아래 등)가 화면에 보이는 동안은 숨긴다(같은 버튼이 두 개 보이지 않게, 맨 아래 글을 가리지 않게).
 * PC(md)는 위쪽 줄에 주 버튼이 늘 있어 쓰지 않는다. 문서 전체가 스크롤되므로 fixed로 붙인다.
 * 모양은 흰 띠 + 위 얇은 선(운영자 2026-11-25 B안 — 바탕 없이 버튼만 띄우면 흰 "앱 받기"가 흐리고 버튼 사이로 뒤 글이 비쳤다).
 * 띠가 보일 때만 누를 수 있다(숨었을 때 뒤 화면을 누를 수 있게).
 */
export function StickyCta({ label, href, external, secondary, watchIds }: StickyCtaProps) {
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
      className={`fixed inset-x-0 bottom-0 z-30 border-t ${LINE} bg-white px-5 pt-3 pb-[calc(14px+env(safe-area-inset-bottom))] transition-[opacity,transform] duration-medium ease-enter motion-reduce:transition-none md:hidden ${
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0"
      }`}
    >
      <div className="flex gap-2">
        <a
          href={href}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          tabIndex={show ? 0 : -1}
          aria-hidden={!show}
          className="flex h-[54px] min-w-0 flex-[1.6] items-center justify-center rounded-xl bg-primary text-[17px] font-bold text-white transition-transform duration-fast active:scale-[0.98]"
        >
          {label}
        </a>
        {secondary && (
          <a
            href={secondary.href}
            {...(secondary.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            tabIndex={show ? 0 : -1}
            aria-hidden={!show}
            className={`flex h-[54px] min-w-0 flex-1 items-center justify-center rounded-xl ${PANEL} text-[17px] font-bold text-gray-900 transition-transform duration-fast active:scale-[0.98]`}
          >
            {secondary.label}
          </a>
        )}
      </div>
    </div>
  );
}
