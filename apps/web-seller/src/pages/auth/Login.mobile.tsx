/**
 * 휴대폰 로그인 (SC-61, 디자인 8-B): 큰 문장 + 카카오·구글(·Apple)로 시작하기, 계정 찾기, 약관, 버전.
 * 버튼 문구·순서는 손님 앱과 같게(I-48 "로그인·가입은 손님 앱처럼"). 심사용 입구(버전 10번)는 심사용 로그인 단계에서.
 */
import React from "react";
import { appVersion } from "@/apps/web-seller/common/utils/webview.bridge";
import { Link } from "react-router-dom";
import { ROUTES } from "@/apps/web-seller/common/constants/route-paths.constant";
import { APP_COLUMN_CLASS } from "@/apps/web-seller/common/ui/Screen";
import { cx } from "@/apps/web-seller/common/ui/cx";
import googleIcon from "@/apps/web-seller/assets/images/google.png";
import kakaoIcon from "@/apps/web-seller/assets/images/kakaotalk.png";
import {
  SELLER_APPLE_LOGIN_ENABLED,
  googleAuthorizeUrl,
  kakaoAuthorizeUrl,
} from "@/apps/web-seller/features/auth/components/mobile/socialLogin";

const BTN =
  "flex h-13 w-full items-center justify-center gap-2 rounded-control text-body font-bold";

export const LoginMobilePage: React.FC = () => {
  const sha = import.meta.env.VITE_PUBLIC_GITHUB_SHA?.trim();
  return (
    <div
      className={cx(
        APP_COLUMN_CLASS,
        "flex min-h-dvh flex-col bg-white px-5 pt-[calc(env(safe-area-inset-top)+56px)] font-app text-ink-900",
      )}
    >
      <div className="flex flex-col gap-4">
        <h1 className="text-title font-bold">
          새 예약을
          <br />
          휴대폰으로 바로
          <br />
          받아 보세요
        </h1>
        <p className="text-sub text-ink-600">픽케이크 사장님</p>
      </div>
      <div className="flex-1" />
      <div className="flex flex-col gap-3" role="group" aria-label="로그인">
        <a href={kakaoAuthorizeUrl()} className={cx(BTN, "bg-kakao text-ink-900")}>
          <img src={kakaoIcon} alt="" width={20} height={20} className="size-5" />
          카카오로 시작하기
        </a>
        <a
          href={googleAuthorizeUrl()}
          className={cx(BTN, "border border-ink-100 bg-white text-ink-900")}
        >
          <img src={googleIcon} alt="" width={20} height={20} className="size-5" />
          구글로 시작하기
        </a>
        {SELLER_APPLE_LOGIN_ENABLED ? (
          <button type="button" className={cx(BTN, "bg-black text-white")}>
            Apple로 시작하기
          </button>
        ) : null}
      </div>
      <div className="flex flex-col items-center gap-2 pb-[max(20px,env(safe-area-inset-bottom))] pt-4">
        <Link
          to={ROUTES.AUTH.FIND_ACCOUNT}
          className="inline-flex min-h-11 items-center text-sub text-ink-600"
        >
          계정을 잊으셨나요?
        </Link>
        <div className="flex items-center justify-center gap-2 text-caption text-ink-600">
          <Link to={ROUTES.TERMS.TERMS_OF_SERVICE} className="inline-flex min-h-11 items-center">
            서비스 이용약관
          </Link>
          <span aria-hidden="true">·</span>
          <Link to={ROUTES.TERMS.PRIVACY_POLICY} className="inline-flex min-h-11 items-center">
            개인정보 처리방침
          </Link>
        </div>
        <span className="text-caption text-ink-600">
          버전 {appVersion() ?? `웹${sha ? ` ${sha.slice(0, 7)}` : ""}`}
        </span>
      </div>
    </div>
  );
};
