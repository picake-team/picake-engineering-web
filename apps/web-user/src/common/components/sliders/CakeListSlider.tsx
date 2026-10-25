"use client";

import { useRef, useState } from "react";
import { Product } from "@/apps/web-user/features/product/types/product.type";
import { CakeListItem } from "@/apps/web-user/features/product/components/cards/CakeListItem";
import { Skeleton, SkeletonText } from "@/apps/web-user/common/components/skeleton";
import { EmptyState } from "@/apps/web-user/common/components/fallbacks/EmptyState";

interface CakeListSliderProps {
  title: string;
  products: Product[];
  isLoading: boolean;
  /** 상품 카드의 상세 주소 (진입 경로 쿼리 포함) */
  getProductHref: (productId: string) => string;
}

export default function CakeListSlider({
  title,
  products,
  isLoading,
  getProductHref,
}: CakeListSliderProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ isDown: false, hasDragged: false, startX: 0, scrollLeft: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    drag.current.isDown = true;
    drag.current.hasDragged = false;
    drag.current.startX = e.pageX - (scrollRef.current?.offsetLeft ?? 0);
    drag.current.scrollLeft = scrollRef.current?.scrollLeft ?? 0;
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!drag.current.isDown) return;
    e.preventDefault();
    const x = e.pageX - (scrollRef.current?.offsetLeft ?? 0);
    const walk = x - drag.current.startX;
    if (Math.abs(walk) > 5) drag.current.hasDragged = true;
    if (scrollRef.current) scrollRef.current.scrollLeft = drag.current.scrollLeft - walk;
  };

  const handleMouseUp = () => {
    drag.current.isDown = false;
    setIsDragging(false);
  };

  // 마우스로 끌어서 스크롤한 직후의 클릭은 카드 이동으로 처리하지 않는다 (캡처 단계에서 차단)
  const handleClickCapture = (e: React.MouseEvent) => {
    if (drag.current.hasDragged) e.stopPropagation();
  };

  return (
    <div className="pb-9">
      <h2 className="px-5 py-2.5 text-xl font-bold text-gray-900 mb-2.5">{title}</h2>
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
      ) : products.length === 0 ? (
        <EmptyState message="등록된 상품이 없습니다." />
      ) : (
        <div
          ref={scrollRef}
          className={`flex gap-[8px] overflow-x-auto scrollbar-hide pl-[20px] select-none ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClickCapture={handleClickCapture}
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
