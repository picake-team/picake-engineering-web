import { getImageProps, type StaticImageData } from "next/image";
import type { CSSProperties, ReactNode } from "react";
import { WRAP } from "@/apps/web-info/common/components/landing/landing.styles";

interface PhotoHeroProps {
  /** PC 사진(어두운 바탕 사진). 왼쪽에서 오른쪽으로 어두운 막을 깔아 흰 글자가 읽힌다 */
  photo: StaticImageData;
  /** PC 사진에서 보일 곳 */
  position: string;
  /** 휴대폰 사진과 보일 곳(`phone-hero.ts`). 사진 아래 흰 바탕에 글을 둔다 */
  phone: { photo: StaticImageData; position: string };
  children: ReactNode;
}

/**
 * 첫 화면.
 * - PC: 화면 가득한 어두운 케이크 사진 위에 흰 글자(운영자 2026-11-20 시안 F, 위쪽 줄·나머지 바탕은 밝게).
 * - 휴대폰: 밝은 케이크 사진 아래 흰 바탕에 진한 글자(운영자 2026-11-21 B안 — 11-17 첫 화면과 같은 모양).
 * 두 사진은 `<picture>`로 폭에 맞는 한 장만 받는다(next/image 두 장을 숨기면 둘 다 받는다).
 * 사진은 첫 화면의 가장 큰 그림(LCP)이라 먼저 받는다.
 */
export function PhotoHero({ photo, position, phone, children }: PhotoHeroProps) {
  const common = { alt: "", fill: true, priority: true, fetchPriority: "high" as const };
  const { props: pc } = getImageProps({ ...common, src: photo, sizes: "100vw" });
  const { props: phoneImg } = getImageProps({ ...common, src: phone.photo, sizes: "100vw" });

  return (
    <section
      id="top"
      className="relative isolate flex flex-col bg-white md:h-[calc(100svh-72px)] md:max-h-[860px] md:min-h-[600px] md:flex-row md:overflow-hidden md:bg-[#1B1512]"
      style={{ "--hero-pos-phone": phone.position, "--hero-pos-pc": position } as CSSProperties}
    >
      {/* 휴대폰 사진 칸은 화면 높이의 54%까지(폭이 좁으면 9:10) — 아이폰 13(보이는 높이 664)에서도 주 버튼이 첫 화면에 보이게.
          11-17은 62%였는데 그때보다 제목이 커서 버튼이 밀렸다. 보이는 높이가 620 이하인 작은 휴대폰(아이폰 SE 등)은 44%. PC는 화면 전체 */}
      <div className="relative -z-10 h-[min(112vw,54svh)] w-full max-md:[@media(max-height:620px)]:h-[44svh] overflow-hidden bg-gray-50 md:absolute md:inset-0 md:h-full">
        <picture>
          <source media="(min-width: 768px)" srcSet={pc.srcSet} sizes={pc.sizes} />
          <img
            {...phoneImg}
            className="object-cover [object-position:var(--hero-pos-phone)] md:[object-position:var(--hero-pos-pc)]"
          />
        </picture>
        {/* 휴대폰: 사진 아래쪽을 흰 바탕으로 이어 사진과 글 사이에 선이 생기지 않게 */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-20 bg-[linear-gradient(to_top,#fff,rgba(255,255,255,0))] md:hidden"
        />
      </div>
      {/* PC: 왼쪽 글 자리에 어두운 막 */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 hidden bg-[linear-gradient(90deg,rgba(20,17,15,0.88)_0%,rgba(20,17,15,0.52)_42%,rgba(20,17,15,0)_72%)] md:block"
      />
      <div
        className={`${WRAP} -mt-4 flex flex-col items-start pb-10 text-gray-900 md:mt-0 md:flex-1 md:justify-center md:pb-0 md:text-white`}
      >
        {children}
      </div>
    </section>
  );
}

/** 첫 화면의 흐린 글자: 휴대폰 흰 바탕에서는 회색, PC 어두운 사진 위에서는 흰색(손님 쪽 "앱 없이 웹으로 둘러보기" 등) */
export const HERO_MUTED_TEXT = "text-gray-600 md:text-white/80";

/** 첫 화면 제목. 머리말도 h1 안에 둔다(검색엔진이 읽는 제목에 "주문제작 케이크"가 들어간다) */
export function HeroTitle({ eyebrow, children }: { eyebrow: string; children: ReactNode }) {
  return (
    <h1>
      {/* 머리말: 휴대폰 흰 바탕에서는 메인 주황(11-17과 같음), PC 어두운 사진 위에서는 연한 주황 */}
      <span className="block text-[14px] font-bold text-primary md:text-base md:text-[#FFB59E]">
        {eyebrow}
      </span>
      <span className="mt-2.5 block text-[clamp(32px,9.4vw,40px)] leading-[1.24] font-extrabold tracking-[-0.04em] text-balance md:mt-3.5 md:text-[52px] lg:text-[60px] [&_em]:not-italic [&_em]:text-primary">
        {children}
      </span>
    </h1>
  );
}

export function HeroLead({ children }: { children: ReactNode }) {
  return (
    <p className={`mt-3 text-base leading-[1.6] md:mt-4 md:text-[19px] ${HERO_MUTED_TEXT}`}>
      {children}
    </p>
  );
}
