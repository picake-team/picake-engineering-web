/**
 * PC 브라우저 알림(기획 I-54, 운영자 결정 2026-11-19 "PC에만").
 *
 * 탭이 뒤에 있거나 다른 창을 보고 있어도 새 예약·손님 채팅·스토어 안내를 운영체제 알림(화면 구석)으로 띄운다.
 * 화면을 보고 있으면 화면 안 위쪽 안내 띠로 충분해서 띄우지 않는다. 휴대폰 앱은 휴대폰 알림(FCM)이 있어 쓰지 않는다.
 * 켜고 끄기는 이 기기(브라우저)에만 둔다 — 허용도 브라우저마다 따로 받기 때문이다.
 */
const STORAGE_KEY = "picake:seller-browser-notify";

export type BrowserNotifyPermission = NotificationPermission | "unsupported";

export function browserNotifySupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function browserNotifyPermission(): BrowserNotifyPermission {
  if (!browserNotifySupported()) return "unsupported";
  return window.Notification.permission;
}

export function isBrowserNotifyOn(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "on";
  } catch {
    return false;
  }
}

export function setBrowserNotifyOn(on: boolean): void {
  try {
    if (on) window.localStorage.setItem(STORAGE_KEY, "on");
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* 저장소를 못 쓰면 이번 화면에서만 */
  }
}

/** 브라우저에 허용을 묻는다(누른 순간에만 부를 것 — 브라우저가 그 밖에는 묻지 않는다) */
export async function requestBrowserNotify(): Promise<BrowserNotifyPermission> {
  if (!browserNotifySupported()) return "unsupported";
  try {
    return await window.Notification.requestPermission();
  } catch {
    return window.Notification.permission;
  }
}

/** 지금 운영체제 알림을 띄울지: 켰고, 허용됐고, 화면을 보고 있지 않을 때 */
export function shouldShowBrowserNotification(state: {
  on: boolean;
  permission: BrowserNotifyPermission;
  visible: boolean;
  focused: boolean;
}): boolean {
  if (!state.on || state.permission !== "granted") return false;
  return !state.visible || !state.focused;
}

export function showBrowserNotification({
  title,
  body,
  tag,
  onClick,
}: {
  title: string;
  body?: string;
  /** 같은 알림은 하나만(알림 id) */
  tag: string;
  onClick: () => void;
}): void {
  const permission = browserNotifyPermission();
  if (
    !shouldShowBrowserNotification({
      on: isBrowserNotifyOn(),
      permission,
      visible: document.visibilityState === "visible",
      focused: document.hasFocus(),
    })
  ) {
    return;
  }
  try {
    const n = new window.Notification(title, { body, tag, icon: "/favicon.ico" });
    n.onclick = () => {
      window.focus();
      onClick();
      n.close();
    };
  } catch {
    /* 알림을 못 띄우는 브라우저(일부 모바일 브라우저)는 조용히 넘어간다 */
  }
}
