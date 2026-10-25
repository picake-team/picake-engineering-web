"use client";

import { useRef, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Header from "@/apps/web-user/common/components/headers/Header";
import { useRecentProducts } from "@/apps/web-user/features/recent/hooks/queries/useRecentProducts";
import { useInfiniteScroll } from "@/apps/web-user/common/hooks/useInfiniteScroll";
import { flattenAndDeduplicateInfiniteData } from "@/apps/web-user/common/utils/pagination.util";
import { Product } from "@/apps/web-user/features/product/types/product.type";
import { PATHS } from "@/apps/web-user/common/constants/paths.constant";
import { Icon } from "@/apps/web-user/common/components/icons";
import { formatAddress } from "@/apps/web-user/common/utils/address.util";
import { RecentProductsSkeleton } from "@/apps/web-user/common/components/skeleton/RecentProductsSkeleton";
import { EmptyState } from "@/apps/web-user/common/components/fallbacks/EmptyState";

function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
}

function groupProductsByDate(products: Product[]): { date: string; items: Product[] }[] {
  const map = new Map<string, Product[]>();
  for (const product of products) {
    const key = formatDateLabel(String(product.updatedAt));
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(product);
  }
  return Array.from(map.entries()).map(([date, items]) => ({ date, items }));
}

export default function RecentPage() {
  const router = useRouter();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useRecentProducts();

  useInfiniteScroll({ hasNextPage, isFetchingNextPage, fetchNextPage, loadMoreRef });

  const products = flattenAndDeduplicateInfiniteData<Product>(data);
  const groupedProducts = useMemo(() => groupProductsByDate(products), [products]);

  return (
    <div>
      <Header variant="back-title" title="최근 본 상품" />

      <div className="px-5 pb-8">
        {isLoading ? (
          <RecentProductsSkeleton />
        ) : products.length === 0 ? (
          <EmptyState message="최근 본 상품이 없습니다." fill />
        ) : (
          groupedProducts.map((group) => (
            <section key={group.date} className="mb-8">
              <h2 className="text-lg font-bold text-gray-900 mb-1.5 py-2.5">{group.date}</h2>
              <ul className="flex flex-col gap-4">
                {group.items.map((product) => (
                  <li key={product.id}>
                    <button
                      type="button"
                      onClick={() => router.push(PATHS.PRODUCT.DETAIL(product.id))}
                      className="flex items-center gap-3 w-full text-left"
                    >
                      <div className="w-[96px] h-[96px] rounded-xl overflow-hidden bg-gray-100 shrink-0">
                        {product.images && product.images.length > 0 ? (
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            width={96}
                            height={96}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                            No Image
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 py-1">
                        <p className="text-sm text-gray-900 truncate">{product.name}</p>
                        <p className="text-sm font-bold text-gray-900">
                          {product.salePrice.toLocaleString()}원~
                        </p>
                        <div className="flex items-center gap-4 mt-1 text-xs">
                          <span className="flex items-center text-gray-900 font-bold">
                            <Icon name="star" width={16} height={16} className="text-yellow-400" />
                            {product.averageRating}
                          </span>
                          <span className="relative text-gray-500 after:content-[''] after:absolute after:top-1/2 after:left-[-8px] after:w-[1px] after:h-[8px] after:bg-gray-300 after:transform after:translate-y-[-50%]">
                            후기 {product.totalReviewCount}개
                          </span>
                        </div>
                        <div className="inline-flex items-center gap-1 mt-2.5 py-1 px-2 text-[11px] font-bold text-gray-700 bg-gray-50 rounded-full max-w-full">
                          <span className="truncate">
                            {formatAddress(product.pickupAddress)} · {product.storeName}
                          </span>
                          <Icon
                            name="arrow"
                            width={16}
                            height={16}
                            className="text-gray-700 rotate-90 shrink-0"
                          />
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}

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
      </div>
    </div>
  );
}
