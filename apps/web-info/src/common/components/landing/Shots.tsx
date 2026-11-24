import Image, { type StaticImageData } from "next/image";

import { PC_FRAME, PHONE_FRAME } from "@/apps/web-info/common/components/landing/landing.styles";

/**
 * 실제 앱 화면 그림의 틀. 휴대폰 틀은 아래가 칸 끝에서 잘린다(토스플레이스·똑독처럼 위쪽만 보인다).
 * 그림은 실제 화면(예시 가게)만 쓰고, 그림·아이콘으로 꾸미지 않는다(운영자: "AI가 만든 느낌").
 * 움직이는 사용법 영상은 같은 틀을 쓰는 `ShotVideo`.
 */
export function PhoneShot({
  src,
  alt,
  className = "",
}: {
  src: StaticImageData;
  alt: string;
  /** 크기·위치(폭·높이) */
  className?: string;
}) {
  return (
    <div className={`${PHONE_FRAME} ${className}`}>
      <Image
        src={src}
        alt={alt}
        sizes="(min-width: 768px) 340px, 260px"
        className="block h-auto w-full"
      />
    </div>
  );
}

/** 컴퓨터 화면 그림. 화면 비율(16:9에 가까운 1440×820)로 위쪽부터 보인다 */
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
