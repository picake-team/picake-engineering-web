"use client";

import Image, { type StaticImageData } from "next/image";
import { useId, useRef, useState, type KeyboardEvent } from "react";

export interface SellerScreenTab {
  label: string;
  src: StaticImageData;
  alt: string;
  caption: string;
}

/**
 * 실제 판매자 앱 화면을 탭으로 바꿔 본다(소개 페이지 "휴대폰 하나로").
 * 모든 화면을 HTML에 넣고 고르지 않은 것은 숨긴다 — 검색·AI가 그림 설명(alt)을 모두 읽게.
 * 탭은 좌우 화살표로도 옮긴다(WAI-ARIA tabs).
 */
export function SellerScreenTabs({ tabs }: { tabs: SellerScreenTab[] }) {
  const [active, setActive] = useState(0);
  const baseId = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const move = (next: number) => {
    const index = (next + tabs.length) % tabs.length;
    setActive(index);
    tabRefs.current[index]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowRight") move(active + 1);
    else if (event.key === "ArrowLeft") move(active - 1);
    else return;
    event.preventDefault();
  };

  return (
    <div>
      <div role="tablist" aria-label="판매자 앱 화면" className="flex gap-2">
        {tabs.map((tab, index) => {
          const selected = index === active;
          return (
            <button
              key={tab.label}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${index}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${index}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(index)}
              onKeyDown={onKeyDown}
              className={`h-10 flex-1 rounded-full text-[15px] font-bold transition-colors duration-150 ${
                selected
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-700 shadow-[0_0_0_1px_rgba(0,0,0,0.08)]"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      {tabs.map((tab, index) => (
        <div
          key={tab.label}
          role="tabpanel"
          id={`${baseId}-panel-${index}`}
          aria-labelledby={`${baseId}-tab-${index}`}
          hidden={index !== active}
          className="mt-5"
        >
          <div className="mx-auto max-w-[280px] overflow-hidden rounded-[20px] bg-white shadow-[0_24px_48px_-24px_rgba(27,21,18,0.55),0_0_0_1px_rgba(0,0,0,0.06)]">
            <Image src={tab.src} alt={tab.alt} sizes="280px" className="block h-auto w-full" />
          </div>
          <p className="mt-3 text-center text-[15px] leading-[1.5] text-gray-700">{tab.caption}</p>
        </div>
      ))}
    </div>
  );
}
