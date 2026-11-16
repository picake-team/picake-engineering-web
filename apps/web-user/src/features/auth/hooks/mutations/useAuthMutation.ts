import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authApi } from "@/apps/web-user/features/auth/apis/auth.api";
import { useAuthStore } from "@/apps/web-user/common/store/auth.store";
import { useAlertStore } from "@/apps/web-user/common/store/alert.store";
import getApiMessage from "@/apps/web-user/common/utils/getApiMessage";
import type { PhoneVerificationPurpose } from "@/apps/web-user/features/auth/types/auth.dto";
import type { DuplicateAccountPayload } from "@/apps/web-user/features/auth/types/auth.dto";
import {
  isRegisterTicketInvalid,
  parseDuplicateAccountPayload,
} from "@/apps/web-user/features/auth/utils/register-duplicate-account.util";
import { PATHS } from "@/apps/web-user/common/constants/paths.constant";
import { consumePostLoginRedirect } from "@/apps/web-user/features/auth/utils/post-login-redirect.util";
import { trackEvent } from "@/apps/web-user/common/utils/analytics.util";
import { decodeJwtPayload } from "@/apps/web-user/features/auth/utils/jwt.util";
import { clearRegisterTicket } from "@/apps/web-user/features/auth/utils/register-ticket.util";

export function useSendPhoneVerification() {
  const { showAlert } = useAlertStore();

  return useMutation({
    mutationFn: ({ phone, purpose }: { phone: string; purpose: PhoneVerificationPurpose }) =>
      authApi.sendPhoneVerification(phone, purpose),
    onError: (error) => {
      showAlert({
        type: "error",
        title: "오류",
        message: getApiMessage.error(error),
      });
    },
  });
}

export function useVerifyPhoneCode() {
  const { showAlert } = useAlertStore();

  return useMutation({
    mutationFn: authApi.verifyPhoneCode,
    onError: (error) => {
      showAlert({
        type: "error",
        title: "오류",
        message: getApiMessage.error(error),
      });
    },
  });
}

/** 앱스토어/플레이스토어 심사용 로그인 (숨겨진 진입점에서만 사용) */
export function useReviewLogin() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const { showAlert } = useAlertStore();

  return useMutation({
    mutationFn: authApi.reviewLogin,
    onSuccess: (data) => {
      login(data.accessToken);
      router.replace(PATHS.HOME);
    },
    onError: (error) => {
      showAlert({
        type: "error",
        title: "오류",
        message: getApiMessage.error(error),
      });
    },
  });
}

export function useGoogleRegister(options?: {
  onDuplicateAccount?: (payload: DuplicateAccountPayload) => void;
}) {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const { showAlert } = useAlertStore();

  return useMutation({
    mutationFn: authApi.googleRegister,
    onSuccess: (data) => {
      const userId = decodeJwtPayload<{ sub: string }>(data.accessToken)?.sub;
      if (userId) {
        trackEvent("success_signup", { provider: "google", user_id: userId });
      }
      clearRegisterTicket("google");
      login(data.accessToken);
      // 로그인을 시작했던 화면으로 복귀 (없으면 홈)
      router.replace(consumePostLoginRedirect());
    },
    onError: (error) => {
      const duplicate = parseDuplicateAccountPayload(error);
      if (duplicate) {
        options?.onDuplicateAccount?.(duplicate);
        return;
      }
      if (isRegisterTicketInvalid(error)) {
        // 가입표가 30분 지났거나 잘못됨 — 이 화면에서는 가입할 수 없어 지우고 홈으로(다시 로그인, 복귀 경로는 유지)
        clearRegisterTicket("google");
        router.replace(PATHS.HOME);
      }
      showAlert({
        type: "error",
        title: "오류",
        message: getApiMessage.error(error),
      });
    },
  });
}

export function useKakaoRegister(options?: {
  onDuplicateAccount?: (payload: DuplicateAccountPayload) => void;
}) {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const { showAlert } = useAlertStore();

  return useMutation({
    mutationFn: authApi.kakaoRegister,
    onSuccess: (data) => {
      const userId = decodeJwtPayload<{ sub: string }>(data.accessToken)?.sub;
      if (userId) {
        trackEvent("success_signup", { provider: "kakao", user_id: userId });
      }
      clearRegisterTicket("kakao");
      login(data.accessToken);
      // 로그인을 시작했던 화면으로 복귀 (없으면 홈)
      router.replace(consumePostLoginRedirect());
    },
    onError: (error) => {
      const duplicate = parseDuplicateAccountPayload(error);
      if (duplicate) {
        options?.onDuplicateAccount?.(duplicate);
        return;
      }
      if (isRegisterTicketInvalid(error)) {
        // 가입표가 30분 지났거나 잘못됨 — 이 화면에서는 가입할 수 없어 지우고 홈으로(다시 로그인, 복귀 경로는 유지)
        clearRegisterTicket("kakao");
        router.replace(PATHS.HOME);
      }
      showAlert({
        type: "error",
        title: "오류",
        message: getApiMessage.error(error),
      });
    },
  });
}

export function useAppleRegister(options?: {
  onDuplicateAccount?: (payload: DuplicateAccountPayload) => void;
}) {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const { showAlert } = useAlertStore();

  return useMutation({
    mutationFn: authApi.appleRegister,
    onSuccess: (data) => {
      const userId = decodeJwtPayload<{ sub: string }>(data.accessToken)?.sub;
      if (userId) {
        trackEvent("success_signup", { provider: "apple", user_id: userId });
      }
      clearRegisterTicket("apple");
      login(data.accessToken);
      // 로그인을 시작했던 화면으로 복귀 (없으면 홈)
      router.replace(consumePostLoginRedirect());
    },
    onError: (error) => {
      const duplicate = parseDuplicateAccountPayload(error);
      if (duplicate) {
        options?.onDuplicateAccount?.(duplicate);
        return;
      }
      if (isRegisterTicketInvalid(error)) {
        // 가입표가 30분 지났거나 잘못됨 — 이 화면에서는 가입할 수 없어 지우고 홈으로(다시 로그인, 복귀 경로는 유지)
        clearRegisterTicket("apple");
        router.replace(PATHS.HOME);
      }
      showAlert({
        type: "error",
        title: "오류",
        message: getApiMessage.error(error),
      });
    },
  });
}
