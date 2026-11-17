/**
 * 운영사 정보(전자상거래법 제10조 사이버몰 표시·제20조 통신판매중개자 고지, 법무 점검표 1·2번).
 * 2026-11-17 네이버 로그인 검수가 "첫 화면에서 사업자 정보가 확인되지 않음"으로 반려돼 넣었다.
 * 운영자 결정: 웹·앱 모두 홈 맨 아래에 펼쳐서(다른 서비스처럼 첫 화면 맨 아래 회색 작은 글씨). 마이페이지에는 두지 않는다.
 */
import Link from "next/link";
import { cn } from "@/apps/web-user/common/lib/utils";
import { PATHS } from "@/apps/web-user/common/constants/paths.constant";
import { BUSINESS_INFO } from "@/apps/web-user/common/constants/site.constants";

export function BusinessInfoFooter({ className }: { className?: string }) {
  const b = BUSINESS_INFO;
  return (
    <footer className={cn("break-keep px-5 text-xs leading-[1.7] text-gray-500", className)}>
      <p className="mb-[12px] flex items-center gap-[8px] text-gray-600">
        <Link href={PATHS.TERMS.TERMS_OF_SERVICE}>이용약관</Link>
        <span aria-hidden className="h-[10px] w-px bg-gray-100" />
        {/* 개인정보 처리방침은 다른 링크와 구분되게 굵게(개인정보 보호법 처리방침 작성지침) */}
        <Link href={PATHS.TERMS.PRIVACY_POLICY} className="font-bold text-gray-700">
          개인정보 처리방침
        </Link>
      </p>
      <p>
        상호 {b.name} · 대표 {b.representative}
      </p>
      <p>사업자등록번호 {b.registrationNumber}</p>
      <p>통신판매업신고 {b.mailOrderNumber}</p>
      <p>주소 {b.address}</p>
      <p>
        전화 {b.phone} · 이메일 {b.email}
      </p>
      <p className="mt-[12px]">
        {b.name}는 통신판매중개자로서 통신판매의 당사자가 아니에요. 상품과 거래에 대한 책임은 각
        가게에 있어요.
      </p>
    </footer>
  );
}
