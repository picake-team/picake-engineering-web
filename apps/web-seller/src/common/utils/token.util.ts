/**
 * 토큰 관련 유틸리티 함수
 */
import { getActAsToken } from "@/apps/web-seller/common/utils/act-as.util";

const ACCESS_TOKEN_KEY = "accessToken";

/**
 * 액세스 토큰 가져오기. 운영자 대신 입력 중(기획 I-41)이면 이 탭의 대리 출입증을 먼저 쓴다
 * (사장님 출입증은 localStorage에 그대로 둔다)
 */
export const getAccessToken = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }
  return getActAsToken() ?? localStorage.getItem(ACCESS_TOKEN_KEY);
};

/**
 * localStorage에 액세스 토큰 저장
 */
export const setAccessToken = (token: string): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  }
};

/**
 * localStorage에서 액세스 토큰 제거
 */
export const removeAccessToken = (): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  }
};

/**
 * 액세스 토큰 키 (내부 사용)
 */
export const ACCESS_TOKEN_STORAGE_KEY = ACCESS_TOKEN_KEY;
