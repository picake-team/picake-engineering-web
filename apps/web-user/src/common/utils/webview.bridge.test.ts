import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { syncConsumerFcmToken, reverseGeocode } = vi.hoisted(() => ({
  syncConsumerFcmToken: vi.fn(),
  reverseGeocode: vi.fn(),
}));
vi.mock("@/apps/web-user/features/fcm/apis/fcm.api", () => ({
  fcmApi: { syncConsumerFcmToken },
}));
vi.mock("@/apps/web-user/common/utils/kakao-geocode.util", () => ({ reverseGeocode }));

import { useAuthStore } from "@/apps/web-user/common/store/auth.store";
import { useUserCurrentLocationStore } from "@/apps/web-user/common/store/user-current-location.store";
import { hasLocationGranted } from "@/apps/web-user/common/utils/location-permission.util";
import {
  registerPushDevice,
  requestLocationFromApp,
} from "@/apps/web-user/common/utils/webview.bridge";

/** 앱 안처럼: window.PicakeApp + 위치 허용 기억용 저장소 */
function stubApp(app: object | null) {
  const store = new Map<string, string>();
  vi.stubGlobal("window", {
    ...(app ? { PicakeApp: app } : {}),
    localStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
    },
  });
}

function withCode(code: string) {
  return Object.assign(new Error(code), { code });
}

