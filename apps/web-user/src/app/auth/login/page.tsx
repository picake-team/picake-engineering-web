"use client";

import { useEffect } from "react";
import Image from "next/image";
import { Icon } from "@/apps/web-user/common/components/icons";
import {
  oauthGoogleLoginButtonClassName,
  oauthKakaoLoginButtonClassName,
  oauthLoginButtonIconClassName,
} from "@/apps/web-user/common/components/buttons/oauth-provider-login-buttons";
import {
  getGoogleOAuthLoginUrl,
  getKakaoOAuthLoginUrl,
} from "@/apps/web-user/features/auth/utils/oauth-login-url.util";
import { useAlertStore } from "@/apps/web-user/common/store/alert.store";
import { trackEvent } from "@/apps/web-user/common/utils/analytics.util";
import type { OAuthProvider } from "@/apps/web-user/common/types/analytics.type";

/**
 * 로그인 화면.
 * 로그인이 필요한 상황(401, 로그인 전용 화면 진입)에서 이동한다.
 *
 * 복귀 경로는 이동 직전에 `setPostLoginRedirect()` 로 저장되며,
 * OAuth 콜백에서 `consumePostLoginRedirect()` 로 사용한다.
 */
export default function LoginPage() {
  const { showAlert } = useAlertStore();

  useEffect(() => {
    trackEvent("view_login_entry", { entry_point: "session_expired" });
  }, []);

  /**
   * authorize URL은 `window.location.origin`이 필요해 클릭 시점에 만든다.
   * 마운트 후 state로 채우면 버튼이 뒤늦게 나타나므로 버튼 자체는 항상 렌더링한다.
   */
  const handleLogin = (provider: OAuthProvider, getLoginUrl: () => string | null) => {
    trackEvent("engage_social_select", { provider });

    const url = getLoginUrl();
    if (!url) {
      showAlert({
        type: "error",
        title: "오류",
        message: "로그인 설정을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
      });
      return;
    }
    window.location.href = url;
  };

  return (
    <div className="flex min-h-screen flex-col bg-white px-5">
      <div className="flex flex-1 items-center justify-center">
        <Icon name="logoPicake" width={100} height={100} />
      </div>

      <div className="flex flex-col gap-2.5 pb-[calc(72px+env(safe-area-inset-bottom,0px))]">
        <button
          type="button"
          className={oauthKakaoLoginButtonClassName}
          onClick={() => handleLogin("kakao", getKakaoOAuthLoginUrl)}
        >
          <Image
            src="/images/contents/kakaotalk.png"
            alt=""
            width={20}
            height={20}
            className={oauthLoginButtonIconClassName}
          />
          카카오로 시작하기
        </button>

        <button
          type="button"
          className={oauthGoogleLoginButtonClassName}
          onClick={() => handleLogin("google", getGoogleOAuthLoginUrl)}
        >
          <Image
            src="/images/contents/google.png"
            alt=""
            width={20}
            height={20}
            className={oauthLoginButtonIconClassName}
          />
          구글로 시작하기
        </button>
      </div>
    </div>
  );
}
