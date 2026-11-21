/**
 * 판매자 앱 약속(`window.PicakeApp`, app 레포 docs/bridge-contract.md §1 "웹이 하는 일") 연결. 손님 웹과 같은 흐름이다.
 * - 이 휴대폰을 알림 받을 곳으로 등록: 로그인한 상태에서 ① 웹을 열 때 ② 로그인 직후 ③ 알림 토큰이 바뀔 때
 *   ④ 알림이 허용으로 바뀔 때 토큰을 받아 서버에 저장(같은 값은 한 번만)
 * - 로그아웃: 기기 ID로 서버에서 이 기기 토큰을 지운 뒤 로그아웃(3초 넘으면 그냥 로그아웃)
 * - 알림 허용 상태: 처음에 묻고, 앱이 앞으로 올 때마다 받아 저장(usePushPermissionStore)
 * - 운영자 대신 입력 중(기획 I-41)에는 이 기기를 등록·해제하지 않는다
 */
import React, { useEffect, useRef } from "react";
import { sellerClient } from "@/apps/web-seller/common/config/axios.config";
import { useAuthStore } from "@/apps/web-seller/features/auth/store/auth.store";
import { getAccessToken } from "@/apps/web-seller/common/utils/token.util";
import { isActAsMode } from "@/apps/web-seller/common/utils/act-as.util";
import { usePushPermissionStore } from "@/apps/web-seller/common/store/push-permission.store";
import {
  createPushRegistrar,
  getPushPermission,
  isSellerAppWebView,
  onPushPermission,
  onPushToken,
  unregisterDevice,
} from "@/apps/web-seller/common/utils/webview.bridge";

const LOGOUT_FALLBACK_MS = 3000;

/** 로그인한 사장님이 직접 쓰는 중일 때만(대신 입력 중이 아니고 출입증이 있을 때) 이 기기를 등록·해제한다 */
function canTouchDevice(): boolean {
  return !!getAccessToken() && !isActAsMode();
}

const registrar = createPushRegistrar(async (r) => {
  if (!canTouchDevice()) return false;
  await sellerClient.post("/fcm-tokens", r);
  return true;
});

let pendingLogout: Promise<void> | null = null;

/** 앱이면 서버에서 이 기기 알림 토큰을 먼저 지우고 로그아웃(3초 넘으면 그냥), 아니면 바로 로그아웃 */
export function logoutWithDevice(logout: () => void): Promise<void> {
  // 운영자 대신 입력 중(기획 I-41)에는 이 기기의 사장님 알림 토큰을 건드리지 않는다(logout이 대신 입력만 끝낸다)
  if (!isSellerAppWebView() || !canTouchDevice()) {
    logout();
    return Promise.resolve();
  }
  if (pendingLogout) return pendingLogout;
  pendingLogout = unregisterDevice(
    (deviceId) => sellerClient.post("/fcm-tokens", { token: "", deviceId }),
    LOGOUT_FALLBACK_MS,
  ).finally(() => {
    pendingLogout = null;
    registrar.reset();
    logout();
  });
  return pendingLogout;
}

export function SellerAppBridgeProvider({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setPermission = usePushPermissionStore((s) => s.setStatus);

  // 알림 허용 상태: 처음에 묻고, 앱이 앞으로 올 때마다(휴대폰 설정에서 바꾸고 돌아옴) 받는다
  useEffect(() => {
    if (!isSellerAppWebView()) return;
    let alive = true;
    let heard = false;
    const off = onPushPermission((status) => {
      heard = true;
      setPermission(status);
    });
    void getPushPermission().then((status) => {
      // 처음 답보다 앱이 알려 준 상태가 먼저 왔으면 그것이 더 새것이다
      if (alive && !heard && status) setPermission(status);
    });
    return () => {
      alive = false;
      off();
    };
  }, [setPermission]);

  // ① 웹을 열 때 ② 로그인 직후 등록하고, ③ 알림 토큰이 바뀌면 다시 등록한다.
  // 로그아웃하면 다음 로그인 때 같은 토큰도 다시 보내게 비운다(다른 계정으로 들어올 수 있어서)
  useEffect(() => {
    if (!isAuthenticated) {
      registrar.reset();
      return;
    }
    if (!isSellerAppWebView() || isActAsMode()) return;
    void registrar.register();
    return onPushToken((r) => void registrar.register(r));
  }, [isAuthenticated]);

  // ④ 알림을 나중에 허용하면(처음 사용 안내, 홈 "켜기", 휴대폰 설정에서 켜고 돌아옴) 다시 등록한다.
  // 앱은 허용 전에는 토큰을 주지 않아서다. 처음 알려 준 상태(unknown → granted)는 위 ①이 맡는다
  const pushStatus = usePushPermissionStore((s) => s.status);
  const prevPushStatus = useRef(pushStatus);
  useEffect(() => {
    const prev = prevPushStatus.current;
    prevPushStatus.current = pushStatus;
    if (!isAuthenticated || !isSellerAppWebView() || isActAsMode()) return;
    if (pushStatus === "granted" && (prev === "denied" || prev === "notDetermined")) {
      void registrar.register();
    }
  }, [pushStatus, isAuthenticated]);

  return <>{children}</>;
}
