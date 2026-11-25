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
  /**
   * 바탕 색. `dark`(기본, 손님 소개): PC는 어두운 사진 위 흰 글자. `light`(사장님 소개, 운영자 2026-11-25 A안):
   * 사장님 앱 스토어 그림 1·2장과 같은 밝은 베이지 바탕 — 휴대폰은 사진 아래가 베이지로 이어지고,
   * PC는 왼쪽 베이지에 진한 글자, 오른쪽에 사진이 번져 들어온다.
   */
  tone?: "dark" | "light";
  children: ReactNode;
}

/** 글자 색. 휴대폰은 늘 흰·베이지 바탕이라 진한 글자, PC만 바탕에 따라 바뀐다(`--hero-fg`·`--hero-fg-muted`) */
const TONE_VARS: Record<"dark" | "light", Record<string, string>> = {
  dark: { "--hero-fg": "#fff", "--hero-fg-muted": "rgba(255,255,255,0.8)" },
  light: { "--hero-fg": "#2A1D18", "--hero-fg-muted": "rgba(42,29,24,0.75)" },
};

/**
 * 첫 화면.
 * - PC: 화면 가득한 어두운 케이크 사진 위에 흰 글자(운영자 2026-11-20 시안 F, 위쪽 줄·나머지 바탕은 밝게).
 * - 휴대폰: 밝은 케이크 사진 아래 흰 바탕에 진한 글자(운영자 2026-11-21 B안 — 11-17 첫 화면과 같은 모양). 첫 화면에 버튼이 없고
 *   (아래 고정 `StickyCta`만, 2026-11-25) 사진이 아래 고정 줄 바로 위까지 남는 높이를 다 채운다(운영자 "첫 화면 이미지는 가득").
 *   높이 = 보이는 화면(svh) − 위쪽 줄 57px − 아래 고정 줄 81px(+아이폰 아래 여백). 위쪽 줄·`StickyCta` 높이를 바꾸면 같이 고친다.
 * 사장님·손님 소개가 같은 모양을 쓴다(2026-11-25 두 페이지를 맞춤 — 머리말 숨김·형광펜·버튼 넓이도 같음).
 * 두 사진은 `<picture>`로 폭에 맞는 한 장만 받는다(next/image 두 장을 숨기면 둘 다 받는다).
 * 사진은 첫 화면의 가장 큰 그림(LCP)이라 먼저 받는다.
 */
export function PhotoHero({ photo, position, phone, tone = "dark", children }: PhotoHeroProps) {
  const light = tone === "light";
  const common = { alt: "", fill: true, priority: true, fetchPriority: "high" as const };
  // 밝은 바탕은 PC 사진이 오른쪽 54~56%만 차지해 그만큼만 받는다(1440 폭 2배 화면에서 약 1600px)
  const { props: pc } = getImageProps({ ...common, src: photo, sizes: light ? "56vw" : "100vw" });
  const { props: phoneImg } = getImageProps({ ...common, src: phone.photo, sizes: "100vw" });

  return (
    <section
      id="top"
      className={`relative isolate flex flex-col max-md:min-h-[calc(100svh-138px-env(safe-area-inset-bottom))] md:h-[calc(100svh-72px)] md:max-h-[860px] md:min-h-[600px] md:flex-row md:overflow-hidden ${
        light
          ? "bg-[#EFE8DC] md:bg-[linear-gradient(90deg,#E6E0D3_0%,#EFE8DC_100%)]"
          : "bg-white md:bg-[#1B1512]"
      }`}
      // 밝은 베이지 #EFE8DC는 사장님 앱 스토어 그림 1·2장(F7a, hq marketing/banners/2026-11-mk14)과 같은 값
      style={
        {
          "--hero-pos-phone": phone.position,
          "--hero-pos-pc": position,
          ...TONE_VARS[tone],
        } as CSSProperties
      }
    >
      {/* 휴대폰 사진 칸은 글 칸을 뺀 남는 높이 전부(아주 낮은 화면에서도 220px은 남김).
          PC는 어두운 바탕이면 화면 전체, 밝은 바탕이면 오른쪽(왼쪽 끝은 바탕으로 번지게) */}
      <div
        className={`relative -z-10 min-h-[220px] w-full flex-1 overflow-hidden md:absolute md:inset-y-0 md:right-0 md:h-full md:w-auto ${
          light
            ? "bg-[#EFE8DC] md:left-[46%] md:[-webkit-mask-image:linear-gradient(90deg,transparent_0%,#000_26%)] md:[mask-image:linear-gradient(90deg,transparent_0%,#000_26%)] lg:left-[44%]"
            : "bg-gray-50 md:left-0"
        }`}
      >
        <picture>
          <source media="(min-width: 768px)" srcSet={pc.srcSet} sizes={pc.sizes} />
          <img
            {...phoneImg}
            className="object-cover [object-position:var(--hero-pos-phone)] md:[object-position:var(--hero-pos-pc)]"
          />
        </picture>
        {/* 휴대폰: 사진 아래쪽을 바탕(흰색·베이지)으로 이어 사진과 글 사이에 선이 생기지 않게 */}
        <div
          aria-hidden
          className={`absolute inset-x-0 bottom-0 h-20 md:hidden ${
            light
              ? "bg-[linear-gradient(to_top,#EFE8DC,rgba(239,232,220,0))]"
              : "bg-[linear-gradient(to_top,#fff,rgba(255,255,255,0))]"
          }`}
        />
      </div>
      {/* PC 어두운 바탕: 왼쪽 글 자리에 어두운 막 */}
      {!light && (
        <div
          aria-hidden
          className="absolute inset-0 -z-10 hidden bg-[linear-gradient(90deg,rgba(20,17,15,0.88)_0%,rgba(20,17,15,0.52)_42%,rgba(20,17,15,0)_72%)] md:block"
        />
      )}
      <div
        className={`${WRAP} -mt-4 flex flex-col items-start pb-7 text-gray-900 md:mt-0 md:flex-1 md:justify-center md:pb-0 md:text-[var(--hero-fg)]`}
      >
        {children}
      </div>
    </section>
  );
}

