"use client";

/**
 * 웹뷰(Flutter)와 통신하는 브릿지 유틸리티
 * 모든 웹뷰 통신 관련 코드는 이 파일에 위치합니다.
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
import { useRemoveConsumerFcmToken } from "@/apps/web-user/features/fcm/hooks/mutations/useRemoveConsumerFcmToken";
import { useUpsertConsumerFcmToken } from "@/apps/web-user/features/fcm/hooks/mutations/useUpsertConsumerFcmToken";
import type { FcmToken } from "@/apps/web-user/features/fcm/types/fcm.type";

// 타입 정의
declare global {
  interface Window {
    // 웹뷰 -> Flutter
    mylocation: {
      postMessage: (message: string) => void;
    };
    openAppSettings: {
      postMessage: (message: string) => void;
    };
    requestFcmTokenUpsert: {
      postMessage: (message: string) => void;
    };
    requestFcmTokenRemove: {
      postMessage: (message: string) => void;
    };

    // Flutter -> 웹뷰
    receiveLocation: (latitude: string | number, longitude: string | number) => void;
    /** 위치 권한 거부 또는 위치 취득 실패 시 Flutter가 호출 */
    receiveLocationError: (reason?: string) => void;
    FcmToken: {
      upsert: (fcmToken: FcmToken) => void;
      remove: (fcmToken: Omit<FcmToken, "token">) => void;
    };
  }
}

export type RequestLocationOptions = {
  /** 사용자가 「내 위치」「현재 위치로 설정」등으로 명시적으로 요청한 경우 */
  userInitiated?: boolean;
};

// ============================================================================
// 웹뷰 -> Flutter
// ============================================================================

/**
 * 앱에서 위치 정보를 요청하는 웹뷰 통신 함수
 * Flutter 앱에 위치 정보 요청 메시지를 전송합니다.
 * 성공 시 window.receiveLocation, 실패/권한거부 시 window.receiveLocationError가 호출됩니다.
 */
export function requestLocationFromWebView(options?: RequestLocationOptions): void {
  if (options?.userInitiated) {
    useUserCurrentLocationStore.getState().markLocationRequestUserInitiated();
  }

  try {
    window.mylocation.postMessage("true");
  } catch (error) {
    console.error("위치 정보 요청 중 오류가 발생했습니다:", error);
    if (options?.userInitiated) {
      useUserCurrentLocationStore.getState().handleLocationRequestFailure();
    }
  }
}

/**
 * OS 앱 설정 화면을 열도록 Flutter에 요청합니다.
 * (위치 권한 등 앱 권한 변경용)
 */
export function requestOpenAppSettings(): void {
  try {
    window.openAppSettings.postMessage("true");
  } catch (error) {
    console.error("앱 설정 화면 열기 요청 중 오류가 발생했습니다:", error);
  }
}

export function requestFcmTokenUpsert(): void {
  try {
    window.requestFcmTokenUpsert.postMessage("true");
  } catch (error) {
    console.error("FCM 토큰 업데이트 중 오류가 발생했습니다:", error);
  }
}

export function requestFcmTokenRemove(): void {
  try {
    window.requestFcmTokenRemove.postMessage("true");
  } catch (error) {
    console.error("FCM 토큰 삭제 중 오류가 발생했습니다:", error);
  }
}

/**
 * 웹뷰 환경인지 확인하는 함수
 * (Flutter에서 주입하는 mylocation 브릿지 존재 여부)
 */
export function isWebViewEnvironment(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return typeof window.mylocation !== "undefined";
}

// ============================================================================
// Flutter -> 웹뷰
// ============================================================================

/**
 * 웹뷰 브릿지 초기화 훅
 * Flutter 앱에서 window.receiveLocation, window.receiveLocationError, window.FcmToken을
 * 호출할 수 있도록 등록합니다.
 * 이 훅은 앱 초기화 시 한 번 호출되어야 합니다.
 */
