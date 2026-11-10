"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 닫힐 때 나가는 움직임이 끝날 때까지 화면에 남겨 두는 훅(아래 창·확인 창).
 * - present: 그릴지 / leaving: 나가는 중인지(나가는 움직임 class를 붙인다)
 * - content: 나가는 동안에는 마지막으로 열려 있던 때의 내용을 그대로 보여 준다
 *   (닫히면서 부모가 값을 비워도 창 안이 깨지거나 빈 채로 내려가지 않게)
 */
export function usePresence<T>(open: boolean, exitMs: number, content: T) {
  const [mounted, setMounted] = useState(open);
  if (open && !mounted) setMounted(true);

  const lastContent = useRef(content);
  if (open) lastContent.current = content;

  useEffect(() => {
    if (open || !mounted) return;
    const timer = window.setTimeout(() => setMounted(false), exitMs);
    return () => window.clearTimeout(timer);
  }, [open, mounted, exitMs]);

  return {
    present: open || mounted,
    leaving: !open && mounted,
    content: open ? content : lastContent.current,
  };
}
