"use client";

import { useState, useEffect } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  isWebViewEnvironment,
  unregisterPushDevice,
} from "@/apps/web-user/common/utils/webview.bridge";
import { queryClient } from "@/apps/web-user/common/config/query-client";

/**
 * 계정이 바뀌면 화면 캐시를 비운다. 채팅·주문·MY 캐시 키에 계정 구분이 없어, 새로고침 없이 다른 계정으로 들어가면
 * 앞 사람의 채팅방 이름·미리보기가 잠깐 보이고 앞 사람 방 번호로 이동했다(11-18 검토)
 */
function clearAccountCache() {
  queryClient.clear();
}

interface AuthState {
  // 상태
  isAuthenticated: boolean;
  accessToken: string | null;

  // 액션
  login: (token: string) => void;
  handleLogoutByEnvironment: () => Promise<void>;
  logout: () => void;
  getAccessToken: () => string | null;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // 초기 상태
      isAuthenticated: false,
      accessToken: null,

      // 로그인 처리 (앱이면 useWebViewBridge가 로그인을 보고 이 휴대폰을 알림 받을 곳으로 등록)
      login: (token: string) => {
        if (get().accessToken !== token) clearAccountCache();
        set({
          accessToken: token,
          isAuthenticated: true,
        });
      },

      // 손님이 누른 로그아웃. 앱이면 서버에서 이 휴대폰의 알림 연결을 먼저 지운다(3초까지만 기다리고 그래도 로그아웃)
      handleLogoutByEnvironment: async () => {
        if (isWebViewEnvironment()) {
          await unregisterPushDevice();
        }
        get().logout();
      },

      // 로그아웃 처리 (Zustand 상태 초기화). 로그인이 끝나(401) 로그아웃할 때는 이것만 부른다
      logout: () => {
        set({
          accessToken: null,
          isAuthenticated: false,
        });
        clearAccountCache();
      },

      // 현재 토큰 조회
      getAccessToken: () => {
        return get().accessToken;
      },
    }),
    {
      name: "picake:auth",
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken,
      }),
    },
  ),
);

// persist hydration 완료 여부를 별도로 관리
export const useAuthHasHydrated = () => {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setHasHydrated(true);
    });

    // 이미 hydration이 끝난 경우
    if (useAuthStore.persist.hasHydrated()) {
      setHasHydrated(true);
    }

    return unsub;
  }, []);

  return hasHydrated;
};
