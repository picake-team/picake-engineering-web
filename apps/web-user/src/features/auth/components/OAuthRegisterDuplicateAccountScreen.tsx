"use client";

import Image from "next/image";
import { useCallback } from "react";
import { useAlertStore } from "@/apps/web-user/common/store/alert.store";
import Header from "@/apps/web-user/common/components/headers/Header";
import {
  AppleLogoIcon,
  OAuthAppleLoginButton,
  OAuthGoogleLoginButton,
  OAuthKakaoLoginButton,
  oauthLoginButtonIconClassName,
} from "@/apps/web-user/common/components/buttons/oauth-provider-login-buttons";
import {
  getAppleOAuthLoginUrl,
  getGoogleOAuthLoginUrl,
  getKakaoOAuthLoginUrl,
} from "@/apps/web-user/features/auth/utils/oauth-login-url.util";
import type { DuplicateAccountPayload } from "@/apps/web-user/features/auth/types/auth.dto";
import { trackEvent } from "@/apps/web-user/common/utils/analytics.util";

type OAuthRegisterDuplicateAccountScreenProps = {
  payload: DuplicateAccountPayload;
  onBack: () => void;
};

export function OAuthRegisterDuplicateAccountScreen({
  payload,
  onBack,
}: OAuthRegisterDuplicateAccountScreenProps) {
  const { showAlert } = useAlertStore();
  const provider = payload.provider;

  const handleLoginClick = useCallback(() => {
    trackEvent("engage_duplicate_login", { provider });
    const href =
      provider === "kakao"
        ? getKakaoOAuthLoginUrl()
        : provider === "apple"
          ? getAppleOAuthLoginUrl()
          : getGoogleOAuthLoginUrl();
    if (!href) {
      showAlert({
        type: "error",
        title: "오류",
        message: "로그인 설정을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
      });
      return;
    }
    window.location.href = href;
  }, [provider, showAlert]);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header variant="back-title" title="회원가입" onBackClick={onBack} />

      <div className="px-5 pt-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
        <h2 className="text-xl font-bold leading-snug tracking-tight text-[var(--grayscale-gr-900,#1F1F1E)]">
          이미 가입한 계정이 있어요.
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-[var(--grayscale-gr-500,#82817D)]">
          아래 계정으로 로그인해주세요.
          {provider !== "kakao" && payload.email && (
            <>
              <br />
              {provider === "google" ? "구글" : "Apple"} 계정을 고르는 화면에서{" "}
              <span className="font-medium text-[var(--grayscale-gr-900,#1F1F1E)]">
                {payload.email}
              </span>
              을 골라 주세요.
            </>
          )}
        </p>

        <div className="mt-8 rounded-[12px] border border-solid border-[var(--grayscale-gr-100,#EBEBEA)] bg-white px-[20px] py-[24px]">
          <dl className="flex flex-col gap-2">
            <div className="flex flex-row items-center gap-[40px]">
              <dt className="min-w-[80px] shrink-0 text-[14px] font-normal text-[var(--grayscale-gr-500,#82817D)]">
                이름
              </dt>
              <dd className="min-w-0 flex-1 text-left text-[14px] font-normal text-[var(--grayscale-gr-900,#1F1F1E)]">
                {payload.name}
              </dd>
            </div>
            <div className="flex flex-row items-center gap-[40px]">
              <dt className="min-w-[80px] shrink-0 text-[14px] font-normal text-[var(--grayscale-gr-500,#82817D)]">
                핸드폰 번호
              </dt>
              <dd className="min-w-0 flex-1 text-left text-[14px] font-normal tabular-nums text-[var(--grayscale-gr-900,#1F1F1E)]">
                {payload.phone}
              </dd>
            </div>
            <div className="flex flex-row items-center gap-[40px]">
              <dt className="min-w-[80px] shrink-0 text-[14px] font-normal text-[var(--grayscale-gr-500,#82817D)]">
                로그인수단
              </dt>
              <dd className="min-w-0 flex-1 text-left text-[14px] font-normal text-[var(--grayscale-gr-900,#1F1F1E)]">
                {provider === "google" ? "구글" : provider === "apple" ? "애플" : "카카오"}
              </dd>
            </div>
            {payload.email && (
              <div className="flex flex-row items-center gap-[40px]">
                <dt className="min-w-[80px] shrink-0 text-[14px] font-normal text-[var(--grayscale-gr-500,#82817D)]">
                  계정
                </dt>
                <dd className="min-w-0 flex-1 break-all text-left text-[14px] font-normal text-[var(--grayscale-gr-900,#1F1F1E)]">
                  {payload.email}
                </dd>
              </div>
            )}
          </dl>
        </div>

        <div className="mt-8 w-full">
          {provider === "kakao" ? (
            <OAuthKakaoLoginButton type="button" onClick={handleLoginClick}>
              <Image
                src="/images/contents/kakaotalk.png"
                alt=""
                width={20}
                height={20}
                className={oauthLoginButtonIconClassName}
              />
              카카오로 로그인
            </OAuthKakaoLoginButton>
          ) : provider === "apple" ? (
            <OAuthAppleLoginButton type="button" onClick={handleLoginClick}>
              <AppleLogoIcon />
              Apple로 로그인
            </OAuthAppleLoginButton>
          ) : (
            <OAuthGoogleLoginButton type="button" onClick={handleLoginClick}>
              <Image
                src="/images/contents/google.png"
                alt=""
                width={20}
                height={20}
                className={oauthLoginButtonIconClassName}
              />
              구글로 로그인
            </OAuthGoogleLoginButton>
          )}
        </div>
      </div>
    </div>
  );
}
