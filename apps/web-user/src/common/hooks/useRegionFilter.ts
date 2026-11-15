"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useUserCurrentLocationStore } from "@/apps/web-user/common/store/user-current-location.store";
import { useStoreRegions } from "@/apps/web-user/features/store/hooks/queries/useStoreRegions";
import { buildRegionsParam } from "@/apps/web-user/common/utils/region-match.util";
import { hasStoredRegion } from "@/apps/web-user/common/utils/region-storage.util";

/** 지역 복원을 기다리는 최대 시간. 이 시간이 지나면 지역 필터 없이 목록을 조회한다. */
const REGION_WAIT_TIMEOUT_MS = 3000;

/**
 * 헤더에서 고른 동네로 상품·가게 목록을 거르는 값(`regions`)과, 첫 조회를 해도 되는지(`isRegionSettled`).
 * 홈 신규·인기 목록과 검색 결과(상품·가게 탭)가 같이 쓴다.
 */
export function useRegionFilter() {
  const { selectedRegion } = useUserCurrentLocationStore();
  const { data: regionsData, isError: isRegionsError } = useStoreRegions();

  const regions = useMemo(() => {
    if (!selectedRegion || !regionsData?.regions) return undefined;
    return buildRegionsParam(selectedRegion, regionsData.regions) || undefined;
  }, [selectedRegion, regionsData]);

  /**
   * 지역 스토어에는 persist가 없어 첫 렌더의 selectedRegion은 항상 null이다.
   * Header가 localStorage에서 지역을 복원한 뒤에야 값이 채워지므로, 그대로 두면
   * regions가 undefined → 값으로 바뀌며 queryKey가 교체되어 같은 목록을 두 번 조회한다.
   * (실측: 홈 진입 1회에 /products 요청 4건)
   *
   * 그래서 지역이 확정될 때까지 조회를 보류한다. 저장된 지역이 있는지는 localStorage로만
   * 알 수 있으므로 첫 렌더에 1회 판정하고 이후 고정한다.
   */
  const [expectsStoredRegion] = useState(hasStoredRegion);

  /**
   * 복원이 끝나지 않아도 일정 시간이 지나면 조회를 진행한다.
   *
   * 저장값이 깨져 있으면 Header가 파싱에 실패해 키만 지우고 overrideResult는 null로 남는데
   * (`Header.tsx`의 복원 effect), 이때 위치 권한까지 없으면 selectedRegion이 영영 채워지지 않아
   * 목록이 스켈레톤에서 벗어나지 못한다. 그 경우 지역 필터 없이라도 목록을 보여준다.
   */
  const [regionWaitTimedOut, setRegionWaitTimedOut] = useState(false);
  useEffect(() => {
    if (!expectsStoredRegion) return;
    const timer = window.setTimeout(() => setRegionWaitTimedOut(true), REGION_WAIT_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [expectsStoredRegion]);

  const isRegionSettledNow =
    // 저장된 지역이 없음 → 지역 필터 없이 즉시 조회 (신규 사용자 지연 없음)
    !expectsStoredRegion ||
    // 지역 목록 API 실패 → 무한 대기 방지, 지역 필터 없이 조회
    isRegionsError ||
    // 복원이 끝나지 않음 → 무한 대기 방지
    regionWaitTimedOut ||
    // 지역 확정 완료
    (!!selectedRegion && !!regionsData?.regions);

  /**
   * 한 번 확정되면 되돌리지 않는다.
   * selectedRegion이 다시 null이 되면 위 조건은 false로 돌아가는데, 그러면 이미 목록을
   * 보고 있던 화면이 스켈레톤으로 되돌아간다. 보류는 첫 조회를 늦추기 위한 장치일 뿐이다.
   */
  const hasRegionSettledRef = useRef(false);
  if (isRegionSettledNow) hasRegionSettledRef.current = true;
  const isRegionSettled = hasRegionSettledRef.current;

  return { regions, isRegionSettled };
}
