/**
 * 휴대폰 로그인 (SC-61, 디자인 8-B): 로고 + 큰 문장 + 카카오·네이버·구글(·Apple)로 시작하기(네이버는 키가 있는 환경만), 아래 "처음이세요?"(사장님 소개 페이지)·계정 찾기.
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
  SELLER_NAVER_LOGIN_ENABLED,
  SOCIAL_LOGIN_ICON_CLASS,
  SOCIAL_LOGIN_NAVER_ICON_CLASS,
  googleAuthorizeUrl,
  kakaoAuthorizeUrl,
  naverAuthorizeUrl,
  refreshNaverHrefOnClick,
} from "@/apps/web-seller/features/auth/components/mobile/socialLogin";
import { NaverLogoIcon } from "@/apps/web-seller/common/components/icons/NaverLogoIcon";
import { ReviewLoginSheet } from "@/apps/web-seller/features/auth/components/mobile/ReviewLoginSheet";
import { SELLER_INTRO_URL } from "@/apps/web-seller/common/constants/seller-intro.constant";
import { isSellerAppWebView } from "@/apps/web-seller/common/utils/webview.bridge";
import { externalLinkProps } from "@/apps/web-seller/common/utils/app-actions.util";
import { useShowMobileScreens } from "@/apps/web-seller/common/hooks/useShowMobileScreens";
import { BusinessInfoLines } from "@/apps/web-seller/features/auth/components/BusinessInfoLines";
import { RecentLoginBubble } from "@/apps/web-seller/features/auth/components/RecentLoginBubble";
import { readLastLoginProvider } from "@/apps/web-seller/features/auth/utils/last-login-provider.util";

const BTN =
  "relative flex h-12 w-full items-center justify-center rounded-control text-body font-bold";

/** 심사용 로그인 입구: 로고를 이 시간 안에 이만큼 누르면 연다(손님 앱의 버전 10번과 같은 수) */
const REVIEW_TAP_COUNT = 10;
const REVIEW_TAP_WINDOW_MS = 2000;

export const LoginMobilePage: React.FC = () => {
  const [reviewOpen, setReviewOpen] = useState(false);
  // 이 기기에서 마지막으로 로그인한 방법 — 그 버튼에 "최근 로그인" 말풍선
  const [lastProvider] = useState(readLastLoginProvider);
  const tapTimesRef = useRef<number[]>([]);
  // 앱 안(아이패드 포함)은 늘 휴대폰 모양: 사업자 정보 줄은 PC 브라우저 로그인에만
  const wide = !useShowMobileScreens() && !isSellerAppWebView();

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
        wide
          ? // PC(넓은 브라우저): 같은 화면을 좁은 칸으로 가운데에, 아래에 사업자 정보 줄(2026-11-20 운영자 결정)
            "mx-auto flex min-h-dvh w-full max-w-narrow flex-col justify-center bg-white px-5 py-12 font-app text-ink-900"
          : cx(
              APP_COLUMN_CLASS,
              "flex min-h-dvh flex-col bg-white px-5 pt-[env(safe-area-inset-top)] font-app text-ink-900",
            ),
      )}
    >
      {/* 로고 + "픽케이크 사장님"을 가운데 크게(운영자 2026-11-21 시안 C — 요기요·땡겨요 사장님처럼, 손님 앱과 구분).
          휴대폰은 남는 높이의 가운데, PC는 버튼 위에 */}
      <div
        className={cx(
          "flex flex-col items-center gap-2.5 text-center",
          wide ? "" : "flex-1 justify-center pb-8",
        )}
      >
        {/* 빠르게 눌러도 확대되지 않게(touch-manipulation), 누른 표시 없이. 10번 누르면 심사용 로그인 */}
        <button
          type="button"
          onClick={onLogoTap}
          className="mb-1 size-[84px] touch-manipulation select-none [-webkit-tap-highlight-color:transparent]"
        >
          <img
            src={logoUrl}
            alt="Picake"
            width={84}
            height={84}
            className="size-[84px]"
            draggable={false}
          />
        </button>
        <h1 className="text-number font-extrabold tracking-[-0.03em]">
          픽케이크 <span className="text-brand">사장님</span>
        </h1>
        <p className="text-body text-ink-600">새 예약을 휴대폰으로 바로 받아 보세요</p>
      </div>
      {wide ? <div className="h-10" /> : null}
      <div className="flex flex-col gap-3" role="group" aria-label="로그인">
        <a href={kakaoAuthorizeUrl()} className={cx(BTN, "bg-kakao text-ink-900")}>
          <img src={kakaoIcon} alt="" width={20} height={20} className={SOCIAL_LOGIN_ICON_CLASS} />
          카카오로 시작하기
          {lastProvider === "kakao" && <RecentLoginBubble />}
        </a>
        {SELLER_NAVER_LOGIN_ENABLED ? (
          <a
            href={naverAuthorizeUrl()}
            onClick={refreshNaverHrefOnClick}
            className={cx(BTN, "bg-naver text-white")}
          >
            <NaverLogoIcon className={SOCIAL_LOGIN_NAVER_ICON_CLASS} />
            네이버로 시작하기
            {lastProvider === "naver" && <RecentLoginBubble />}
          </a>
        ) : null}
        <a
          href={googleAuthorizeUrl()}
          className={cx(BTN, "border border-ink-100 bg-white text-ink-900")}
        >
          <img src={googleIcon} alt="" width={20} height={20} className={SOCIAL_LOGIN_ICON_CLASS} />
          구글로 시작하기
          {lastProvider === "google" && <RecentLoginBubble />}
        </a>
        {SELLER_APPLE_LOGIN_ENABLED ? (
          <button type="button" className={cx(BTN, "bg-black text-white")}>
            Apple로 시작하기
            {lastProvider === "apple" && <RecentLoginBubble />}
          </button>
        ) : null}
      </div>
      <div className="flex items-center justify-center gap-3 pb-[max(20px,env(safe-area-inset-bottom))] pt-4 text-sub text-ink-600">
        {/* 처음 온 사장님이 무엇인지 볼 곳(기획 I-49). 글자는 "처음이세요?"만(운영자 11-14), 화면 읽기에는 가는 곳을 말한다.
            앱 안에서는 휴대폰 브라우저로 연다(앱 안에서 열면 돌아올 길이 없어서) */}
        <a
          {...externalLinkProps(SELLER_INTRO_URL)}
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
      {wide ? (
        <div className="mt-6">
          <BusinessInfoLines />
        </div>
      ) : null}
      <ReviewLoginSheet open={reviewOpen} onClose={() => setReviewOpen(false)} />
    </div>
  );
};
