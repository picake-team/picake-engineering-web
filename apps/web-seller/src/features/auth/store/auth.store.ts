import { create } from "zustand";
import { consumeReturnTo } from "@/apps/web-seller/common/utils/return-to.util";
import { ROUTES } from "@/apps/web-seller/common/constants/paths.constant";
import { isActAsMode } from "@/apps/web-seller/common/utils/act-as.util";
import { finishActAs } from "@/apps/web-seller/features/act-as/apis/act-as.api";
import {
  setAccessToken as setTokenToStorage,
  removeAccessToken,
} from "@/apps/web-seller/common/utils/token.util";

interface AuthState {
  // 상태
  isInitialized: boolean;
  isAuthenticated: boolean;

  // 액션
  setInitialized: (value: boolean) => void;
  login: (args: { navigate?: any; accessToken?: string }) => void;
  logout: (navigate?: any) => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  // 초기 상태
  isInitialized: false,
  isAuthenticated: false,

  // 초기화 플래그 설정
  setInitialized: (value: boolean) =>
    set({
      isInitialized: value,
    }),

  // 로그인 (localStorage에만 토큰 저장)
  login: ({ navigate, accessToken }) => {
    set({ isAuthenticated: true, isInitialized: true });
    if (accessToken) {
      setTokenToStorage(accessToken);
    }

    if (navigate && typeof window !== "undefined") {
      // 로그인이 풀려 들어온 주소가 있으면 그곳으로(휴대폰 알림으로 연 주문 등)
      navigate(consumeReturnTo() ?? ROUTES.ROOT);
    }
  },

  // 로그아웃 (localStorage에서 토큰 제거)
  logout: (navigate) => {
    // 운영자 대신 입력 중(기획 I-41)이면 로그아웃은 대신 입력 끝내기 — 이 브라우저의 원래 판매자 로그인(localStorage)은 지우지 않는다
    if (isActAsMode()) {
      void finishActAs();
      return;
    }
    removeAccessToken();
    set({ isAuthenticated: false, isInitialized: false });
    // 로그인 페이지로 이동
    if (navigate) {
      navigate(ROUTES.AUTH.LOGIN);
    }
  },
}));