export function useWebViewBridge() {
  const { login, handleLogoutByEnvironment, isAuthenticated, accessToken } = useAuthStore();
  const { setLocation, setAddress, clearLocationRequestFlag, handleLocationRequestFailure } =
    useUserCurrentLocationStore();
  const { mutate: upsertConsumerFcmToken } = useUpsertConsumerFcmToken();
  const { mutate: removeConsumerFcmToken } = useRemoveConsumerFcmToken();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    // Flutter 앱에서 호출할 수 있도록 window.receiveLocation 함수 초기화
    window.receiveLocation = (latitude: string | number, longitude: string | number) => {
      // string이면 number로 변환
      const latNumber = typeof latitude === "string" ? parseFloat(latitude) : latitude;
      const lngNumber = typeof longitude === "string" ? parseFloat(longitude) : longitude;

      if (Number.isNaN(latNumber) || Number.isNaN(lngNumber)) {
        // userInitiated 플래그가 남아 있어야 모달 표시 가능
        handleLocationRequestFailure();
        return;
      }

      clearLocationRequestFlag();

      // 전역 상태(Zustand store)에 위치 정보 저장
      setLocation(latNumber, lngNumber);

      // 역지오코딩으로 주소 변환
      reverseGeocode(latNumber, lngNumber).then((result) => {
        if (result) setAddress(result);
      });
    };

    // 위치 권한 거부 / 취득 실패
    window.receiveLocationError = () => {
      handleLocationRequestFailure();
    };

    // Flutter 앱에서 호출할 수 있도록 window.FcmToken 객체 초기화
    window.FcmToken = {
      upsert: ({ token, deviceId }: FcmToken) => {
        if (!isAuthenticated || !accessToken) {
          console.warn("로그인 상태가 아니어서 FCM 토큰 upsert를 건너뜁니다.");
          return;
        }
        if (!token || typeof token !== "string" || !deviceId || typeof deviceId !== "string") {
          console.warn("유효하지 않은 FCM 토큰 또는 디바이스 ID가 전달되었습니다.");
          return;
        }
        const normalizedToken = token.trim();
        const normalizedDeviceId = deviceId.trim();
        if (!normalizedToken || !normalizedDeviceId) {
          console.warn("유효하지 않은 FCM 토큰 또는 디바이스 ID가 전달되었습니다.");
          return;
        }

        upsertConsumerFcmToken({ token: normalizedToken, deviceId: normalizedDeviceId });
      },
      remove: ({ deviceId }: Omit<FcmToken, "token">) => {
        if (!isAuthenticated || !accessToken) {
          console.warn("로그인 상태가 아니어서 FCM 토큰 remove를 건너뜁니다.");
          return;
        }
        if (!deviceId || typeof deviceId !== "string") {
          console.warn("유효하지 않은 디바이스 ID가 전달되었습니다.");
          return;
        }
        const normalizedDeviceId = deviceId.trim();
        if (!normalizedDeviceId) {
          console.warn("유효하지 않은 디바이스 ID가 전달되었습니다.");
          return;
        }
        removeConsumerFcmToken({ deviceId: normalizedDeviceId });
      },
    };
  }, [
    login,
    handleLogoutByEnvironment,
    setLocation,
    setAddress,
    clearLocationRequestFlag,
    handleLocationRequestFailure,
    upsertConsumerFcmToken,
    removeConsumerFcmToken,
    isAuthenticated,
    accessToken,
  ]);

  /**
   * 처음 들어올 때는 위치 권한을 묻지 않는다(2026-11-16 운영자: 새 홈은 위치를 쓰지 않음). 위치는 지도·검색 결과
   * 거리순·"현재 위치"처럼 필요할 때 묻는다(useLocationWhenNeeded, useUserLocation).
   * 전에 위치를 받은 적이 있으면(권한 허용) 묻는 창 없이 들어올 때 한 번 다시 받는다. 브라우저는 권한이 지금도
   * 허용일 때만(확인할 수 없으면 받지 않고 필요할 때 묻는다).
   */
  const silentLocationRequestedRef = useRef(false);
  useEffect(() => {
    if (typeof window === "undefined" || silentLocationRequestedRef.current) return;
    if (!hasLocationGranted()) return;
    silentLocationRequestedRef.current = true;

    if (isWebViewEnvironment()) {
      requestLocationFromWebView();
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
      );
    });
  }, [setLocation, setAddress]);
}

// ============================================================================
// 외부 앱 유도용 커스텀 스키마 URL
// ============================================================================

/**
 * Flutter에서 커스텀 스키마로 가로채 외부 앱(지도 등)으로 유도하기 위한 URL prefix
 */
export const EXTERNAL_APP_SCHEME_PREFIX = "apps://";

/**
 * 외부 앱 유도용 커스텀 스키마 URL로 래핑합니다.
 * 예) https://example.com -> apps://https://example.com
 */
export function toExternalAppSchemeUrl(webUrl: string): string {
  return `${EXTERNAL_APP_SCHEME_PREFIX}${webUrl}`;
}
