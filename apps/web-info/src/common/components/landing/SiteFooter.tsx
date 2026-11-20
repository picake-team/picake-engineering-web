import LogoPicake from "@/apps/web-info/common/assets/logo-picake.svg";
import { COCOA, WRAP } from "@/apps/web-info/common/components/landing/landing.styles";
import { BUSINESS_INFO } from "@/apps/web-info/common/constants/site.constants";

/**
 * 맨 아래 운영사 줄: 누가 운영하는지 보여 믿음을 준다(검색·AI가 회사 이름을 잇는 데도 쓴다).
 * 개인 휴대폰 번호는 넣지 않고 이메일·카카오톡으로 받는다.
 */
export function SiteFooter({
  id,
  links,
  notice,
}: {
  id?: string;
  /** 다른 쪽 페이지·약관 링크 */
  links: { label: string; href: string; external?: boolean }[];
  /** 손님 쪽: 통신판매중개자 고지(손님 홈 맨 아래와 같은 문장) */
  notice?: string;
}) {
  return (
    <footer
      id={id}
      className={`${COCOA} pt-7 pb-[calc(40px+env(safe-area-inset-bottom))] text-xs leading-[1.75] text-white/60 md:text-[13px]`}
    >
      <div className={`${WRAP} flex flex-col gap-5 md:flex-row md:items-start md:justify-between`}>
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-[13px] font-bold text-white/85 md:text-[14px]">
            <LogoPicake aria-hidden className="size-5" />
            픽케이크(Picake) · 주문제작 케이크 예약 서비스
          </p>
          <p>
            {BUSINESS_INFO.name} · 대표 {BUSINESS_INFO.representative} · 사업자등록번호{" "}
            {BUSINESS_INFO.registrationNumber}
          </p>
          <p>
            통신판매업 {BUSINESS_INFO.mailOrderNumber} · 문의 {BUSINESS_INFO.email}
          </p>
          {notice && <p className="mt-2">{notice}</p>}
        </div>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] font-semibold text-white/85 md:text-[14px]">
          {links.map((l) => (
            <li key={l.label}>
              <a
                href={l.href}
                {...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="rounded-sm hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
