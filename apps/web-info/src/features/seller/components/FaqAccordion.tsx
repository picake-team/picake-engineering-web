"use client";

import { useState } from "react";
import { Icon } from "@/apps/web-info/common/components/icons";

interface FaqAccordionProps {
  items: { q: string; a: string }[];
}

/** 한 번에 하나만 펼쳐지는 FAQ. 높이는 grid-rows 0fr↔1fr 전환으로 측정 없이 애니메이션한다 */
export function FaqAccordion({ items }: FaqAccordionProps) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <ul className="divide-y divide-gray-200 border-y border-gray-200">
      {items.map((item, i) => {
        const expanded = open === i;
        return (
          <li key={item.q}>
            <button
              type="button"
              aria-expanded={expanded}
              onClick={() => setOpen(expanded ? null : i)}
              className="flex w-full items-center gap-2 py-5 text-left"
            >
              {/* 주황을 면으로 쓰고 글자를 먹색으로 얹는다. 흰 배경 위 주황 글자는 대비가 모자란다 */}
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary font-mono text-2xs font-extrabold text-gray-900">
                Q
              </span>
              <span className="flex-1 text-base font-bold text-gray-900">{item.q}</span>
              <Icon
                name="selectArrow"
                width={20}
                height={20}
                className={`shrink-0 text-gray-600 transition-transform duration-300 ${
                  // 아이콘 원본이 위쪽(^)이라 닫힘 상태에서 뒤집어 아래쪽으로 보이게 한다
                  expanded ? "" : "rotate-180"
                }`}
              />
            </button>
            <div
              className={`grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <p className="overflow-hidden pl-[28px] text-sm leading-6 text-gray-700">
                <span className="block pb-5">{item.a}</span>
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
