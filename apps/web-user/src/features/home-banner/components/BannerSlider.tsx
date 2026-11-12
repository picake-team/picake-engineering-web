"use client";

import Image from "next/image";
import { FadeInImage } from "@/apps/web-user/common/components/motion/FadeInImage";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import { useHomeBanners } from "@/apps/web-user/features/home-banner/hooks/queries/useHomeBanners";
import type {
  HomeBanner,
  HomeBannerImageAlign,
} from "@/apps/web-user/features/home-banner/types/home-banner.type";
import { Skeleton } from "@/apps/web-user/common/components/skeleton/Skeleton";

/** 정렬값 → object-position (이미지가 화면보다 넓을 때 잘리는 방향 제어) */
const ALIGN_OBJECT_POSITION: Record<HomeBannerImageAlign, string> = {
  LEFT: "left center",
  CENTER: "center center",
  RIGHT: "right center",
};

function updateBullets(bullets: HTMLElement[], activeIndex: number) {
  bullets.forEach((bullet, i) => {
    const dist = Math.abs(i - activeIndex);
    if (dist > 3) {
      bullet.style.display = "none";
    } else {
      bullet.style.display = "inline-block";
      if (i === activeIndex) {
        bullet.style.width = "10px";
        bullet.style.height = "12px";
        bullet.style.borderRadius = "0";
        bullet.style.backgroundImage = "url('/images/banner/bullet_on.png')";
      } else {
        const size = dist <= 1 ? 8 : dist === 2 ? 6 : 4;
        bullet.style.width = `${size}px`;
        bullet.style.height = `${size}px`;
        bullet.style.borderRadius = "50%";
        bullet.style.backgroundImage = "url('/images/banner/bullet_off.png')";
      }
    }
  });
}

function BannerSlideImage({
  src,
  alt,
  align,
  priority,
}: {
  src: string;
  alt: string;
  align: HomeBannerImageAlign;
  priority?: boolean;
}) {
  // 첫 장은 첫 화면에서 가장 큰 그림이라 서서히 나타나게 하지 않는다(나타나는 0.2초가 그대로 늦어짐)
  const ImageTag = priority ? Image : FadeInImage;
  return (
    <ImageTag
      src={src}
      alt={alt}
      fill
      className="object-cover"
      style={{ objectPosition: ALIGN_OBJECT_POSITION[align] }}
      priority={priority}
      sizes="100vw"
    />
  );
}

export default function BannerSlider({ initialBanners }: { initialBanners?: HomeBanner[] }) {
  const { data: banners = [], isLoading } = useHomeBanners(initialBanners);

  if (isLoading) {
    return (
      <div className="h-[246px]">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  if (banners.length === 0) {
    return <div className="h-[246px]" aria-hidden />;
  }

  return (
    <div className="h-[246px] bg-gray-50">
      <Swiper
        modules={[Pagination, Autoplay]}
        pagination={{
          clickable: true,
          renderBullet: (index: number, className: string) => {
            return `<span class="${className}" data-index="${index}"></span>`;
          },
        }}
        autoplay={{ delay: 3000, disableOnInteraction: false }}
        loop={banners.length > 1}
        onSlideChange={(swiper) => {
          const bullets = swiper.pagination.bullets;
          if (!bullets) return;
          updateBullets(bullets as unknown as HTMLElement[], swiper.realIndex);
        }}
        onAfterInit={(swiper) => {
          const bullets = swiper.pagination.bullets;
          if (!bullets) return;
          updateBullets(bullets as unknown as HTMLElement[], swiper.realIndex);
        }}
        className="h-full [&_.swiper-pagination]:!bottom-[42px] [&_.swiper-pagination-bullet]:opacity-100 [&_.swiper-pagination-bullet]:transition-all [&_.swiper-pagination-bullet]:duration-base [&_.swiper-pagination-bullet]:[filter:drop-shadow(0px_2px_7px_rgba(0,0,0,0.45))] [&_.swiper-pagination-bullet]:bg-[length:100%_100%] [&_.swiper-pagination-bullet]:bg-no-repeat [&_.swiper-pagination-bullet]:[background-color:transparent]"
      >
        {banners.map((banner, idx) => {
          const slideContent = (
            <BannerSlideImage
              src={banner.imageUrl}
              alt={`배너 ${idx + 1}`}
              align={banner.imageAlign ?? "CENTER"}
              priority={idx === 0}
            />
          );

          return (
            <SwiperSlide key={banner.id}>
              {banner.linkUrl ? (
                banner.linkUrl.startsWith("http") ? (
                  <a
                    href={banner.linkUrl}
                    className="relative block h-full w-full"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {slideContent}
                  </a>
                ) : (
                  <Link href={banner.linkUrl} className="relative block h-full w-full">
                    {slideContent}
                  </Link>
                )
              ) : (
                <div className="relative h-full w-full">{slideContent}</div>
              )}
            </SwiperSlide>
          );
        })}
      </Swiper>
    </div>
  );
}
