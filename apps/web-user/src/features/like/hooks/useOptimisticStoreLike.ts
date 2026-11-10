"use client";

import { useState } from "react";
import { useAddStoreLike } from "@/apps/web-user/features/like/hooks/mutations/useAddStoreLike";
import { useRemoveStoreLike } from "@/apps/web-user/features/like/hooks/mutations/useRemoveStoreLike";
import type { StoreInfo } from "@/apps/web-user/features/store/types/store.type";

/**
 * 가게 목록의 저장(하트)을 누르자마자 바꾼다(상품 하트와 같은 방식). 서버 저장이 실패하면 되돌린다.
 * 목록은 저장이 끝난 뒤 다시 받아 오므로, 그때까지는 누른 값(override)을 보여 준다.
 */
export function useOptimisticStoreLike() {
  const { mutate: addLike } = useAddStoreLike();
  const { mutate: removeLike } = useRemoveStoreLike();
  const [override, setOverride] = useState<Record<string, boolean>>({});

  const isLiked = (store: StoreInfo) => override[store.id] ?? !!store.isLiked;

  const likeCount = (store: StoreInfo) => {
    const now = isLiked(store);
    if (now === !!store.isLiked) return store.likeCount;
    return Math.max(0, store.likeCount + (now ? 1 : -1));
  };

  const toggle = (store: StoreInfo) => {
    const next = !isLiked(store);
    setOverride((prev) => ({ ...prev, [store.id]: next }));
    const revert = () =>
      setOverride((prev) => {
        const rest = { ...prev };
        delete rest[store.id];
        return rest;
      });
    if (next) addLike(store.id, { onError: revert });
    else removeLike(store.id, { onError: revert });
  };

  return { isLiked, likeCount, toggle };
}
