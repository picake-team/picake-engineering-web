import { useQuery } from "@tanstack/react-query";
import { QUERY_STALE_TIME } from "@/apps/web-user/common/constants/query-cache.constants";
import { useQueryErrorAlert } from "@/apps/web-user/common/hooks/useQueryErrorAlert";
import { storeApi } from "@/apps/web-user/features/store/apis/store.api";
import { storeQueryKeys } from "@/apps/web-user/features/store/constants/storeQueryKeys.constant";
import { StoreInfo } from "@/apps/web-user/features/store/types/store.type";

/** 가게 상세. 서버가 미리 받은 가게(placeholder, 로그인 없이)가 있으면 먼저 보이고 바로 새로 받는다 */
export function useStoreDetail(
  storeId: string,
  placeholder?: StoreInfo,
  options: { silentError?: boolean } = {},
) {
  const query = useQuery<StoreInfo>({
    queryKey: storeQueryKeys.detail(storeId),
    queryFn: () => storeApi.getDetail(storeId),
    enabled: !!storeId,
    staleTime: QUERY_STALE_TIME.DETAIL,
    placeholderData: placeholder?.id === storeId ? placeholder : undefined,
  });

  // 곁들여 쓰는 곳(채팅방 영업시간 줄)은 못 불러와도 오류 창을 띄우지 않는다
  useQueryErrorAlert(options.silentError ? { isError: false, error: null } : query);

  return query;
}
