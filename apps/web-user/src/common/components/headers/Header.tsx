"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useIsFetching } from "@tanstack/react-query";
import Link from "next/link";
import { Icon } from "@/apps/web-user/common/components/icons";
import { useUserCurrentLocationStore } from "@/apps/web-user/common/store/user-current-location.store";
import { PATHS } from "@/apps/web-user/common/constants/paths.constant";
import { navigateBack } from "@/apps/web-user/common/utils/navigate-back.util";
import { useHeaderStore } from "@/apps/web-user/common/store/header.store";
import { useStoreRegions } from "@/apps/web-user/features/store/hooks/queries/useStoreRegions";
import {
  matchAddressToRegion,
  findNearestActiveRegion,
  RegionMatchResult,
} from "@/apps/web-user/common/utils/region-match.util";
import { Modal } from "@/apps/web-user/common/components/modals/Modal";
import { Toast } from "@/apps/web-user/common/components/toast/Toast";
import { RegionSelectSheet } from "@/apps/web-user/common/components/headers/RegionSelectSheet";
import { useAlarmUnreadCount } from "@/apps/web-user/features/alarm/hooks/queries/useAlarmUnreadCount";
import { isProduction } from "@/apps/web-user/common/utils/environment.util";
import { trackEvent } from "@/apps/web-user/common/utils/analytics.util";
import { REGION_STORAGE_KEY } from "@/apps/web-user/common/utils/region-storage.util";

const showQaButton = !isProduction(process.env.NEXT_PUBLIC_NODE_ENV);

const DEFAULT_ADDRESS = "서울특별시 강남구";

interface HeaderProps {
  variant?: "main" | "product" | "minimal" | "search" | "back-title";
  title?: string;
  /** `back-title`에서 뒤로 버튼 동작을 덮어쓸 때 사용 (미지정 시 `navigateBack`) */
  onBackClick?: () => void;
  /** 히스토리가 없을 때(딥링크 직진입 등) 이동할 경로. 미지정 시 홈(`/`) */
  backFallbackPath?: string;
}

