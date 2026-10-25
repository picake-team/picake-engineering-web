"use client";

import { useState } from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Thumbs } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import { ImageModal } from "@/apps/web-user/common/components/sliders";
import { EmptyState } from "@/apps/web-user/common/components/fallbacks/EmptyState";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/thumbs";

interface ProductDetailImageGallerySectionProps {
  images: string[];
  productName: string;
}

export function ProductDetailImageGallerySection({
  images,
  productName,
}: ProductDetailImageGallerySectionProps) {
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null);
  // 이미지 미리보기(확대) 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);

  const handleImageClick = (index: number) => {
    setModalIndex(index);
    setIsModalOpen(true);
  };

  // ImageModal이 요구하는 SliderImage 형태로 변환
  const modalImages = (images ?? []).map((url, index) => ({ id: `${index}`, url }));

  if (!images || images.length === 0) {
    return (
      <div className="w-full aspect-square bg-gray-100 flex items-center justify-center">
        <EmptyState message="이미지가 없습니다." />
      </div>
    );
  }

  return (
    <div className="product-image-gallery">
      {/* 메인 슬라이드 */}
      <Swiper
        modules={[Pagination, Thumbs]}
        pagination={{ type: "fraction" }}
        thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
        loop={images.length > 1}
        className="w-full aspect-square"
      >
        {images.map((image, index) => (
          <SwiperSlide key={index}>
            <button
              type="button"
              onClick={() => handleImageClick(index)}
              className="w-full h-full relative block cursor-pointer"
              aria-label={`${productName} 이미지 ${index + 1} 확대 보기`}
            >
              <Image
                src={image}
                alt={`${productName} - 이미지 ${index + 1}`}
                fill
                sizes="(min-width: 640px) 640px, 100vw"
                className="object-cover"
                priority={index === 0}
              />
            </button>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* 썸네일 미리보기 (이미지가 2개 이상일 때만 표시) */}
      {images.length > 1 && (
        <Swiper
          onSwiper={setThumbsSwiper}
          modules={[Thumbs]}
          watchSlidesProgress
          slidesPerView="auto"
          spaceBetween={6}
          className="mt-[8px] !px-[8px] thumbnail-swiper [&_.swiper-slide-thumb-active>div]:outline-none [&_.swiper-slide-thumb-active>div]:after:bg-white/30 [&_.swiper-slide-thumb-active>div]:after:border-2 [&_.swiper-slide-thumb-active>div]:after:border-primary [&_.swiper-slide-thumb-active>div]:after:rounded-xl"
        >
          {images.map((image, index) => (
            <SwiperSlide key={index} className="!w-[60px] cursor-pointer">
              <div className="w-[60px] h-[60px] relative rounded-xl overflow-hidden after:absolute after:inset-0 after:z-10 after:pointer-events-none">
                <Image
                  src={image}
                  alt={`${productName} - 썸네일 ${index + 1}`}
                  fill
                  sizes="60px"
                  className="object-cover"
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      )}

      {/* 이미지 확대 미리보기 모달 */}
      <ImageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        images={modalImages}
        initialIndex={modalIndex}
      />
    </div>
  );
}
