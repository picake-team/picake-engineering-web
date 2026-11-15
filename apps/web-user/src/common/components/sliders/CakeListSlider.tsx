"use client";

import { useDragScroll } from "@/apps/web-user/common/hooks/useDragScroll";
import { Product } from "@/apps/web-user/features/product/types/product.type";
import { CakeListItem } from "@/apps/web-user/features/product/components/cards/CakeListItem";
import { Skeleton, SkeletonText } from "@/apps/web-user/common/components/skeleton";
import { EmptyState } from "@/apps/web-user/common/components/fallbacks/EmptyState";
import { LoadErrorState } from "@/apps/web-user/common/components/fallbacks/LoadErrorState";

interface CakeListSliderProps {
  /** 없으면 제목 줄을 그리지 않는다(바깥에서 제목·탭을 그릴 때) */
  title?: React.ReactNode;
  products: Product[];
  isLoading: boolean;
  /** 불러오지 못했으면 "다시 시도"(없을 때 "등록된 상품이 없어요"와 헷갈리지 않게) */
  onRetry?: () => void;
  /** 상품 카드의 상세 주소 (진입 경로 쿼리 포함) */
  getProductHref: (productId: string) => string;
}

export default function CakeListSlider({
  title,
  products,
  isLoading,
  onRetry,
  getProductHref,
}: CakeListSliderProps) {
  const { ref: scrollRef, isDragging, dragProps } = useDragScroll();

  return (
    <div className="pb-9">
      {title && <h2 className="px-5 py-2.5 text-xl font-bold text-gray-900 mb-2.5">{title}</h2>}
      {isLoading ? (
        <div className="flex gap-[8px] overflow-hidden pl-[20px]">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="min-w-[140px]">
              <Skeleton className="w-[140px] h-[140px] rounded-xl" />
              <div className="mt-2 space-y-1.5">
                <SkeletonText className="w-16" />
                <SkeletonText className="w-24" />
                <SkeletonText className="w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : onRetry ? (
        <LoadErrorState onRetry={onRetry} />
      ) : products.length === 0 ? (
        <EmptyState message="등록된 상품이 없어요." />
      ) : (
        <div
          ref={scrollRef}
          className={`flex gap-[8px] overflow-x-auto scrollbar-hide pl-[20px] select-none ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
          {...dragProps}
        >
          {products.map((product) => (
            <CakeListItem key={product.id} product={product} href={getProductHref(product.id)} />
          ))}
          <div className="min-w-[12px] shrink-0" />
        </div>
      )}
    </div>
  );
}
