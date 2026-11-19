/**
 * 운영사 정보(2026-11-17 네이버 로그인 검수 반려로 넣음). 사장님 센터는 손님과 거래하는 곳이 아니라 법상 꼭 필요하진 않지만,
 * 네이버 로그인 앱 하나를 손님·사장님이 같이 써서 검수자가 이 화면도 본다. PC 로그인에만 둔다
 * (휴대폰 로그인은 약관·버전도 두지 않는 화면, 운영자 결정).
 */
import { BUSINESS_INFO } from "@/apps/web-seller/common/constants/business-info.constant";

export function BusinessInfoLines() {
  const b = BUSINESS_INFO;
  return (
    <div className="break-keep text-center text-caption leading-relaxed text-ink-500">
      <p>
        상호 {b.name} · 대표 {b.representative} · 사업자등록번호 {b.registrationNumber}
      </p>
      <p>통신판매업신고 {b.mailOrderNumber}</p>
      <p>주소 {b.address}</p>
      <p>
        전화 {b.phone} · 이메일 {b.email}
      </p>
    </div>
  );
}
