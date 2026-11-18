"use client";

import { useState, useEffect } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  isWebViewEnvironment,
  requestFcmTokenRemove,
  requestFcmTokenUpsert,
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
  handleLogoutByEnvironment: () => void;
  logout: () => void;
  getAccessToken: () => string | null;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // 초기 상태
      isAuthenticated: false,
      accessToken: null,

      // 로그인 처리 (Zustand 상태 업데이트 + 웹뷰라면 앱에 FCM 토큰 업서트 요청)
      login: (token: string) => {
        if (get().accessToken !== token) clearAccountCache();
        set({
          accessToken: token,
          isAuthenticated: true,
        });
        if (isWebViewEnvironment()) {
          requestFcmTokenUpsert();
        }
      },

      // 로그아웃 준비 (웹뷰라면 FCM 토큰 제거 요청, 웹뷰가 아니라면 상태 초기화)
      handleLogoutByEnvironment: () => {
        if (isWebViewEnvironment()) {
          requestFcmTokenRemove();
        } else {
          set({
            accessToken: null,
            isAuthenticated: false,
          });
          clearAccountCache();
        }
      },

      // 로그아웃 처리 (Zustand 상태 초기화)
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
