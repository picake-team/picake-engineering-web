"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authApi } from "@/apps/web-user/features/auth/apis/auth.api";
import { useAuthStore } from "@/apps/web-user/common/store/auth.store";
import { isServerAuthMessage } from "@/apps/web-user/features/auth/constants/auth.constant";
import { PATHS } from "@/apps/web-user/common/constants/paths.constant";
import { useAlertStore } from "@/apps/web-user/common/store/alert.store";
import getApiMessage from "@/apps/web-user/common/utils/getApiMessage";
import {
  clearPostLoginRedirect,
  consumePostLoginRedirect,
} from "@/apps/web-user/features/auth/utils/post-login-redirect.util";
import { trackEvent } from "@/apps/web-user/common/utils/analytics.util";
import { decodeJwtPayload } from "@/apps/web-user/features/auth/utils/jwt.util";
import { resolveSocialAuthFailReason } from "@/apps/web-user/features/auth/utils/social-auth-error.util";
import {
  clearAllRegisterTickets,
  saveRegisterTicket,
} from "@/apps/web-user/features/auth/utils/register-ticket.util";
import { saveLastLoginProvider } from "@/apps/web-user/features/auth/utils/last-login-provider.util";
import {
  consumeNaverOAuthState,
  isNaverOAuthStateValid,
} from "@/apps/web-user/features/auth/utils/naver-oauth-state.util";

/**
 * 네이버 로그인 콜백 — 주소의 code·state를 받는다.
 * state가 이 탭이 만든 값과 같을 때만 서버에 보낸다(남이 만든 로그인 결과를 받지 않게). 나머지는 카카오 콜백과 같다.
 */
function NaverAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAuthStore((s) => s.login);
  const { showAlert } = useAlertStore();
  // code·state는 한 번만 쓴다 — 개발 모드(StrictMode)에서 효과가 두 번 돌아도 두 번째는 건너뜀(state를 이미 써서 실패로 보이지 않게)
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const stateValid = isNaverOAuthStateValid(state);
    // 확인을 통과한 state만 지운다 — 취소하고 돌아온 값은 남겨 다시 시도할 때 쓴다(네이버가 앞 시도의 state를 돌려줄 때가 있음)
    if (code && state && stateValid) consumeNaverOAuthState(state);

    if (!code) {
      clearPostLoginRedirect();
      // 네이버 화면에서 동의를 취소하면 code 없이 error=access_denied로 돌아온다
      trackEvent("fail_social_auth", { provider: "naver", fail_reason: "cancel" });
      router.replace(PATHS.HOME);
      return;
    }
    if (!stateValid || !state) {
      clearPostLoginRedirect();
      trackEvent("fail_social_auth", { provider: "naver", fail_reason: "auth_error" });
      router.replace(PATHS.HOME);
      showAlert({
        type: "error",
        title: "오류",
        message: "로그인을 확인하지 못했어요. 다시 로그인해 주세요.",
      });
      return;
    }

    const run = async () => {
      trackEvent("request_social_auth", { provider: "naver" });

      try {
        const data = await authApi.naverLogin(code, state);
        const userId = decodeJwtPayload<{ sub: string }>(data.accessToken)?.sub;
        if (userId) {
          trackEvent("success_login", { provider: "naver", user_id: userId });
        }
        // 로그인 화면 "최근 로그인" 말풍선
        saveLastLoginProvider("naver");
        clearAllRegisterTickets();
        login(data.accessToken);
        // 로그인을 시작했던 화면으로 복귀 (없으면 홈)
        router.replace(consumePostLoginRedirect());
      } catch (error: unknown) {
        const err = error as {
          response?: {
            data?: { data?: { registerToken?: string; message?: string } };
          };
        };
        const { registerToken, message } = err?.response?.data?.data || {};

        if (isServerAuthMessage(message, "PHONE_VERIFICATION_REQUIRED") && registerToken) {
          const params = new URLSearchParams();
          // 가입표: 서버가 확인한 네이버 회원 식별자(받았으면 번호·이름도)가 들어 있어 가입은 이 값으로만 한다(30분).
          // 주소에 싣지 않고 이 탭에 둔다 — 저장이 안 되는 브라우저만 주소로
          if (!saveRegisterTicket("naver", registerToken)) {
            params.set("registerToken", registerToken);
          }
          // 회원가입으로 이어지므로 복귀 경로는 유지 (가입 완료 후 사용)
          router.replace(
            params.toString()
              ? `${PATHS.AUTH.NAVER_REGISTER}?${params.toString()}`
              : PATHS.AUTH.NAVER_REGISTER,
          );
        } else {
          clearPostLoginRedirect();
          trackEvent("fail_social_auth", {
            provider: "naver",
            fail_reason: resolveSocialAuthFailReason(error),
          });
          router.replace(PATHS.HOME);
          showAlert({
            type: "error",
            title: "오류",
            message: getApiMessage.error(error),
          });
        }
      }
    };

    void run();
  }, [searchParams, router, login, showAlert]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-gray-50">
      <p className="text-sm text-gray-600">네이버 로그인 처리 중...</p>
    </div>
  );
}

export default function NaverAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
          <p className="text-sm text-gray-600">로딩 중...</p>
        </div>
      }
    >
      <NaverAuthCallbackContent />
    </Suspense>
  );
}
