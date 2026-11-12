import { useQuery } from "@tanstack/react-query";
import { QUERY_STALE_TIME } from "@/apps/web-user/common/constants/query-cache.constants";
import { useQueryErrorAlert } from "@/apps/web-user/common/hooks/useQueryErrorAlert";
import { productApi } from "@/apps/web-user/features/product/apis/product.api";
import { productQueryKeys } from "@/apps/web-user/features/product/constants/productQueryKeys.constant";
import { Product } from "@/apps/web-user/features/product/types/product.type";

/**
 * 상품 상세. 서버가 미리 받은 상품(placeholder, 로그인 없이 받은 것)이 있으면 그것을 먼저 보이고
 * 로그인 상태로 바로 새로 받는다(첫 화면 사진이 처음부터 받아지게)
 */
export function useProductDetail(productId: string, placeholder?: Product) {
  const query = useQuery<Product>({
    queryKey: productQueryKeys.detail(productId),
    queryFn: () => productApi.getProductDetail(productId),
    enabled: !!productId,
    staleTime: QUERY_STALE_TIME.DETAIL,
    placeholderData: placeholder?.id === productId ? placeholder : undefined,
  });

  useQueryErrorAlert(query);

  return query;
}
