import type { ReactNode } from "react";
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

/** 글 | 컴퓨터 화면 한 장(상품 등록·가게 컴퓨터). 휴대폰은 글 아래 화면 */
export function TextWithPc({
  id,
  kicker,
  title,
  points,
  shot,
  className = "",
}: {
  id?: string;
  /** 칸 바탕(예: PAPER). 같은 모양 칸이 이어질 때 바탕으로 나눈다 */
  className?: string;
  kicker: string;
  title: ReactNode;
  points: ReactNode[];
  /** 오른쪽(휴대폰은 아래) 컴퓨터 화면: 그림(PcShot) 또는 사용법 영상(ShotVideo frame="pc") */
  shot: ReactNode;
}) {
  const headingId = id ? `${id}-title` : undefined;
  return (
    <section id={id} aria-labelledby={headingId} className={`py-16 md:py-28 ${className}`}>
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
        {shot}
      </div>
    </section>
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
