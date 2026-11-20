import type { StaticImageData } from "next/image";
import type { ReactNode } from "react";
import { PcShot } from "@/apps/web-info/common/components/landing/Shots";
import {
  CARD_BODY,
  KICKER,
  LINE,
  PAPER,
  TITLE,
  WRAP,
} from "@/apps/web-info/common/components/landing/landing.styles";

/**
 * 사장님 소개 페이지에만 있는 칸(2026-11-20 시안 A + 더한 칸). 공용 칸은 common/components/landing.
 * 글은 한 벌이고 휴대폰은 쌓고 PC는 나란히 둔다.
 */

export interface CompareRow {
  label: string;
  /** 카톡·DM으로 받을 때 */
  before: string;
  /** 픽케이크로 받을 때 */
  after: string;
}

const BEFORE = "카톡·DM으로 받을 때";
const AFTER = "픽케이크로 받을 때";

/**
 * 카톡으로 받을 때와 비교. PC는 세 칸 표, 휴대폰은 줄마다 카드(이름 · 지금 · 픽케이크).
 * 표 역할(role)을 직접 달아 휴대폰에서 칸을 쌓아도 화면 읽기 프로그램이 표로 읽는다.
 * 카톡과 비교가 안 되는 것(손님 가입·정산·비용)은 넣지 않는다 — 카톡도 가입이 없고 계좌로 받고 무료다(2026-11-20 검토).
 */
