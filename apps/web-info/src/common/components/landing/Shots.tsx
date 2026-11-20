import Image, { type StaticImageData } from "next/image";

/**
 * 실제 앱 화면 그림의 틀. 휴대폰 틀은 아래가 칸 끝에서 잘린다(토스플레이스·똑독처럼 위쪽만 보인다).
 * 그림은 실제 화면(예시 가게)만 쓰고, 그림·아이콘으로 꾸미지 않는다(운영자: "AI가 만든 느낌").
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
    <div
      className={`overflow-hidden rounded-t-[30px] border-[6px] border-b-0 border-[#111] bg-white shadow-[0_30px_60px_-24px_rgba(0,0,0,0.4)] md:rounded-t-[38px] md:border-[7px] md:border-b-0 ${className}`}
    >
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
}: {
  src: StaticImageData;
  alt: string;
  className?: string;
}) {
  return (
    <div
      className={`aspect-[1440/820] overflow-hidden rounded-[12px] border-[6px] border-[#1d1d1d] bg-white shadow-[0_24px_50px_-28px_rgba(0,0,0,0.45)] md:rounded-[16px] md:border-[10px] ${className}`}
    >
      <Image
        src={src}
        alt={alt}
        sizes="(min-width: 1024px) 640px, (min-width: 768px) 90vw, 85vw"
        className="block h-full w-full object-cover object-top"
      />
    </div>
  );
}
