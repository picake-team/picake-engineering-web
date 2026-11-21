import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/apps/web-user/common/store/auth.store";
import { useAlertStore } from "@/apps/web-user/common/store/alert.store";
import { captureSentryApiError } from "@/apps/web-user/common/utils/sentry.util";
import { PATHS } from "@/apps/web-user/common/constants/paths.constant";
import { setPostLoginRedirect } from "@/apps/web-user/features/auth/utils/post-login-redirect.util";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_DOMAIN;

const axiosConfig = {
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
};

export const consumerClient = axios.create({
  ...axiosConfig,
  baseURL: `${API_BASE_URL}/v1/consumer`,
});

// 공통 요청 인터셉터 - Authorization 헤더 추가
const requestInterceptor = (config: InternalAxiosRequestConfig) => {
  // 기본 Content-Type(application/json)이 FormData 요청에 남으면 boundary 없이 전송되어 업로드가 실패함
  if (config.data instanceof FormData && config.headers) {
    const headers = config.headers as InternalAxiosRequestConfig["headers"] & {
      delete?: (name: string) => void;
    };
    if (typeof headers.delete === "function") {
      headers.delete("Content-Type");
    } else {
      delete (headers as Record<string, unknown>)["Content-Type"];
      delete (headers as Record<string, unknown>)["content-type"];
    }
  }

  const token = useAuthStore.getState().accessToken;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

// 공통 응답 인터셉터 - 401 에러 처리
const responseErrorHandler = async (error: AxiosError<{ data?: { message?: string } }>) => {
  const status = error.response?.status;
  const message = error.response?.data?.data?.message;

  // 401 && ACCESS_TOKEN_INVALID 오류 처리
  if (status === 401 && message?.includes("ACCESS_TOKEN_INVALID")) {
    // 이 기기에서만 로그아웃한다. 서버의 알림 연결 해제는 같은 토큰이라 어차피 401이라 부르지 않는다
    useAuthStore.getState().logout();
    useAlertStore.getState().showAlert({
      type: "error",
      title: "로그인",
      message: "로그인한 뒤 이용해 주세요.",
      isLoginRequired: true,
      onClose: () => {
        // 로그인 완료 후 돌아올 수 있도록 현재 경로를 저장한 뒤 로그인 화면으로 이동
        setPostLoginRedirect();
        window.location.href = PATHS.AUTH.LOGIN;
      },
    });
    // resolve 하면 호출부가 성공으로 오인해 응답(undefined)을 참조하다 터지므로 반드시 reject
    return Promise.reject(error);
  }

  captureSentryApiError(error);

  return Promise.reject(error);
};

consumerClient.interceptors.request.use(requestInterceptor, (error) => Promise.reject(error));
consumerClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  responseErrorHandler,
);
