import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { storeApi } from "@/apps/web-seller/features/store/apis/store.api";
import { useAlertStore } from "@/apps/web-seller/common/store/alert.store";
import getApiMessage from "@/apps/web-seller/common/utils/getApiMessage";
import {
  CreateStoreRequestDto,
  StoreBusinessCalendarDto,
  UpdateStoreRequestDto,
} from "@/apps/web-seller/features/store/types/store.dto";
import { ROUTES } from "@/apps/web-seller/common/constants/paths.constant";
import { storeQueryKeys } from "@/apps/web-seller/features/store/constants/storeQueryKeys.constant";

// 스토어 생성 뮤테이션
export function useCreateStore() {
  const { addAlert } = useAlertStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateStoreRequestDto) => storeApi.createStore(request),
    onSuccess: (response) => {
      addAlert({
        severity: "success",
        message: "스토어를 만들었어요.",
      });
      // 스토어 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: storeQueryKeys.all });
      navigate(ROUTES.STORE_DETAIL_CALENDAR(response.id));
    },
    onError: (error) => {
      addAlert({
        severity: "error",
        message: getApiMessage.error(error),
      });
    },
  });
}

// 스토어 수정 뮤테이션
export function useUpdateStore() {
  const { addAlert } = useAlertStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ storeId, request }: { storeId: string; request: UpdateStoreRequestDto }) =>
      storeApi.updateStore(storeId, request),
    onSuccess: (_response, variables) => {
      addAlert({
        severity: "success",
        message: "스토어 정보를 저장했어요.",
      });
      queryClient.invalidateQueries({ queryKey: storeQueryKeys.all });
      navigate(ROUTES.STORE_DETAIL_HOME(variables.storeId));
    },
    onError: (error) => {
      addAlert({
        severity: "error",
        message: getApiMessage.error(error),
      });
    },
  });
}

/** 스토어 영업 캘린더 저장 (PUT /store/:id/business-calendar) */
export function useUpdateStoreBusinessCalendar() {
  const { addAlert } = useAlertStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ storeId, request }: { storeId: string; request: StoreBusinessCalendarDto }) =>
      storeApi.updateBusinessCalendar(storeId, request),
    onSuccess: (_data, variables) => {
      addAlert({
        severity: "success",
        message: "영업시간을 저장했어요.",
      });
      queryClient.invalidateQueries({ queryKey: storeQueryKeys.detail(variables.storeId) });
      queryClient.invalidateQueries({ queryKey: storeQueryKeys.all });
    },
    onError: (error: unknown) => {
      addAlert({
        severity: "error",
        message: getApiMessage.error(error),
        autoHideDuration: null,
      });
    },
  });
}

/** 네이버 플레이스 미리보기 (저장하지 않음) */
export function usePreviewNaverPlace() {
  const { addAlert } = useAlertStore();

  return useMutation({
    mutationFn: (url: string) => storeApi.previewNaverPlace(url),
    onError: (error: unknown) => {
      addAlert({
        severity: "error",
        message: getApiMessage.error(error),
      });
    },
  });
}

/** 스토어에 네이버 플레이스 연결 (PUT /store/:id/naver-place) */
export function useConnectNaverPlace() {
  const { addAlert } = useAlertStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ storeId, placeId }: { storeId: string; placeId: string }) =>
      storeApi.connectNaverPlace(storeId, placeId),
    onSuccess: (_data, variables) => {
      addAlert({
        severity: "success",
        message: "네이버 매장을 연결했어요.",
      });
      queryClient.invalidateQueries({ queryKey: storeQueryKeys.detail(variables.storeId) });
    },
    onError: (error: unknown) => {
      addAlert({
        severity: "error",
        message: getApiMessage.error(error),
      });
    },
  });
}

/** 스토어의 네이버 플레이스 연결 해제 (DELETE /store/:id/naver-place) */
export function useDisconnectNaverPlace() {
  const { addAlert } = useAlertStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (storeId: string) => storeApi.disconnectNaverPlace(storeId),
    onSuccess: (_data, storeId) => {
      addAlert({
        severity: "success",
        message: "네이버 매장 연결을 끊었어요. 가져와 저장한 정보는 그대로예요.",
      });
      queryClient.invalidateQueries({ queryKey: storeQueryKeys.detail(storeId) });
    },
    onError: (error: unknown) => {
      addAlert({
        severity: "error",
        message: getApiMessage.error(error),
      });
    },
  });
}
