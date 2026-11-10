import { QueryClient } from "@tanstack/react-query";
import { QUERY_STALE_TIME } from "@/apps/web-seller/common/constants/query-cache.constants";

// QueryClient 인스턴스 생성
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: QUERY_STALE_TIME.DEFAULT,
      // 캐시에서 데이터를 유지하는 시간 (10분)
      gcTime: 10 * 60 * 1000,
      // 자동으로 데이터를 다시 가져오는 간격 (비활성)
      refetchInterval: false,
      refetchOnMount: true,
      // 관리자 패널 탭 전환 시 불필요한 refetch 방지
      refetchOnWindowFocus: false,
      // 네트워크 재연결 시 자동 리페치
      refetchOnReconnect: true,
      // 에러 발생 시 재시도 횟수
      retry: 0,
      // 인터넷이 끊겨도 멈춰 두지 않고 바로 실패시킨다. 멈춰 두면 데이터 없이 "없어요" 빈 화면이 떠서
      // 주문이 없는 것처럼 보였다(2026-11-10). 실패하면 "인터넷 연결을 확인해 주세요", 연결되면 다시 불러온다
      networkMode: "always",
      // 가장 가까운 상위 error boundary컴포넌트에서 캐치
      // throwOnError: true,
    },
    mutations: {
      // 뮤테이션 에러 발생 시 재시도 횟수
      retry: 0,
      // 끊긴 채 누르면 "처리 중"에 멈춰 있다가 연결되는 순간 몰래 처리되지 않게, 바로 실패 안내
      networkMode: "always",
      // 가장 가까운 상위 error boundary컴포넌트에서 캐치
      // throwOnError: true,
    },
  },
});
