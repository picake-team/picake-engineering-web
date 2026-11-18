import { useQuery } from "@tanstack/react-query";
import { useQueryErrorAlert } from "@/apps/web-admin/common/hooks/useQueryErrorAlert";
import { actAsApi } from "@/apps/web-admin/features/store-management/apis/act-as.api";
import { storeManagementQueryKeys } from "@/apps/web-admin/features/store-management/constants/storeManagementQueryKeys.constant";

/** 이 가게 대리 입력 기록(기획 I-41). 진행 중인 세션이 있으면 30초마다 다시 본다 */
export function useActAsSessions(storeId: string | null) {
  const query = useQuery({
    queryKey: storeManagementQueryKeys.actAsSessions(storeId ?? ""),
    queryFn: () => actAsApi.listSessions(storeId!),
    enabled: Boolean(storeId),
    refetchInterval: (q) => (q.state.data?.some((s) => s.status === "ACTIVE") ? 30_000 : false),
  });
  useQueryErrorAlert(query);
  return query;
}

/** 세션 하나의 요청 기록(펼쳤을 때만) */
export function useActAsActions(sessionId: string, enabled: boolean) {
  const query = useQuery({
    queryKey: storeManagementQueryKeys.actAsActions(sessionId),
    queryFn: () => actAsApi.listActions(sessionId),
    enabled,
  });
  useQueryErrorAlert(query);
  return query;
}
