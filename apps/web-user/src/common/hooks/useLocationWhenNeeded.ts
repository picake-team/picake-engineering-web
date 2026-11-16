"use client";

import { useEffect } from "react";
import { useUserCurrentLocationStore } from "@/apps/web-user/common/store/user-current-location.store";
import { reverseGeocode } from "@/apps/web-user/common/utils/kakao-geocode.util";
import {
  isWebViewEnvironment,
  requestLocationFromWebView,
} from "@/apps/web-user/common/utils/webview.bridge";

/** 들어와 있는 동안(새로 고치기 전) 한 번만 묻는다. 거부한 손님에게 화면마다 다시 묻지 않게 */
let askedThisSession = false;

/**
 * 위치가 필요한 화면(지도, 검색 결과 거리순)에서만 위치를 묻는다(2026-11-16 운영자: 첫 화면에서 묻지 않기).
 * 앱이면 앱에 위치를 달라고 하고(처음이면 휴대폰이 권한을 물음), 웹이면 브라우저가 묻는다.
 * 손님이 누른 게 아니라 거부해도 설정 안내 창은 띄우지 않는다(거리순은 인기순으로, 지도는 기본 위치로).
 */
export function useLocationWhenNeeded(enabled: boolean): void {
  const hasLocation = useUserCurrentLocationStore((s) => s.latitude != null && s.longitude != null);

  useEffect(() => {
    if (!enabled || hasLocation || askedThisSession) return;
    askedThisSession = true;

    if (isWebViewEnvironment()) {
      requestLocationFromWebView();
      return;
    }
    if (typeof navigator === "undefined" || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const { setLocation, setAddress } = useUserCurrentLocationStore.getState();
        setLocation(latitude, longitude);
        reverseGeocode(latitude, longitude).then((result) => {
          if (result) setAddress(result);
        });
      },
      () => {
        // 거부·실패: 손님이 누른 것이 아니라 아무것도 띄우지 않는다
      },
    );
  }, [enabled, hasLocation]);
}
