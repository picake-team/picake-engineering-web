"use client";

import { useEffect } from "react";
import { isWebViewEnvironment } from "@/apps/web-user/common/utils/webview.bridge";

/**
 * iOS에서 Universal Links 대신 커스텀 스킴(`picake://`)으로 앱을 여는 브릿지.
 *
 * iOS는 Universal Links로 앱이 열려도 웹뷰 네비게이션 직후 앱을 백그라운드로 내리고 Safari를
 * 다시 띄우는 자체 동작이 있어(2026-08-03 앱담당자 확인, `ios-universal-links.constant.ts` 참고),
 * 알림톡 버튼이 여는 `/order/*`, `/mypage/order`, `/mypage/reviews/write`, `/quote/:requestId`에서
 * 이 컴포넌트를 마운트해 현재 경로+쿼리를 `picake://`로 즉시 리다이렉트합니다. 앱이 설치되어 있지
 * 않으면 커스텀 스킴 navigation이 조용히 무시되고 현재 웹페이지가 그대로 보입니다(에러 없음).
 *
 * 이미 손님 앱(웹뷰) 안이면 넘기지 않습니다(2026-11-11). 앱 웹뷰의 UA에도 iPhone이 들어 있어,
 * 막지 않으면 앱 안에서 같은 화면을 `picake://`로 다시 열려고 합니다.
 *
 * iOS 사파리는 iframe을 통한 커스텀 스킴 호출을 차단하므로 반드시 `location.href` 방식을 씁니다.
 */
export function IosCustomSchemeRedirect() {
  useEffect(() => {
    if (!/iPhone|iPad|iPod/.test(window.navigator.userAgent)) return;
    if (isWebViewEnvironment()) return;

    const { pathname, search } = window.location;
    window.location.href = `picake://${pathname.replace(/^\//, "")}${search}`;
  }, []);

  return null;
}
