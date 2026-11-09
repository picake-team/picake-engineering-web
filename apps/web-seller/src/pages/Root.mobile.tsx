/**
 * 휴대폰 첫 화면 이동: 마지막으로 고른 스토어(없으면 첫 스토어) 홈. 스토어가 없으면 바로 스토어 만들기
 * (I-48 "처음에는 로그인 뒤 바로 연다"; 지금 PC는 "스토어가 없습니다" 안내만).
 * 로그인 확인과 스토어 목록을 실제로 받은 뒤에만 정한다. 받기 전에 "0개"로 보면 스토어가 있어도
 * 스토어 만들기로 가 버린다(운영자 확인 2026-11-09).
 */
import React from "react";
import { Navigate } from "react-router-dom";
import { ROUTES } from "@/apps/web-seller/common/constants/route-paths.constant";
import { readLastStoreId } from "@/apps/web-seller/common/utils/last-store.util";
import { getAccessToken } from "@/apps/web-seller/common/utils/token.util";
import { useAuthStore } from "@/apps/web-seller/features/auth/store/auth.store";
import { useMyStores } from "@/apps/web-seller/features/store/hooks/queries/useMyStores";
import { LoadErrorState } from "@/apps/web-seller/common/ui/Surface";

function Waiting() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-white">
      <span className="inline-block size-7 animate-spin rounded-full border-[3px] border-ink-100 border-t-brand" />
    </div>
  );
}

function LoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-dvh flex-col bg-white px-5 font-app">
      <LoadErrorState big onRetry={onRetry} />
    </div>
  );
}

export const RootMobilePage: React.FC = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { stores, isSuccess, isError, refetch } = useMyStores();
  if (!isAuthenticated) {
    // 로그인 확인이 실패했다. 토큰이 지워졌으면 로그인 화면으로 넘어가는 중이고, 남아 있으면 연결 문제다
    return getAccessToken() ? <LoadError onRetry={() => window.location.reload()} /> : <Waiting />;
  }
  if (isError) return <LoadError onRetry={() => void refetch()} />;
  if (!isSuccess) return <Waiting />;
  if (stores.length === 0) return <Navigate to={ROUTES.STORE_CREATE} replace />;
  const last = readLastStoreId();
  const target = stores.find((s) => s.id === last) ?? stores[0];
  return <Navigate to={ROUTES.STORE_DETAIL_HOME(target.id)} replace />;
};
