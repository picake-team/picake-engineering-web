"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import {
  TransformWrapper,
  TransformComponent,
  ReactZoomPanPinchContentRef,
} from "react-zoom-pan-pinch";
import { Icon } from "@/apps/web-user/common/components/icons";
import { SliderImage } from "./ImageSlider";
import { usePageScrollLock } from "@/apps/web-user/common/hooks/usePageScrollLock";

interface ImageModalProps {
  /** 모달 열림 상태 */
  isOpen: boolean;
  /** 모달 닫기 핸들러 */
  onClose: () => void;
  /** 이미지 배열 */
  images: SliderImage[];
  /** 초기 선택된 이미지 인덱스 */
  initialIndex?: number;
}

/**
 * 이미지 상세 보기 모달 컴포넌트
 */
export const ImageModal: React.FC<ImageModalProps> = ({
  isOpen,
  onClose,
  images,
  initialIndex = 0,
}) => {
  const [swiper, setSwiper] = useState<SwiperType | null>(null);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  /** 확대 상태 여부 (확대 중에만 이미지 패닝을 허용한다) */
  const [isZoomed, setIsZoomed] = useState(false);
  /** 슬라이드 조작 중 여부 (좌우 화살표 노출 제어) */
  const [isSliding, setIsSliding] = useState(false);
  const transformRefs = useRef<(ReactZoomPanPinchContentRef | null)[]>([]);

  // 확대 중에는 슬라이드 스와이프를 막아 패닝과 충돌하지 않도록 함
  useEffect(() => {
    if (swiper) swiper.allowTouchMove = !isZoomed;
  }, [swiper, isZoomed]);

  useEffect(() => {
    if (!isSliding) return;
    const timer = setTimeout(() => setIsSliding(false), 1500);
    return () => clearTimeout(timer);
  }, [isSliding]);

  useEffect(() => {
    if (isOpen && swiper) {
      swiper.slideTo(initialIndex, 0);
      setCurrentIndex(initialIndex);
    }
  }, [isOpen, initialIndex, swiper]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        swiper?.slidePrev();
      } else if (e.key === "ArrowRight") {
        swiper?.slideNext();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
    }

    return () => {
      document.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, onClose, swiper]);

  usePageScrollLock(isOpen);

  if (!isOpen || images.length === 0) return null;

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center bg-black">
      {/* 닫기 버튼 */}
      <button
        type="button"
        onClick={onClose}
        aria-label="닫기"
        className="absolute top-4 right-4 z-10 p-2 text-white"
      >
        <Icon name="close" width={24} height={24} />
      </button>

      {/* 이미지 카운터 */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 text-white text-sm">
        {currentIndex + 1} / {images.length}
      </div>

      {/* Swiper 슬라이더 */}
      <div className="w-full h-full">
        <Swiper
          modules={[Navigation]}
          onSwiper={setSwiper}
          onTouchStart={() => setIsSliding(true)}
          onSlideChange={(s) => {
            // 이전 슬라이드 줌 리셋
            transformRefs.current.forEach((ref) => {
              ref?.resetTransform();
            });
            setIsZoomed(false);
            setCurrentIndex(s.activeIndex);
          }}
          slidesPerView={1}
          initialSlide={initialIndex}
          className="w-full h-full"
        >
          {images.map((image, idx) => (
            <SwiperSlide key={image.id} className="flex items-center justify-center">
              <TransformWrapper
                ref={(ref) => {
                  transformRefs.current[idx] = ref;
                }}
                initialScale={1}
                minScale={1}
                maxScale={4}
                centerOnInit
                doubleClick={{ mode: "reset" }}
                // 확대 전에는 패닝을 꺼야 터치 이벤트가 Swiper로 전달되어 스와이프가 동작한다
                panning={{ disabled: !isZoomed }}
                onTransformed={(ref) => {
                  setIsZoomed(ref.state.scale > 1);
                }}
              >
                <TransformComponent
                  wrapperStyle={{ width: "100%", height: "100%" }}
                  contentStyle={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div className="relative w-full h-full flex items-center justify-center p-4">
                    <Image
                      src={image.url}
                      alt={`이미지 ${idx + 1}`}
                      fill
                      className="object-contain"
                    />
                  </div>
                </TransformComponent>
              </TransformWrapper>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* 좌우 컨트롤러 */}
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => swiper?.slidePrev()}
            className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 w-[40px] h-[56px] rounded-r-[8px] bg-black/30 flex items-center justify-center text-white transition-opacity duration-slow ${
              !isSliding ? "opacity-0" : currentIndex === 0 ? "opacity-30" : "opacity-100"
            } ${currentIndex === 0 ? "md:opacity-30" : "md:opacity-100"}`}
            disabled={currentIndex === 0}
          >
            <Icon name="arrow" width={24} height={24} className="-rotate-90" />
          </button>
          <button
            type="button"
            onClick={() => swiper?.slideNext()}
            className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 w-[40px] h-[56px] rounded-l-[8px] bg-black/30 flex items-center justify-center text-white transition-opacity duration-slow ${
              !isSliding
                ? "opacity-0"
                : currentIndex === images.length - 1
                  ? "opacity-30"
                  : "opacity-100"
            } ${currentIndex === images.length - 1 ? "md:opacity-30" : "md:opacity-100"}`}
            disabled={currentIndex === images.length - 1}
          >
            <Icon name="arrow" width={24} height={24} className="rotate-90" />
          </button>
        </>
      )}
    </div>
  );
};
