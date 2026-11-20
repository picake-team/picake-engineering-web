import type { ReactNode } from "react";
import { LineLink } from "@/apps/web-info/common/components/landing/Buttons";
import { LINE, PANEL, PAPER, WRAP } from "@/apps/web-info/common/components/landing/landing.styles";

/**
 * 손님 소개 페이지에만 있는 칸(2026-11-20 시안 B + 더한 칸). 공용 칸은 common/components/landing.
 */

export interface Qa {
  /** 손님이 물을 말 */
  q: string;
  /** 답(굵은 글자는 기능 이름) */
  a: ReactNode;
}

/**
 * "물어보기 전에 여기서": 손님 설문에서 바란 기능(날짜·가격·스타일·실시간 문의·완성본·리뷰, 기획 R-02)에 하나씩 답한다.
 * 휴대폰 한 줄씩, PC 두 칸, 넓은 PC 세 칸
 */
export function QaGrid({ items }: { items: Qa[] }) {
  return (
    <ul className="mt-8 grid gap-3 md:mt-11 md:grid-cols-2 md:gap-4 lg:grid-cols-3">
      {items.map((x) => (
        <li
          key={x.q}
          className={`rounded-[20px] border ${LINE} bg-white p-5 md:rounded-[22px] md:p-6`}
        >
          <p className="text-[19px] leading-[1.4] font-extrabold tracking-[-0.03em] text-gray-900 md:text-[21px]">
            “{x.q}”
          </p>
          <p className="mt-2 text-[15px] leading-[1.6] text-gray-700 md:mt-2.5 md:text-base [&_b]:font-bold [&_b]:text-primary">
            {x.a}
          </p>
        </li>
      ))}
    </ul>
  );
}

/** 예약이 쉬운 이유 세 가지. 휴대폰 한 줄씩, PC 세 칸 */
export function EasyCards({ items }: { items: { title: string; body: string }[] }) {
  return (
    <ul className="mt-8 grid gap-3 md:mt-11 md:grid-cols-3 md:gap-[18px]">
      {items.map((x) => (
        <li key={x.title} className={`${PANEL} rounded-[20px] p-6 md:rounded-[22px] md:p-7`}>
          <p className="text-[20px] leading-[1.35] font-extrabold tracking-[-0.025em] text-gray-900 md:text-[22px]">
            {x.title}
          </p>
          <p className="mt-2 text-[15px] leading-[1.6] text-gray-700 md:text-base">{x.body}</p>
        </li>
      ))}
    </ul>
  );
}

/** 사장님 쪽으로 가는 띠(쿠팡이츠·배민처럼 손님 페이지에서 사장님 입점으로 잇는다) */
export function SellerBand({ id, href }: { id?: string; href: string }) {
  return (
    <section id={id} aria-labelledby="seller-band-title" className={`${PAPER} py-12 md:py-16`}>
      <div
        className={`${WRAP} flex flex-col gap-5 md:flex-row md:items-center md:justify-between md:gap-8`}
      >
        <div>
          <h2
            id="seller-band-title"
            className="text-[22px] leading-[1.35] font-extrabold tracking-[-0.03em] text-gray-900 md:text-[28px]"
          >
            케이크 가게 사장님이세요?
          </h2>
          <p className="mt-1.5 text-[15px] leading-[1.6] text-gray-700 md:text-[17px]">
            이용료·수수료 0원으로 견적과 주문서를 받아 보세요
          </p>
        </div>
        <div className="w-full md:w-auto">
          <LineLink href={href}>사장님 소개 보기 ›</LineLink>
        </div>
      </div>
    </section>
  );
}
