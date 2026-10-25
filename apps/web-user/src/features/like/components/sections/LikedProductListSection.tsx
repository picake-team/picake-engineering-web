"use client";

import { useRef } from "react";
import { useLikedProducts } from "@/apps/web-user/features/like/hooks/queries/useLikedProducts";
import { Product } from "@/apps/web-user/features/product/types/product.type";
import { CakeListItem } from "@/apps/web-user/features/product/components/cards/CakeListItem";
import { useInfiniteScroll } from "@/apps/web-user/common/hooks/useInfiniteScroll";
import { flattenAndDeduplicateInfiniteData } from "@/apps/web-user/common/utils/pagination.util";
import { PATHS } from "@/apps/web-user/common/constants/paths.constant";
import { EmptyState } from "@/apps/web-user/common/components/fallbacks/EmptyState";

export function LikedProductListSection() {
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useLikedProducts();

  useInfiniteScroll({ hasNextPage, isFetchingNextPage, fetchNextPage, loadMoreRef });

  const products = flattenAndDeduplicateInfiniteData<Product>(data);

  if (isLoading) return <></>;

  if (products.length === 0) {
    return <EmptyState message="저장한 상품이 없습니다." fill fillOffset={60} />;
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-x-[7px] gap-y-6">
        {products.map((product) => (
          <CakeListItem
            key={product.id}
            product={product}
            href={PATHS.PRODUCT.DETAIL(product.id)}
          />
        ))}
      </div>
      {hasNextPage && (
        <div ref={loadMoreRef} className="flex justify-center items-center py-8 min-h-[100px]">
          {isFetchingNextPage && (
            <div className="flex flex-col items-center gap-3 text-sm text-gray-400">
              <div className="loading-spinner-small" />
              <span>더 많은 상품을 불러오는 중...</span>
            </div>
          )}
        </div>
      )}
    </>
  );
}
