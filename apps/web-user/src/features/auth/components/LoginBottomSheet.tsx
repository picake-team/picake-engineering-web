"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { DragHandleBottomSheet } from "@/apps/web-user/common/components/bottom-sheets/DragHandleBottomSheet";
import {
  AppleLogoIcon,
  NaverLogoIcon,
  oauthAppleLoginButtonClassName,
  oauthGoogleLoginButtonClassName,
  oauthKakaoLoginButtonClassName,
  oauthLoginButtonIconClassName,
  oauthNaverLoginButtonClassName,
} from "@/apps/web-user/common/components/buttons/oauth-provider-login-buttons";
import {
  getAppleOAuthLoginUrl,
  getGoogleOAuthLoginUrl,
  getKakaoOAuthLoginUrl,
  getNaverOAuthLoginUrl,
} from "@/apps/web-user/features/auth/utils/oauth-login-url.util";
import { useLoginSheetStore } from "@/apps/web-user/common/store/login-sheet.store";
import { setPostLoginRedirect } from "@/apps/web-user/features/auth/utils/post-login-redirect.util";
import { trackEvent } from "@/apps/web-user/common/utils/analytics.util";
import { RecentLoginBubble } from "@/apps/web-user/features/auth/components/RecentLoginBubble";
import { useLastLoginProvider } from "@/apps/web-user/features/auth/hooks/useLastLoginProvider";

/**
 * 비로그인 사용자에게 노출되는 로그인 / 회원가입 바텀시트.
 * 카카오·네이버·구글·애플 OAuth 시작 버튼 노출(네이버는 키가 있는 환경만).
 *
 * 전역 useLoginSheetStore 로 isOpen/close 를 관리하며, RootWrapperLayout 에 1회만 마운트된다.
 * 각 화면에서는 useLoginSheetStore().openLoginSheet() 으로 호출.
 */
export function LoginBottomSheet() {
  const isOpen = useLoginSheetStore((s) => s.isOpen);
  const entryPoint = useLoginSheetStore((s) => s.entryPoint);
  const closeLoginSheet = useLoginSheetStore((s) => s.closeLoginSheet);
  const lastProvider = useLastLoginProvider(isOpen);
  const [googleAuthHref, setGoogleAuthHref] = useState<string | null>(null);
  const [kakaoAuthHref, setKakaoAuthHref] = useState<string | null>(null);
  const [naverAuthHref, setNaverAuthHref] = useState<string | null>(null);
  const [appleAuthHref, setAppleAuthHref] = useState<string | null>(null);

  // 창을 열 때마다 로그인 주소를 새로 만든다 — 네이버 state는 통과하면 지워지므로(취소로 돌아온 값은 남김) 주소를 다시 만들어야
  // 다음 로그인이 새 값을 쓴다. 네이버 버튼은 누를 때 한 번 더 만든다(창을 오래 열어 둬도 30분 안, 11-16 검토)
  useEffect(() => {
    if (!isOpen) return;
    setGoogleAuthHref(getGoogleOAuthLoginUrl());
    setKakaoAuthHref(getKakaoOAuthLoginUrl());
    setNaverAuthHref(getNaverOAuthLoginUrl());
    setAppleAuthHref(getAppleOAuthLoginUrl());
  }, [isOpen]);

  // 로그인/회원가입 진입 화면 노출
  useEffect(() => {
    if (isOpen && entryPoint) {
      trackEvent("view_login_entry", { entry_point: entryPoint });
    }
  }, [isOpen, entryPoint]);

  return (
    <DragHandleBottomSheet
      isOpen={isOpen}
      // 예약 창 위에서도 열린다(로그인 없이 다 고른 뒤 "로그인하고 예약신청", I-59 A)
      zIndexClassName="z-sheet-over"
      onClose={closeLoginSheet}
      ariaLabel="로그인 / 회원가입 하기"
    >
      <div className="px-5 py-4">
        <h2 className="text-xl font-bold text-gray-900">로그인 / 회원가입 하기</h2>
        <p className="mt-2 text-sm text-gray-500">픽케이크에서 케이크 예약을 쉽고 빠르게</p>

        <div className="mt-8 flex flex-col gap-3">
          {kakaoAuthHref && (
            <a
              href={kakaoAuthHref}
              className={oauthKakaoLoginButtonClassName}
              onClick={() => {
                setPostLoginRedirect();
                trackEvent("engage_social_select", { provider: "kakao" });
              }}
            >
              <Image
                src="/images/contents/kakaotalk.png"
                alt=""
                width={20}
                height={20}
                className={oauthLoginButtonIconClassName}
              />
              카카오로 시작하기
              {lastProvider === "kakao" && <RecentLoginBubble />}
            </a>
          )}
          {naverAuthHref && (
            <a
              href={naverAuthHref}
              className={oauthNaverLoginButtonClassName}
              onClick={(e) => {
                // 누를 때 주소를 다시 만든다 — 창을 연 뒤 오래 있어도 state가 30분 안이게(11-16 검토)
                const fresh = getNaverOAuthLoginUrl();
                if (fresh) e.currentTarget.href = fresh;
                setPostLoginRedirect();
                trackEvent("engage_social_select", { provider: "naver" });
              }}
            >
              <NaverLogoIcon />
              네이버로 시작하기
              {lastProvider === "naver" && <RecentLoginBubble />}
            </a>
          )}
          {googleAuthHref && (
            <a
              href={googleAuthHref}
              className={oauthGoogleLoginButtonClassName}
              onClick={() => {
                setPostLoginRedirect();
                trackEvent("engage_social_select", { provider: "google" });
              }}
            >
              <Image
                src="/images/contents/google.png"
                alt=""
                width={20}
                height={20}
                className={oauthLoginButtonIconClassName}
              />
              구글로 시작하기
              {lastProvider === "google" && <RecentLoginBubble />}
            </a>
          )}
          {appleAuthHref && (
            <a
              href={appleAuthHref}
              className={oauthAppleLoginButtonClassName}
              onClick={() => {
                setPostLoginRedirect();
                trackEvent("engage_social_select", { provider: "apple" });
              }}
            >
              <AppleLogoIcon />
              Apple로 계속하기
              {lastProvider === "apple" && <RecentLoginBubble />}
            </a>
          )}
        </div>
      </div>
    </DragHandleBottomSheet>
  );
}
