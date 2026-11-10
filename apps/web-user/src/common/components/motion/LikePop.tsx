"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import clsx from "clsx";

/**
 * 저장(하트)을 켰을 때 아이콘이 톡 튕기는 움직임(공용 움직임 값 like-pop: 1 → 1.3 → 1, spring).
 * 처음 그릴 때는 움직이지 않고, 꺼져 있다가 켜질 때만 한 번 튕긴다.
 */
export function LikePop({
  liked,
  children,
  className,
}: {
  liked: boolean;
  children: ReactNode;
  className?: string;
}) {
  const wasLiked = useRef(liked);
  const [popCount, setPopCount] = useState(0);

  useEffect(() => {
    if (liked && !wasLiked.current) setPopCount((n) => n + 1);
    wasLiked.current = liked;
  }, [liked]);

  return (
    <span
      key={popCount}
      className={clsx(
        "inline-flex",
        popCount > 0 && "animate-like-pop motion-reduce:animate-none",
        className,
      )}
    >
      {children}
    </span>
  );
}
