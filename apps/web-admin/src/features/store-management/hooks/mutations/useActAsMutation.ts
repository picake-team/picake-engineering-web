import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAlertStore } from "@/apps/web-admin/common/store/alert.store";
import getApiMessage from "@/apps/web-admin/common/utils/getApiMessage";
import { actAsApi } from "@/apps/web-admin/features/store-management/apis/act-as.api";
import { storeManagementQueryKeys } from "@/apps/web-admin/features/store-management/constants/storeManagementQueryKeys.constant";
import type {
  StartActAsSessionRequestDto,
  StartActAsSessionResponseDto,
} from "@/apps/web-admin/features/store-management/types/act-as.dto";

/** 이 가게로 들어가기(기획 I-41). 오류(OTP·허용 관리자 등)는 창 안에서 보인다 */
export function useStartActAs(storeId: string) {
  const queryClient = useQueryClient();
  return useMutation<StartActAsSessionResponseDto, Error, StartActAsSessionRequestDto>({
    mutationFn: (dto) => actAsApi.start(storeId, dto),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: storeManagementQueryKeys.actAsSessions(storeId),
      });
    },
  });
}

/** 세션 바로 끝내기 */
export function useEndActAs(storeId: string) {
  const queryClient = useQueryClient();
  const { addAlert } = useAlertStore();
  return useMutation<void, Error, string>({
    mutationFn: (sessionId) => actAsApi.end(sessionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: storeManagementQueryKeys.actAsSessions(storeId),
      });
      addAlert({ severity: "success", message: "대리 입력을 끝냈어요." });
    },
    onError: (error) => {
      addAlert({ severity: "error", message: getApiMessage.error(error) });
    },
  });
}
