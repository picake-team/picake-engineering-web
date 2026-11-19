import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { productApi } from "@/apps/web-seller/features/product/apis/product.api";
import { productQueryKeys } from "@/apps/web-seller/features/product/constants/productQueryKeys.constant";
import {
  ProductListResponseDto,
  GetSellerProductsRequestDto,
  SortBy,
} from "@/apps/web-seller/features/product/types/product.dto";
import type { GetSellerProductsQueryParams } from "@/apps/web-seller/features/product/types/product.ui";

// 상품 상세 조회 쿼리
export function useProductDetail(productId: string) {
  const query = useQuery({
    queryKey: productQueryKeys.detail(productId),
    queryFn: () => productApi.getProductDetail(productId),
    enabled: !!productId,
  });

  return query;
}

export function useProductList({
  limit = 30,
  sortBy = SortBy.LATEST,
  storeId,
  search,
  sizes,
  salesStatus,
  visibilityStatus,
  minPrice,
  maxPrice,
  productType,
  productCategoryTypes,
}: Partial<GetSellerProductsQueryParams> & { storeId: string }) {
  const query = useInfiniteQuery<ProductListResponseDto>({
    queryKey: productQueryKeys.list({
      limit,
      sortBy,
      storeId,
      search,
      sizes,
      salesStatus,
      visibilityStatus,
      minPrice,
      maxPrice,
      productType,
      productCategoryTypes,
    }),
    queryFn: ({ pageParam = 1 }) => {
      const params: GetSellerProductsRequestDto = {
        page: pageParam as number,
        limit,
        sortBy,
        storeId,
      };
      if (search) {
        params.search = search;
      }
      if (sizes?.length) {
        params.sizes = sizes;
      }
      if (salesStatus) {
        params.salesStatus = salesStatus;
      }
      if (visibilityStatus) {
        params.visibilityStatus = visibilityStatus;
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
      if (productCategoryTypes?.length) {
        params.productCategoryTypes = productCategoryTypes;
      }
      return productApi.getProducts(params);
    },
    // 반환된 값은 다음 API 요청의 queryFn의 pageParam으로 전달됩니다.
    // 이 값은 hasNextPage에도 영향을 줍니다.
    getNextPageParam: (lastPage) => {
      if (lastPage.meta.hasNext) {
        return lastPage.meta.currentPage + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });

  return query;
}
