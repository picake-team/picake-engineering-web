"use client";

import { useEffect, useState } from "react";
import { SELLER_SIGNUP_URL } from "@/apps/web-info/common/constants/partner.constants";

interface StickyJoinCtaProps {
  /** 이 요소들이 화면에 보이는 동안에는 하단 버튼을 숨긴다(같은 버튼이 두 개 보이지 않게) */
  watchIds: string[];
}

/**
 * 첫 화면 버튼이 화면 밖으로 나가면 아래에 붙는 "입점 신청하기".
 * 페이지에 사진·밝은 바탕·어두운 칸이 섞여 있어 바탕 띠(그라데이션) 없이 버튼만 띄운다.
 */
export function StickyJoinCta({ watchIds }: StickyJoinCtaProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const targets = watchIds
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
  }, [watchIds]);

  // fixed 대신 sticky를 쓴다. 페이지는 #root-scroll-container 안에서 스크롤되는데,
  // fixed 요소 위에서 터치로 드래그하면 스크롤이 그 컨테이너로 전달되지 않아 버튼 위에서 스크롤이 멈춘다.
  // 바깥 박스는 같은 높이만큼 음수 margin을 줘서 레이아웃 자리를 차지하지 않고,
  // overflow-hidden으로 숨김 상태(아래로 밀린 버튼)가 스크롤 길이를 늘리지 않게 한다.
  return (
    <div className="pointer-events-none sticky bottom-0 z-40 -mt-[calc(86px+env(safe-area-inset-bottom))] h-[calc(86px+env(safe-area-inset-bottom))] overflow-hidden">
      <div
        className={`px-5 pt-4 pb-[calc(16px+env(safe-area-inset-bottom))] transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          show ? "pointer-events-auto translate-y-0 opacity-100" : "translate-y-full opacity-0"
        }`}
      >
        <a
          href={SELLER_SIGNUP_URL}
          tabIndex={show ? 0 : -1}
          aria-hidden={!show}
          className="flex h-[54px] w-full items-center justify-center rounded-xl bg-primary text-[17px] font-bold text-white shadow-[0_12px_28px_-12px_rgba(27,21,18,0.6)] transition-transform duration-150 active:scale-[0.98]"
        >
          입점 신청하기
        </a>
      </div>
    </div>
  );
}