export function CompareTable({ rows }: { rows: CompareRow[] }) {
  return (
    <div
      role="table"
      aria-label={`${BEFORE}와 ${AFTER} 비교`}
      className={`mt-8 overflow-hidden rounded-[20px] border ${LINE} md:mt-11 md:rounded-[24px]`}
    >
      <div role="rowgroup" className="hidden md:block">
        <div role="row" className="grid grid-cols-[200px_1fr_1fr] text-[15px] font-bold">
          <span role="columnheader" className="bg-[#F4F2EE] px-7 py-4">
            <span className="sr-only">무엇</span>
          </span>
          <span role="columnheader" className="bg-[#F4F2EE] px-7 py-4 text-gray-600">
            {BEFORE}
          </span>
          <span role="columnheader" className="bg-primary px-7 py-4 text-white">
            {AFTER}
          </span>
        </div>
      </div>
      <div role="rowgroup">
        {rows.map((r) => (
          <div
            key={r.label}
            role="row"
            className={`grid border-t ${LINE} first:border-t-0 md:grid-cols-[200px_1fr_1fr] md:first:border-t`}
          >
            <span
              role="rowheader"
              className="px-5 pt-4 text-[16px] font-bold text-gray-900 md:px-7 md:py-5 md:text-[17px]"
            >
              {r.label}
            </span>
            <span
              role="cell"
              className="px-5 pt-1 text-[15px] leading-[1.55] text-gray-600 md:px-7 md:py-5 md:text-[17px]"
            >
              {/* 휴대폰은 위 머리 줄이 없어(md부터) 칸 앞 글자가 어느 쪽인지 알려 준다 — 화면 읽기 프로그램도 읽는다 */}
              <span className="text-gray-500 md:hidden">지금 · </span>
              {r.before}
            </span>
            <span
              role="cell"
              className="px-5 pt-1 pb-4 text-[15px] leading-[1.55] font-semibold text-gray-900 md:bg-[#FFF6F3] md:px-7 md:py-5 md:text-[17px]"
            >
              <span className="font-bold text-primary md:hidden">픽케이크 · </span>
              {r.after}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export interface FromToCard {
  from: string;
  title: string;
  body: string;
}

/** "AI가 채워요": 넣는 것 ↓ 채워지는 것. 휴대폰 한 줄씩, PC 세 칸 */
export function FromToCards({ items }: { items: FromToCard[] }) {
  return (
    <ul className="mt-8 grid gap-3 md:mt-11 md:grid-cols-3 md:gap-4">
      {items.map((c) => (
        <li
          key={c.title}
          className={`grid content-start gap-2 rounded-[20px] border ${LINE} bg-white p-6 md:rounded-[24px] md:p-7`}
        >
          <p className="text-[14px] text-gray-600 md:text-[15px]">{c.from}</p>
          <p aria-hidden className="text-[15px] font-bold text-primary">
            ↓
          </p>
          <p className="text-[20px] leading-[1.4] font-extrabold tracking-[-0.025em] text-gray-900 md:text-[22px]">
            {c.title}
          </p>
          <p className="text-[15px] leading-[1.6] text-gray-700">{c.body}</p>
        </li>
      ))}
    </ul>
  );
}

/** 글 | 컴퓨터 화면 한 장(상품 등록). 휴대폰은 글 아래 화면 */
export function TextWithPc({
  id,
  kicker,
  title,
  points,
  shot,
  shotAlt,
}: {
  id?: string;
  kicker: string;
  title: ReactNode;
  points: ReactNode[];
  shot: StaticImageData;
  shotAlt: string;
}) {
  const headingId = id ? `${id}-title` : undefined;
  return (
    <section id={id} aria-labelledby={headingId} className="py-16 md:py-28">
      <div className={`${WRAP} grid gap-10 lg:grid-cols-[1fr_1.35fr] lg:items-center lg:gap-14`}>
        <div>
          <p className={KICKER}>{kicker}</p>
          <h2
            id={headingId}
            className={`${TITLE} mt-2 md:mt-3 [&_em]:not-italic [&_em]:text-primary`}
          >
            {title}
          </h2>
          <ul className="mt-6 grid gap-3">
            {points.map((p, i) => (
              <li
                key={i}
                className={`${CARD_BODY} relative pl-6 [&_b]:font-bold [&_b]:text-gray-900`}
              >
                <span
                  aria-hidden
                  className="absolute top-[0.65em] left-0.5 size-2 rounded-full bg-primary"
                />
                {p}
              </li>
            ))}
          </ul>
        </div>
        <PcShot src={shot} alt={shotAlt} />
      </div>
    </section>
  );
}

export interface PcFeature {
  src: StaticImageData;
  alt: string;
  title: string;
  body: string;
}

/**
 * 가게 컴퓨터에서도: 실제 PC 화면 네 장. PC는 두 칸씩, 휴대폰은 옆으로 넘긴다(그림이 작아지지 않게).
 */
export function PcGallery({ items }: { items: PcFeature[] }) {
  return (
    <ul
      aria-label="컴퓨터 화면"
      className="-mx-5 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-5 px-5 pb-2 [scrollbar-width:none] md:mx-0 md:mt-11 md:grid md:grid-cols-2 md:gap-6 md:overflow-visible md:px-0 md:pb-0 [&::-webkit-scrollbar]:hidden"
    >
      {items.map((f) => (
        <li key={f.title} className="w-[84%] shrink-0 snap-start md:w-auto">
          <PcShot
            src={f.src}
            alt={f.alt}
            // 넓은 PC는 두 칸(최대 약 600px), PC는 두 칸, 휴대폰은 옆으로 넘기는 카드 한 장
            sizes="(min-width: 1280px) 600px, (min-width: 768px) 46vw, 84vw"
          />
          <p className="mt-3 text-[17px] font-bold tracking-[-0.02em] text-gray-900 md:mt-3.5 md:text-[20px]">
            {f.title}
          </p>
          <p className="mt-1 text-[15px] leading-[1.55] text-gray-700 md:text-base">{f.body}</p>
        </li>
      ))}
    </ul>
  );
}

/** 처음 시작은 저희가: 이름 + 한 줄. 넓은 PC는 두 줄씩 */
export function HelpList({ items }: { items: readonly (readonly [string, string])[] }) {
  return (
    <ul className="border-t border-gray-900 lg:grid lg:grid-cols-2 lg:gap-x-10">
      {items.map(([title, sub]) => (
        <li key={title} className={`border-b ${LINE} py-4 md:py-5`}>
          <p className="text-base leading-[1.5] font-bold text-gray-900 md:text-[17px]">{title}</p>
          <p className="mt-1 text-[15px] leading-[1.6] text-gray-700 md:text-base">{sub}</p>
        </li>
      ))}
    </ul>
  );
}

/** 0원 칸: 제목이 아니라 끝쪽에("0원이어도 기능을 보고 정하겠다", R-03) */
export function ZeroPrice({ steps, note }: { steps: string; note: string }) {
  return (
    <section aria-labelledby="zero-title" className={`${PAPER} py-16 text-center md:py-24`}>
      <div className={WRAP}>
        <h2 id="zero-title">
          <span className="block text-[clamp(22px,6.4vw,26px)] leading-[1.3] font-extrabold tracking-[-0.03em] md:text-[30px]">
            이용료·수수료
          </span>
          {/* 첫 화면 머리말·입점 버튼과 같은 메인 주황(운영자 2026-11-17) */}
          <span className="mt-3 block text-[64px] leading-none font-extrabold tracking-[-0.04em] text-primary md:text-[96px]">
            0원
          </span>
        </h2>
        <p className="mt-6 text-base leading-[1.6] font-bold text-gray-900 md:mt-7 md:text-lg">
          가게 열기는 2단계예요
        </p>
        <p className="mt-1 text-[15px] leading-[1.6] text-gray-700 md:text-base">{steps}</p>
        <p className="mt-5 inline-block rounded-full bg-white px-4 py-2.5 text-[14px] font-bold text-gray-900 md:text-base">
          {note}
        </p>
      </div>
    </section>
  );
}
