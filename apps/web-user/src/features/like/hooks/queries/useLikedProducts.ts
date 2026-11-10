import { useInfiniteQuery } from "@tanstack/react-query";
import { likeApi, LikedProductsResponse } from "@/apps/web-user/features/like/apis/like.api";
import { likeQueryKeys } from "@/apps/web-user/features/like/constants/likeQueryKeys.constant";

export function useLikedProducts({ limit = 20 }: { limit?: number } = {}) {
  const query = useInfiniteQuery<LikedProductsResponse>({
    queryKey: likeQueryKeys.likedProducts(),
    queryFn: ({ pageParam = 1 }) =>
      likeApi.getLikedProducts({ page: pageParam as number, limit, sortBy: "latest" }),
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNext ? lastPage.meta.currentPage + 1 : undefined,
    initialPageParam: 1,
  });
  // 조회 실패는 목록 화면이 "불러오지 못했어요 · 다시 시도"로 알린다(오류 창 없음)

  return query;
}
