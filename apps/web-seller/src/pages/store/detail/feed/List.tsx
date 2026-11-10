import React, { useRef } from "react";
import { PageTitle } from "@/apps/web-seller/common/components/layouts/MobileFrame";
import { useParams } from "react-router-dom";
import { useFeedList } from "@/apps/web-seller/features/feed/hooks/queries/useFeedQuery";
import { useInfiniteScroll } from "@/apps/web-seller/common/hooks/useInfiniteScroll";
import { flattenAndDeduplicateInfiniteData } from "@/apps/web-seller/common/utils/pagination.util";
import type { FeedResponseDto } from "@/apps/web-seller/features/feed/types/feed.dto";
import { FeedList } from "@/apps/web-seller/features/feed/components/list/FeedList";
import { ContentLoading } from "@/apps/web-seller/common/components/loading/ContentLoading";
import { InfiniteScrollLoading } from "@/apps/web-seller/common/components/loading/InfiniteScrollLoading";
import { useInMobileFrame } from "@/apps/web-seller/common/components/layouts/mobile-frame.context";
import { LoadErrorState } from "@/apps/web-seller/common/ui/Surface";

export const StoreDetailFeedListPage: React.FC = () => {
  const inFrame = useInMobileFrame();
  const { storeId } = useParams<{ storeId: string }>();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  if (!storeId) {
    return (
      <div>
        <h2 className="text-xl font-semibold">스토어를 고르지 않았어요.</h2>
      </div>
    );
  }

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, refetch } =
    useFeedList(storeId);

  // 무한 스크롤 훅 사용
  useInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    loadMoreRef,
  });

  // 피드 목록 평탄화 및 중복 제거
  const feeds = flattenAndDeduplicateInfiniteData<FeedResponseDto>(data);
  const totalItems = data?.pages?.[0]?.meta?.totalItems ?? feeds.length ?? 0;

  return (
    <div className={inFrame ? "flex flex-1 flex-col" : "space-y-6"}>
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <PageTitle className="text-3xl font-bold">피드 목록</PageTitle>
      </div>

      {/* 통계 카드 (정렬/필터 없음). 휴대폰 틀 안에서는 디자인 A90처럼 두지 않는다 */}
      <div className={inFrame ? "hidden" : "rounded-lg border bg-card p-4"}>
        <div className="text-sm text-muted-foreground">
          총 <span className="font-semibold text-foreground">{totalItems}</span>개의 피드
        </div>
      </div>

      {/* 피드 목록 */}
      {isLoading ? (
        <ContentLoading variant="section" message="피드를 불러오는 중…" className="py-12" />
      ) : inFrame && isError ? (
        <LoadErrorState big onRetry={() => void refetch()} />
      ) : (
        <>
          <FeedList feeds={feeds} />

          {/* 무한 스크롤 트리거 */}
          {hasNextPage && (
            <div ref={loadMoreRef} className="flex min-h-[100px] items-center justify-center py-8">
              {isFetchingNextPage ? (
                <InfiniteScrollLoading message="더 많은 피드를 불러오는 중…" />
              ) : null}
            </div>
          )}
        </>
      )}
    </div>
  );
};
