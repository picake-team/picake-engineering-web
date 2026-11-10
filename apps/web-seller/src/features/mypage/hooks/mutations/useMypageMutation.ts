import { useMutation, useQueryClient } from "@tanstack/react-query";
import { mypageApi } from "@/apps/web-seller/features/mypage/apis/mypage.api";
import { mypageQueryKeys } from "@/apps/web-seller/features/mypage/constants/mypageQueryKeys.constant";
import { useAlertStore } from "@/apps/web-seller/common/store/alert.store";
import getApiMessage from "@/apps/web-seller/common/utils/getApiMessage";
import type {
  ChangePhoneRequestDto,
  UpdateSellerMypageProfileRequestDto,
  WithdrawAccountRequestDto,
} from "@/apps/web-seller/features/mypage/types/mypage.dto";

export function useUpdateMypageProfile() {
  const queryClient = useQueryClient();
  const { addAlert } = useAlertStore();

  return useMutation({
    mutationFn: (body: UpdateSellerMypageProfileRequestDto) => mypageApi.updateProfile(body),
    onSuccess: (response) => {
      queryClient.setQueryData(mypageQueryKeys.profile(), response);
      addAlert({
        message: "프로필을 저장했어요",
        title: "성공",
        severity: "success",
      });
    },
    onError: (error) => {
      addAlert({
        message: getApiMessage.error(error),
        severity: "error",
      });
    },
  });
}

/** 새 번호 `PHONE_CHANGE` 인증 완료 후 — POST /mypage/change-phone */
export function useMypageChangePhone() {
  const queryClient = useQueryClient();
  const { addAlert } = useAlertStore();

  return useMutation({
    mutationFn: (dto: ChangePhoneRequestDto) => mypageApi.changePhone(dto),
    onSuccess: (response) => {
      void queryClient.invalidateQueries({ queryKey: mypageQueryKeys.profile() });
      addAlert({
        message: getApiMessage.success(response),
        title: "성공",
        severity: "success",
      });
    },
    onError: (error) => {
      addAlert({
        message: getApiMessage.error(error),
        severity: "error",
      });
    },
  });
}

/** 회원 탈퇴 — POST /mypage/withdraw */
export function useMypageWithdraw() {
  const { addAlert } = useAlertStore();

  return useMutation({
    mutationFn: (dto: WithdrawAccountRequestDto) => mypageApi.withdrawAccount(dto),
    onSuccess: (response) => {
      addAlert({
        message: getApiMessage.success(response),
        title: "성공",
        severity: "success",
      });
    },
    onError: (error) => {
      addAlert({
        message: getApiMessage.error(error),
        severity: "error",
      });
    },
  });
}
