import { useQuery } from "@tanstack/react-query";
import { QUERY_STALE_TIME } from "@/apps/web-user/common/constants/query-cache.constants";
import { useQueryErrorAlert } from "@/apps/web-user/common/hooks/useQueryErrorAlert";
import { storeApi } from "@/apps/web-user/features/store/apis/store.api";
import { storeQueryKeys } from "@/apps/web-user/features/store/constants/storeQueryKeys.constant";
import { StoreInfo } from "@/apps/web-user/features/store/types/store.type";

/** 가게 상세. 서버가 미리 받은 가게(placeholder, 로그인 없이)가 있으면 먼저 보이고 바로 새로 받는다 */
export function useStoreDetail(storeId: string, placeholder?: StoreInfo) {
  const query = useQuery<StoreInfo>({
    queryKey: storeQueryKeys.detail(storeId),
    queryFn: () => storeApi.getDetail(storeId),
    enabled: !!storeId,
    staleTime: QUERY_STALE_TIME.DETAIL,
    placeholderData: placeholder?.id === storeId ? placeholder : undefined,
  });

  useQueryErrorAlert(query);

  return query;
}
