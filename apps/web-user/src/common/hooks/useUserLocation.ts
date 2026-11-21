"use client";

import { useCallback, useMemo } from "react";
import { useUserCurrentLocationStore } from "@/apps/web-user/common/store/user-current-location.store";
import {
  isWebViewEnvironment,
  requestLocationFromApp,
} from "@/apps/web-user/common/utils/webview.bridge";
import { reverseGeocode } from "@/apps/web-user/common/utils/kakao-geocode.util";

interface UserLocation {
  latitude: number;
  longitude: number;
}

/**
 * 사용자의 현재 위치를 가져오는 훅
 * - 좌표는 user-current-location store를 구독 (앱이면 requestLocationFromApp이 store에 기록)
 * - refresh()는 사용자 명시 요청으로 취급 → 권한 거부 시 안내 모달. 끝나면(받았거나 못 받았거나) 풀리는 Promise
 *   — 지도 "내 위치" 버튼이 찾는 동안 표시를 끄는 데 쓴다
 */
export function useUserLocation() {
  const latitude = useUserCurrentLocationStore((s) => s.latitude);
  const longitude = useUserCurrentLocationStore((s) => s.longitude);
  const setLocation = useUserCurrentLocationStore((s) => s.setLocation);
  const setAddress = useUserCurrentLocationStore((s) => s.setAddress);
  const markLocationRequestUserInitiated = useUserCurrentLocationStore(
    (s) => s.markLocationRequestUserInitiated,
  );
  const handleLocationRequestFailure = useUserCurrentLocationStore(
    (s) => s.handleLocationRequestFailure,
  );

  const location = useMemo<UserLocation | null>(() => {
    if (latitude == null || longitude == null) return null;
    return { latitude, longitude };
  }, [latitude, longitude]);

  const refresh = useCallback((): Promise<void> => {
    if (isWebViewEnvironment()) {
      return requestLocationFromApp({ userInitiated: true });
    }

    if (!navigator.geolocation) {
      handleLocationRequestFailure();
      return Promise.resolve();
    }

    markLocationRequestUserInitiated();
    return new Promise<void>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          useUserCurrentLocationStore.getState().clearLocationRequestFlag();
          const { latitude: lat, longitude: lng } = pos.coords;
          setLocation(lat, lng);
          reverseGeocode(lat, lng).then((result) => {
            if (result) setAddress(result);
          });
          resolve();
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            handleLocationRequestFailure();
          } else {
            useUserCurrentLocationStore.getState().clearLocationRequestFlag();
          }
          resolve();
        },
        // 눌렀으니 새 위치를 정확하게. 10초 넘으면 그만(지도는 이미 알고 있던 위치로 옮겨져 있다)
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 },
      );
    });
  }, [handleLocationRequestFailure, markLocationRequestUserInitiated, setAddress, setLocation]);

  return { location, refresh };
}
