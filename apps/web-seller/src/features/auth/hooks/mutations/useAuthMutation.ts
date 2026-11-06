import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/apps/web-seller/features/auth/store/auth.store";
import { authApi } from "@/apps/web-seller/features/auth/apis/auth.api";
import { useAlertStore } from "@/apps/web-seller/common/store/alert.store";
import { logoutWithDevice } from "@/apps/web-seller/common/components/providers/SellerAppBridgeProvider";
import getApiMessage from "@/apps/web-seller/common/utils/getApiMessage";
import type {
  FindAccountRequestDto,
  PhoneVerificationPurpose,
} from "@/apps/web-seller/features/auth/types/auth.dto";

export function useLogout() {
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async () => Promise.resolve(),
    onSuccess: () => {
      // 판매자 앱이면 이 휴대폰의 알림 토큰을 먼저 해제한다(손님 앱과 같은 흐름)
      logoutWithDevice(() => logout(navigate));
    },
  });
}

// 휴대폰 인증번호 발송 뮤테이션
export function useSendPhoneVerification() {
  const { addAlert } = useAlertStore();

  return useMutation({
    mutationFn: ({ phone, purpose }: { phone: string; purpose: PhoneVerificationPurpose }) =>
      authApi.sendPhoneVerification(phone, purpose),
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

// 휴대폰 인증번호 검증 뮤테이션
export function useVerifyPhoneCode() {
  const { addAlert } = useAlertStore();

  return useMutation({
    mutationFn: authApi.verifyPhoneCode,
    onError: (error) => {
      addAlert({
        message: getApiMessage.error(error),
        severity: "error",
      });
    },
  });
}

// 구글 회원가입 `GOOGLE_REGISTRATION` 인증 완료 후 POST /auth/google/register
export function useGoogleRegister() {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const { addAlert } = useAlertStore();

  return useMutation({
    mutationFn: authApi.googleRegister,
    onSuccess: (data) => {
      login({ navigate, accessToken: data.accessToken });
    },
    onError: (error) => {
      addAlert({
        message: getApiMessage.error(error),
        severity: "error",
      });
    },
  });
}

// 카카오 회원가입 `KAKAO_REGISTRATION` 인증 완료 후 POST /auth/kakao/register
export function useKakaoRegister() {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const { addAlert } = useAlertStore();

  return useMutation({
    mutationFn: authApi.kakaoRegister,
    onSuccess: (data) => {
      login({ navigate, accessToken: data.accessToken });
    },
    onError: (error) => {
      addAlert({
        message: getApiMessage.error(error),
        severity: "error",
      });
    },
  });
}

/** 휴대폰 `FIND_ACCOUNT` 인증 완료 후 — POST /auth/find-account */
export function useFindAccount() {
  const { addAlert } = useAlertStore();

  return useMutation({
    mutationFn: (dto: FindAccountRequestDto) => authApi.findAccount(dto),
    onError: (error) => {
      addAlert({
        message: getApiMessage.error(error),
        severity: "error",
      });
    },
  });
}
