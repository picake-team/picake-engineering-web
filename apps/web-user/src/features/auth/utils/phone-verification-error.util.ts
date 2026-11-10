import { AxiosError } from "axios";
import { isServerAuthMessage } from "@/apps/web-user/features/auth/constants/auth.constant";
import type { PhoneVerificationFailReason } from "@/apps/web-user/common/types/analytics.type";

/** 휴대폰 인증번호 확인(verifyPhoneCode) 실패의 fail_reason 판별 */
export function resolvePhoneVerificationFailReason(error: unknown): PhoneVerificationFailReason {
  const axiosError = error as AxiosError<{ data?: { message?: unknown } }>;
  const message = axiosError.response?.data?.data?.message;
  if (isServerAuthMessage(message, "PHONE_VERIFICATION_EXPIRED")) {
    return "expired_code";
  }
  return "invalid_code";
}
