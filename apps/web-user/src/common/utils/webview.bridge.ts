"use client";

/**
 * 손님 앱과 주고받는 곳. 모든 앱 통신 코드는 이 파일에 둔다.
 * 앱 안이면 앱이 `window.PicakeApp`을 문서 맨 앞부터 넣어 둔다(우리 주소에서만). 메서드는 Promise로 답하고,
 * 실패는 Error에 code를 달아 reject한다(앱이 5초 안에 준비되지 않으면 "unavailable").
 * 약속 정본은 앱 레포(picake-engineering-app) `docs/bridge-contract.md` 1절.
 */

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/apps/web-user/common/store/auth.store";
import { useUserCurrentLocationStore } from "@/apps/web-user/common/store/user-current-location.store";
import { reverseGeocode } from "@/apps/web-user/common/utils/kakao-geocode.util";
import {
  forgetLocationGranted,
  getBrowserGeolocationPermission,
  hasLocationGranted,
} from "@/apps/web-user/common/utils/location-permission.util";
import { fcmApi } from "@/apps/web-user/features/fcm/apis/fcm.api";

type PushPermission = "granted" | "denied" | "notDetermined";
type LatLng = { latitude: number; longitude: number };
type PushRegistration = { token: string; deviceId: string };

/** 앱이 넣는 `window.PicakeApp` 중 손님 웹이 쓰는 것 */
interface PicakeApp {
  getDeviceId(): Promise<string>;
  /** 알림이 허용일 때만 값, 아니면 null */
  getPushToken(): Promise<PushRegistration | null>;
  /** "app": 이 앱 정보(위치 권한 등) */
  openSettings(type: "app" | "notification"): Promise<void>;
  /** 휴대폰 브라우저·그 앱으로 연다. 열 앱이 없거나 막는 주소면 code "unsupported" */
  openExternal(url: string): Promise<void>;
  on(event: "pushToken", listener: (registration: PushRegistration) => void): () => void;
  on(event: "pushPermission", listener: (status: PushPermission) => void): () => void;
  /** 손님 앱만. 권한이 정해지지 않았으면 휴대폰이 묻는다. 거부 code "denied", 위치 꺼짐·시간 넘김 "unavailable" */
  getLocation?(onLastKnown?: (position: LatLng) => void): Promise<LatLng>;
}

declare global {
  interface Window {
    PicakeApp?: PicakeApp;
  }
}

function getPicakeApp(): PicakeApp | undefined {
  if (typeof window === "undefined") return undefined;
  return window.PicakeApp;
}

function errorCode(error: unknown): string | undefined {
  const code = (error as { code?: unknown } | null)?.code;
  return typeof code === "string" ? code : undefined;
}

/** 앱(웹뷰) 안인지. 앱이 넣는 window.PicakeApp이 있는지로 본다 */
export function isWebViewEnvironment(): boolean {
  return getPicakeApp() != null;
}

// ============================================================================
// 위치
// ============================================================================

export type RequestLocationOptions = {
  /** 사용자가 「내 위치」「현재 위치로 설정」등으로 명시적으로 요청한 경우 */
  userInitiated?: boolean;
};

/** 받은 위치 순서. 늦게 끝난 주소 찾기가 더 새 위치의 주소를 덮지 않게 */
let appLocationSeq = 0;

/** 앱이 준 위치를 저장하고 주소를 찾는다. 숫자가 아니면 false */
function applyAppLocation({ latitude, longitude }: LatLng): boolean {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return false;

  const store = useUserCurrentLocationStore.getState();
  store.clearLocationRequestFlag();
  store.setLocation(latitude, longitude);

  const seq = ++appLocationSeq;
  void reverseGeocode(latitude, longitude).then((address) => {
    if (address && seq === appLocationSeq) {
      useUserCurrentLocationStore.getState().setAddress(address);
    }
  });
  return true;
}

/**
 * 앱에 지금 위치를 달라고 한다. 권한이 정해지지 않았으면 휴대폰이 묻는다(처음 들어올 때는 부르지 않는다).
 * 마지막으로 알던 위치가 먼저 오면 그것부터 쓴다. 거부(denied)·위치 꺼짐·시간 넘김(unavailable)은
 * 실패 처리 — 손님이 누른 요청이면 설정 안내 창이 뜬다.
 */
