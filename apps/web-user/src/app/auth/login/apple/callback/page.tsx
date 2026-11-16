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
import {
  clearAllRegisterTickets,
  saveRegisterTicket,
} from "@/apps/web-user/features/auth/utils/register-ticket.util";
import { saveLastLoginProvider } from "@/apps/web-user/features/auth/utils/last-login-provider.util";
import { consumePostLoginRedirect } from "@/apps/web-user/features/auth/utils/post-login-redirect.util";

/**
 * 애플 OAuth 콜백 — `/auth/login/apple`(route.ts)이 폼바디를 파싱해 `code`를 쿼리로 붙여 여기로
 * 리다이렉트합니다. 이후 흐름은 `/auth/login/google`과 동일하게 `code`로
 * `/v1/consumer/auth/apple/login`을 호출합니다.
 * 휴대폰 미연동 시 → 가입표 `registerToken`을 이 탭에 두고(저장 안 되면 쿼리로) `/auth/register/apple`으로 이동
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
        // 로그인 화면 "최근 로그인" 말풍선
        saveLastLoginProvider("apple");
        clearAllRegisterTickets();
        login(data.accessToken);
        // 카카오·구글·네이버 콜백처럼 로그인 전에 보던 곳으로(예약 창에서 "로그인하고 예약신청", 알림톡 예약 상세 등).
        // 전에는 애플만 늘 홈으로 가고 돌아갈 곳이 남아 있었다(11-16 검토)
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
          // 가입표: 서버가 확인한 소셜 ID(카카오는 번호·이름도)가 들어 있어 가입은 이 값으로만 한다(30분).
          // 주소에 싣지 않고 이 탭에 둔다 — 저장이 안 되는 브라우저만 주소로
          if (!saveRegisterTicket("apple", registerToken)) {
            params.set("registerToken", registerToken);
          }
          if (appleName) {
            params.set("appleName", appleName);
          }
          router.replace(
            params.toString()
              ? `${PATHS.AUTH.APPLE_REGISTER}?${params.toString()}`
              : PATHS.AUTH.APPLE_REGISTER,
          );
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
