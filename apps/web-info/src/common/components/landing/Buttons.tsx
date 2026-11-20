import Image from "next/image";
import type { ReactNode } from "react";
import kakaoIcon from "@/apps/web-info/common/assets/kakaotalk.png";

/**
 * 소개 페이지 버튼. 높이 54(휴대폰)·56(PC), 모서리 14.
 * 주 버튼은 주황 바탕 + 흰 글자(운영자 2026-11-17 결정, 대비 2.9:1을 알리고 정함).
 */
const BASE =
  "inline-flex h-[54px] w-full items-center justify-center gap-1.5 rounded-[14px] px-6 text-[17px] font-bold transition-transform duration-fast active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 md:h-14 md:w-[240px]";

function linkProps(external?: boolean) {
  return external ? { target: "_blank", rel: "noopener noreferrer" } : {};
}

export function PrimaryLink({
  href,
  id,
  external,
  children,
}: {
  href: string;
  id?: string;
  external?: boolean;
  children: ReactNode;
}) {
  return (
    <a
      id={id}
      href={href}
      {...linkProps(external)}
      // 키보드 초점은 주황 테두리 — 휴대폰 흰 첫 화면과 PC 어두운 사진 위 모두에서 보인다
      className={`${BASE} bg-primary text-white focus-visible:outline-primary`}
    >
      {children}
    </a>
  );
}

/** 밝은 바탕 위 보조 버튼(회색 테두리) */
export function LineLink({
  href,
  external,
  children,
}: {
  href: string;
  external?: boolean;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      {...linkProps(external)}
      className={`${BASE} border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 focus-visible:outline-gray-900`}
    >
      {children}
    </a>
  );
}

/** 카카오톡 버튼: 손님 앱·판매자 앱 로그인과 같은 모양(노랑 #FFEB00·진한 글자·카카오톡 아이콘 20px) */
export function KakaoLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${BASE} bg-[#FFEB00] text-gray-900 focus-visible:outline-primary`}
    >
      <Image
        src={kakaoIcon}
        alt=""
        width={20}
        height={20}
        className="size-5 shrink-0 object-contain"
      />
      {children}
    </a>
  );
}