export async function requestLocationFromApp(options?: RequestLocationOptions): Promise<void> {
  if (options?.userInitiated) {
    useUserCurrentLocationStore.getState().markLocationRequestUserInitiated();
  }

  const app = getPicakeApp();
  if (!app?.getLocation) {
    useUserCurrentLocationStore.getState().handleLocationRequestFailure();
    return;
  }

  let gotLastKnown = false;
  try {
    const position = await app.getLocation((lastKnown) => {
      if (applyAppLocation(lastKnown)) gotLastKnown = true;
    });
    if (applyAppLocation(position) || gotLastKnown) return;
    // userInitiated 플래그가 남아 있어야 모달 표시 가능
    useUserCurrentLocationStore.getState().handleLocationRequestFailure();
  } catch (error) {
    // 거부했으면 다음에 들어올 때 조용히 다시 받지 않는다(필요할 때 묻는다)
    if (errorCode(error) === "denied") forgetLocationGranted();
    // 마지막 위치를 받았으면 그것을 쓴다
    if (gotLastKnown) return;
    useUserCurrentLocationStore.getState().handleLocationRequestFailure();
  }
}

/** 휴대폰 설정의 이 앱 정보(위치 권한 등)를 연다 */
export function openAppSettings(): void {
  getPicakeApp()
    ?.openSettings("app")
    .catch((error) => console.error("앱 설정 화면 열기 중 오류가 발생했습니다:", error));
}

// ============================================================================
// 바깥 링크
// ============================================================================

/** 앱이 휴대폰 브라우저·그 앱으로 연다. 앱 밖이거나 열 앱이 없으면(code "unsupported") reject */
export async function openExternalInApp(url: string): Promise<void> {
  const app = getPicakeApp();
  if (!app) throw new Error("앱 안이 아닙니다");
  await app.openExternal(url);
}

// ============================================================================
// 알림 받을 곳(이 휴대폰) 등록·해제
// ============================================================================

/** 로그아웃 때 알림 연결 해제를 기다리는 최대 시간. 앱·서버가 답하지 않아도 로그아웃은 된다 */
const LOGOUT_UNREGISTER_WAIT_MS = 3000;

/** 마지막으로 서버에 보낸 값(로그인 토큰·알림 토큰·기기 ID). 같은 값은 한 번만 보낸다 */
let lastSentPushKey: string | null = null;

async function sendPushRegistration(registration: PushRegistration | null): Promise<void> {
  const { isAuthenticated, accessToken } = useAuthStore.getState();
  if (!registration || !isAuthenticated || !accessToken) return;

  const token = typeof registration.token === "string" ? registration.token.trim() : "";
  const deviceId = typeof registration.deviceId === "string" ? registration.deviceId.trim() : "";
  if (!token || !deviceId) return;

  const key = `${accessToken}|${token}|${deviceId}`;
  if (key === lastSentPushKey) return;
  lastSentPushKey = key;

  try {
    await fcmApi.syncConsumerFcmToken({ token, deviceId });
  } catch (error) {
    // 다음 기회(앱이 앞으로 올 때·다시 열 때)에 다시 보낼 수 있게
    if (lastSentPushKey === key) lastSentPushKey = null;
    console.warn("알림 받을 곳 등록에 실패했습니다:", error);
  }
}

/** 로그인해 있으면 이 휴대폰을 알림 받을 곳으로 등록한다(알림이 허용일 때만 앱이 토큰을 준다) */
export async function registerPushDevice(): Promise<void> {
  const app = getPicakeApp();
  if (!app || !useAuthStore.getState().isAuthenticated) return;
  try {
    await sendPushRegistration(await app.getPushToken());
  } catch (error) {
    console.warn("알림 토큰을 받지 못했습니다:", error);
  }
}

