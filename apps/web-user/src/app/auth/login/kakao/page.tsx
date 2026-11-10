"use client";

import { Suspense, useEffect } from "react";
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

function KakaoAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAuthStore((s) => s.login);
  const { showAlert } = useAlertStore();

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      clearPostLoginRedirect();
      // 카카오 인증 화면에서 사용자가 취소한 경우 code 없이 리다이렉트됨
      trackEvent("fail_social_auth", { provider: "kakao", fail_reason: "cancel" });
      router.replace(PATHS.HOME);
      return;
    }

    const run = async () => {
      trackEvent("request_social_auth", { provider: "kakao" });

      try {
        const data = await authApi.kakaoLogin(code);
        const userId = decodeJwtPayload<{ sub: string }>(data.accessToken)?.sub;
        if (userId) {
          trackEvent("success_login", { provider: "kakao", user_id: userId });
        }
        login(data.accessToken);
        // 로그인을 시작했던 화면으로 복귀 (없으면 홈)
        router.replace(consumePostLoginRedirect());
      } catch (error: unknown) {
        const err = error as {
          response?: {
            data?: { data?: { kakaoId?: string; kakaoEmail?: string; message?: string } };
          };
        };
        const { kakaoId, kakaoEmail, message } = err?.response?.data?.data || {};

        if (isServerAuthMessage(message, "PHONE_VERIFICATION_REQUIRED") && kakaoId && kakaoEmail) {
          const params = new URLSearchParams();
          params.set("kakaoId", kakaoId);
          params.set("kakaoEmail", kakaoEmail);
          // 회원가입으로 이어지므로 복귀 경로는 유지 (가입 완료 후 사용)
          router.replace(`${PATHS.AUTH.KAKAO_REGISTER}?${params.toString()}`);
        } else {
          clearPostLoginRedirect();
          trackEvent("fail_social_auth", {
            provider: "kakao",
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
      <p className="text-sm text-gray-600">카카오 로그인 처리 중...</p>
    </div>
  );
}

export default function KakaoAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
          <p className="text-sm text-gray-600">로딩 중...</p>
        </div>
      }
    >
      <KakaoAuthCallbackContent />
    </Suspense>
  );
}
