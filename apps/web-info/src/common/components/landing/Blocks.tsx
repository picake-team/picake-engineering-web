import Image, { type StaticImageData } from "next/image";
import type { ReactNode } from "react";
import {
  CARD_BODY,
  CARD_TITLE,
  KICKER,
  LEAD,
  LINE,
  PANEL,
  TITLE,
  WRAP,
} from "@/apps/web-info/common/components/landing/landing.styles";

/**
 * 소개 페이지 칸 부품(손님 쪽·사장님 쪽 같이 씀). 글은 한 벌이고 휴대폰은 쌓고 PC는 나란히 둔다.
 * 제목 안의 `<em>`은 메인 주황으로 보인다(운영자 2026-11-20 시안).
 */

/** 칸 머리말 · 제목 · 한 줄 설명 */
export function SectionHeading({
  kicker,
  title,
  lead,
  align = "center",
  id,
}: {
  kicker?: string;
  title: ReactNode;
  lead?: ReactNode;
  align?: "center" | "left";
  /** 제목 id(칸의 aria-labelledby) */
  id?: string;
}) {
  return (
    <div className={align === "center" ? "text-center" : ""}>
      {kicker && <p className={KICKER}>{kicker}</p>}
      <h2
        id={id}
        className={`${TITLE} ${kicker ? "mt-2 md:mt-3" : ""} [&_em]:not-italic [&_em]:text-primary`}
      >
        {title}
      </h2>
      {lead && <p className={`${LEAD} mt-3`}>{lead}</p>}
    </div>
  );
}

export interface Pain {
  /** 겪는 일(한두 줄) */
  problem: ReactNode;
  /** 답하는 기능 이름 */
  answerName: string;
  /** 답 한 줄 */
  answer: string;
}

/** 고민 칸: 휴대폰 한 줄씩, PC 두 칸, 넓은 PC 네 칸 */
export function PainGrid({ items }: { items: Pain[] }) {
  return (
    <ul className="mt-8 grid gap-3 md:mt-11 md:grid-cols-2 md:gap-4 lg:grid-cols-4">
      {items.map((p) => (
        <li
          // 같은 기능이 두 고민에 답할 수 있어(손님 쪽 "견적") 기능 이름과 답을 같이 키로 쓴다
          key={`${p.answerName}-${p.answer}`}
          className={`grid grid-rows-[1fr_auto] gap-4 rounded-[20px] border ${LINE} bg-white p-5 md:rounded-[22px] md:p-7`}
        >
          <p className="text-[18px] leading-[1.45] font-bold tracking-[-0.02em] text-gray-900 md:text-[20px]">
            {p.problem}
          </p>
          <p
            className={`border-t border-dashed ${LINE} pt-4 text-[15px] leading-[1.55] text-gray-700 md:text-base`}
          >
            <b className="font-bold text-primary">{p.answerName}</b> · {p.answer}
          </p>
        </li>
      ))}
    </ul>
  );
}

/**
 * 해결 줄 하나: 글 | 실제 화면. 휴대폰은 글 아래 화면, 넓은 PC는 나란히(짝수 줄은 좌우를 바꾼다).
 * 화면은 칸 아래 끝에서 잘린다.
 */
export function SolveRow({
  id,
  tag,
  title,
  body,
  shot,
  flip = false,
  headingLevel = "h3",
}: {
  id?: string;
  tag: string;
  title: ReactNode;
  body: ReactNode;
  /** 칸 아래에 붙는 화면(사용법 영상 ShotVideo 등) */
  shot: ReactNode;
  flip?: boolean;
  /** 앞 칸 제목 아래 줄이면 h3, 혼자 서는 칸이면 h2(화면 읽기 프로그램의 제목 순서) */
  headingLevel?: "h2" | "h3";
}) {
  const Heading = headingLevel;
  return (
    <article
      id={id}
      className={`${PANEL} grid overflow-hidden rounded-[24px] lg:h-[460px] lg:grid-cols-2 lg:items-center lg:gap-12 lg:rounded-[28px]`}
    >
      <div className={`px-6 pt-8 md:px-10 md:pt-12 lg:px-14 lg:pt-0 ${flip ? "lg:order-2" : ""}`}>
        <p className={KICKER}>{tag}</p>
        <Heading className={`${CARD_TITLE} mt-2 text-gray-900`}>{title}</Heading>
        <p className={`${CARD_BODY} mt-3`}>{body}</p>
      </div>
      <div className="mt-8 flex justify-center self-end px-6 md:mt-10 lg:mt-0">{shot}</div>
    </article>
  );
}