/**
 * 로그아웃 전에 서버에서 이 휴대폰의 알림 연결을 지운다(로그아웃한 휴대폰에 알림이 안 가게).
 * 그 요청에 로그인 토큰이 필요해 로그아웃보다 먼저 한다. 3초 넘게 걸리면 기다리지 않는다.
 */
export async function unregisterPushDevice(): Promise<void> {
  const app = getPicakeApp();
  if (!app) return;
  lastSentPushKey = null;

  const remove = (async () => {
    const deviceId = (await app.getDeviceId())?.trim();
    if (!deviceId) return;
    await fcmApi.syncConsumerFcmToken({ token: "", deviceId });
  })().catch((error) => console.warn("알림 연결 해제에 실패했습니다:", error));

  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<void>((resolve) => {
    timer = setTimeout(resolve, LOGOUT_UNREGISTER_WAIT_MS);
  });
  await Promise.race([remove, timeout]);
  clearTimeout(timer);
}

// ============================================================================
// 앱 초기화 훅
// ============================================================================

/**
 * 앱과의 연결을 건다. 앱 초기화 시 한 번 호출한다(AuthProvider).
 * - 알림: 로그인해 있으면 ① 웹을 열 때 ② 로그인 직후 ③ 알림 토큰이 바뀔 때 ④ 알림이 허용으로 바뀔 때 등록
 * - 위치: 전에 받은 적이 있으면 들어올 때 묻는 창 없이 한 번 다시 받는다
 */
export function useWebViewBridge() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const { setLocation, setAddress } = useUserCurrentLocationStore();

  // ① 웹을 열 때 이미 로그인해 있으면 ② 로그인 직후
  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;
    void registerPushDevice();
  }, [isAuthenticated, accessToken]);

  // ③ 알림 토큰이 바뀌면 ④ 휴대폰 설정에서 알림을 켜고 돌아오면
  useEffect(() => {
    const app = getPicakeApp();
    if (!app) return;

    let lastPermission: PushPermission | null = null;
    const offPushToken = app.on("pushToken", (registration) => {
      void sendPushRegistration(registration);
    });
    const offPushPermission = app.on("pushPermission", (status) => {
      const turnedOn = status === "granted" && lastPermission !== "granted";
      lastPermission = status;
      if (turnedOn) void registerPushDevice();
    });
    return () => {
      offPushToken();
      offPushPermission();
    };
  }, []);

  /**
   * 처음 들어올 때는 위치 권한을 묻지 않는다(2026-11-16 운영자: 새 홈은 위치를 쓰지 않음). 위치는 지도·검색 결과
   * 거리순·"현재 위치"처럼 필요할 때 묻는다(useLocationWhenNeeded, useUserLocation).
   * 전에 위치를 받은 적이 있으면(권한 허용) 묻는 창 없이 들어올 때 한 번 다시 받는다. 앱은 위치를 먼저 보내 주지
   * 않아 이때 달라고 한다(받으면 setLocation이 허용을 기억). 브라우저는 권한이 지금도 허용일 때만(확인할 수 없으면
   * 받지 않고 필요할 때 묻는다).
   */
  const silentLocationRequestedRef = useRef(false);
  useEffect(() => {
    if (typeof window === "undefined" || silentLocationRequestedRef.current) return;
    if (!hasLocationGranted()) return;
    silentLocationRequestedRef.current = true;

    if (isWebViewEnvironment()) {
      void requestLocationFromApp();
      return;
    }
    if (!navigator.geolocation) return;

    void getBrowserGeolocationPermission().then((state) => {
      if (state === "denied") {
        forgetLocationGranted();
        return;
      }
      if (state !== "granted") return;
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation(latitude, longitude);
          reverseGeocode(latitude, longitude).then((result) => {
            if (result) setAddress(result);
          });
        },
        (error) => {
          console.error("브라우저 위치 정보 요청 실패:", error.message);
        },
        // 들어올 때는 빨리 점을 그리는 게 먼저 — 5분 안에 받은 위치가 있으면 그것을(지도 "내 위치"는 새로 받는다)
        { maximumAge: 5 * 60 * 1000, timeout: 10000 },
      );
    });
  }, [setLocation, setAddress]);
}
