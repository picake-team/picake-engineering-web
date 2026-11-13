"use client";

import { useRouter } from "next/navigation";
import { Icon } from "@/apps/web-user/common/components/icons";
import {
  buildMapSearchUrl,
  buildMapSearchUrlWithOptionalQuery,
  formatMapPickupFilterForSearchBar,
  formatMapPickupFilterInline,
  type MapPickupFilter,
} from "@/apps/web-user/features/store/utils/map.util";
import { trackEvent } from "@/apps/web-user/common/utils/analytics.util";

interface MapTopSearchBarProps {
  /** 검색어가 있으면 뒤로가기+검색어+닫기 UI, 없으면 플레이스홀더 버튼 */
  searchQuery: string | null;
  onCalendarClick?: () => void;
  pickupFilter?: MapPickupFilter | null;
  /** 픽업 칩(비검색 모드) 초기화 */
  onPickupClear?: () => void;
  /** 검색 결과 헤더 ← : 검색어 없이 검색 페이지로 (픽업은 유지) */
  onSearchBackClick?: () => void;
  /** 검색 결과 헤더 검색어 영역: 검색어 유지한 채 검색 페이지로 */
  onSearchEditClick?: () => void;
  /** 검색 결과 헤더 X : 검색어 없이 지도(픽업은 유지) */
  onSearchCloseClick?: () => void;
}

export function MapPickupFilterChip({
  filter,
  onCalendarClick,
  onClear,
}: {
  filter: MapPickupFilter;
  onCalendarClick: () => void;
  onClear: () => void;
}) {
  const { dateLine, periodLine } = formatMapPickupFilterForSearchBar(filter);

  const labelClass = "block w-full truncate text-[11px] font-bold leading-[14px] text-primary";

  return (
    <div
      className="box-border flex h-10 shrink-0 items-center"
      style={{
        borderRadius: 8,
        padding: "5px 8px",
        background: "var(--primary-or-50, #FFEFEB)",
        border: "1px solid var(--primary-or-100, #FFD2C7)",
        boxShadow: "0px 2px 10px 0px #0000000A",
        gap: 8,
      }}
    >
      <button
        type="button"
        onClick={onCalendarClick}
        className="flex min-h-0 min-w-0 flex-1 flex-col items-start justify-center gap-0 p-0 text-left"
        aria-label={`픽업 ${dateLine} ${periodLine} 날짜 변경`}
      >
        <span className={labelClass}>{dateLine}</span>
        <span className={labelClass}>{periodLine}</span>
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClear();
        }}
        className="flex shrink-0 items-center justify-center p-0"
        aria-label="픽업 날짜 지우기"
      >
        <Icon name="close3" width={16} height={16} className="shrink-0 block" />
      </button>
    </div>
  );
}

