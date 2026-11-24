import Image, { type StaticImageData } from "next/image";

import { PC_FRAME } from "@/apps/web-info/common/components/landing/landing.styles";

/**
 * 실제 앱 화면 그림의 틀(컴퓨터). 그림은 실제 화면(예시 가게)만 쓰고, 그림·아이콘으로 꾸미지 않는다(운영자: "AI가 만든 느낌").
 * 화면 비율(16:9에 가까운 1440×820)로 위쪽부터 보인다.
 * 휴대폰 화면은 2026-11-24·25부터 모두 사용법 영상(`ShotVideo`, 휴대폰 틀 `PHONE_FRAME`)이라 휴대폰 그림 틀은 없앴다.
 */
export function PcShot({
  src,
  alt,
  className = "",
  sizes = "(min-width: 1024px) 640px, (min-width: 768px) 90vw, 85vw",
}: {
  src: StaticImageData;
  alt: string;
  className?: string;
  /** 놓이는 칸 폭(next/image가 알맞은 크기를 고르게). 기본은 글 | 화면 한 장 */
  sizes?: string;
}) {
  return (
    <div className={`${PC_FRAME} ${className}`}>
      <Image
        src={src}
        alt={alt}
        sizes={sizes}
        className="block h-full w-full object-cover object-top"
      />
    </div>
  );
}