beforeEach(() => {
  syncConsumerFcmToken.mockReset().mockResolvedValue(undefined);
  reverseGeocode.mockReset().mockResolvedValue("서울특별시 강남구");
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
  useAuthStore.getState().logout();
  useUserCurrentLocationStore.setState({
    latitude: null,
    longitude: null,
    address: null,
    isLocationRequestUserInitiated: false,
    isLocationPermissionModalOpen: false,
  });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("로그아웃 (앱이면 이 휴대폰의 알림 연결을 먼저 지움)", () => {
  it("기기 ID로 서버에서 지운 뒤 로그아웃한다(그 요청에 로그인 토큰이 필요)", async () => {
    stubApp({ getDeviceId: vi.fn().mockResolvedValue("device-1") });
    useAuthStore.getState().login("token-logout");
    syncConsumerFcmToken.mockImplementation(async () => {
      expect(useAuthStore.getState().accessToken).toBe("token-logout");
    });

    await useAuthStore.getState().handleLogoutByEnvironment();

    expect(syncConsumerFcmToken).toHaveBeenCalledWith({ token: "", deviceId: "device-1" });
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it("앱이 답하지 않아도 3초 뒤에는 로그아웃한다", async () => {
    vi.useFakeTimers();
    stubApp({ getDeviceId: () => new Promise<string>(() => undefined) });
    useAuthStore.getState().login("token-stuck");

    const done = useAuthStore.getState().handleLogoutByEnvironment();
    await vi.advanceTimersByTimeAsync(2999);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    await vi.advanceTimersByTimeAsync(1);
    await done;

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(syncConsumerFcmToken).not.toHaveBeenCalled();
  });

  it("서버가 실패해도 로그아웃한다", async () => {
    stubApp({ getDeviceId: vi.fn().mockResolvedValue("device-1") });
    syncConsumerFcmToken.mockRejectedValue(new Error("network"));
    useAuthStore.getState().login("token-fail");

    await useAuthStore.getState().handleLogoutByEnvironment();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it("브라우저면 서버를 부르지 않고 바로 로그아웃한다", async () => {
    stubApp(null);
    useAuthStore.getState().login("token-web");

    await useAuthStore.getState().handleLogoutByEnvironment();

    expect(syncConsumerFcmToken).not.toHaveBeenCalled();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});

describe("알림 받을 곳 등록", () => {
  it("같은 값(로그인 토큰·알림 토큰·기기 ID)은 한 번만 보내고, 로그인이 바뀌면 다시 보낸다", async () => {
    stubApp({ getPushToken: vi.fn().mockResolvedValue({ token: "fcm-1", deviceId: "device-1" }) });
    useAuthStore.getState().login("token-a");

    await registerPushDevice();
    await registerPushDevice();
    expect(syncConsumerFcmToken).toHaveBeenCalledTimes(1);
    expect(syncConsumerFcmToken).toHaveBeenCalledWith({ token: "fcm-1", deviceId: "device-1" });

    useAuthStore.getState().login("token-b");
    await registerPushDevice();
    expect(syncConsumerFcmToken).toHaveBeenCalledTimes(2);
  });

  it("보내기에 실패하면 다음에 다시 보낸다", async () => {
    stubApp({ getPushToken: vi.fn().mockResolvedValue({ token: "fcm-2", deviceId: "device-2" }) });
    useAuthStore.getState().login("token-retry");
    syncConsumerFcmToken.mockRejectedValueOnce(new Error("network"));

    await registerPushDevice();
    await registerPushDevice();

    expect(syncConsumerFcmToken).toHaveBeenCalledTimes(2);
  });

  it("로그인 전이거나 알림이 허용이 아니면(null) 보내지 않는다", async () => {
    const getPushToken = vi.fn().mockResolvedValue(null);
    stubApp({ getPushToken });

    await registerPushDevice();
    expect(getPushToken).not.toHaveBeenCalled();

    useAuthStore.getState().login("token-null");
    await registerPushDevice();
    expect(getPushToken).toHaveBeenCalledTimes(1);
    expect(syncConsumerFcmToken).not.toHaveBeenCalled();
  });
});

describe("앱 위치", () => {
  it("마지막 위치가 먼저 오면 그것부터 쓰고 지금 위치로 바꾼다. 받으면 허용을 기억한다", async () => {
    stubApp({
      getLocation: vi.fn(
        async (onLastKnown?: (pos: { latitude: number; longitude: number }) => void) => {
          onLastKnown?.({ latitude: 37.1, longitude: 127.1 });
          expect(useUserCurrentLocationStore.getState().latitude).toBe(37.1);
          return { latitude: 37.5, longitude: 127.0 };
        },
      ),
    });

    await requestLocationFromApp({ userInitiated: true });

    const state = useUserCurrentLocationStore.getState();
    expect(state.latitude).toBe(37.5);
    expect(state.longitude).toBe(127.0);
    expect(state.isLocationRequestUserInitiated).toBe(false);
    expect(hasLocationGranted()).toBe(true);
    await vi.waitFor(() =>
      expect(useUserCurrentLocationStore.getState().address).toBe("서울특별시 강남구"),
    );
  });

  it("누른 요청이 거부(denied)되면 설정 안내 창, 허용 기억은 지운다", async () => {
    stubApp({ getLocation: vi.fn().mockRejectedValue(withCode("denied")) });
    window.localStorage.setItem("picake:location-granted", "1");

    await requestLocationFromApp({ userInitiated: true });

    expect(useUserCurrentLocationStore.getState().isLocationPermissionModalOpen).toBe(true);
    expect(hasLocationGranted()).toBe(false);
  });

  it("위치 꺼짐·시간 넘김(unavailable)도 실패 처리, 누르지 않은 요청이면 창을 띄우지 않는다", async () => {
    stubApp({ getLocation: vi.fn().mockRejectedValue(withCode("unavailable")) });

    await requestLocationFromApp({ userInitiated: true });
    expect(useUserCurrentLocationStore.getState().isLocationPermissionModalOpen).toBe(true);

    useUserCurrentLocationStore.setState({ isLocationPermissionModalOpen: false });
    await requestLocationFromApp();
    expect(useUserCurrentLocationStore.getState().isLocationPermissionModalOpen).toBe(false);
  });

  it("숫자가 아닌 위치는 실패로 본다", async () => {
    stubApp({ getLocation: vi.fn().mockResolvedValue({ latitude: Number.NaN, longitude: 127 }) });

    await requestLocationFromApp({ userInitiated: true });

    expect(useUserCurrentLocationStore.getState().latitude).toBeNull();
    expect(useUserCurrentLocationStore.getState().isLocationPermissionModalOpen).toBe(true);
  });
});
