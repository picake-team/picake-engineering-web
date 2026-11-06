/**
 * 아래로 당기면 새로고침(I-48 화면 원칙 "목록은 아래로 당기면 새로고침").
 * 안드로이드 앱 안 화면에는 기본 동작이 없고 아이폰은 튕기기만 해서 화면이 직접 만든다.
 * 화면 맨 위에서 손가락으로 끌어내릴 때만 움직이고, 64 이상 끌면 놓을 때 새로 불러온다.
 */
import React, { useEffect, useRef, useState } from "react";

const TRIGGER = 64;
const MAX = 96;

export function PullToRefresh({
  onRefresh,
  children,
}: {
  onRefresh: () => Promise<unknown>;
  children: React.ReactNode;
}) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const pullRef = useRef(0);
  const busyRef = useRef(false);
  const refreshRef = useRef(onRefresh);
  refreshRef.current = onRefresh;

  useEffect(() => {
    const setBoth = (v: number) => {
      pullRef.current = v;
      setPull(v);
    };
    const onStart = (e: TouchEvent) => {
      startY.current = window.scrollY <= 0 && !busyRef.current ? e.touches[0].clientY : null;
    };
    const onMove = (e: TouchEvent) => {
      if (startY.current === null) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy <= 0 || window.scrollY > 0) {
        setBoth(0);
        return;
      }
      setBoth(Math.min(MAX, dy * 0.5));
    };
    const onEnd = () => {
      if (startY.current === null) return;
      startY.current = null;
      if (pullRef.current < TRIGGER) {
        setBoth(0);
        return;
      }
      busyRef.current = true;
      setRefreshing(true);
      setBoth(48);
      void refreshRef.current().finally(() => {
        busyRef.current = false;
        setRefreshing(false);
        setBoth(0);
      });
    };
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd);
    window.addEventListener("touchcancel", onEnd);
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
    };
  }, []);

  const ready = pull >= TRIGGER || refreshing;
  return (
    <>
      <div
        aria-hidden={!refreshing}
        className="-mt-1 flex items-end justify-center overflow-hidden transition-[height] duration-150"
        style={{ height: pull }}
      >
        <span
          role={refreshing ? "status" : undefined}
          aria-label={refreshing ? "새로 불러오는 중" : undefined}
          className={`mb-3 inline-block size-6 rounded-full border-[2.5px] border-ink-100 border-t-brand ${refreshing ? "animate-spin" : ""}`}
          style={{
            transform: refreshing ? undefined : `rotate(${pull * 4}deg)`,
            opacity: ready ? 1 : Math.min(1, pull / TRIGGER),
          }}
        />
      </div>
      {children}
    </>
  );
}
