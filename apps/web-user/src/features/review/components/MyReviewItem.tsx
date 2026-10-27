"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { MyReview } from "@/apps/web-user/features/review/types/review.type";
import type { OrderItemResponse } from "@/apps/web-user/features/order/types/order.type";
import { formatOrderItemSummary } from "@/apps/web-user/features/product/utils/custom-option.util";
import { Icon } from "@/apps/web-user/common/components/icons";
import { ImageSlider } from "@/apps/web-user/common/components/sliders";
import { PATHS } from "@/apps/web-user/common/constants/paths.constant";

interface MyReviewItemProps {
  review: MyReview;
  onDelete?: (reviewId: string) => void;
  onImageClick?: (review: MyReview) => void;
}

function formatOrderItemOptions(item: OrderItemResponse): string {
  return formatOrderItemSummary(item);
}

export function MyReviewItem({ review, onDelete, onImageClick }: MyReviewItemProps) {
  const orderItems = review.order?.orderItems ?? [];
  const hasOrderOptions = orderItems.length > 0;
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const [isOptionExpanded, setIsOptionExpanded] = useState(false);
  const contentRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = contentRef.current;
    if (el) {
      setIsTruncated(el.scrollHeight > el.clientHeight);
    }
  }, [review.content]);

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  };

  const formatPrice = (price: number) => {
    return `${price.toLocaleString()}원`;
  };

  return (
    <div
      id={`review-${review.id}`}
      className="pt-6 pb-12 border-b border-gray-100 last:border-b-0 scroll-mt-10"
    >
      {/* 스토어명 + 삭제 */}
      <div className="flex items-center justify-between mb-1">
        <Link href={PATHS.STORE.DETAIL(review.storeId)} className="flex items-center gap-0.5">
          <span className="text-sm font-bold text-gray-900">{review.storeName}</span>
          <Icon name="arrow" width={20} height={20} className="text-gray-900 rotate-90" />
        </Link>
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(review.id)}
            className="text-xs text-gray-500 font-bold underline"
          >
            삭제
          </button>
        )}
      </div>

      {/* 별점 + 날짜 */}
      <div className="flex items-center gap-2 mb-3">
        <span className="flex items-center gap-[2px]">
          <Icon name="star" width={18} height={18} className="text-yellow-400" />
          <span className="text-sm font-bold text-gray-900">{Math.round(review.rating)}</span>
        </span>
        <span className="text-xs text-gray-500">{formatDate(review.createdAt)}</span>
      </div>

      {/* 후기 내용 */}
      <div className="mb-3">
        <p
          ref={contentRef}
          className={`text-sm text-gray-700 leading-[140%] ${!isExpanded ? "line-clamp-3" : ""}`}
        >
          {review.content}
        </p>
        {isTruncated && !isExpanded && (
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="text-sm text-gray-500 mt-1"
          >
            더보기
          </button>
        )}
        {isExpanded && (
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            className="text-sm text-gray-500 mt-1"
          >
            접기
          </button>
        )}
      </div>

      {/* 상품 정보 */}
      <div className="relative py-3 px-4 bg-gray-50 rounded-xl">
        <div className={`flex items-center gap-3 ${hasOrderOptions ? "pr-[70px]" : ""}`}>
          <span className="w-[40px] h-[40px] relative rounded-lg overflow-hidden flex-shrink-0">
            {review.productImageUrl ? (
              <Image
                src={review.productImageUrl}
                alt={review.productName}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-200" />
            )}
          </span>
          <div className="flex flex-col text-sm text-gray-900">
            <p>{review.productName}</p>
            {review.productPrice != null && <p>{formatPrice(review.productPrice)}</p>}
          </div>
        </div>
        {hasOrderOptions && (
          <button
            type="button"
            onClick={() => setIsOptionExpanded(!isOptionExpanded)}
            className="absolute right-4 top-3 flex items-center gap-[2px] text-sm text-gray-500"
          >
            주문옵션
            <Icon
              name="arrow"
              width={16}
              height={16}
              className={`text-gray-500 transition-transform ${isOptionExpanded ? "rotate-0" : "rotate-180"}`}
            />
          </button>
        )}
        {isOptionExpanded && hasOrderOptions && (
          <div className="text-2sm text-gray-500 mt-3 space-y-1">
            {orderItems.map((item) => {
              const options = formatOrderItemOptions(item);
              if (!options) return null;
              return <p key={item.id}>{options}</p>;
            })}
          </div>
        )}
      </div>

      {/* 리뷰 이미지 */}
      {review.imageUrls.length > 0 && (
        <div className="mt-3">
          <ImageSlider
            images={review.imageUrls.map((url, idx) => ({
              id: `${review.id}-${idx}`,
              url,
            }))}
            imageWidth={160}
            imageHeight={120}
            gap={4}
            onImageClick={onImageClick ? () => onImageClick(review) : undefined}
          />
        </div>
      )}
    </div>
  );
}
