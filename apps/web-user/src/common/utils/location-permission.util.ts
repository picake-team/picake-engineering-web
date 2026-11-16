/**
 * 위치를 한 번이라도 받았는지(위치 권한을 허용함) 기억한다(2026-11-16 운영자: 첫 화면에서 위치를 묻지 않기).
 * 기억해 두면 다음에 들어올 때 묻는 창 없이 조용히 다시 받아 거리순·지도가 바로 맞는다.
 */
const LOCATION_GRANTED_KEY = "picake:location-granted";

export function rememberLocationGranted(): void {
  try {
    window.localStorage.setItem(LOCATION_GRANTED_KEY, "1");
  } catch {
    // 저장하지 못해도 다음에 위치가 필요할 때 다시 물을 뿐이다
  }
}

export function forgetLocationGranted(): void {
  try {
    window.localStorage.removeItem(LOCATION_GRANTED_KEY);
  } catch {
    // 무시
  }
}

export function hasLocationGranted(): boolean {
  try {
    return window.localStorage.getItem(LOCATION_GRANTED_KEY) === "1";
  } catch {
    return false;
  }
}

/** 브라우저의 위치 권한 상태를 묻는 창 없이 확인한다. 브라우저가 알려 주지 않으면 "unknown" */
export async function getBrowserGeolocationPermission(): Promise<PermissionState | "unknown"> {
  try {
    if (typeof navigator === "undefined" || !navigator.permissions?.query) return "unknown";
    const status = await navigator.permissions.query({ name: "geolocation" as PermissionName });
    return status.state;
  } catch {
    return "unknown";
  }
}
