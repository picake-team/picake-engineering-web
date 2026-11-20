import Image, { type StaticImageData } from "next/image";
import type { CSSProperties, ReactNode } from "react";
import { WRAP } from "@/apps/web-info/common/components/landing/landing.styles";

interface PhotoHeroProps {
  photo: StaticImageData;
  /** 사진에서 보일 곳. 휴대폰은 세로로 길게, PC는 가로로 넓게 잘린다 */
  position: { phone: string; pc: string };
  /**
   * 사진을 받을 크기(next/image sizes). 휴대폰은 사진 칸이 세로로 길어 가로 사진은 화면보다 넓게 그려진다
   * (손님 쪽 3:2 사진은 390폭 휴대폰에서 약 800px). 기본은 화면 폭
   */
  sizes?: string;
  children: ReactNode;
}

/**
 * 첫 화면: 화면 가득한 케이크 사진 위에 흰 글자(운영자 2026-11-20 시안 F, 위쪽 줄·나머지 바탕은 밝게).
 * 휴대폰은 아래에서 위로, PC는 왼쪽에서 오른쪽으로 어두운 막을 깔아 글자가 읽힌다(사진은 어두운 바탕 사진만 쓴다).
 * 사진은 첫 화면의 가장 큰 그림(LCP)이라 먼저 받는다.
 */
export function PhotoHero({ photo, position, sizes = "100vw", children }: PhotoHeroProps) {
  return (
    <section
      id="top"
      className="relative isolate flex h-[calc(100svh-56px)] max-h-[820px] min-h-[540px] overflow-hidden bg-[#1B1512] md:h-[calc(100svh-72px)] md:max-h-[860px] md:min-h-[600px]"
      style={{ "--hero-pos-phone": position.phone, "--hero-pos-pc": position.pc } as CSSProperties}
    >
      {/* 휴대폰은 사진을 위쪽 2/3에 두고 아래 글 자리는 어두운 바탕으로 이어 케이크가 글에 가리지 않게, PC는 화면 전체 */}
      <div className="absolute inset-x-0 top-0 -z-10 h-[68%] md:inset-0 md:h-full">
        <Image
          src={photo}
          alt=""
          fill
          priority
          // priority만으로는 fetchpriority가 붙지 않았다(Lighthouse 2026-11-14)
          fetchPriority="high"
          sizes={sizes}
          className="object-cover [object-position:var(--hero-pos-phone)] md:[object-position:var(--hero-pos-pc)]"
        />
      </div>
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_top,#1B1512_32%,rgba(27,21,18,0.78)_46%,rgba(27,21,18,0)_68%)] md:bg-[linear-gradient(90deg,rgba(20,17,15,0.88)_0%,rgba(20,17,15,0.52)_42%,rgba(20,17,15,0)_72%)]"
      />
      <div
        className={`${WRAP} flex flex-col items-start justify-end pb-12 text-white md:justify-center md:pb-0`}
      >
        {children}
      </div>
    </section>
  );
}

/** 첫 화면 제목. 머리말도 h1 안에 둔다(검색엔진이 읽는 제목에 "주문제작 케이크"가 들어간다) */
export function HeroTitle({ eyebrow, children }: { eyebrow: string; children: ReactNode }) {
  return (
    <h1>
      <span className="block text-[14px] font-bold text-[#FFB59E] md:text-base">{eyebrow}</span>
      <span className="mt-2.5 block text-[clamp(32px,9.4vw,40px)] leading-[1.24] font-extrabold tracking-[-0.04em] text-balance md:mt-3.5 md:text-[52px] lg:text-[60px] [&_em]:not-italic [&_em]:text-primary">
        {children}
      </span>
    </h1>
  );
}

export function HeroLead({ children }: { children: ReactNode }) {
  return (
    <p className="mt-3 text-base leading-[1.6] text-white/80 md:mt-4 md:text-[19px]">{children}</p>
  );
}
