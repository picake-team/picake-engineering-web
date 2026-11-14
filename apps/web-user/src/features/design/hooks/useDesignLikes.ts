"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/apps/web-user/common/store/auth.store";
import { useLoginSheetStore } from "@/apps/web-user/common/store/login-sheet.store";
import { trackEvent } from "@/apps/web-user/common/utils/analytics.util";
import {
  designApi,
  type DesignLikesResponse,
} from "@/apps/web-user/features/design/apis/design.api";

export const designQueryKeys = {
  likes: (authed: boolean) => ["design", "likes", authed] as const,
};

/** 좋아요 수와 내 좋아요(디자인 모음 전체가 함께 쓴다) */
export function useDesignLikes() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: designQueryKeys.likes(isAuthenticated),
    queryFn: designApi.getLikes,
    staleTime: 30_000,
  });
}

/** ♥ 누르기: 로그인 전이면 로그인 창, 누르자마자 바꾸고 실패하면 되돌린다 */
export function useToggleDesignLike() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const openLoginSheet = useLoginSheetStore((s) => s.openLoginSheet);
  const key = designQueryKeys.likes(true);

  const mutation = useMutation({
    mutationFn: ({ designId, liked }: { designId: string; liked: boolean }) =>
      liked ? designApi.like(designId) : designApi.unlike(designId),
    onMutate: async ({ designId, liked }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const prev = queryClient.getQueryData<DesignLikesResponse>(key);
      const base = prev ?? { counts: {}, myLikes: [] };
      const count = Math.max(0, (base.counts[designId] ?? 0) + (liked ? 1 : -1));
      queryClient.setQueryData<DesignLikesResponse>(key, {
        counts: { ...base.counts, [designId]: count },
        myLikes: liked
          ? [designId, ...base.myLikes.filter((id) => id !== designId)]
          : base.myLikes.filter((id) => id !== designId),
      });
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(key, ctx.prev);
      else void queryClient.invalidateQueries({ queryKey: key });
    },
  });

  return (designId: string, currentlyLiked: boolean) => {
    if (!isAuthenticated) {
      openLoginSheet("like_button");
      return;
    }
    trackEvent("engage_design_like", { design_id: designId, liked: !currentlyLiked });
    mutation.mutate({ designId, liked: !currentlyLiked });
  };
}
