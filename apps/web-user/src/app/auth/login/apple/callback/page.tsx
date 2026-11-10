"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authApi } from "@/apps/web-user/features/auth/apis/auth.api";
import { useAuthStore } from "@/apps/web-user/common/store/auth.store";
import { isServerAuthMessage } from "@/apps/web-user/features/auth/constants/auth.constant";
import { PATHS } from "@/apps/web-user/common/constants/paths.constant";
import { useAlertStore } from "@/apps/web-user/common/store/alert.store";
import getApiMessage from "@/apps/web-user/common/utils/getApiMessage";
import { trackEvent } from "@/apps/web-user/common/utils/analytics.util";
import { decodeJwtPayload } from "@/apps/web-user/features/auth/utils/jwt.util";
import { resolveSocialAuthFailReason } from "@/apps/web-user/features/auth/utils/social-auth-error.util";

/**
 * 애플 OAuth 콜백 — `/auth/login/apple`(route.ts)이 폼바디를 파싱해 `code`를 쿼리로 붙여 여기로
 * 리다이렉트합니다. 이후 흐름은 `/auth/login/google`과 동일하게 `code`로
 * `/v1/consumer/auth/apple/login`을 호출합니다.
 * 휴대폰 미연동 시 → `appleId`·`appleEmail`을 쿼리로 붙여 `/auth/register/apple`으로 이동
 */
function AppleAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAuthStore((s) => s.login);
  const { showAlert } = useAlertStore();

  useEffect(() => {
    const code = searchParams.get("code");
    const appleName = searchParams.get("appleName");
    if (!code) {
      // 애플 인증 화면에서 사용자가 취소한 경우 error만 붙어 리다이렉트됨
      trackEvent("fail_social_auth", { provider: "apple", fail_reason: "cancel" });
      router.replace(PATHS.HOME);
      return;
    }

    const run = async () => {
      trackEvent("request_social_auth", { provider: "apple" });

      try {
        const data = await authApi.appleLogin(code);
        const userId = decodeJwtPayload<{ sub: string }>(data.accessToken)?.sub;
        if (userId) {
          trackEvent("success_login", { provider: "apple", user_id: userId });
        }
        login(data.accessToken);
        router.replace(PATHS.HOME);
      } catch (error: unknown) {
        const err = error as {
          response?: {
            data?: { data?: { appleId?: string; appleEmail?: string; message?: string } };
          };
        };
        const { appleId, appleEmail, message } = err?.response?.data?.data || {};

        if (isServerAuthMessage(message, "PHONE_VERIFICATION_REQUIRED") && appleId && appleEmail) {
          const params = new URLSearchParams();
          params.set("appleId", appleId);
          params.set("appleEmail", appleEmail);
          if (appleName) {
            params.set("appleName", appleName);
          }
          router.replace(`${PATHS.AUTH.APPLE_REGISTER}?${params.toString()}`);
        } else {
          trackEvent("fail_social_auth", {
            provider: "apple",
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
      <p className="text-sm text-gray-600">애플 로그인 처리 중...</p>
    </div>
  );
}

export default function AppleAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
          <p className="text-sm text-gray-600">로딩 중...</p>
        </div>
      }
    >
      <AppleAuthCallbackContent />
    </Suspense>
  );
}
