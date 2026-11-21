/**
 * 판매자 앱("픽케이크 사장님")과 판매자 웹 사이의 약속. 정본은 app 레포 `docs/bridge-contract.md` §1.
 *
 * 앱은 우리 주소의 모든 페이지에 문서 맨 앞부터 `window.PicakeApp`을 넣는다. 없으면 휴대폰 브라우저·PC다.
 * 메서드는 모두 Promise로 답하고, 실패는 Error에 `code`를 달아 reject한다(앱이 5초 안에 준비되지 않으면 "unavailable").
 * 출시한 뒤에는 앱 버전이 섞이므로 나중에 생긴 기능(share·saveImage)은 메서드가 있는지로 고른다.
 * 손님 웹(`web-user` webview.bridge)도 같은 `window.PicakeApp`을 쓴다.
 */

/** 휴대폰 알림 허용 상태 */
export type PushPermission = "granted" | "denied" | "notDetermined";
/** 서버 `/fcm-tokens`에 보내는 이 휴대폰의 알림 토큰 */
export type PushRegistration = { token: string; deviceId: string };
type LatLng = { latitude: number; longitude: number };

export interface PicakeApp {
  app: "customer" | "seller";
  platform: "android" | "ios";
  version: string;
  build: string;

  getDeviceId(): Promise<string>;
  /** 알림이 허용일 때만 값, 아니면 null */
  getPushToken(): Promise<PushRegistration | null>;
  getPushPermission(): Promise<PushPermission>;
  /** 허용 창을 띄우고 결과(이미 정했으면 창 없이 지금 상태) */
  requestPushPermission(): Promise<PushPermission>;
  openSettings(type: "app" | "notification"): Promise<void>;
  /** 휴대폰 브라우저·그 앱으로 연다. 열 수 없으면 code "unsupported" */
  openExternal(url: string): Promise<void>;
  on(event: "pushToken", listener: (r: PushRegistration) => void): () => void;
  on(event: "pushPermission", listener: (status: PushPermission) => void): () => void;

  /** 손님 앱만 */
  getLocation?(onLastKnown?: (pos: LatLng) => void): Promise<LatLng>;
  /** 공유 창(본문 = url). 사용자가 닫아도 성공 */
  share?(data: { title?: string; url: string }): Promise<void>;
  /** 사진첩에 저장. 안내 문구는 웹이 띄운다. 권한 거부 code "denied", 그 밖 "failed" */
  saveImage?(src: string): Promise<void>;
}

declare global {
  interface Window {
    PicakeApp?: PicakeApp;
  }
}

function app(): PicakeApp | null {
  return typeof window !== "undefined" ? (window.PicakeApp ?? null) : null;
}

function errorCode(error: unknown): string | null {
  const code = (error as { code?: unknown } | null)?.code;
  return typeof code === "string" ? code : null;
}

/** 판매자 앱 안인지(window.PicakeApp이 있는지) */
export function isSellerAppWebView(): boolean {
  return app() !== null;
}

/** 이 화면이 어디서 쓰이는지(분석용): 앱 / 휴대폰 브라우저 / PC */
export function sellerSurface(isPhoneWidth: boolean): "app" | "mobile_web" | "pc" {
  if (isSellerAppWebView()) return "app";
  return isPhoneWidth ? "mobile_web" : "pc";
}

/** 앱 버전(앱이 아니면 null) */
export function appVersion(): string | null {
  return app()?.version || null;
}

/** 앱이 도는 휴대폰 OS(앱이 아니면 null) */
export function appPlatform(): "android" | "ios" | null {
  return app()?.platform ?? null;
}

// ── 알림 ──

/** 지금 알림 허용 상태(앱이 아니거나 앱이 답하지 못하면 null) */
export async function getPushPermission(): Promise<PushPermission | null> {
  const a = app();
  if (!a) return null;
  try {
    return await a.getPushPermission();
  } catch (error) {
    console.error("알림 허용 상태 확인 실패:", error);
    return null;
  }
}

/** 알림 허용 창을 띄우고 결과(앱이 아니거나 실패하면 null) */
export async function requestPushPermission(): Promise<PushPermission | null> {
  const a = app();
  if (!a) return null;
  try {
    return await a.requestPushPermission();
  } catch (error) {
    console.error("알림 허용 요청 실패:", error);
    return null;
  }
}

/** 휴대폰 설정의 이 앱 알림 설정을 연다 */
export async function openNotificationSettings(): Promise<void> {
  try {
    await app()?.openSettings("notification");
  } catch (error) {
    console.error("알림 설정 열기 실패:", error);
  }
}

