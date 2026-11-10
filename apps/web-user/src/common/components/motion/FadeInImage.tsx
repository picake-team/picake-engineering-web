"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";
import clsx from "clsx";

/**
 * 사진이 오면 0.2초 동안 부드럽게 나타나는 next/image(공용 움직임 값 base·enter).
 * 오기 전에는 감싼 칸의 회색 바탕이 보이게 둔다(감싼 칸에 bg-gray-50 등).
 * 동작 줄이기면 바로 보인다.
 */
export function FadeInImage({ className, onLoad, alt, ...props }: ImageProps) {
  const [loaded, setLoaded] = useState(false);
  return (
    <Image
      {...props}
      alt={alt}
      className={clsx(
        className,
        "transition-opacity duration-base ease-enter motion-reduce:transition-none",
        loaded ? "opacity-100" : "opacity-0",
      )}
      onLoad={(e) => {
        setLoaded(true);
        onLoad?.(e);
      }}
    />
  );
}
