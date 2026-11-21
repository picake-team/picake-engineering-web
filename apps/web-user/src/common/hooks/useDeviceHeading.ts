"use client";

import { useCallback, useEffect, useState } from "react";

type CompassOrientationEvent = DeviceOrientationEvent & { webkitCompassHeading?: number };
type PermissionRequestableOrientation = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<"granted" | "denied" | "default">;
};

/** 같은 방향으로 보는 작은 흔들림은 다시 그리지 않는다(도) */
const MIN_CHANGE_DEG = 3;

function orientationEventClass(): PermissionRequestableOrientation | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { DeviceOrientationEvent?: PermissionRequestableOrientation })
    .DeviceOrientationEvent;
}

/**
 * 아이폰(사파리·앱 웹뷰)은 방향을 읽기 전에 허용을 받아야 한다. 안드로이드 크롬·웹뷰도 요즘 `requestPermission`이 있지만
 * 허용 없이 `deviceorientationabsolute`가 온다 — 절대 방향 신호가 있으면 기다리지 않는다(2026-11-21 에뮬레이터 앱에서 확인)
 */
function needsPermission(): boolean {
  if (typeof window !== "undefined" && "ondeviceorientationabsolute" in window) return false;
  return typeof orientationEventClass()?.requestPermission === "function";
}

/** 화면이 돌아간 만큼(가로로 들었을 때) 더한다 */
function screenAngle(): number {
  if (typeof window === "undefined") return 0;
  const angle = window.screen?.orientation?.angle;
  if (typeof angle === "number") return angle;
  const legacy = (window as unknown as { orientation?: number }).orientation;
  return typeof legacy === "number" ? legacy : 0;
}

/**
 * 휴대폰이 향한 방향(북쪽 0°, 시계 방향). 모르면 null — 지도 현재 위치 점의 작은 삼각형(운영자 2026-11-21 H3).
 * - 안드로이드(크롬·앱 웹뷰): `deviceorientationabsolute`, 허용 창 없음
 * - 아이폰: 처음 한 번 "동작 및 방향" 허용(`requestPermission`은 누르는 순간에만 부를 수 있다) 뒤 `webkitCompassHeading`.
 *   새 앱은 우리 주소에 한해 앱이 대신 허용한다(앱 레포 PicakeShell)
 * - PC·나침반이 없는 기기는 늘 null
 */
export function useDeviceHeading(active: boolean) {
  const [heading, setHeading] = useState<number | null>(null);
  const [allowed, setAllowed] = useState<boolean>(() => !needsPermission());

  useEffect(() => {
    if (!active || !allowed || typeof window === "undefined") return;
    let frame = 0;
    let pending: number | null = null;
    let shown: number | null = null;

    const push = (deg: number) => {
      pending = ((deg % 360) + 360) % 360;
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        if (pending == null) return;
        const diff = shown == null ? 360 : Math.abs(((pending - shown + 540) % 360) - 180);
        if (diff < MIN_CHANGE_DEG) return;
        shown = pending;
        setHeading(Math.round(pending));
      });
    };

    const onAbsolute = (event: Event) => {
      const alpha = (event as DeviceOrientationEvent).alpha;
      if (typeof alpha !== "number") return;
      push(360 - alpha + screenAngle());
    };
    const onCompass = (event: Event) => {
      const compass = (event as CompassOrientationEvent).webkitCompassHeading;
      if (typeof compass !== "number" || Number.isNaN(compass)) return;
      push(compass + screenAngle());
    };

    const useAbsolute = "ondeviceorientationabsolute" in window;
    if (useAbsolute) window.addEventListener("deviceorientationabsolute", onAbsolute);
    else window.addEventListener("deviceorientation", onCompass);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      if (useAbsolute) window.removeEventListener("deviceorientationabsolute", onAbsolute);
      else window.removeEventListener("deviceorientation", onCompass);
    };
  }, [active, allowed]);

  /** 아이폰: 버튼을 누른 그 순간에 부른다(허용 창). 필요 없거나 이미 허용됐으면 그대로 */
  const requestPermission = useCallback(() => {
    const OrientationEvent = orientationEventClass();
    if (!needsPermission() || typeof OrientationEvent?.requestPermission !== "function") {
      setAllowed(true);
      return;
    }
    OrientationEvent.requestPermission()
      .then((result) => setAllowed(result === "granted"))
      .catch(() => {
        /* 누르는 순간이 아니었거나 막힘 — 방향 없이 점만 */
      });
  }, []);

  return { heading, requestPermission };
}