export default function Header({
  variant = "main",
  title,
  onBackClick,
  backFallbackPath = PATHS.HOME,
}: HeaderProps) {
  const router = useRouter();
  const { address, latitude, longitude, setAddress, setSelectedRegion } =
    useUserCurrentLocationStore();
  const { isHomeSearchVisible } = useHeaderStore();
  const { data: regionsData } = useStoreRegions();

  const [overrideResult, setOverrideResult] = useState<RegionMatchResult | null>(null);
  const [previousResult] = useState<RegionMatchResult | null>(null);
  const [showOpenAlarmToast, setShowOpenAlarmToast] = useState(false);
  const [regionToast, setRegionToast] = useState<"loading" | "done" | null>(null);
  const isRegionChanging = useRef(false);
  // 사용자가 닫은 비활성 지역 라벨. 앱(WebView)이 위치를 다시 전달해도 같은 지역이면 모달을 재오픈하지 않는다.
  const dismissedInactiveLabelRef = useRef<string | null>(null);
  const productFetching = useIsFetching({ queryKey: ["product", "list"] });
  const { data: unreadAlarmCount = 0 } = useAlarmUnreadCount();
  const [showRegionSheet, setShowRegionSheet] = useState(false);
  const [inactiveModal, setInactiveModal] = useState<{
    visible: boolean;
    type: "seoul" | "outside";
    currentLabel: string;
    nearest: RegionMatchResult | null;
  }>({ visible: false, type: "seoul", currentLabel: "", nearest: null });

  const matchResult = useMemo(() => {
    if (!address || !regionsData?.regions) return null;
    return matchAddressToRegion(address, regionsData.regions);
  }, [address, regionsData]);

  // 최초 진입 시 localStorage에서 지역 복원
  useEffect(() => {
    const stored = localStorage.getItem(REGION_STORAGE_KEY);
    if (stored) {
      try {
        setOverrideResult(JSON.parse(stored));
      } catch {
        localStorage.removeItem(REGION_STORAGE_KEY);
      }
    }
  }, []);

  // overrideResult 변경 시 localStorage 저장
  useEffect(() => {
    if (overrideResult) {
      localStorage.setItem(REGION_STORAGE_KEY, JSON.stringify(overrideResult));
    }
  }, [overrideResult]);

  // GPS로 활성 지역 확정 시 localStorage 저장 (overrideResult 없을 때만)
  useEffect(() => {
    if (matchResult && matchResult.storeCount > 0 && !overrideResult) {
      localStorage.setItem(REGION_STORAGE_KEY, JSON.stringify(matchResult));
    }
  }, [matchResult, overrideResult]);

  // 비활성 지역 감지 시 모달 표시 (저장된 지역이 있으면 스킵)
  useEffect(() => {
    if (!matchResult || !regionsData?.regions) return;
    if (overrideResult) return;
    if (matchResult.storeCount === 0) {
      const isSeoul = matchResult.depth1Label === "서울";
      const inactiveLabel = isSeoul ? matchResult.label : matchResult.depth1Label;
      // 이미 닫은 지역이 재감지된 경우(위치 응답 중복·지연): 모달 대신 기본 지역으로 되돌린다
      if (dismissedInactiveLabelRef.current === inactiveLabel) {
        setAddress(DEFAULT_ADDRESS);
        return;
      }
      if (isSeoul) {
        const nearest = findNearestActiveRegion(
          regionsData.regions,
          matchResult.depth1Label,
          latitude,
          longitude,
        );
        setInactiveModal({
          visible: true,
          type: "seoul",
          currentLabel: matchResult.label,
          nearest,
        });
      } else {
        setInactiveModal({
          visible: true,
          type: "outside",
          currentLabel: matchResult.depth1Label,
          nearest: null,
        });
      }
    }
  }, [matchResult, regionsData, overrideResult]);

  // 유효 지역이 확정될 때마다 전역 store에 동기화 (상품 목록 필터링에 사용)
  useEffect(() => {
    const effectiveRegion =
      overrideResult ?? ((matchResult?.storeCount ?? 0) > 0 ? matchResult : null);
    setSelectedRegion(effectiveRegion);
  }, [overrideResult, matchResult, setSelectedRegion]);

  // 지역 변경 후 product 쿼리 refetch 완료 감지
  useEffect(() => {
    if (isRegionChanging.current && productFetching === 0) {
      isRegionChanging.current = false;
      setRegionToast("done");
    }
  }, [productFetching]);

  const displayAddress =
    overrideResult?.label ??
    (inactiveModal.visible ? previousResult?.label : matchResult?.label) ??
    null;

  // 배경 클릭 비활성화
  const handleInactiveClose = () => {};

  const dismissInactiveModal = () => {
    dismissedInactiveLabelRef.current = inactiveModal.currentLabel;
    setInactiveModal((prev) => ({ ...prev, visible: false }));
  };

  // 근처매장보기: 가장 가까운 활성 지역으로 override
  const handleInactiveConfirm = () => {
    if (inactiveModal.nearest) {
      const effectiveRegion =
        overrideResult ?? ((matchResult?.storeCount ?? 0) > 0 ? matchResult : null);
      if (effectiveRegion?.label !== inactiveModal.nearest.label) {
        isRegionChanging.current = true;
        setRegionToast("loading");
      }
      setOverrideResult(inactiveModal.nearest);
    }
    dismissInactiveModal();
  };

  // RegionSelectSheet에서 "현재 위치로 설정" 클릭 → GPS가 비활성 지역을 잡았을 때 호출.
  // 저장된 override 때문에 Header.tsx의 자동 effect가 모달을 띄우지 못하는 경우를 보완하기 위해
  // 모달을 강제로 띄움.
  const handleGpsInactive = (result: RegionMatchResult) => {
    if (!regionsData?.regions) return;
    // 사용자가 직접 요청한 경우이므로 이전에 닫은 지역이어도 다시 안내한다
    dismissedInactiveLabelRef.current = null;
    const isSeoul = result.depth1Label === "서울";
    if (isSeoul) {
      const nearest = findNearestActiveRegion(
        regionsData.regions,
        result.depth1Label,
        latitude,
        longitude,
      );
      setInactiveModal({ visible: true, type: "seoul", currentLabel: result.label, nearest });
    } else {
      setInactiveModal({
        visible: true,
        type: "outside",
        currentLabel: result.depth1Label,
        nearest: null,
      });
    }
  };

  // 취소: 강남구(디폴트)로 리셋
  const handleInactiveCancel = () => {
    setAddress(DEFAULT_ADDRESS);
    setOverrideResult(null);
    dismissInactiveModal();
  };

  // 우리 동네 오픈알림 (서울 외 지역)
  const handleOutsideConfirm = () => {
    // TODO: 오픈 알림 등록 로직
    setAddress(DEFAULT_ADDRESS);
    setOverrideResult(null);
    dismissInactiveModal();
    setTimeout(() => setShowOpenAlarmToast(true), 500);
  };

  // 알람 버튼 컴포넌트 (공통)
  const AlarmButton = () => {
    const badge =
      unreadAlarmCount > 0 ? (unreadAlarmCount > 99 ? "99+" : String(unreadAlarmCount)) : null;
    return (
      <Link
        href={PATHS.ALARM}
        className="relative flex items-center justify-center rounded-lg text-gray-900"
        aria-label={unreadAlarmCount > 0 ? `알람, 미읽음 ${unreadAlarmCount}건` : "알람"}
      >
        <Icon name="alarm" width={24} height={24} />
        {badge !== null && (
          <span className="absolute top-[1px] right-[1px] w-1 h-1 rounded-full bg-primary" />
        )}
      </Link>
    );
  };

  const handleBack = () => {
    if (onBackClick) {
      onBackClick();
      return;
    }

    navigateBack(router, { fallbackPath: backFallbackPath });
  };

  const LocationButton = () => (
    <button
      type="button"
      onClick={() => {
        trackEvent("engage_location_setting");
        setShowRegionSheet(true);
      }}
      className="flex items-center justify-center"
    >
      <Icon name="location" width={20} height={20} className="text-primary" />
      <span className="font-bold text-gray-900 ml-1">
        {displayAddress ?? "위치를 불러오는 중..."}
      </span>
      <Icon name="arrow" width={20} height={20} className="text-gray-900 rotate-180" />
    </button>
  );

  // 뒤로가기 + 타이틀
  if (variant === "back-title") {
    return (
      <header className="sticky top-0 z-50 bg-white px-5 relative flex items-center justify-center h-[52px]">
        <button
          onClick={handleBack}
          className="absolute left-5 flex items-center justify-center rounded-lg border-none bg-transparent text-gray-900 cursor-pointer"
          aria-label="뒤로가기"
        >
          <Icon name="chevronLeft" width={24} height={24} className="text-gray-900" />
        </button>
        {title && <h1 className="text-sm font-bold text-gray-900">{title}</h1>}
      </header>
    );
  }

  // 뒤로가기 + 장바구니
  if (variant === "product") {
    return (
      <header className="sticky top-0 z-50 bg-white px-5 flex justify-between items-center h-[52px]">
        <button
          onClick={handleBack}
          className="flex items-center justify-center rounded-lg border-none bg-transparent text-gray-900 cursor-pointer"
          aria-label="뒤로가기"
        >
          <Icon name="chevronLeft" width={24} height={24} className="text-gray-900" />
        </button>
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(PATHS.SEARCH)}
            className="h-6 w-6 flex items-center justify-center"
            aria-label="검색"
          >
            <Icon name="search" width={24} height={24} />
          </button>
          <AlarmButton />
        </div>
      </header>
    );
  }

  // 헤더 없음
  if (variant === "minimal") {
    return null;
  }

  // 위치 + 알람 + 취소
  if (variant === "search") {
    return (
      <header className="sticky top-0 left-0 right-0 z-50 bg-white max-w-[638px] mx-auto px-5 flex justify-between items-center h-[46px]">
        <LocationButton />
        <button onClick={handleBack} className="text-sm font-bold text-gray-500 underline">
          닫기
        </button>
      </header>
    );
  }

  // 위치 + 알람
  return (
    <>
      <header className="sticky top-0 left-0 right-0 z-50 bg-white max-w-[638px] mx-auto px-5 flex justify-between items-center h-[52px]">
        {/* 위치 */}
        <LocationButton />

        {/* 우측 메뉴 */}
        <div className="flex items-center gap-4">
          {showQaButton && (
            <Link
              href={PATHS.QA}
              className="px-3 py-1.5 text-xs font-bold text-yellow-400 bg-yellow-400/10 border border-yellow-400/30 rounded-lg"
            >
              QA
            </Link>
          )}
          {!isHomeSearchVisible && (
            <button
              onClick={() => router.push(PATHS.SEARCH)}
              className="h-6 w-6 flex items-center justify-center"
            >
              <Icon name="search" width={24} height={24} />
            </button>
          )}
          <AlarmButton />
        </div>
      </header>

      {/* 비활성 지역 모달 (서울 내) */}
      <Modal
        isOpen={inactiveModal.visible && inactiveModal.type === "seoul"}
        onClose={handleInactiveClose}
        title={`아직 ${inactiveModal.currentLabel} 매장은 준비중입니다. 가까운 동네에서 픽업해보시겠어요?`}
        confirmText="근처매장보기"
        confirmVariant="primary"
        cancelText="취소"
        cancelVariant="outline"
        onConfirm={handleInactiveConfirm}
        onCancel={handleInactiveCancel}
      />

      {/* 비활성 지역 모달 (서울 외) */}
      <Modal
        isOpen={inactiveModal.visible && inactiveModal.type === "outside"}
        onClose={handleInactiveClose}
        title={`아직 ${inactiveModal.currentLabel}까지는 달려가는중이에요! 오픈 알람할때 가장 먼저 알려드릴까요?`}
        confirmText="우리 동네 오픈알림"
        confirmVariant="primary"
        cancelText="취소"
        cancelVariant="outline"
        onConfirm={handleOutsideConfirm}
        onCancel={handleInactiveCancel}
        confirmFlex={7}
        cancelFlex={3}
      />

      {/* 지역 선택 시트 */}
      {regionsData?.regions && (
        <RegionSelectSheet
          isOpen={showRegionSheet}
          onClose={() => setShowRegionSheet(false)}
          regions={regionsData.regions}
          currentResult={overrideResult ?? matchResult}
          onSelect={(result) => {
            const effectiveRegion =
              overrideResult ?? ((matchResult?.storeCount ?? 0) > 0 ? matchResult : null);
            if (effectiveRegion?.label !== result.label) {
              isRegionChanging.current = true;
              setRegionToast("loading");
            }
            setOverrideResult(result);
            const selectedRegions = result.selectedLabels?.length
              ? result.selectedLabels
              : [result.label];
            trackEvent("success_location_change", {
              selected_regions: selectedRegions.join(","),
              region_count: selectedRegions.length,
            });
          }}
          onGpsInactive={handleGpsInactive}
        />
      )}

      {regionToast === "loading" && (
        <Toast
          message="위치 설정 중.."
          showSpinner
          spinnerClassName="text-white"
          variant="column"
          position="center"
          duration={10000}
          onClose={() => setRegionToast(null)}
        />
      )}

      {regionToast === "done" && (
        <Toast
          message="설정완료"
          iconName="checkCircle"
          iconClassName="text-green-400"
          variant="column"
          position="center"
          duration={1500}
          onClose={() => setRegionToast(null)}
        />
      )}

      {showOpenAlarmToast && (
        <Toast
          message="오픈시 알람을 보내드릴게요!"
          iconName="checkCircle"
          iconClassName="text-green-400"
          onClose={() => setShowOpenAlarmToast(false)}
        />
      )}
    </>
  );
}
