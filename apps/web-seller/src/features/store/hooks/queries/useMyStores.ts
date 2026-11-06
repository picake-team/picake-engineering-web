import { useMemo } from "react";
import { flattenAndDeduplicateInfiniteData } from "@/apps/web-seller/common/utils/pagination.util";
import { useStoreList } from "@/apps/web-seller/features/store/hooks/queries/useStoreQuery";
import type { StoreResponseDto } from "@/apps/web-seller/features/store/types/store.dto";

/** 내 스토어 목록(한 번에 펼친 것). 스토어 바꾸기·▾ 표시에 쓴다 */
export function useMyStores() {
  const query = useStoreList();
  const stores = useMemo(
    () => flattenAndDeduplicateInfiniteData<StoreResponseDto>(query.data),
    [query.data],
  );
  return { ...query, stores };
}
