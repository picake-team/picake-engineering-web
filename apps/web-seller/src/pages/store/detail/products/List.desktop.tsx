import React, { useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/apps/web-seller/common/components/selects/Select";
import { BaseInput as Input } from "@/apps/web-seller/common/components/inputs/BaseInput";
import { NumberInput } from "@/apps/web-seller/common/components/inputs/NumberInput";
import { BaseButton as Button } from "@/apps/web-seller/common/components/buttons/BaseButton";
import { Label } from "@/apps/web-seller/common/components/labels/Label";
import { useProductList } from "@/apps/web-seller/features/product/hooks/queries/useProductQuery";
import { useInfiniteScroll } from "@/apps/web-seller/common/hooks/useInfiniteScroll";
import { ContentLoading } from "@/apps/web-seller/common/components/loading/ContentLoading";
import { InfiniteScrollLoading } from "@/apps/web-seller/common/components/loading/InfiniteScrollLoading";
import { ProductList } from "@/apps/web-seller/features/product/components/list/ProductList";
import {
  SortBy,
  ProductResponseDto,
  EnableStatus,
  ProductType,
  ProductCategoryType,
  CakeSizeDisplayName,
} from "@/apps/web-seller/features/product/types/product.dto";
import {
  PRODUCT_CATEGORY_GROUPS,
  CAKE_SIZE_DISPLAY_NAME_OPTIONS,
} from "@/apps/web-seller/features/product/constants/product.constant";
import { flattenAndDeduplicateInfiniteData } from "@/apps/web-seller/common/utils/pagination.util";
import { useDebouncedValue } from "@/apps/web-seller/common/hooks/useDebouncedValue";

const DEBOUNCE_DELAY_MS = 300;

export const StoreDetailProductListPage: React.FC = () => {
  const { storeId } = useParams();
  const [sortBy, setSortBy] = useState<SortBy>(SortBy.LATEST);
  const [search, setSearch] = useState<string>("");
  const [salesStatus, setSalesStatus] = useState<EnableStatus | undefined>(undefined);
  const [visibilityStatus, setVisibilityStatus] = useState<EnableStatus | undefined>(undefined);
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [productType, setProductType] = useState<ProductType | undefined>(undefined);
  const [productCategoryTypes, setProductCategoryTypes] = useState<ProductCategoryType[]>([]);
  const [sizes, setSizes] = useState<CakeSizeDisplayName[]>([]);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // 검색 및 가격 필터 debounce (과도한 API 호출 방지)
  const debouncedSearch = useDebouncedValue(search, DEBOUNCE_DELAY_MS);
  const debouncedMinPrice = useDebouncedValue(minPrice, DEBOUNCE_DELAY_MS);
  const debouncedMaxPrice = useDebouncedValue(maxPrice, DEBOUNCE_DELAY_MS);

  const handleResetFilters = useCallback(() => {
    setSearch("");
    setSalesStatus(undefined);
    setVisibilityStatus(undefined);
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setProductType(undefined);
    setProductCategoryTypes([]);
    setSizes([]);
  }, []);

  const handleResetSizes = useCallback(() => {
    setSizes([]);
  }, []);

  const handleResetCategories = useCallback(() => {
    setProductCategoryTypes([]);
  }, []);

  const hasActiveFilters =
    search.trim() !== "" ||
    salesStatus !== undefined ||
    visibilityStatus !== undefined ||
    minPrice !== undefined ||
    maxPrice !== undefined ||
    productType !== undefined ||
    productCategoryTypes.length > 0 ||
    sizes.length > 0;

  if (!storeId) {
    return (
      <div>
        <h2 className="text-xl font-semibold">스토어가 선택되지 않았습니다.</h2>
      </div>
    );
  }

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useProductList({
    storeId,
    sortBy,
    search: debouncedSearch.trim() || undefined,
    salesStatus,
    visibilityStatus,
    minPrice: debouncedMinPrice,
    maxPrice: debouncedMaxPrice,
    productType,
    productCategoryTypes: productCategoryTypes.length ? productCategoryTypes : undefined,
    sizes: sizes.length ? sizes : undefined,
  });

  // 무한 스크롤 훅 사용
  useInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    loadMoreRef,
  });

  // 상품 목록 평탄화 및 중복 제거
  const products = flattenAndDeduplicateInfiniteData<ProductResponseDto>(data);
  // 전체 개수는 첫 번째 페이지의 meta에서 가져옴 (무한 스크롤)
  const totalItems = data?.pages?.[0]?.meta?.totalItems || products.length || 0;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">상품 목록</h1>
      </div>

      {/* 필터 및 정렬 */}
      <div className="space-y-4 rounded-lg border bg-card p-4">
        {/* 통계 및 정렬 */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm text-muted-foreground">
              총 <span className="font-semibold text-foreground">{totalItems}</span>개의 상품
            </div>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={handleResetFilters}>
                전체 초기화
              </Button>
            )}
            {sizes.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleResetSizes}>
                사이즈 초기화
              </Button>
            )}
            {productCategoryTypes.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleResetCategories}>
                카테고리 초기화
              </Button>
            )}
          </div>
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortBy)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="정렬 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SortBy.LATEST}>최신순</SelectItem>
              <SelectItem value={SortBy.POPULAR}>인기순</SelectItem>
              <SelectItem value={SortBy.PRICE_ASC}>가격 낮은순</SelectItem>
              <SelectItem value={SortBy.PRICE_DESC}>가격 높은순</SelectItem>
              <SelectItem value={SortBy.REVIEW_COUNT}>후기 많은순</SelectItem>
              <SelectItem value={SortBy.RATING_AVG}>별점 높은순</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 필터 */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {/* 검색 */}
          <div className="space-y-2">
            <Label>상품명 검색</Label>
            <Input
              placeholder="상품명 검색"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* 상품 타입 */}
          <div className="space-y-2">
            <Label>상품 타입</Label>
            <Select
              value={productType || "ALL"}
              onValueChange={(value) =>
                setProductType(value === "ALL" ? undefined : (value as ProductType))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="상품 타입 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">전체</SelectItem>
                <SelectItem value={ProductType.BASIC_CAKE}>기본 케이크</SelectItem>
                <SelectItem value={ProductType.CUSTOM_CAKE}>커스텀 케이크</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 판매 상태 */}
          <div className="space-y-2">
            <Label>판매 상태</Label>
            <Select
              value={salesStatus || "ALL"}
              onValueChange={(value) =>
                setSalesStatus(value === "ALL" ? undefined : (value as EnableStatus))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="상태 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">전체</SelectItem>
                <SelectItem value={EnableStatus.ENABLE}>판매중</SelectItem>
                <SelectItem value={EnableStatus.DISABLE}>판매중지</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 노출 상태 */}
          <div className="space-y-2">
            <Label>노출 상태</Label>
            <Select
              value={visibilityStatus || "ALL"}
              onValueChange={(value) =>
                setVisibilityStatus(value === "ALL" ? undefined : (value as EnableStatus))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="상태 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">전체</SelectItem>
                <SelectItem value={EnableStatus.ENABLE}>노출</SelectItem>
                <SelectItem value={EnableStatus.DISABLE}>숨김</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 최소 가격 */}
          <div className="space-y-2">
            <Label>최소 가격</Label>
            <NumberInput value={minPrice} onChange={setMinPrice} placeholder="최소 가격" min={0} />
          </div>

          {/* 최대 가격 */}
          <div className="space-y-2">
            <Label>최대 가격</Label>
            <NumberInput value={maxPrice} onChange={setMaxPrice} placeholder="최대 가격" min={0} />
          </div>
        </div>

        {/* 케이크 사이즈 필터 (복수 선택) */}
        <div className="space-y-2">
          <Label>케이크 사이즈 (해당 중 하나라도 포함)</Label>
          <div className="flex flex-wrap gap-2">
            {CAKE_SIZE_DISPLAY_NAME_OPTIONS.map((opt) => {
              const isSelected = sizes.includes(opt.value);
              return (
                <label
                  key={opt.value}
                  className={`
                      inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm cursor-pointer select-none transition-all duration-150 border
                      ${
                        isSelected
                          ? "border-primary bg-primary/10 text-primary font-medium"
                          : "border-border bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                      }
                    `}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {
                      if (isSelected) {
                        setSizes(sizes.filter((s) => s !== opt.value));
                      } else {
                        setSizes([...sizes, opt.value]);
                      }
                    }}
                    className="sr-only"
                  />
                  {opt.label}
                </label>
              );
            })}
          </div>
        </div>

        {/* 카테고리 필터 (복수 선택) */}
        <div className="space-y-2">
          <Label>카테고리 (해당 중 하나라도 포함)</Label>
          <div className="flex flex-wrap gap-2">
            {PRODUCT_CATEGORY_GROUPS.flatMap((group) =>
              group.options.map((opt) => {
                const isSelected = productCategoryTypes.includes(opt.value);
                return (
                  <label
                    key={opt.value}
                    className={`
                      inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm cursor-pointer select-none transition-all duration-150 border
                      ${
                        isSelected
                          ? "border-primary bg-primary/10 text-primary font-medium"
                          : "border-border bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                      }
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {
                        if (isSelected) {
                          setProductCategoryTypes(
                            productCategoryTypes.filter((t) => t !== opt.value),
                          );
                        } else {
                          setProductCategoryTypes([...productCategoryTypes, opt.value]);
                        }
                      }}
                      className="sr-only"
                    />
                    {opt.label}
                  </label>
                );
              }),
            )}
          </div>
        </div>
      </div>

      {/* 상품 목록 */}
      {isLoading ? (
        <ContentLoading variant="section" message="상품을 불러오는 중…" className="py-12" />
      ) : (
        <>
          <ProductList products={products} />

          {/* 무한 스크롤 트리거 */}
          {hasNextPage && (
            <div ref={loadMoreRef} className="flex min-h-[100px] items-center justify-center py-8">
              {isFetchingNextPage ? (
                <InfiniteScrollLoading message="더 많은 상품을 불러오는 중…" />
              ) : null}
            </div>
          )}
        </>
      )}
    </div>
  );
};
