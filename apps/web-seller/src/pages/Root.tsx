import React, { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useStoreList } from "@/apps/web-seller/features/store/hooks/queries/useStoreQuery";
import { flattenAndDeduplicateInfiniteData } from "@/apps/web-seller/common/utils/pagination.util";
import type { StoreResponseDto } from "@/apps/web-seller/features/store/types/store.dto";
import { ROUTES } from "@/apps/web-seller/common/constants/paths.constant";
import { ContentLoading } from "@/apps/web-seller/common/components/loading/ContentLoading";
import { readLastStoreId } from "@/apps/web-seller/common/utils/last-store.util";

export const RootPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: storeListData, isLoading } = useStoreList();
  const stores = useMemo(() => {
    if (!storeListData) return [];
    return flattenAndDeduplicateInfiniteData<StoreResponseDto>(storeListData);
  }, [storeListData]);

  useEffect(() => {
    if (stores.length > 0) {
      // 마지막으로 고른 스토어가 아직 내 스토어면 그곳으로(휴대폰 화면 SC-72 "다시 켜도 남는다")
      const last = readLastStoreId();
      const target = stores.find((s) => s.id === last) ?? stores[0];
      navigate(ROUTES.STORE_DETAIL_HOME(target.id), { replace: true });
    }
  }, [stores, navigate]);

  if (isLoading) {
    return (
      <ContentLoading
        variant="page"
        message="스토어를 불러오는 중…"
        showLogo
        className="border-0 shadow-none"
      />
    );
  }

  if (stores.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">스토어가 없습니다</h1>
        <p className="text-muted-foreground">먼저 스토어를 생성해주세요.</p>
      </div>
    );
  }

  return <ContentLoading variant="section" message="스토어로 이동 중…" className="py-12" />;
};
