import {
  fetchConsumerApiResult,
  type ServerApiResult,
} from "@/apps/web-user/common/utils/server-api.util";
import type { Product } from "@/apps/web-user/features/product/types/product.type";
import type { StoreInfo } from "@/apps/web-user/features/store/types/store.type";

/**
 * 공유 미리보기·구조화 데이터용 캐시 시간(초).
 * 구조화 데이터에 가격이 들어가므로 1시간처럼 길게 두지 않는다.
 */
const METADATA_REVALIDATE_SECONDS = 300;

/** SEO·OG용 상품 상세 (서버 전용) */
export function fetchProductForMetadata(productId: string): Promise<ServerApiResult<Product>> {
  return fetchConsumerApiResult<Product>(`/products/${productId}`, {
    revalidate: METADATA_REVALIDATE_SECONDS,
  });
}

/** SEO·OG용 스토어 상세 (서버 전용) */
export function fetchStoreForMetadata(storeId: string): Promise<ServerApiResult<StoreInfo>> {
  return fetchConsumerApiResult<StoreInfo>(`/store/${storeId}`, {
    revalidate: METADATA_REVALIDATE_SECONDS,
  });
}
