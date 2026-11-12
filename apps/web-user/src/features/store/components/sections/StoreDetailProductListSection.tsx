"use client";

import { useState, useRef } from "react";
import { useProductList } from "@/apps/web-user/features/product/hooks/queries/useProductList";
import {
  Product,
  ProductType,
  type ProductListResponse,
} from "@/apps/web-user/features/product/types/product.type";
import { ProductList } from "@/apps/web-user/features/product/components/list/ProductList";
import { PillTabs } from "@/apps/web-user/common/components/tabs/PillTabs";
import { useInfiniteScroll } from "@/apps/web-user/common/hooks/useInfiniteScroll";
import { flattenAndDeduplicateInfiniteData } from "@/apps/web-user/common/utils/pagination.util";
import { EmptyState } from "@/apps/web-user/common/components/fallbacks/EmptyState";
import { LoadErrorState } from "@/apps/web-user/common/components/fallbacks/LoadErrorState";

type ProductTypeFilter = "ALL" | ProductType.BASIC_CAKE | ProductType.CUSTOM_CAKE;

const PRODUCT_TYPE_TABS = [
  { id: "ALL", label: "전체", hasDividerAfter: true },
  { id: ProductType.BASIC_CAKE, label: "기본" },
  { id: ProductType.CUSTOM_CAKE, label: "커스텀" },
];

interface StoreDetailProductListSectionProps {
  storeId: string;
  /** 서버가 미리 받은 "전체" 첫 쪽 */
  initialFirstPage?: ProductListResponse;
}

export function StoreDetailProductListSection({
  storeId,
  initialFirstPage,
}: StoreDetailProductListSectionProps) {
  const [productTypeFilter, setProductTypeFilter] = useState<ProductTypeFilter>("ALL");
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
    isPlaceholderData,
  } = useProductList({
    storeId,
    productType: productTypeFilter === "ALL" ? undefined : productTypeFilter,
    limit: 20,
    placeholderFirstPage: productTypeFilter === "ALL" ? initialFirstPage : undefined,
  });

  useInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    loadMoreRef,
  });

  const products = flattenAndDeduplicateInfiniteData<Product>(data);

  if (isError && !data) {
    return <LoadErrorState fill onRetry={() => void refetch()} />;
  }

  if (isLoading) {
    return <></>;
  }

  return (
    <div>
      {/* 상품 타입 필터 탭 */}
      <div className="mb-[20px]">
        <PillTabs
          tabs={PRODUCT_TYPE_TABS}
          activeTab={productTypeFilter}
          onChange={(tabId) => setProductTypeFilter(tabId as ProductTypeFilter)}
        />
      </div>

      {/* 상품 그리드 */}
      {products.length === 0 ? (
        <EmptyState message="등록된 상품이 없어요." fill />
      ) : (
        <ProductList products={products} likeDisabled={isPlaceholderData} />
      )}

      {/* 무한 스크롤 트리거 */}
      {hasNextPage && (
        <div ref={loadMoreRef} className="flex justify-center items-center py-8 min-h-[100px]">
          {isFetchingNextPage && (
            <div className="flex flex-col items-center gap-3 text-gray-500 text-sm">
              <div className="loading-spinner-small" />
              <span>더 많은 상품을 불러오는 중...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
