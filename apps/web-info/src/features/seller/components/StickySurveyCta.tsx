"use client";

import { useEffect, useState } from "react";
import { PARTNER_SURVEY_URL } from "@/apps/web-info/common/constants/partner.constants";

interface StickySurveyCtaProps {
  /** 이 요소가 화면에 보이는 동안에는 하단 버튼을 숨긴다(같은 버튼이 두 개 보이지 않게) */
  watchIds: string[];
}

/**
 * 히어로 CTA가 화면 밖으로 나가면 하단에 고정되는 설문 버튼.
 * 그라데이션은 페이지 배경과 같은 흰색 기준이다. 배경색이 바뀌면 여기도 같이 바꿔야
 * 어두운 섹션 위에 흰 띠로 떠 보이는 일이 생기지 않는다.
 */
export function StickySurveyCta({ watchIds }: StickySurveyCtaProps) {
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
    <div className="pointer-events-none sticky bottom-0 z-40 -mt-[calc(98px+env(safe-area-inset-bottom))] h-[calc(98px+env(safe-area-inset-bottom))] overflow-hidden">
      <div
        className={`bg-gradient-to-t from-white via-white/95 to-white/0 px-5 pt-7 pb-[calc(16px+env(safe-area-inset-bottom))] transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          show ? "pointer-events-auto translate-y-0 opacity-100" : "translate-y-full opacity-0"
        }`}
      >
        <a
          href={PARTNER_SURVEY_URL}
          target="_blank"
          rel="noopener noreferrer"
          tabIndex={show ? 0 : -1}
          className="flex h-[54px] w-full items-center justify-center rounded-xl bg-primary text-base font-extrabold text-gray-900 shadow-[0_10px_30px_-12px_rgba(255,101,62,0.8)] transition-transform duration-150 active:scale-[0.98]"
        >
          5분 설문 참여하기
        </a>
      </div>
    </div>
  );
}
