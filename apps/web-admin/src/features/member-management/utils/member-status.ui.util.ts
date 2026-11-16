import type { StatusBadgeVariant } from "@/apps/web-admin/common/components/badges/StatusBadge";
import {
  MemberStatus,
  SellerVerificationStatus,
} from "@/apps/web-admin/features/member-management/types/member-management.dto";

/** 회원 항목(활성 여부·탈퇴 일시) → 상태 값 */
export function getMemberStatus(item: {
  isActive: boolean;
  withdrawnAt: string | null;
}): MemberStatus {
  if (item.withdrawnAt) return MemberStatus.WITHDRAWN;
  return item.isActive ? MemberStatus.ACTIVE : MemberStatus.INACTIVE;
}

const MEMBER_STATUS_LABELS: Record<MemberStatus, string> = {
  [MemberStatus.ACTIVE]: "활성",
  [MemberStatus.INACTIVE]: "비활성",
  [MemberStatus.WITHDRAWN]: "탈퇴",
};

const MEMBER_STATUS_BADGE_VARIANTS: Record<MemberStatus, StatusBadgeVariant> = {
  [MemberStatus.ACTIVE]: "success",
  [MemberStatus.INACTIVE]: "error",
  [MemberStatus.WITHDRAWN]: "default",
};

export function getMemberStatusLabel(status: MemberStatus): string {
  return MEMBER_STATUS_LABELS[status];
}

export function getMemberStatusBadgeVariant(status: MemberStatus): StatusBadgeVariant {
  return MEMBER_STATUS_BADGE_VARIANTS[status];
}

/** 상태 필터 셀렉트 옵션 */
export const MEMBER_STATUS_FILTER_OPTIONS = (Object.values(MemberStatus) as MemberStatus[]).map(
  (value) => ({ value, label: MEMBER_STATUS_LABELS[value] }),
);

const SELLER_VERIFICATION_STATUS_LABELS: Record<SellerVerificationStatus, string> = {
  [SellerVerificationStatus.REGISTERED]: "가입 완료",
  [SellerVerificationStatus.BUSINESS_VERIFIED]: "사업자 검증 완료",
};

const SELLER_VERIFICATION_STATUS_BADGE_VARIANTS: Record<
  SellerVerificationStatus,
  StatusBadgeVariant
> = {
  [SellerVerificationStatus.REGISTERED]: "warning",
  [SellerVerificationStatus.BUSINESS_VERIFIED]: "info",
};

export function getSellerVerificationStatusLabel(status: SellerVerificationStatus): string {
  return SELLER_VERIFICATION_STATUS_LABELS[status];
}

export function getSellerVerificationStatusBadgeVariant(
  status: SellerVerificationStatus,
): StatusBadgeVariant {
  return SELLER_VERIFICATION_STATUS_BADGE_VARIANTS[status];
}

/** 검증 상태 필터 셀렉트 옵션 */
export const SELLER_VERIFICATION_STATUS_FILTER_OPTIONS = (
  Object.values(SellerVerificationStatus) as SellerVerificationStatus[]
).map((value) => ({ value, label: SELLER_VERIFICATION_STATUS_LABELS[value] }));

/** 소셜 연동 표시 문자열 (예: "구글 · 카카오", 미연동이면 "-") */
export function getSocialProvidersLabel(item: {
  googleEmail: string | null;
  kakaoEmail: string | null;
  appleEmail?: string | null;
  naverId?: string | null;
}): string {
  const providers = [
    item.kakaoEmail && "카카오",
    item.naverId && "네이버",
    item.googleEmail && "구글",
    item.appleEmail && "애플",
  ].filter(Boolean);
  return providers.length > 0 ? providers.join(" · ") : "-";
}
