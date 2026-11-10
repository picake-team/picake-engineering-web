import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { feedApi } from "@/apps/web-seller/features/feed/apis/feed.api";
import { useAlertStore } from "@/apps/web-seller/common/store/alert.store";
import getApiMessage from "@/apps/web-seller/common/utils/getApiMessage";
import {
  CreateFeedRequestDto,
  UpdateFeedRequestDto,
} from "@/apps/web-seller/features/feed/types/feed.dto";
import { ROUTES } from "@/apps/web-seller/common/constants/paths.constant";
import { feedQueryKeys } from "@/apps/web-seller/features/feed/constants/feedQueryKeys.constant";

// 피드 생성 뮤테이션
export function useCreateFeed() {
  const { addAlert } = useAlertStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ storeId, request }: { storeId: string; request: CreateFeedRequestDto }) =>
      feedApi.createFeed(storeId, request),
    onSuccess: (_response, variables) => {
      addAlert({
        severity: "success",
        message: "피드를 등록했어요.",
      });
      // 피드 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: feedQueryKeys.all });
      navigate(ROUTES.STORE_DETAIL_FEED_LIST(variables.storeId));
    },
    onError: (error) => {
      addAlert({
        severity: "error",
        message: getApiMessage.error(error),
      });
    },
  });
}

// 피드 수정 뮤테이션
export function useUpdateFeed() {
  const { addAlert } = useAlertStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      storeId,
      feedId,
      request,
    }: {
      storeId: string;
      feedId: string;
      request: UpdateFeedRequestDto;
    }) => feedApi.updateFeed(storeId, feedId, request),
    onSuccess: (_response, variables) => {
      addAlert({
        severity: "success",
        message: "피드를 고쳤어요.",
      });
      // 피드 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: feedQueryKeys.all });
      navigate(ROUTES.STORE_DETAIL_FEED_LIST(variables.storeId));
    },
    onError: (error) => {
      addAlert({
        severity: "error",
        message: getApiMessage.error(error),
      });
    },
  });
}

// 피드 삭제 뮤테이션
export function useDeleteFeed() {
  const { addAlert } = useAlertStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ storeId, feedId }: { storeId: string; feedId: string }) =>
      feedApi.deleteFeed(storeId, feedId),
    onSuccess: (_response, variables) => {
      addAlert({
        severity: "success",
        message: "피드를 삭제했어요.",
      });
      // 피드 쿼리 무효화. 지운 피드의 상세는 다시 부르지 않는다(열려 있던 상세 화면이 다시 불러
      // 오류 안내가 함께 뜨지 않게)
      queryClient.invalidateQueries({
        queryKey: feedQueryKeys.all,
        predicate: (query) => query.queryKey[2] !== variables.feedId,
      });
      navigate(ROUTES.STORE_DETAIL_FEED_LIST(variables.storeId));
    },
    onError: (error) => {
      addAlert({
        severity: "error",
        message: getApiMessage.error(error),
      });
    },
  });
}
