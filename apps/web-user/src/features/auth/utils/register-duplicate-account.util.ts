import type { AxiosError } from "axios";
import { AUTH_ERROR_MESSAGES } from "@/apps/web-user/features/auth/constants/auth.constant";
import type {
  DuplicateAccountPayload,
  OAuthLoginProvider,
} from "@/apps/web-user/features/auth/types/auth.dto";

/**
 * 회원가입 API 409 응답에서 기존 계정 안내용 필드(message, name, phone)를 파싱합니다.
 */
export function parseDuplicateAccountPayload(error: unknown): DuplicateAccountPayload | null {
  const axiosError = error as AxiosError<{
    data?: { message?: unknown; name?: unknown; phone?: unknown; email?: unknown };
  }>;
  const status = axiosError.response?.status;
  const data = axiosError.response?.data?.data;
  if (status !== 409 || !data || typeof data !== "object") return null;

  const message = typeof data.message === "string" ? data.message : null;
  const name = typeof data.name === "string" ? data.name : null;
  const phone = typeof data.phone === "string" ? data.phone : null;
  const email = typeof data.email === "string" && data.email ? data.email : null;
  if (!message || !name || !phone) return null;

  if (
    message !== AUTH_ERROR_MESSAGES.PHONE_KAKAO_ACCOUNT_EXISTS &&
    message !== AUTH_ERROR_MESSAGES.PHONE_GOOGLE_ACCOUNT_EXISTS &&
    message !== AUTH_ERROR_MESSAGES.PHONE_APPLE_ACCOUNT_EXISTS
  ) {
    return null;
  }

  return { message, name, phone, email };
}

/**
 * 백엔드 message 문자열로 로그인 수단(구글/카카오/애플)을 추론합니다.
 * 중복 계정 화면에는 `PHONE_KAKAO_ACCOUNT_EXISTS` / `PHONE_GOOGLE_ACCOUNT_EXISTS` / `PHONE_APPLE_ACCOUNT_EXISTS`만 옵니다.
 */
export function resolveLoginProviderFromDuplicateMessage(
  message:
    | typeof AUTH_ERROR_MESSAGES.PHONE_KAKAO_ACCOUNT_EXISTS
    | typeof AUTH_ERROR_MESSAGES.PHONE_GOOGLE_ACCOUNT_EXISTS
    | typeof AUTH_ERROR_MESSAGES.PHONE_APPLE_ACCOUNT_EXISTS,
): OAuthLoginProvider {
  if (message === AUTH_ERROR_MESSAGES.PHONE_KAKAO_ACCOUNT_EXISTS) return "kakao";
  if (message === AUTH_ERROR_MESSAGES.PHONE_APPLE_ACCOUNT_EXISTS) return "apple";
  return "google";
}
