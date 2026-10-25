"use client";

import { useEffect, useRef } from "react";
import { useProductList } from "@/apps/web-user/features/product/hooks/queries/useProductList";
import {
  SortBy,
  Product,
  ProductCategoryType,
} from "@/apps/web-user/features/product/types/product.type";
import type { MapListSortBy } from "@/apps/web-user/features/store/utils/map.util";
import { CakeListItem } from "@/apps/web-user/features/product/components/cards/CakeListItem";
import { useInfiniteScroll } from "@/apps/web-user/common/hooks/useInfiniteScroll";
import { flattenAndDeduplicateInfiniteData } from "@/apps/web-user/common/utils/pagination.util";
import { PATHS } from "@/apps/web-user/common/constants/paths.constant";
import { EmptyState } from "@/apps/web-user/common/components/fallbacks/EmptyState";

interface SearchProductListSectionProps {
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  productCategoryTypes?: ProductCategoryType[];
  sortBy?: MapListSortBy;
  /** 검색 결과 개수를 상위(검색 화면)로 보고 — 애널리틱스 이벤트용 */
  onResultCountChange?: (count: number) => void;
}

function toProductSortBy(sortBy: MapListSortBy): SortBy {
  return sortBy === "review" ? SortBy.RATING_AVG : SortBy.POPULAR;
}

export function SearchProductListSection({
  search,
  minPrice,
  maxPrice,
  productCategoryTypes,
  sortBy = "distance",
  onResultCountChange,
}: SearchProductListSectionProps) {
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useProductList({
    search: search?.trim() || undefined,
    sortBy: toProductSortBy(sortBy),
    minPrice,
    maxPrice,
    productCategoryTypes,
  });

  useInfiniteScroll({ hasNextPage, isFetchingNextPage, fetchNextPage, loadMoreRef });

  const products = flattenAndDeduplicateInfiniteData<Product>(data);
  const totalCount = data?.pages[0]?.meta.totalItems;

  useEffect(() => {
    if (totalCount != null) onResultCountChange?.(totalCount);
  }, [totalCount, onResultCountChange]);

  if (isLoading) return <></>;

  if (products.length === 0) {
    return <EmptyState message="검색 결과가 없습니다." fill />;
  }

  return (
    <>
      <p className="text-sm text-gray-500 py-3 font-bold">
        총 <span className="text-gray-900">{products.length}</span>개
      </p>
      <div className="grid grid-cols-2 gap-x-[7px] gap-y-6">
        {products.map((product) => (
          <CakeListItem
            key={product.id}
            product={product}
            href={`${PATHS.PRODUCT.DETAIL(product.id)}?entry_point=search`}
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
