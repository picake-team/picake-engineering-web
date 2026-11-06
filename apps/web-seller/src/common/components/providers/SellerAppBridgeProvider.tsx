/**
 * 판매자 앱(웹뷰) 브릿지 연결. 손님 앱(`web-user` webview.bridge)과 같은 흐름이다.
 * - 로그인하면 앱에 이 휴대폰의 알림 토큰을 달라고 하고(requestFcmTokenUpsert), 앱이 FcmToken.upsert로 주면 서버에 저장
 * - 로그아웃은 앱에 토큰 해제를 부탁하고(requestFcmTokenRemove), FcmToken.remove가 오면 서버에서 지운 뒤 로그아웃
 *   (앱이 3초 안에 답하지 않으면 그냥 로그아웃)
 * - 앱이 알려 주는 알림 허용 상태를 저장(receivePushPermission)
 */
import React, { useEffect, useRef } from "react";
import { sellerClient } from "@/apps/web-seller/common/config/axios.config";
import { useAuthStore } from "@/apps/web-seller/features/auth/store/auth.store";
import { getAccessToken } from "@/apps/web-seller/common/utils/token.util";
import { usePushPermissionStore } from "@/apps/web-seller/common/store/push-permission.store";
import {
  askPushPermissionStatus,
  isSellerAppWebView,
  requestFcmTokenRemove,
  requestFcmTokenUpsert,
} from "@/apps/web-seller/common/utils/webview.bridge";

const LOGOUT_FALLBACK_MS = 3000;

let pendingLogout: { done: () => void; timer: number } | null = null;

/** 앱이면 알림 토큰을 먼저 지우고 로그아웃, 아니면 바로 로그아웃 */
export function logoutWithDevice(logout: () => void) {
  if (!isSellerAppWebView() || !requestFcmTokenRemove()) {
    logout();
    return;
  }
  if (pendingLogout) return;
  const timer = window.setTimeout(() => {
    pendingLogout = null;
    logout();
  }, LOGOUT_FALLBACK_MS);
  pendingLogout = {
    timer,
    done: () => {
      window.clearTimeout(timer);
      pendingLogout = null;
      logout();
    },
  };
}

export function SellerAppBridgeProvider({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setPermission = usePushPermissionStore((s) => s.setStatus);
  const upsertedFor = useRef<string | null>(null);

  // 앱 → 웹 함수 등록
  useEffect(() => {
    if (!isSellerAppWebView()) return;
    window.FcmToken = {
      upsert: ({ token, deviceId }) => {
        const t = token?.trim();
        const d = deviceId?.trim();
        if (!t || !d || !getAccessToken()) return;
        void sellerClient.post("/fcm-tokens", { token: t, deviceId: d }).catch((e) => {
          console.error("알림 토큰 저장 실패:", e);
        });
      },
      remove: ({ deviceId }) => {
        const d = deviceId?.trim();
        const finish = () => (pendingLogout ? pendingLogout.done() : undefined);
        if (!d || !getAccessToken()) {
          finish();
          return;
        }
        void sellerClient
          .post("/fcm-tokens", { token: "", deviceId: d })
          .catch((e) => console.error("알림 토큰 해제 실패:", e))
          .finally(finish);
      },
    };
    window.receivePushPermission = (status) => setPermission(status);
    askPushPermissionStatus();
    return () => {
      delete window.FcmToken;
      delete window.receivePushPermission;
    };
  }, [setPermission]);

  // 로그인하면 이 휴대폰을 알림 받을 곳으로 등록(토큰마다 한 번)
  useEffect(() => {
    if (!isAuthenticated || !isSellerAppWebView()) return;
    const token = getAccessToken();
    if (!token || upsertedFor.current === token) return;
    upsertedFor.current = token;
    requestFcmTokenUpsert();
  }, [isAuthenticated]);

  return <>{children}</>;
}
