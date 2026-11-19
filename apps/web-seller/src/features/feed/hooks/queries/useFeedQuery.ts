import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { feedApi } from "@/apps/web-seller/features/feed/apis/feed.api";
import {
  FeedListRequestDto,
  FeedResponseDto,
  FeedListResponseDto,
} from "@/apps/web-seller/features/feed/types/feed.dto";
import { feedQueryKeys } from "@/apps/web-seller/features/feed/constants/feedQueryKeys.constant";

// 피드 목록 조회 (무한 스크롤)
export function useFeedList(storeId: string, limit: number = 20) {
  const query = useInfiniteQuery<FeedListResponseDto>({
    queryKey: feedQueryKeys.list({ storeId, limit }),
    queryFn: ({ pageParam = 1 }) => {
      const params: FeedListRequestDto = {
        page: pageParam as number,
        limit,
      };
      return feedApi.getFeeds(storeId, params);
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.meta.hasNext) {
        return lastPage.meta.currentPage + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    enabled: !!storeId,
  });

  return query;
}

// 피드 상세 조회
export function useFeedDetail(storeId: string, feedId: string) {
  const query = useQuery<FeedResponseDto>({
    queryKey: feedQueryKeys.detail(feedId),
    queryFn: () => feedApi.getFeedDetail(storeId, feedId),
    enabled: !!storeId && !!feedId,
  });

  return query;
}
