import { useEffect, useRef, useState } from "react";
import { kstDateKey } from "@/apps/web-seller/common/utils/kst-date.util";

const DAY_MS = 24 * 60 * 60 * 1000;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** 지금부터 다음 한국 자정까지(ms) */
export function msUntilNextKstMidnight(now: number): number {
  const nextMidnightUtc = (Math.floor((now + KST_OFFSET_MS) / DAY_MS) + 1) * DAY_MS - KST_OFFSET_MS;
  return nextMidnightUtc - now;
}

/**
 * 한국 날짜 "오늘"(YYYY-MM-DD). 화면을 켜 둔 채 자정이 지나거나, 앱을 내렸다가 다음 날 다시 열어도
 * 바뀐다(홈 "오늘 픽업"·캘린더 오늘 표시가 어제에 머물지 않게). 날짜가 같으면 다시 그리지 않는다
 */
export function useKstTodayKey(): string {
  const [key, setKey] = useState(() => kstDateKey(new Date()));
  useEffect(() => {
    const update = () => setKey(kstDateKey(new Date()));
    const timer = window.setTimeout(update, msUntilNextKstMidnight(Date.now()) + 1000);
    const onVisible = () => {
      if (document.visibilityState === "visible") update();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", update);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", update);
    };
  }, [key]);
  return key;
}

/** "오늘"이 바뀌면 이전 오늘을 보고 있던 값만 새 오늘로 옮긴다(사장님이 다른 날을 골라 뒀으면 그대로) */
export function useFollowToday(todayKey: string, onChange: (prev: string, next: string) => void) {
  const prev = useRef(todayKey);
  const cb = useRef(onChange);
  cb.current = onChange;
  useEffect(() => {
    if (prev.current === todayKey) return;
    cb.current(prev.current, todayKey);
    prev.current = todayKey;
  }, [todayKey]);
}
