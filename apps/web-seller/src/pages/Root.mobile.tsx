/**
 * 휴대폰 첫 화면 이동: 마지막으로 고른 스토어(없으면 첫 스토어) 홈. 스토어가 없으면 바로 스토어 만들기
 * (I-48 "처음에는 로그인 뒤 바로 연다"; 지금 PC는 "스토어가 없습니다" 안내만).
 */
import React from "react";
import { Navigate } from "react-router-dom";
import { ROUTES } from "@/apps/web-seller/common/constants/route-paths.constant";
import { readLastStoreId } from "@/apps/web-seller/common/utils/last-store.util";
import { useMyStores } from "@/apps/web-seller/features/store/hooks/queries/useMyStores";
import { LoadErrorState } from "@/apps/web-seller/common/ui/Surface";

export const RootMobilePage: React.FC = () => {
  const { stores, isLoading, isError, refetch } = useMyStores();
  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-white">
        <span className="inline-block size-7 animate-spin rounded-full border-[3px] border-ink-100 border-t-brand" />
      </div>
    );
  }
  if (isError) {
    return (
      <div className="flex min-h-dvh flex-col bg-white px-5 font-app">
        <LoadErrorState big onRetry={() => void refetch()} />
      </div>
    );
  }
  if (stores.length === 0) return <Navigate to={ROUTES.STORE_CREATE} replace />;
  const last = readLastStoreId();
  const target = stores.find((s) => s.id === last) ?? stores[0];
  return <Navigate to={ROUTES.STORE_DETAIL_HOME(target.id)} replace />;
};
