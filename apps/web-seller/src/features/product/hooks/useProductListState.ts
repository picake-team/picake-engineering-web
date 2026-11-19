/**
 * 상품 목록 상태(휴대폰 SC-82·PC 상품 화면 공용, 기획 I-54): 검색(0.3초 기다림)·판매 상태 칩과 칩 숫자·거르기 창·판매 상태 바로 바꾸기.
 * 화면은 그리는 모양(휴대폰 줄·PC 표)만 따로 갖는다.
 */
import { useMemo, useState } from "react";
import { useDebouncedValue } from "@/apps/web-seller/common/hooks/useDebouncedValue";
import { flattenAndDeduplicateInfiniteData } from "@/apps/web-seller/common/utils/pagination.util";
import { useProductList } from "@/apps/web-seller/features/product/hooks/queries/useProductQuery";
import { useProductSalesToggle } from "@/apps/web-seller/features/product/hooks/mutations/useProductSalesToggle";
import {
  EnableStatus,
  type ProductResponseDto,
} from "@/apps/web-seller/features/product/types/product.dto";
import {
  DEFAULT_PRODUCT_FILTER,
  productFilterSummary,
  type ProductFilter,
} from "@/apps/web-seller/features/product/components/mobile/ProductFilterSheet";

export type ProductBucket = "all" | "on" | "off" | "hidden";

const BUCKET_PARAMS: Record<
  ProductBucket,
  { salesStatus?: EnableStatus; visibilityStatus?: EnableStatus }
> = {
  all: {},
  on: { salesStatus: EnableStatus.ENABLE },
  off: { salesStatus: EnableStatus.DISABLE },
  hidden: { visibilityStatus: EnableStatus.DISABLE },
};

export function useProductListState(storeId: string) {
  const [search, setSearch] = useState("");
  const debounced = useDebouncedValue(search.trim(), 300);
  const [bucket, setBucket] = useState<ProductBucket>("all");
  const [filter, setFilter] = useState<ProductFilter>(DEFAULT_PRODUCT_FILTER);
  const [filterOpen, setFilterOpen] = useState(false);
  const toggle = useProductSalesToggle();

  const common = {
    storeId,
    sortBy: filter.sortBy,
    search: debounced || undefined,
    productType: filter.productType,
    minPrice: filter.minPrice,
    maxPrice: filter.maxPrice,
    sizes: filter.sizes.length ? filter.sizes : undefined,
    productCategoryTypes: filter.categories.length ? filter.categories : undefined,
  };
  const list = useProductList({ ...common, limit: 20, ...BUCKET_PARAMS[bucket] });
  // 칩 숫자: 같은 조건으로 1개씩만 받아 전체 수를 본다
  const all = useProductList({ ...common, limit: 1 });
  const on = useProductList({ ...common, limit: 1, ...BUCKET_PARAMS.on });
  const off = useProductList({ ...common, limit: 1, ...BUCKET_PARAMS.off });
  const hidden = useProductList({ ...common, limit: 1, ...BUCKET_PARAMS.hidden });
  const count = (q: typeof all) => q.data?.pages[0]?.meta.totalItems;

  const products = useMemo(
    () => flattenAndDeduplicateInfiniteData<ProductResponseDto>(list.data),
    [list.data],
  );
  const summary = productFilterSummary(filter);

  return {
    search,
    setSearch,
    bucket,
    setBucket,
    bucketOptions: [
      { value: "all" as const, label: "전체", count: count(all) },
      { value: "on" as const, label: "판매중", count: count(on) },
      { value: "off" as const, label: "판매중지", count: count(off) },
      { value: "hidden" as const, label: "숨김", count: count(hidden) },
    ],
    list,
    products,
    /** 걸러 둔 조건 한 줄(없으면 null) */
    summary,
    clearFilter: () => setFilter(DEFAULT_PRODUCT_FILTER),
    openFilter: () => setFilterOpen(true),
    /** 검색·거르기 없이 상품이 하나도 없음(첫 상품 안내) */
    noProductsAtAll: count(all) === 0 && !debounced && !summary,
    toggleSales: (p: ProductResponseDto) =>
      toggle.mutate({
        productId: p.id,
        name: p.name,
        next: p.salesStatus === EnableStatus.ENABLE ? EnableStatus.DISABLE : EnableStatus.ENABLE,
      }),
    /** <ProductFilterSheet {...filterSheet} /> */
    filterSheet: {
      open: filterOpen,
      value: filter,
      onClose: () => setFilterOpen(false),
      onApply: (f: ProductFilter) => {
        setFilter(f);
        setFilterOpen(false);
      },
    },
  };
}