/** 알림 허용 상태가 바뀌면(앱이 앞으로 올 때마다) 알려 준다. 끊는 함수를 돌려준다 */
export function onPushPermission(listener: (status: PushPermission) => void): () => void {
  return app()?.on("pushPermission", listener) ?? (() => {});
}

/** 알림 토큰이 바뀌면 알려 준다(허용일 때만). 끊는 함수를 돌려준다 */
export function onPushToken(listener: (r: PushRegistration) => void): () => void {
  return app()?.on("pushToken", listener) ?? (() => {});
}

/** 이 휴대폰의 알림 토큰(허용이 아니거나 앱이 아니면 null) */
export async function getPushRegistration(): Promise<PushRegistration | null> {
  const a = app();
  if (!a) return null;
  try {
    return cleanRegistration(await a.getPushToken());
  } catch (error) {
    console.error("알림 토큰 가져오기 실패:", error);
    return null;
  }
}

function cleanRegistration(r: PushRegistration | null | undefined): PushRegistration | null {
  const token = r?.token?.trim();
  const deviceId = r?.deviceId?.trim();
  return token && deviceId ? { token, deviceId } : null;
}

/**
 * 이 휴대폰을 알림 받을 곳으로 등록한다. 같은 토큰·기기는 한 번만 보내고, 보내지 못했으면(send가 false·실패) 다음에 다시 보낸다.
 * `register(r)`에 값을 주면 그 값을(pushToken 이벤트), 없으면 앱에 묻는다. 로그아웃하면 `reset()`(다음 로그인에 다시 보내게).
 */
export function createPushRegistrar(send: (r: PushRegistration) => Promise<boolean>) {
  let sent: string | null = null;
  return {
    async register(given?: PushRegistration) {
      const r = given ? cleanRegistration(given) : await getPushRegistration();
      if (!r) return;
      const key = `${r.token}\n${r.deviceId}`;
      if (sent === key) return;
      sent = key;
      let ok = false;
      try {
        ok = await send(r);
      } catch (error) {
        console.error("알림 토큰 저장 실패:", error);
      }
      if (!ok && sent === key) sent = null;
    },
    reset() {
      sent = null;
    },
  };
}

/**
 * 로그아웃 전에 서버에서 이 기기의 알림 토큰을 지운다(기기 ID → send). 앱이 답하지 않거나 서버가 늦어도
 * `maxMs` 안에 끝난다(실패해도 reject하지 않는다 — 로그아웃은 늘 이어지게).
 */
export async function unregisterDevice(
  send: (deviceId: string) => Promise<unknown>,
  maxMs: number,
): Promise<void> {
  const a = app();
  if (!a) return;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const work = (async () => {
    const deviceId = (await a.getDeviceId())?.trim();
    if (deviceId) await send(deviceId);
  })().catch((error) => console.error("알림 토큰 해제 실패:", error));
  const timeout = new Promise<void>((resolve) => {
    timer = setTimeout(resolve, maxMs);
  });
  await Promise.race([work, timeout]);
  clearTimeout(timer);
}

// ── 바깥 링크·공유·사진 ──

/** 앱이 휴대폰 브라우저·그 앱으로 연다. 앱이 아니거나 열 수 없으면 false(화면이 대신할 길을 보인다) */
export async function openExternal(url: string): Promise<boolean> {
  const a = app();
  if (!a) return false;
  try {
    await a.openExternal(url);
    return true;
  } catch (error) {
    if (errorCode(error) !== "unsupported") console.error("바깥 링크 열기 실패:", error);
    return false;
  }
}

/** 공유 창(앱) → 휴대폰 브라우저 공유 창 → 안 되면 false(화면이 복사로) */
export async function shareViaDevice(title: string, url: string): Promise<boolean> {
  const a = app();
  if (a && typeof a.share === "function") {
    try {
      await a.share({ title, url });
      return true;
    } catch (error) {
      console.error("앱 공유 창 실패:", error);
    }
  }
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

/** 앱이 사진첩에 저장할 수 있는지(아니면 화면이 브라우저 다운로드로) */
export function canSaveImageToDevice(): boolean {
  return typeof app()?.saveImage === "function";
}

/** 사진첩에 저장(앱). 결과 안내는 부르는 쪽이 띄운다 */
export async function saveImageToDevice(src: string): Promise<"saved" | "denied" | "failed"> {
  const a = app();
  if (typeof a?.saveImage !== "function") return "failed";
  try {
    await a.saveImage(src);
    return "saved";
  } catch (error) {
    if (errorCode(error) === "denied") return "denied";
    console.error("사진 저장 실패:", error);
    return "failed";
  }
}
