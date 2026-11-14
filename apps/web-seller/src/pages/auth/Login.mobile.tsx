/**
 * 휴대폰 로그인 (SC-61, 디자인 8-B): 로고 + 큰 문장 + 카카오·구글(·Apple)로 시작하기, 아래 "처음이세요?"(사장님 소개 페이지)·계정 찾기.
 * 버튼 문구·순서는 손님 앱과 같게(I-48 "로그인·가입은 손님 앱처럼"). 로고는 손님 웹과 같은 것.
 * 약관·개인정보 처리방침·버전은 이 화면에 두지 않는다(운영자 결정). 처리방침은 가입 화면 약관 동의와
 * 마이페이지에서, 버전은 마이페이지에서 본다. 심사용 로그인 입구는 버전 대신 로고: 2초 안에 10번 누르면
 * 심사용 로그인 창(SC-62)이 열린다. 사장님에게는 보이지 않는 입구라 누른 표시도 내지 않는다.
 */
import React, { useRef, useState } from "react";
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
import { ReviewLoginSheet } from "@/apps/web-seller/features/auth/components/mobile/ReviewLoginSheet";
import { SELLER_INTRO_URL } from "@/apps/web-seller/common/constants/seller-intro.constant";
import { externalHref } from "@/apps/web-seller/common/utils/webview.bridge";

const BTN =
  "flex h-12 w-full items-center justify-center gap-2 rounded-control text-body font-bold";

/** 심사용 로그인 입구: 로고를 이 시간 안에 이만큼 누르면 연다(손님 앱의 버전 10번과 같은 수) */
const REVIEW_TAP_COUNT = 10;
const REVIEW_TAP_WINDOW_MS = 2000;

export const LoginMobilePage: React.FC = () => {
  const [reviewOpen, setReviewOpen] = useState(false);
  const tapTimesRef = useRef<number[]>([]);

  const onLogoTap = () => {
    const now = Date.now();
    const recent = [...tapTimesRef.current, now].filter((t) => now - t <= REVIEW_TAP_WINDOW_MS);
    if (recent.length >= REVIEW_TAP_COUNT) {
      tapTimesRef.current = [];
      setReviewOpen(true);
      return;
    }
    tapTimesRef.current = recent;
  };

  return (
    <div
      className={cx(
        APP_COLUMN_CLASS,
        "flex min-h-dvh flex-col bg-white px-5 pt-[calc(env(safe-area-inset-top)+48px)] font-app text-ink-900",
      )}
    >
      <div className="flex flex-col gap-3">
        {/* 빠르게 눌러도 확대되지 않게(touch-manipulation), 누른 표시 없이 */}
        <button
          type="button"
          onClick={onLogoTap}
          className="mb-2 size-16 touch-manipulation select-none self-start [-webkit-tap-highlight-color:transparent]"
        >
          <img
            src={logoUrl}
            alt="Picake"
            width={64}
            height={64}
            className="size-16"
            draggable={false}
          />
        </button>
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
      <div className="flex items-center justify-center gap-3 pb-[max(20px,env(safe-area-inset-bottom))] pt-4 text-sub text-ink-600">
        {/* 처음 온 사장님이 무엇인지 볼 곳(기획 I-49). 글자는 "처음이세요?"만(운영자 11-14), 화면 읽기에는 가는 곳을 말한다.
            앱 안에서는 휴대폰 브라우저로 연다(앱 안에서 열면 돌아올 길이 없어서) */}
        <a
          href={externalHref(SELLER_INTRO_URL)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="처음이세요? 픽케이크 사장님 소개 보기"
          className="inline-flex min-h-11 items-center"
        >
          처음이세요?
        </a>
        <span aria-hidden className="h-3 w-px bg-ink-100" />
        <Link to={ROUTES.AUTH.FIND_ACCOUNT} className="inline-flex min-h-11 items-center">
          계정을 잊으셨나요?
        </Link>
      </div>
      <ReviewLoginSheet open={reviewOpen} onClose={() => setReviewOpen(false)} />
    </div>
  );
};
