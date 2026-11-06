/**
 * 판매자 앱("픽케이크 사장님", Flutter 웹뷰)과 판매자 웹 사이의 브릿지.
 *
 * 손님 앱과 같은 이름(웹 → 앱 `requestFcmTokenUpsert`·`requestFcmTokenRemove`·`openAppSettings`,
 * 앱 → 웹 `window.FcmToken.upsert/remove`, 바깥 링크 `apps://`)을 그대로 쓴다(구조 가이드 "앱 구조 원칙").
 * 판매자 앱에서 새로 필요한 것(알림 허용 묻기·상태, 공유 창, 사진 저장, 앱 버전)은 아래 이름으로 앱담당자에게
 * 요청한다. 앱이 그 채널을 넣지 않았으면(휴대폰 브라우저 등) 웹은 조용히 다른 방법으로 넘어간다.
 * 웹은 "앱 안인가"가 아니라 "그 기능을 쓸 수 있나"로 확인한다.
 */

type Channel = { postMessage: (message: string) => void };

/** 앱이 알려 주는 휴대폰 알림 허용 상태 */
export type PushPermission = "granted" | "denied" | "notDetermined";

declare global {
  interface Window {
    // 손님 앱과 같은 채널
    requestFcmTokenUpsert?: Channel;
    requestFcmTokenRemove?: Channel;
    openAppSettings?: Channel;
    FcmToken?: {
      upsert: (fcmToken: { token: string; deviceId: string }) => void;
      remove: (fcmToken: { deviceId: string }) => void;
    };
    // 판매자 앱에서 새로 넣는 채널(앱담당자 요청)
    /** 휴대폰 알림 허용 창을 띄운다 → 끝나면 window.receivePushPermission(상태) */
    requestPushPermission?: Channel;
    /** 지금 허용 상태를 묻는다 → window.receivePushPermission(상태) */
    getPushPermission?: Channel;
    receivePushPermission?: (status: PushPermission) => void;
    /** 휴대폰 공유 창. 메시지는 JSON {"title","url"} */
    shareLink?: Channel;
    /** 사진을 휴대폰 사진첩에 저장. 메시지는 사진 주소 */
    saveImage?: Channel;
    /** 앱이 처음 열 때 넣어 주는 정보(앱 버전·OS) */
    PicakeSellerApp?: { version?: string; platform?: "ios" | "android" };
  }
}

function post(channel: Channel | undefined, message: string): boolean {
  if (!channel) return false;
  try {
    channel.postMessage(message);
    return true;
  } catch (error) {
    console.error("앱 브릿지 호출 실패:", error);
    return false;
  }
}

/** 판매자 앱 안인지(알림 토큰 채널이 있는지) */
export function isSellerAppWebView(): boolean {
  return typeof window !== "undefined" && typeof window.requestFcmTokenUpsert !== "undefined";
}

/** 로그인 직후: 앱에 이 휴대폰의 알림 토큰을 달라고 한다(→ window.FcmToken.upsert) */
export function requestFcmTokenUpsert(): boolean {
  return post(window.requestFcmTokenUpsert, "true");
}

/** 로그아웃할 때: 앱에 알림 토큰 해제를 부탁한다(→ window.FcmToken.remove) */
export function requestFcmTokenRemove(): boolean {
  return post(window.requestFcmTokenRemove, "true");
}

/** 휴대폰 설정(이 앱의 알림 설정)을 연다 */
export function openAppSettings(): boolean {
  return post(window.openAppSettings, "true");
}

export function canAskPushPermission(): boolean {
  return typeof window !== "undefined" && typeof window.requestPushPermission !== "undefined";
}

export function requestPushPermission(): boolean {
  return post(window.requestPushPermission, "true");
}

export function askPushPermissionStatus(): boolean {
  return post(window.getPushPermission, "true");
}

/** 공유 창(앱) → 휴대폰 브라우저 공유 창 → 안 되면 false(화면이 복사로) */
export async function shareViaDevice(title: string, url: string): Promise<boolean> {
  if (post(window.shareLink, JSON.stringify({ title, url }))) return true;
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({ title, url });
      return true;
    } catch (e) {
      // 사용자가 닫은 것도 공유를 끝낸 것으로 본다
      if (e instanceof DOMException && e.name === "AbortError") return true;
    }
  }
  return false;
}

/** 사진첩에 저장(앱). 앱이 아니면 false(화면이 다운로드로) */
export function saveImageToDevice(url: string): boolean {
  return post(window.saveImage, url);
}

/** 앱 버전(앱이 알려 주지 않으면 null) */
export function appVersion(): string | null {
  return typeof window !== "undefined" ? (window.PicakeSellerApp?.version ?? null) : null;
}

/** 바깥 링크를 앱이 가로채 휴대폰 브라우저·그 앱으로 열게 한다(손님 앱과 같은 `apps://`) */
export const EXTERNAL_APP_SCHEME_PREFIX = "apps://";

export function externalHref(webUrl: string): string {
  return isSellerAppWebView() ? `${EXTERNAL_APP_SCHEME_PREFIX}${webUrl}` : webUrl;
}

/** 이 화면이 어디서 쓰이는지(분석용): 앱 / 휴대폰 브라우저 / PC */
export function sellerSurface(isPhoneWidth: boolean): "app" | "mobile_web" | "pc" {
  if (isSellerAppWebView()) return "app";
  return isPhoneWidth ? "mobile_web" : "pc";
}