export interface Tile {
  title: string;
  body: string;
}

/** "이것도 돼요": 기능 이름 + 한 줄. 휴대폰 두 칸, PC 세 칸, 넓은 PC 네 칸 */
export function TileGrid({ items, className = "" }: { items: Tile[]; className?: string }) {
  return (
    <ul
      className={`grid grid-cols-2 gap-2.5 md:grid-cols-3 md:gap-3.5 lg:grid-cols-4 ${className}`}
    >
      {items.map((t) => (
        <li key={t.title} className={`${PANEL} rounded-[16px] p-4 md:rounded-[18px] md:p-[22px]`}>
          <p className="text-[16px] leading-[1.4] font-bold tracking-[-0.02em] text-gray-900 md:text-[18px]">
            {t.title}
          </p>
          <p className="mt-1.5 text-[14px] leading-[1.55] text-gray-700 md:text-[15px]">{t.body}</p>
        </li>
      ))}
    </ul>
  );
}

/** 왼쪽 제목 | 오른쪽 내용(넓은 PC). 휴대폰·좁은 PC는 제목 아래 내용 */
export function SplitSection({
  id,
  title,
  children,
}: {
  id?: string;
  title: ReactNode;
  children: ReactNode;
}) {
  const headingId = id ? `${id}-title` : undefined;
  return (
    <section id={id} aria-labelledby={headingId} className="py-16 md:py-28">
      <div className={`${WRAP} lg:grid lg:grid-cols-[340px_1fr] lg:gap-12`}>
        <h2 id={headingId} className={`${TITLE} lg:sticky lg:top-[104px] lg:self-start`}>
          {title}
        </h2>
        <div className="mt-6 lg:mt-0">{children}</div>
      </div>
    </section>
  );
}

export interface Faq {
  q: string;
  a: string;
  id?: string;
}

/** 자주 묻는 질문: 펼친 채로 둔다(검색·AI가 읽는 글과 화면 글이 같아야 한다) */
export function FaqList({ items }: { items: Faq[] }) {
  return (
    <dl className="max-w-[760px] border-t border-gray-900">
      {items.map(({ q, a, id }) => (
        <div key={q} id={id} className={`border-b ${LINE} py-4 md:py-5`}>
          <dt className="text-base leading-[1.5] font-bold text-gray-900 md:text-[17px]">{q}</dt>
          <dd className="mt-1.5 text-[15px] leading-[1.65] text-gray-700 md:text-base">{a}</dd>
        </div>
      ))}
    </dl>
  );
}

/** 마지막 칸: 본문 폭 안 둥근 사진 칸 + 한 줄 + 버튼 */
export function ClosingBox({
  id,
  photo,
  title,
  children,
}: {
  id?: string;
  photo: StaticImageData;
  title: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="pb-16 md:pb-28">
      <div className={WRAP}>
        <div className="relative isolate overflow-hidden rounded-[24px] bg-[#1B1512] px-6 py-16 text-center text-white md:rounded-[28px] md:py-24">
          <Image
            src={photo}
            alt=""
            fill
            sizes="(min-width: 1280px) 1200px, 100vw"
            className="-z-10 object-cover"
          />
          <div aria-hidden className="absolute inset-0 -z-10 bg-[rgba(27,21,18,0.62)]" />
          <h2 className={TITLE}>{title}</h2>
          <div className="mx-auto mt-8 flex max-w-[320px] flex-col gap-2 md:max-w-none md:flex-row md:justify-center md:gap-3">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
