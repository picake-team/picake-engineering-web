/**
 * 휴대폰 로그인 (SC-61, 디자인 8-B): 로고 + 큰 문장 + 카카오·구글(·Apple)로 시작하기, 계정 찾기.
 * 버튼 문구·순서는 손님 앱과 같게(I-48 "로그인·가입은 손님 앱처럼"). 로고는 손님 웹과 같은 것.
 * 약관·개인정보 처리방침·버전은 이 화면에 두지 않는다(운영자 결정 2026-11-06). 처리방침은 가입 화면 약관 동의와
 * 마이페이지에서, 버전은 마이페이지에서 본다. 심사용 로그인 입구는 버전 대신 로고(2초 안에 10번)로 심사용 로그인 단계에서 붙인다.
 */
import React from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/apps/web-seller/common/constants/route-paths.constant";
import { APP_COLUMN_CLASS } from "@/apps/web-seller/common/ui/Screen";
import { cx } from "@/apps/web-seller/common/ui/cx";
import googleIcon from "@/apps/web-seller/assets/images/google.png";
import logoUrl from "@/apps/web-seller/assets/images/logo_picake.svg";
import kakaoIcon from "@/apps/web-seller/assets/images/kakaotalk.png";
import {
  SELLER_APPLE_LOGIN_ENABLED,
  googleAuthorizeUrl,
  kakaoAuthorizeUrl,
} from "@/apps/web-seller/features/auth/components/mobile/socialLogin";

const BTN =
  "flex h-12 w-full items-center justify-center gap-2 rounded-control text-body font-bold";

export const LoginMobilePage: React.FC = () => {
  return (
    <div
      className={cx(
        APP_COLUMN_CLASS,
        "flex min-h-dvh flex-col bg-white px-5 pt-[calc(env(safe-area-inset-top)+48px)] font-app text-ink-900",
      )}
    >
      <div className="flex flex-col gap-3">
        <img
          src={logoUrl}
          alt="Picake"
          width={64}
          height={64}
          className="mb-2 size-16 select-none"
          draggable={false}
        />
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
      </div>
    </div>
  );
};