export function MapTopSearchBar({
  searchQuery,
  onCalendarClick,
  pickupFilter,
  onPickupClear,
  onSearchBackClick,
  onSearchEditClick,
  onSearchCloseClick,
}: MapTopSearchBarProps) {
  const router = useRouter();

  const handleSearchBack = () => {
    if (onSearchBackClick) {
      onSearchBackClick();
    } else {
      router.back();
    }
  };

  const handleSearchEdit = () => {
    if (onSearchEditClick) {
      onSearchEditClick();
    } else {
      handleSearchBack();
    }
  };

  const renderPickupSlot = () => {
    if (onCalendarClick == null) return null;
    if (pickupFilter != null) {
      return (
        <MapPickupFilterChip
          filter={pickupFilter}
          onCalendarClick={onCalendarClick}
          onClear={onPickupClear ?? (() => {})}
        />
      );
    }
    return (
      <button
        type="button"
        onClick={onCalendarClick}
        className="box-border flex h-10 w-10 shrink-0 items-center justify-center"
        style={{
          borderRadius: 26,
          border: "1px solid var(--grayscale-gr-100, #EBEBEA)",
          boxShadow: "0px 2px 10px 0px #0000000A",
          background: "#ffffff",
        }}
        aria-label="픽업 날짜 선택"
      >
        <Icon name="calendar" width={20} height={20} className="text-gray-500 block shrink-0" />
      </button>
    );
  };

  return (
    <div
      className={`absolute top-0 left-0 right-0 z-10 max-w-[638px] mx-auto ${!searchQuery ? "pt-4 px-4" : ""}`}
      style={
        searchQuery
          ? {
              padding: "16px 20px",
              background: "#FFFFFF",
              borderBottom: "1px solid var(--grayscale-gr-100, #EBEBEA)",
            }
          : undefined
      }
    >
      {searchQuery ? (
        <div className="flex w-full min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={handleSearchBack}
            className="flex shrink-0 items-center justify-center p-0"
            aria-label="검색 페이지로 돌아가기"
          >
            <Icon name="back" width={24} height={24} className="text-gray-900 block" />
          </button>
          <button
            type="button"
            onClick={handleSearchEdit}
            className="min-w-0 flex-1 truncate border-0 bg-transparent p-0 text-left font-normal"
            style={{
              fontSize: 16,
              lineHeight: "140%",
              color: "var(--grayscale-gr-900, #1A1A1A)",
            }}
            aria-label="검색어 수정"
          >
            {searchQuery}
          </button>
          {/* 검색 페이지와 동일: X → 세로선 → 달력 또는 픽업 한 줄 (gap 12px) */}
          <div className="flex shrink-0 items-center gap-[12px]">
            <button
              type="button"
              onClick={() => {
                if (onSearchCloseClick) {
                  onSearchCloseClick();
                } else {
                  router.push(
                    buildMapSearchUrlWithOptionalQuery(searchQuery, pickupFilter ?? null),
                  );
                }
              }}
              className="flex h-5 w-5 shrink-0 items-center justify-center p-0"
              aria-label="검색 초기화"
            >
              <Icon name="closeCircle" width={20} height={20} className="text-gray-300" />
            </button>
            <div className="h-3 w-px shrink-0 bg-gray-100" aria-hidden />
            {pickupFilter != null ? (
              <button
                type="button"
                onClick={() => onCalendarClick?.()}
                className="max-w-[min(100%,200px)] shrink-0 truncate border-0 p-0 text-left"
                style={{
                  borderRadius: 4,
                  padding: "2px 4px",
                  background: "var(--primary-or-50, #FFEFEB)",
                  fontWeight: 700,
                  fontSize: 11,
                  lineHeight: "140%",
                  color: "var(--primary-or-400, #FF653E)",
                }}
                aria-label="픽업 날짜 변경"
              >
                {formatMapPickupFilterInline(pickupFilter)}
              </button>
            ) : (
              onCalendarClick != null && (
                <button
                  type="button"
                  onClick={onCalendarClick}
                  className="flex shrink-0 items-center justify-center border-0 bg-transparent p-0"
                  aria-label="픽업 날짜 선택"
                >
                  <Icon
                    name="calendar"
                    width={20}
                    height={20}
                    className="block shrink-0 text-gray-500"
                  />
                </button>
              )
            )}
          </div>
        </div>
      ) : (
        <div className="flex w-full items-center gap-2" style={{ gap: 8 }}>
          <button
            type="button"
            onClick={() => {
              trackEvent("engage_map_search_bar");
              router.push(buildMapSearchUrl(pickupFilter ?? null));
            }}
            className="min-w-0 flex-1 text-left"
          >
            <div
              className="box-border flex w-full items-center gap-2 bg-white font-normal"
              style={{
                height: 40,
                borderRadius: 999,
                padding: "0 16px",
                border: "1px solid var(--grayscale-gr-100, #EBEBEA)",
                boxShadow: "0px 2px 10px 0px #0000000A",
              }}
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                <Icon name="search" width={20} height={20} className="text-gray-800 block" />
              </span>
              <span
                className="flex min-h-0 flex-1 items-center text-left"
                style={{
                  fontSize: 14,
                  lineHeight: "140%",
                  color: "var(--grayscale-gr-500, #82817D)",
                }}
              >
                어떤 케이크를 찾으시나요?
              </span>
            </div>
          </button>
          {renderPickupSlot()}
        </div>
      )}
    </div>
  );
}
