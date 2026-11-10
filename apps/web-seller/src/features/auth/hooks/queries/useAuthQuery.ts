import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAuthStore } from "@/apps/web-seller/features/auth/store/auth.store";
import { authApi } from "@/apps/web-seller/features/auth/apis/auth.api";
import { authQueryKeys } from "@/apps/web-seller/features/auth/constants/authQueryKeys.constant";

// 현재 사용자 정보 조회 (새로고침 시 자동 실행)
export function useMe() {
  const { setInitialized, login } = useAuthStore();

  const query = useQuery({
    queryKey: authQueryKeys.me,
    queryFn: authApi.me,
    throwOnError: false,
    refetchOnWindowFocus: true,
    // 앱 전체는 끊기면 바로 실패(networkMode always)지만, 로그인 확인은 연결될 때까지 기다린다.
    // 실패로 끝내면 "확인 끝·로그인 안 됨"이 돼 첫 화면이 새로고침 안내로 가고, 끊긴 채 새로고침하면 웹뷰 오류 화면이 뜬다
    networkMode: "online",
  });

  // 쿼리 결과 처리. 서버 답(성공·실패)이 온 뒤에만 "확인 끝"으로 둔다 — 답 전에 화면을 그리면 로그인 안 된 채로
  // 스토어 목록을 0개로 보고 휴대폰 첫 화면이 스토어 만들기로 보냈다
  useEffect(() => {
    if (query.isSuccess && query.data) {
      login({});
    }
    if (query.isSuccess || query.isError) {
      setInitialized(true);
    }
  }, [query.isSuccess, query.isError, query.data, setInitialized, login]);

  return query;
}
