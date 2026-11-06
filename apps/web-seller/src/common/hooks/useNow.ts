import { useEffect, useState } from "react";

/** 지금 시각(ms). 남은 시간 글자처럼 시간이 흐르면 바뀌는 곳에서 intervalMs마다 다시 그린다 */
export function useNow(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}
