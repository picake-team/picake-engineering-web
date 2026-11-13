import { NODE_ENV, type NodeEnv } from "@/apps/web-user/common/constants/environment.constants";

/**
 * iOS Universal Links용 apple-app-site-association(AASA) 설정.
 *
 * - 검증: `https://staging.picakes.com/.well-known/apple-app-site-association`
 * - 상용: `https://picakes.com/.well-known/apple-app-site-association`
 * - 알림톡 WL 버튼(`https://#{도메인}/order/...`)이 앱으로 열리려면
 *   해당 도메인에 이 파일이 노출되고, iOS 앱에 Associated Domains(`applinks:`)
 *   capability와 도메인 등록이 되어 있어야 합니다.
 *   (Android의 assetlinks.json / intent-filter autoVerify와 대응하는 설정입니다.
 *   {@link ../../.well-known/assetlinks.json/route.ts})
 *
 * `appID`는 `{Apple Team ID}.{Bundle ID}` 형식입니다. Team ID(`S5AJRJ2DLR`)는
 * Sign in with Apple 설정 때 받은 것과 같은 Apple Developer 계정입니다.
 *
 * ⚠️ **iOS Universal Links는 현재 비활성화 상태입니다(2026-08-03, 앱담당자 확인).**
 * Universal Links로 앱이 열리면 웹뷰 네비게이션 직후(~1초) iOS가 자체적으로 앱을 백그라운드로
 * 내리고 Safari를 다시 띄우는 현상이 확인됐습니다(카카오톡·메모 앱 등 진입 경로 무관하게 재현,
 * 앱 쪽 코드에 외부 브라우저를 여는 경로 없음 확인 — iOS 자체 동작으로 판단). 대신 커스텀 스킴
 * (`picake://`)으로 전환했습니다 — `common/components/deep-link/IosCustomSchemeRedirect.tsx`가
 * `/order/*`, `/mypage/order`, `/mypage/reviews/write`, `/quote/:requestId`, `/chat/:threadId`에서 이 URL의 경로+쿼리를 그대로
 * `picake://`로 바꿔 리다이렉트합니다. 이 파일의 `IOS_APP_ID_BY_ENV`는 그래서 빈 문자열로
 * 두어(아래 `getAppleAppSiteAssociation`이 `details: []`를 반환) AASA에서 appID 자체를
 * 아예 선언하지 않습니다 — Bundle ID는 이미 확인해뒀으니(`com.product.picake`, 환경 공용),
 * 나중에 Universal Links를 다시 켜려면 `IOS_APP_ID` 값을 `IOS_APP_ID_BY_ENV`에 다시 채우면 됩니다.
 */
export type AppleAppSiteAssociationDetail = {
  appIDs: string[];
  components: Array<{ "/": string; "?"?: Record<string, string>; comment?: string }>;
};

export type AppleAppSiteAssociation = {
  applinks: {
    details: AppleAppSiteAssociationDetail[];
  };
};

/**
 * 알림톡 WL 버튼 등에서 앱으로 열려야 하는 경로 패턴.
 * `USER_ORDER_ALIMTALK_BUTTON_URLS`·`scripts/alimtalk-templates/templates.json`(backend), `paths.constant.ts`(web-user) 기준.
 * 범위를 넓히거나 좁힐 때는 두 상수와 함께 맞춰주세요.
 */
const UNIVERSAL_LINK_COMPONENTS: AppleAppSiteAssociationDetail["components"] = [
  { "/": "/order/*", comment: "주문 상세/취소 (알림톡 [주문 상세보기], [입금 완료하기])" },
  {
    "/": "/mypage/reviews/write",
    "?": { orderId: "*" },
    comment: "리뷰 작성 (알림톡 [후기 작성하기])",
  },
  { "/": "/mypage/order", comment: "내 주문 목록" },
  { "/": "/quote/*", comment: "견적 요청 상세 (알림톡 [견적 보기])" },
  { "/": "/chat/*", comment: "채팅방 (알림톡 [답변 보기])" },
];

/** Team ID + Bundle ID — 환경 구분 없이 공용(위 주석 참고). 확인된 값이지만 현재 미사용(아래 참고). */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const IOS_APP_ID = "S5AJRJ2DLR.com.product.picake";

/**
 * 환경별 `{Team ID}.{Bundle ID}`. 비어 있으면 해당 환경 응답에서 제외됩니다.
 * 현재 둘 다 비워서 Universal Links를 껐습니다 — 재활성화 시 `IOS_APP_ID`를 채워 넣으세요.
 */
const IOS_APP_ID_BY_ENV: Record<typeof NODE_ENV.STAGING | typeof NODE_ENV.PRODUCTION, string> = {
  [NODE_ENV.STAGING]: "",
  [NODE_ENV.PRODUCTION]: "",
};

/** `NEXT_PUBLIC_NODE_ENV` 기준으로 노출할 apple-app-site-association을 반환합니다. */
export function getAppleAppSiteAssociation(nodeEnv?: string | null): AppleAppSiteAssociation {
  const env = (nodeEnv ?? process.env.NEXT_PUBLIC_NODE_ENV ?? "") as NodeEnv;
  const appId =
    env === NODE_ENV.PRODUCTION
      ? IOS_APP_ID_BY_ENV[NODE_ENV.PRODUCTION]
      : IOS_APP_ID_BY_ENV[NODE_ENV.STAGING];

  const details: AppleAppSiteAssociationDetail[] = appId
    ? [{ appIDs: [appId], components: UNIVERSAL_LINK_COMPONENTS }]
    : [];

  return { applinks: { details } };
}
