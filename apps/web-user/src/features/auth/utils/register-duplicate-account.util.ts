import type { AxiosError } from "axios";
import { isServerAuthMessage } from "@/apps/web-user/features/auth/constants/auth.constant";
import type {
  DuplicateAccountPayload,
  OAuthLoginProvider,
} from "@/apps/web-user/features/auth/types/auth.dto";

/** 서버 409 글로 이미 가입한 로그인 수단(구글/카카오/애플)을 알아낸다. 다른 글이면 null */
export function resolveLoginProviderFromDuplicateMessage(
  message: unknown,
): OAuthLoginProvider | null {
  if (isServerAuthMessage(message, "PHONE_KAKAO_ACCOUNT_EXISTS")) return "kakao";
  if (isServerAuthMessage(message, "PHONE_GOOGLE_ACCOUNT_EXISTS")) return "google";
  if (isServerAuthMessage(message, "PHONE_APPLE_ACCOUNT_EXISTS")) return "apple";
  return null;
}

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

  const provider = resolveLoginProviderFromDuplicateMessage(message);
  if (!provider) return null;

  return { message, provider, name, phone, email };
}
