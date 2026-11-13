"use client";

import { useState, useEffect, useRef } from "react";
import clsx from "clsx";
import { Button } from "@/apps/web-user/common/components/buttons/Button";
import {
  matchAddressToRegion,
  RegionMatchResult,
} from "@/apps/web-user/common/utils/region-match.util";
import { RegionData } from "@/apps/web-user/features/store/types/region.type";
import { useUserCurrentLocationStore } from "@/apps/web-user/common/store/user-current-location.store";
import {
  requestLocationFromWebView,
  isWebViewEnvironment,
} from "@/apps/web-user/common/utils/webview.bridge";
import { reverseGeocode } from "@/apps/web-user/common/utils/kakao-geocode.util";
import { Icon } from "@/apps/web-user/common/components/icons";
import { usePageScrollLock } from "@/apps/web-user/common/hooks/usePageScrollLock";

interface RegionSelectSheetProps {
  isOpen: boolean;
  onClose: () => void;
  regions: RegionData[];
  currentResult: RegionMatchResult | null;
  onSelect: (result: RegionMatchResult) => void;
  /** GPS 결과가 비활성 지역일 때 호출 — 상위(Header)에서 inactiveModal 띄움 */
  onGpsInactive?: (result: RegionMatchResult) => void;
}

export function RegionSelectSheet({
  isOpen,
  onClose,
  regions,
  currentResult,
  onSelect,
  onGpsInactive,
}: RegionSelectSheetProps) {
  const { address, setLocation, setAddress, isLocationPermissionModalOpen } =
    useUserCurrentLocationStore();
  const [isWaitingForLocation, setIsWaitingForLocation] = useState(false);
  // "현재 위치로 설정" 클릭 시점의 address. GPS 응답이 도착해서 address가 실제로 바뀌었는지 비교용.
  // 이걸 안 두면 setIsWaitingForLocation(true)가 즉시 useEffect를 발화시켜 stale address로 매칭 처리해버림.
  const addressBeforeGpsRef = useRef<string | null>(null);

  const listableRegions = regions.filter((r) => {
    if (r.depth1.label === "전국") return false;
    return r.depth2.some((d) => d.label !== "전지역" && d.storeCount > 0);
  });

  const [selectedDepth1, setSelectedDepth1] = useState(
    currentResult?.depth1Label ?? listableRegions[0]?.depth1.label ?? "",
  );
  // depth1별 체크 상태를 따로 보관. depth1 탭 전환 시 다른 탭의 체크가 유지되도록.
  const [checkedByDepth1, setCheckedByDepth1] = useState<Map<string, Set<string>>>(new Map());
  const [initialState, setInitialState] = useState<{
    depth1: string;
    checkedByDepth1: Map<string, Set<string>>;
  }>({ depth1: "", checkedByDepth1: new Map() });

  // 시트가 열릴 때 초기 상태 세팅
  useEffect(() => {
    if (!isOpen) return;
    const initialDepth1 = currentResult?.depth1Label ?? listableRegions[0]?.depth1.label ?? "";
    setSelectedDepth1(initialDepth1);

    const region = listableRegions.find((r) => r.depth1.label === initialDepth1);
    const activeItems =
      region?.depth2.filter((d) => d.label !== "전지역" && d.storeCount > 0) ?? [];

    let initialLabels: Set<string>;
    if (currentResult?.depth1Label === initialDepth1) {
      if (
        currentResult.label === currentResult.depth1Label ||
        currentResult.label === `${currentResult.depth1Label} 전지역`
      ) {
        // 전지역 선택 → 현재 활성 구 전체 체크
        initialLabels = new Set(activeItems.map((d) => d.label));
      } else if (currentResult.selectedLabels && currentResult.selectedLabels.length > 0) {
        // 실제 선택된 구 목록으로 복원 (다중 선택). 현재 활성 구에 남아있는 것만.
        const activeSet = new Set(activeItems.map((d) => d.label));
        initialLabels = new Set(currentResult.selectedLabels.filter((l) => activeSet.has(l)));
      } else {
        // 폴백: 레거시 저장값(단일 label)
        initialLabels = new Set([currentResult.label]);
      }
    } else {
      initialLabels = new Set();
    }

    const initialMap = new Map<string, Set<string>>();
    if (initialLabels.size > 0) {
      initialMap.set(initialDepth1, initialLabels);
    }
    setCheckedByDepth1(initialMap);
    setInitialState({
      depth1: initialDepth1,
      checkedByDepth1: new Map(Array.from(initialMap.entries()).map(([k, v]) => [k, new Set(v)])),
    });
  }, [isOpen]);

  // 뒤 화면 스크롤 방지
  usePageScrollLock(isOpen);

  // 위치 대기 중 address가 업데이트되면 자동으로 매칭 처리
  // address가 클릭 직전 값과 동일하면 GPS 응답이 아직 도착 안 한 stale 상태이므로 무시.
  useEffect(() => {
    if (!isWaitingForLocation || !address) return;
    if (address === addressBeforeGpsRef.current) return;
    setIsWaitingForLocation(false);
    processMatchResult(matchAddressToRegion(address, regions));
  }, [address, isWaitingForLocation]);

  // 위치 권한 거부 모달이 뜨면 GPS 대기 해제
  useEffect(() => {
    if (isLocationPermissionModalOpen && isWaitingForLocation) {
      setIsWaitingForLocation(false);
    }
  }, [isLocationPermissionModalOpen, isWaitingForLocation]);

  // 매칭 결과 처리 — 비활성 모달은 Header가 일원화해서 띄움
  // - 활성 지역: onSelect 후 시트 닫기
  // - 비활성 지역: onGpsInactive 콜백으로 상위에 위임 후 시트 닫기
  const processMatchResult = (result: RegionMatchResult | null) => {
    if (result) {
      if (result.storeCount > 0) {
        onSelect(result);
      } else {
        onGpsInactive?.(result);
      }
    }
    onClose();
  };

  const getActiveItems = (depth1Label: string) => {
    const region = listableRegions.find((r) => r.depth1.label === depth1Label);
    return region?.depth2.filter((d) => d.label !== "전지역" && d.storeCount > 0) ?? [];
  };

  const getCheckedLabels = (depth1Label: string): Set<string> =>
    checkedByDepth1.get(depth1Label) ?? new Set<string>();

  const isAllCheckedForDepth1 = (depth1Label: string): boolean => {
    const items = getActiveItems(depth1Label);
    const checks = getCheckedLabels(depth1Label);
    return items.length > 0 && checks.size === items.length;
  };

  const currentActiveItems = getActiveItems(selectedDepth1);
  const currentCheckedLabels = getCheckedLabels(selectedDepth1);
  const showAllRegion = currentActiveItems.length >= 2;
  const isAllChecked = isAllCheckedForDepth1(selectedDepth1);

  const handleDepth1Change = (depth1Label: string) => {
    // 같은 depth1을 다시 눌렀을 때 체크 상태(ALL 배지 포함)가 리셋되지 않도록 가드.
    if (depth1Label === selectedDepth1) return;
    // 탭만 전환 — 다른 depth1의 체크는 그대로 유지.
    setSelectedDepth1(depth1Label);
  };

  // 새로 체크가 발생한 depth1만 남기고 다른 depth1의 체크를 모두 비움.
  // (단일 depth1만 동시에 체크 유지하는 규칙. 탭 전환만으론 안 비움, 다른 depth1에서 새 체크가 발생할 때 비움.)
  const handleAllRegionToggle = () => {
    if (isAllChecked) {
      setCheckedByDepth1((prev) => {
        const next = new Map(prev);
        next.delete(selectedDepth1);
        return next;
      });
    } else {
      const onlyCurrent = new Map<string, Set<string>>();
      onlyCurrent.set(selectedDepth1, new Set(currentActiveItems.map((d) => d.label)));
      setCheckedByDepth1(onlyCurrent);
    }
  };

  const handleDepth2Toggle = (label: string) => {
    setCheckedByDepth1((prev) => {
      const currentSet = prev.get(selectedDepth1) ?? new Set<string>();
      const isUnchecking = currentSet.has(label);
      if (isUnchecking) {
        // 같은 depth1에서 해제 — 다른 depth1엔 영향 없음
        const next = new Map(prev);
        const newSet = new Set(currentSet);
        newSet.delete(label);
        if (newSet.size === 0) {
          next.delete(selectedDepth1);
        } else {
          next.set(selectedDepth1, newSet);
        }
        return next;
      }
      // 새로 체크 — 다른 depth1의 체크 전부 비우고 현재 depth1에만 set
      const newSet = new Set(currentSet);
      newSet.add(label);
      const next = new Map<string, Set<string>>();
      next.set(selectedDepth1, newSet);
      return next;
    });
  };

  const handleSetCurrentLocation = () => {
    // 캐시된 address 무시 - 항상 신선한 GPS 요청
    addressBeforeGpsRef.current = address;
    setIsWaitingForLocation(true);
    if (isWebViewEnvironment()) {
      // 웹뷰: window.receiveLocation → setAddress가 외부에서 호출됨. address 변경 시 useEffect가 처리.
      // 권한 거부 시 window.receiveLocationError → 전역 모달 (userInitiated)
      requestLocationFromWebView({ userInitiated: true });
    } else if (navigator.geolocation) {
      useUserCurrentLocationStore.getState().markLocationRequestUserInitiated();
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          useUserCurrentLocationStore.getState().clearLocationRequestFlag();
          const { latitude, longitude } = position.coords;
          setLocation(latitude, longitude);
          const addr = await reverseGeocode(latitude, longitude);
          setIsWaitingForLocation(false);
          if (addr) {
            setAddress(addr);
            // 동일 위치 재클릭 시 setAddress가 no-op이 되어 useEffect 미발화 케이스를 피하기 위해 직접 처리.
            processMatchResult(matchAddressToRegion(addr, regions));
          }
        },
        (error) => {
          setIsWaitingForLocation(false);
          if (error.code === error.PERMISSION_DENIED) {
            useUserCurrentLocationStore.getState().handleLocationRequestFailure();
            return;
          }
          useUserCurrentLocationStore.getState().clearLocationRequestFlag();
        },
      );
    } else {
      setIsWaitingForLocation(false);
    }
  };

  const handleConfirm = () => {
    if (currentCheckedLabels.size === 0) {
      onClose();
      return;
    }
    // 실제 선택된 구 목록. 표시용 label과 별개로 보관해 재진입 복원·필터에 사용.
    const selectedLabels = Array.from(currentCheckedLabels);
    if (isAllChecked) {
      const totalStoreCount = currentActiveItems.reduce((sum, d) => sum + d.storeCount, 0);
      onSelect({
        label: `${selectedDepth1} 전지역`,
        storeCount: totalStoreCount,
        depth1Label: selectedDepth1,
        selectedLabels,
      });
    } else if (currentCheckedLabels.size === 1) {
      const label = selectedLabels[0];
      const item = currentActiveItems.find((d) => d.label === label)!;
      onSelect({
        label: item.label,
        storeCount: item.storeCount,
        depth1Label: selectedDepth1,
        selectedLabels,
      });
    } else {
      const selectedItems = currentActiveItems.filter((d) => currentCheckedLabels.has(d.label));
      const totalStoreCount = selectedItems.reduce((sum, d) => sum + d.storeCount, 0);
      onSelect({
        label: `${selectedItems[0].label} 외 ${selectedItems.length - 1}곳`,
        storeCount: totalStoreCount,
        depth1Label: selectedDepth1,
        selectedLabels,
      });
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-sheet-top flex flex-col bg-white max-w-[638px] mx-auto">
      {/* 헤더 */}
      <div className="h-[52px] shrink-0 flex items-center justify-between px-5">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center border-none bg-transparent text-gray-900 cursor-pointer p-0"
            aria-label="뒤로가기"
          >
            <Icon name="chevronLeft" width={24} height={24} className="text-gray-900" />
          </button>
          <h2 className="font-bold text-gray-900">지역 설정</h2>
        </div>
        <button
          type="button"
          onClick={handleSetCurrentLocation}
          disabled={isWaitingForLocation}
          className="flex items-center gap-1"
        >
          <Icon name="currentLocation" width={16} height={16} className="text-blue-400" />
          <span className="text-xs font-bold text-blue-400">현재 위치로 설정</span>
        </button>
      </div>

      {/* 본문 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 좌측: depth1 목록 */}
        <div className="w-[120px] shrink-0 overflow-y-auto bg-gray-50">
          {listableRegions.map((region) => {
            const isSelected = region.depth1.label === selectedDepth1;
            const checkedCount = getCheckedLabels(region.depth1.label).size;
            const isAll = isAllCheckedForDepth1(region.depth1.label);

            return (
              <button
                key={region.depth1.label}
                type="button"
                onClick={() => handleDepth1Change(region.depth1.label)}
                className={clsx(
                  "w-full px-6 h-[52px] text-sm text-left text-gray-900 transition-colors flex items-center justify-between gap-1 border-b border-gray-100",
                  isSelected ? "bg-white font-bold" : "font-medium",
                )}
              >
                <span className="truncate">{region.depth1.label}</span>
                {checkedCount > 0 && (
                  <span className="text-sm shrink-0 text-primary">
                    {isAll ? "ALL" : checkedCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 우측: depth2 목록 */}
        <div className="flex-1 overflow-y-auto">
          {showAllRegion && (
            <button
              type="button"
              onClick={handleAllRegionToggle}
              className="w-full flex items-center justify-between px-6 h-[52px] text-sm text-gray-900 font-bold transition-colors"
            >
              <span>전지역</span>
              {isAllChecked && (
                <Icon name="check" width={16} height={16} className="text-red-400" />
              )}
            </button>
          )}

          {currentActiveItems.map((item) => {
            const isChecked = currentCheckedLabels.has(item.label);
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => handleDepth2Toggle(item.label)}
                className="w-full flex items-center justify-between px-6 h-[52px] text-sm text-gray-900 font-bold transition-colors"
              >
                <span>{item.label}</span>
                {isChecked && <Icon name="check" width={16} height={16} className="text-red-400" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 푸터 */}
      <div className="shrink-0 px-5 py-4 border-t border-gray-100 flex gap-2">
        <span style={{ flex: 3 }}>
          <Button
            variant="outline"
            onClick={() => {
              setSelectedDepth1(initialState.depth1);
              setCheckedByDepth1(
                new Map(
                  Array.from(initialState.checkedByDepth1.entries()).map(([k, v]) => [
                    k,
                    new Set(v),
                  ]),
                ),
              );
            }}
            className="flex items-center justify-center gap-[6px]"
          >
            <Icon name="reset" width={20} height={20} className="text-gray-900" />
            초기화
          </Button>
        </span>
        <span style={{ flex: 7 }}>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={currentCheckedLabels.size === 0}
          >
            선택완료
          </Button>
        </span>
      </div>
    </div>
  );
}