/** 첫 화면의 흐린 글자(제목 아래 작은 줄): 휴대폰은 회색, PC는 바탕에 맞춰(`PhotoHero` tone) */
const HERO_MUTED_TEXT = "text-gray-600 md:text-[var(--hero-fg-muted)]";

/** 첫 화면 작은 줄 안의 굵은 낱말(0원 등): 휴대폰은 진한 글자, PC는 바탕에 맞춰 */
export const HERO_STRONG = "font-extrabold text-gray-900 md:text-[var(--hero-fg)]";

/**
 * 첫 화면 형광펜(운영자 2026-11-25). 제목의 강조 낱말(`<em>`)과 작은 글의 0원(`<b>`)에 쓴다.
 * - 휴대폰(흰 바탕·진한 글자): 글자 아래쪽에 메인 주황(#FF653E)을 옅게 — 흰 바탕에서는 분홍빛으로 보인다(D안).
 * - PC: 진한 주황 띠를 살짝 기울여(H5안). 옅게 깔면 어두운 사진 위에서 갈색으로 보여 진하게 했다(밝은 바탕에서도 같은 띠에 진한 글자).
 * `HeroTitle`의 `[&_em]:` 이름에도 같은 값을 따로 적는다(tailwind는 글자 그대로 적힌 이름만 만든다).
 */
export const HERO_MARKER =
  "max-md:bg-[linear-gradient(transparent_56%,rgba(255,101,62,0.38)_56%)] max-md:px-0.5 md:bg-[linear-gradient(-4deg,transparent_40%,#FF653E_40%,#FF653E_84%,transparent_84%)] md:px-1";

/**
 * 첫 화면 제목. 머리말도 h1 안에 둔다(검색엔진이 읽는 제목에 "주문제작 케이크"가 들어간다).
 * 머리말은 화면에서만 숨기고(검색·화면 읽기에는 남음, 운영자 2026-11-25 "글 덩어리를 줄여 한눈에"),
 * 강조 낱말(`<em>`)은 주황 글자 대신 형광펜(`HERO_MARKER`와 같은 모양).
 */
export function HeroTitle({ eyebrow, children }: { eyebrow: string; children: ReactNode }) {
  return (
    <h1>
      <span className="sr-only">{eyebrow}</span>
      {/* HERO_MARKER와 같은 값(tailwind는 글자 그대로 적힌 이름만 만든다) */}
      <span className="block text-[clamp(30px,8.8vw,36px)] leading-[1.3] font-extrabold tracking-[-0.04em] text-balance md:text-[52px] md:leading-[1.24] lg:text-[60px] [&_em]:text-inherit [&_em]:not-italic max-md:[&_em]:bg-[linear-gradient(transparent_56%,rgba(255,101,62,0.38)_56%)] max-md:[&_em]:px-0.5 md:[&_em]:bg-[linear-gradient(-4deg,transparent_40%,#FF653E_40%,#FF653E_84%,transparent_84%)] md:[&_em]:px-1">
        {children}
      </span>
    </h1>
  );
}

export function HeroLead({ children }: { children: ReactNode }) {
  return (
    // text-balance: 작은 휴대폰(320)에서 "한 / 곳에서"처럼 낱말 하나만 다음 줄로 떨어지지 않게
    <p
      className={`mt-3 text-base leading-[1.6] text-balance md:mt-4 md:text-[19px] ${HERO_MUTED_TEXT}`}
    >
      {children}
    </p>
  );
}
