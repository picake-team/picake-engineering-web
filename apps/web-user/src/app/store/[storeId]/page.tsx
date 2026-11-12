import StoreDetailScreen from "@/apps/web-user/features/store/components/screens/StoreDetailScreen";
import { fetchStoreForMetadata } from "@/apps/web-user/common/apis/metadata.api";
import { fetchConsumerApiResult } from "@/apps/web-user/common/utils/server-api.util";
import {
  SortBy,
  type ProductListResponse,
} from "@/apps/web-user/features/product/types/product.type";

interface StoreDetailPageProps {
  params: Promise<{ storeId: string }>;
}

/** 가게 화면 상품 목록 첫 쪽(화면의 "전체"와 같은 조건: 20개·인기순) */
const STORE_PRODUCTS_FIRST_PAGE = { limit: 20, sortBy: SortBy.POPULAR };

/**
 * 가게 화면(사장님이 보내는 가게 링크 I-45의 첫 화면). 미리보기와 같은 요청으로 가게를,
 * 화면과 같은 조건으로 상품 첫 쪽을 서버에서 받아 첫 HTML에 넣는다. 받지 못하면 예전처럼 화면이 받는다.
 */
export default async function StoreDetailPage({ params }: StoreDetailPageProps) {
  const { storeId } = await params;
  const query = new URLSearchParams({
    page: "1",
    limit: String(STORE_PRODUCTS_FIRST_PAGE.limit),
    sortBy: STORE_PRODUCTS_FIRST_PAGE.sortBy,
    storeId,
  });
  const [store, products] = await Promise.all([
    fetchStoreForMetadata(storeId),
    fetchConsumerApiResult<ProductListResponse>(`/products?${query}`, { revalidate: 60 }),
  ]);
  return (
    <StoreDetailScreen
      storeId={storeId}
      initialStore={store.status === "ok" ? store.data : undefined}
      initialProducts={products.status === "ok" ? products.data : undefined}
    />
  );
}
