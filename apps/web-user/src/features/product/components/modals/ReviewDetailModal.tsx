"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import { Review } from "@/apps/web-user/features/review/types/review.type";
import { Icon } from "@/apps/web-user/common/components/icons";
import { usePageScrollLock } from "@/apps/web-user/common/hooks/usePageScrollLock";

interface ImageWithReview {
  url: string;
  review: Review;
}

interface ReviewDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  reviews: Review[];
  initialReviewId?: string;
}

export const ReviewDetailModal: React.FC<ReviewDetailModalProps> = ({
  isOpen,
  onClose,
  reviews,
  initialReviewId,
}) => {
  const [swiper, setSwiper] = useState<SwiperType | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTextExpanded, setIsTextExpanded] = useState(false);
  const [isSliding, setIsSliding] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const [expandedHeight, setExpandedHeight] = useState<number | null>(null);
  const touchStartY = useRef(0);
  const contentRef = useRef<HTMLParagraphElement>(null);

  // 모든 리뷰의 이미지를 하나로 합침 (리뷰 정보 포함)
  const allImages: ImageWithReview[] = useMemo(() => {
    return reviews.flatMap((review) =>
      review.imageUrls.map((url) => ({
        url,
        review,
      })),
    );
  }, [reviews]);

  // 초기 슬라이드 인덱스 계산
  const initialSlideIndex = useMemo(() => {
    if (!initialReviewId) return 0;
    const index = allImages.findIndex((img) => img.review.id === initialReviewId);
    return index >= 0 ? index : 0;
  }, [allImages, initialReviewId]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      setCurrentIndex(initialSlideIndex);
      setIsExpanded(false);
      setIsTextExpanded(false);
      swiper?.slideTo(initialSlideIndex, 0);
    }

    return () => {
      document.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, onClose, swiper, initialSlideIndex]);

  usePageScrollLock(isOpen);

  // 슬라이드 중 화살표 표시 (모바일)
  useEffect(() => {
    if (isSliding) {
      const timer = setTimeout(() => setIsSliding(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [isSliding]);

  // 리뷰 내용이 3줄 초과인지 체크 + 확장 높이 계산
  useEffect(() => {
    const el = contentRef.current;
    if (el) {
      const isTrunc = el.scrollHeight > el.clientHeight;
      setIsTruncated(isTrunc);

      if (isTrunc) {
        // 텍스트 전체 높이 + 헤더(36px) + 패딩(pt-5:20px + pb-8:32px) + 여유(20px)
        const textHeight = el.scrollHeight;
        const totalHeight = textHeight + 36 + 20 + 32 + 20;
        // 최대 75vh, 최소 25vh
        const maxHeight = window.innerHeight * 0.75;
        const minHeight = window.innerHeight * 0.25;
        setExpandedHeight(Math.max(minHeight, Math.min(totalHeight, maxHeight)));
      }
    }
  }, [currentIndex, reviews]);

  // 텍스트 확장 딜레이 (박스가 올라온 후 텍스트 펼침)
  useEffect(() => {
    if (isExpanded) {
      const timer = setTimeout(() => setIsTextExpanded(true), 150);
      return () => clearTimeout(timer);
    } else {
      setIsTextExpanded(false);
    }
  }, [isExpanded]);

  if (!isOpen || allImages.length === 0) return null;

  const currentImage = allImages[currentIndex];
  const currentReview = currentImage?.review;

  if (!currentReview) return null;

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  };

  const roundedRating = Math.round(currentReview.rating);

  // 리뷰 박스 드래그 핸들러
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isTruncated) return;

    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;

    if (diff > 50) {
      setIsExpanded(true);
    } else if (diff < -50) {
      setIsExpanded(false);
    }
  };

  const handleReviewClick = () => {
    if (!isTruncated) return;
    setIsExpanded((prev) => !prev);
  };

  return (
    <div className="fixed inset-0 z-modal-over bg-gray-900 max-w-[640px] mx-auto">
      {/* 헤더 */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-[20px] py-[14px]">
        <button
          type="button"
          onClick={onClose}
          aria-label="뒤로가기"
          className="text-white h-[24px] w-[24px]"
        >
          <Icon name="chevronLeft" width={24} height={24} />
        </button>
        <span className="text-white text-sm font-medium">
          {currentIndex + 1} / {allImages.length}
        </span>
        <div className="w-[24px]" />
      </div>

      {/* 이미지 슬라이더 영역 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <Swiper
          key={`swiper-${reviews.map((r) => r.id).join("-")}`}
          modules={[Navigation]}
          onSwiper={setSwiper}
          onSlideChange={(s) => {
            setCurrentIndex(s.activeIndex);
            setIsExpanded(false);
            setIsTextExpanded(false);
          }}
          onTouchStart={() => setIsSliding(true)}
          slidesPerView={1}
          initialSlide={initialSlideIndex}
          className="w-full h-full"
        >
          {allImages.map((img, idx) => (
            <SwiperSlide key={`${img.review.id}-${idx}`}>
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-full h-[50vh] relative">
                  <Image
                    src={img.url}
                    alt={`리뷰 이미지 ${idx + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* 좌우 컨트롤러 */}
        {allImages.length > 1 && (
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
                  : currentIndex === allImages.length - 1
                    ? "opacity-30"
                    : "opacity-100"
              } ${currentIndex === allImages.length - 1 ? "md:opacity-30" : "md:opacity-100"}`}
              disabled={currentIndex === allImages.length - 1}
            >
              <Icon name="arrow" width={24} height={24} className="rotate-90" />
            </button>
          </>
        )}
      </div>

      {/* 리뷰 정보 박스 */}
      <div
        onClick={handleReviewClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`absolute bottom-0 left-0 right-0 z-30 transition-all duration-slow ease-enter motion-reduce:transition-none overflow-y-auto ${isTruncated ? "cursor-pointer" : ""}`}
        style={{
          height: isExpanded && isTruncated && expandedHeight ? `${expandedHeight}px` : "25vh",
          background:
            isExpanded && isTruncated
              ? "rgba(31, 31, 30, 0.95)"
              : "linear-gradient(to bottom, rgba(31, 31, 30, 0) 100%, rgba(31, 31, 30, 1) 0%)",
        }}
      >
        <div
          className={`flex flex-col px-5 pt-5 pb-8 h-full ${isExpanded ? "justify-start" : "justify-end"}`}
        >
          {/* 별점, 날짜, 닉네임 */}
          <div className="flex items-center justify-between gap-3 mb-3">
            <span className="flex items-center gap-[2px]">
              <Icon name="star" width={18} height={18} className="text-yellow-400" />
              <span className="font-bold text-white">{roundedRating}</span>
            </span>
            <div className="flex items-center gap-[24px] text-sm text-gray-300">
              <span className="relative before:content-[''] before:absolute before:right-[-12px] before:top-1/2 before:-translate-y-1/2 before:w-[1px] before:h-[8px] before:bg-gray-300">
                {formatDate(currentReview.createdAt)}
              </span>
              <span className="font-bold">{currentReview.userNickname || "익명"}</span>
            </div>
          </div>

          {/* 리뷰 내용 */}
          <p
            ref={contentRef}
            className={`text-sm text-gray-50 leading-[160%] whitespace-pre-wrap ${
              !isTextExpanded ? "line-clamp-3" : ""
            }`}
          >
            {currentReview.content}
          </p>
        </div>
      </div>
    </div>
  );
};
