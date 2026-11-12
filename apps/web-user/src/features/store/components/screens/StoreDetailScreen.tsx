"use client";

import { useEffect } from "react";
import { useStoreDetail } from "@/apps/web-user/features/store/hooks/queries/useStoreDetail";
import { useProductList } from "@/apps/web-user/features/product/hooks/queries/useProductList";
import { useStoreFeeds } from "@/apps/web-user/features/feed/hooks/queries/useStoreFeeds";
import { StoreDetailIntroSection } from "@/apps/web-user/features/store/components/sections/StoreDetailIntroSection";
import { StoreDetailProductListSection } from "@/apps/web-user/features/store/components/sections/StoreDetailProductListSection";
import { StoreDetailReviewSection } from "@/apps/web-user/features/store/components/sections/StoreDetailReviewSection";
import { StoreDetailFeedSection } from "@/apps/web-user/features/store/components/sections/StoreDetailFeedSection";
import { Tabs } from "@/apps/web-user/common/components/tabs/Tabs";
import { StoreDetailSkeleton } from "@/apps/web-user/common/components/skeleton/StoreDetailSkeleton";
import { trackEvent } from "@/apps/web-user/common/utils/analytics.util";
import { StoreQuoteEntry } from "@/apps/web-user/features/quote/components/entry/StoreQuoteEntry";
import { useScrollRestoration } from "@/apps/web-user/common/hooks/useScrollRestoration";
import { useStoreLinkVisit } from "@/apps/web-user/features/store/hooks/useStoreLinkVisit";
import type { StoreInfo } from "@/apps/web-user/features/store/types/store.type";
import type { ProductListResponse } from "@/apps/web-user/features/product/types/product.type";

interface StoreDetailScreenProps {
  storeId: string;
  /** 서버가 미리 받은 가게·상품 첫 쪽(로그인 없이). 하트 등 내 정보는 새로 받은 뒤에 맞춘다 */
  initialStore?: StoreInfo;
  initialProducts?: ProductListResponse;
}

export default function StoreDetailScreen({
  storeId,
  initialStore,
  initialProducts,
}: StoreDetailScreenProps) {
  // 뒤로 오면 보던 자리 그대로(새로 들어오면 맨 위부터)
  useScrollRestoration();
  const { data, isLoading, isPlaceholderData } = useStoreDetail(storeId, initialStore);
  // 사장님이 보낸 가게 링크(?from=link)로 왔으면 방문으로 남긴다(I-45). 없는 가게면 남기지 않는다
  useStoreLinkVisit(data ? storeId : undefined);
  // 아래 상품 목록(StoreDetailProductListSection, "전체")과 같은 조건이라 같은 요청을 함께 쓴다(개수만 필요)
  const { data: productData } = useProductList({
    storeId,
    limit: 20,
    placeholderFirstPage: initialProducts,
  });
  // StoreDetailFeedSection과 동일한 파라미터 → 쿼리 캐시 공유 (추가 요청 없음)
  const { data: feedData } = useStoreFeeds({ storeId });

  // 상품 개수 (첫 페이지 meta에서 가져옴)
  const productCount = productData?.pages[0]?.meta.totalItems ?? 0;
  const feedCount = feedData?.meta.totalItems ?? 0;

  // 스토어 상세화면 노출
  useEffect(() => {
    if (data) {
      trackEvent("view_store_detail", { store_id: storeId });
    }
  }, [data, storeId]);

  if (isLoading) {
    return <StoreDetailSkeleton />;
  }

  if (!data) {
    return <div>스토어 정보를 불러오지 못했어요.</div>;
  }

  return (
    <div className="w-full pb-[100px]">
      <div className="px-[20px]">
        <StoreDetailIntroSection store={data} likeDisabled={isPlaceholderData} />
      </div>
      <Tabs
        defaultTab="product"
        swipeable
        tabs={[
          {
            id: "product",
            label: `상품 ${productCount}`,
            content: (
              <StoreDetailProductListSection storeId={storeId} initialFirstPage={initialProducts} />
            ),
          },
          {
            id: "review",
            label: `후기 ${data.totalReviewCount}`,
            content: <StoreDetailReviewSection storeId={storeId} />,
          },
          {
            id: "feed",
            label: `피드 ${feedCount}`,
            content: <StoreDetailFeedSection storeId={storeId} />,
          },
        ]}
      />
      {/* 견적 요청 입구(기획 I-46 SC-13 3): 상품·후기·피드 탭 모두 같은 자리 */}
      <StoreQuoteEntry store={data} />
    </div>
  );
}
