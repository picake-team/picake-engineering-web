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
 * - refresh()는 사용자 명시 요청으로 취급 → 권한 거부 시 안내 모달
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

  const refresh = useCallback(() => {
    if (isWebViewEnvironment()) {
      void requestLocationFromApp({ userInitiated: true });
      return;
    }

    if (!navigator.geolocation) {
      handleLocationRequestFailure();
      return;
    }

    markLocationRequestUserInitiated();
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        useUserCurrentLocationStore.getState().clearLocationRequestFlag();
        const { latitude: lat, longitude: lng } = pos.coords;
        setLocation(lat, lng);
        reverseGeocode(lat, lng).then((result) => {
          if (result) setAddress(result);
        });
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          handleLocationRequestFailure();
          return;
        }
        useUserCurrentLocationStore.getState().clearLocationRequestFlag();
      },
    );
  }, [handleLocationRequestFailure, markLocationRequestUserInitiated, setAddress, setLocation]);

  return { location, refresh };
}
