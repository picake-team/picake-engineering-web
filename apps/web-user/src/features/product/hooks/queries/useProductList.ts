import { useInfiniteQuery } from "@tanstack/react-query";
import { productApi } from "@/apps/web-user/features/product/apis/product.api";
import { productQueryKeys } from "@/apps/web-user/features/product/constants/productQueryKeys.constant";
import {
  ProductListResponse,
  GetProductsParams,
  ProductListQueryParams,
  SortBy,
} from "@/apps/web-user/features/product/types/product.type";

interface UseProductListOptions extends Partial<ProductListQueryParams> {
  /**
   * 조회 실행 여부 (기본 true).
   * 지역 필터처럼 뒤늦게 확정되는 파라미터가 있을 때, 값이 확정되기 전에 요청이 나가
   * queryKey가 바뀌며 같은 목록을 두 번 조회하는 것을 막는 용도입니다.
   * queryKey에는 포함되지 않습니다.
   */
  enabled?: boolean;
}

export function useProductList({
  limit = 30,
  sortBy = SortBy.POPULAR,
  storeId,
  search,
  minPrice,
  maxPrice,
  productType,
  productCategoryTypes,
  regions,
  enabled = true,
}: UseProductListOptions = {}) {
  const query = useInfiniteQuery<ProductListResponse>({
    queryKey: productQueryKeys.list({
      limit,
      sortBy,
      storeId,
      search,
      minPrice,
      maxPrice,
      productType,
      productCategoryTypes,
      regions,
    }),
    queryFn: ({ pageParam = 1 }) => {
      const params: GetProductsParams = {
        page: pageParam as number,
        limit,
        sortBy,
      };
      if (storeId) {
        params.storeId = storeId;
      }
      if (search) {
        params.search = search;
      }
      if (minPrice !== undefined) {
        params.minPrice = minPrice;
      }
      if (maxPrice !== undefined) {
        params.maxPrice = maxPrice;
      }
      if (productType) {
        params.productType = productType;
      }
      if (productCategoryTypes && productCategoryTypes.length > 0) {
        params.productCategoryTypes = productCategoryTypes;
      }
      if (regions) {
        params.regions = regions;
      }
      return productApi.getProducts(params);
    },
    // 반환된 값은 다음 API 요청의 queryFn의 pageParam으로 전달됩니다.
    // 이 값은 hasNextPage에도 영향을 줍니다.
    enabled,
    getNextPageParam: (lastPage) => {
      if (lastPage.meta.hasNext) {
        return lastPage.meta.currentPage + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });
  // 조회 실패는 목록 화면이 "불러오지 못했어요 · 다시 시도"로 알린다(오류 창 없음)

  return query;
}
