"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { FadeInImage } from "@/apps/web-user/common/components/motion/FadeInImage";
import { trackEvent } from "@/apps/web-user/common/utils/analytics.util";
import {
  designDetailHref,
  designImageSrc,
  designQuoteHref,
  getDesign,
} from "@/apps/web-user/features/design/utils/design.util";

/**
 * 홈 "케이크 디자인" 매거진 칸(기획 I-112 ①): 세로로 큰 사진 카드를 넘긴다.
 * 카드는 디자인 상세로, 아래 흰 칸은 바로 견적 요청서로 간다.
 */
export function DesignMagazineSection({ designIds }: { designIds: string[] }) {
  // 시즌(크리스마스 12월 25일까지)은 서버에서 정해 넘긴다(서버 그림과 휴대폰 그림이 어긋나지 않게)
  const designs = useMemo(
    () => designIds.map((id) => getDesign(id)).filter((d) => d !== null),
    [designIds],
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);

  // 화면에 처음 보일 때 한 번
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          trackEvent("view_design_magazine");
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    if (!card) return;
    const step = card.offsetWidth + 12;
    setActive(Math.min(designs.length - 1, Math.max(0, Math.round(el.scrollLeft / step))));
  };

  if (designs.length === 0) return null;

  return (
    <section ref={sectionRef} className="pb-[4px] pt-[28px]">
      <div className="flex items-center justify-between px-5">
        <h2 className="text-xl font-bold text-gray-900">케이크 디자인</h2>
        <Link href="/search?tab=design" className="text-sm text-gray-500">
          더 보기 ›
        </Link>
      </div>
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="scrollbar-hide mt-[16px] flex snap-x snap-mandatory gap-[12px] overflow-x-auto px-[14vw] pb-[10px] pt-[4px] sm:px-5"
      >
        {designs.map((d, i) => (
          <div
            key={d.id}
            className="relative aspect-[5/7] w-[72vw] max-w-[300px] shrink-0 snap-center overflow-hidden rounded-2xl bg-gray-50 shadow-[0_6px_18px_rgba(0,0,0,0.12)] sm:snap-start"
          >
            <Link href={designDetailHref(d.id, "home")} className="absolute inset-0">
              <FadeInImage
                src={designImageSrc(d.image.file)}
                alt={d.name}
                fill
                priority={i === 0}
                sizes="300px"
                className="object-cover"
              />
              <span className="absolute inset-0 bg-black/25" />
              <span className="absolute right-[12px] top-[12px] rounded-full bg-white/85 px-[8px] py-[3px] text-2xs font-semibold text-gray-900">
                참고 사진
              </span>
              <span className="absolute left-[20px] right-[64px] top-[22px] text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.35)]">
                <span className="block whitespace-pre-line text-2xl font-bold leading-[1.3]">
                  {d.magazine?.title}
                </span>
                <span className="mt-[8px] block text-sm">{d.magazine?.subtitle}</span>
              </span>
            </Link>
            <Link
              href={designQuoteHref([d.id])}
              onClick={() =>
                trackEvent("request_design_quote", { design_id: d.id, entry_point: "home" })
              }
              className="press absolute inset-x-[12px] bottom-[12px] flex items-center gap-[8px] rounded-xl bg-white px-[14px] py-[11px]"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-gray-900">
                  이 디자인으로 견적 받기
                </span>
                <span className="mt-[2px] block truncate text-xs text-gray-500">
                  <span aria-hidden className="text-primary">
                    ✦
                  </span>{" "}
                  사진만 고르면 요청서가 채워져요
                </span>
              </span>
              <span className="text-gray-400">›</span>
            </Link>
          </div>
        ))}
      </div>
      <div className="mt-[10px] flex justify-center gap-[7px]" aria-hidden>
        {designs.map((d, i) => (
          <span
            key={d.id}
            className={`h-[7px] w-[7px] rounded-full ${i === active ? "bg-primary" : "bg-gray-200"}`}
          />
        ))}
      </div>
    </section>
  );
}
