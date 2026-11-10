"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { StoreInfo } from "@/apps/web-user/features/store/types/store.type";
import type { StoreListFilter } from "@/apps/web-user/features/store/types/store.type";
import { MapStoreCardContent } from "./MapStoreCard";
import { MapStoreListFilter } from "./MapStoreListFilter";
import { Icon } from "@/apps/web-user/common/components/icons";
import {
  type MapListSortBy,
  sortStoresForMapList,
} from "@/apps/web-user/features/store/utils/map.util";
import { EmptyState } from "@/apps/web-user/common/components/fallbacks/EmptyState";

const SORT_OPTIONS: { value: MapListSortBy; label: string }[] = [
  { value: "distance", label: "거리순" },
  { value: "review", label: "리뷰순" },
];

const tabButtonStyle = {
  gap: 4,
  borderRadius: 26,
  border: "1px solid var(--grayscale-gr-100, #EBEBEA)",
  padding: "8px 14px",
  background: "var(--grayscale-gr-00, #FFFFFF)",
  fontWeight: 400,
  fontSize: 14,
  lineHeight: "140%" as const,
  color: "var(--grayscale-gr-900, #1A1A1A)",
};

interface MapStoreListSectionProps {
  stores: StoreInfo[];
  /** true면 상단 드래그 핸들 숨김 (지도 페이지 인라인 드래그 패널에서 사용) */
  hideHandle?: boolean;
  /** true면 정렬/필터 행 숨김 (지도 목록 영역에서 리스트만 표시) */
  hideSortFilter?: boolean;
  /** 목록 내 모든 카드가 동일한 기준으로 거리 표시 (지도 페이지에서 한 번만 조회한 위치) */
  userLocation?: { latitude: number; longitude: number } | null;
  /** 정렬 기준 (지도 목록에서 사용, 없으면 정렬 UI 비표시) */
  sortBy?: MapListSortBy;
  /** 정렬 변경 콜백 */
  onSortByChange?: (value: MapListSortBy) => void;
  /** 목록 필터 (사이즈·가격·유형). API 재조회에 사용 */
  listFilter?: StoreListFilter;
  /** 필터 적용 콜백 */
  onListFilterChange?: (filter: StoreListFilter) => void;
  /** 지도 목록 필터 모달 열림 상태 */
  onFilterPanelOpenChange?: (open: boolean) => void;
}

/** 지도 바텀 시트용 스토어 목록 (옵션에 따라 핸들/정렬·필터/리스트) */
export function MapStoreListSection({
  stores,
  hideHandle,
  hideSortFilter,
  userLocation,
  sortBy = "distance",
  onSortByChange,
  listFilter,
  onListFilterChange,
  onFilterPanelOpenChange,
}: MapStoreListSectionProps) {
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [sortDropdownRect, setSortDropdownRect] = useState<{ top: number; left: number } | null>(
    null,
  );
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const sortDropdownListRef = useRef<HTMLDivElement>(null);
  const sortButtonRef = useRef<HTMLButtonElement>(null);

  const sortedStores = useMemo(
    () => sortStoresForMapList(stores, sortBy, userLocation ?? null),
    [stores, sortBy, userLocation],
  );

  useEffect(() => {
    if (!sortDropdownOpen) return;
    const el = sortButtonRef.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      setSortDropdownRect({ left: rect.left, top: rect.bottom + 4 });
    }
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const inTrigger = sortDropdownRef.current?.contains(target);
      const inList = sortDropdownListRef.current?.contains(target);
      if (!inTrigger && !inList) setSortDropdownOpen(false);
    };
    window.addEventListener("click", handleClickOutside);
    return () => {
      window.removeEventListener("click", handleClickOutside);
      setSortDropdownRect(null);
    };
  }, [sortDropdownOpen]);

  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? "거리순";

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {!hideHandle && (
        <div className="flex justify-center pt-3 pb-1">
          <div
            className="rounded-full bg-gray-200 shrink-0"
            style={{ width: 40, height: 4 }}
            aria-hidden
          />
        </div>
      )}

      {!hideSortFilter && (
        <div
          className="min-w-0 shrink-0 overflow-x-auto overflow-y-visible"
          style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-x" }}
        >
          {/* 패딩을 스크롤되는 쪽에 두어, 스크롤 끝에서도 오른쪽 20px가 보이도록 함 */}
          <div
            className="flex items-center flex-nowrap"
            style={{
              gap: 12,
              minWidth: "min-content",
              padding: "12px 20px 24px 20px",
              width: "max-content",
              boxSizing: "content-box",
            }}
          >
            {onSortByChange ? (
              <div className="shrink-0" ref={sortDropdownRef}>
                <button
                  ref={sortButtonRef}
                  type="button"
                  onClick={() => setSortDropdownOpen((prev) => !prev)}
                  className="flex items-center shrink-0"
                  style={tabButtonStyle}
                  aria-expanded={sortDropdownOpen}
                  aria-haspopup="listbox"
                  aria-label={`정렬: ${currentSortLabel}`}
                >
                  {currentSortLabel}
                  <Icon
                    name="selectArrow"
                    width={16}
                    height={16}
                    className={`shrink-0 transition-transform ${sortDropdownOpen ? "rotate-0" : "rotate-180"}`}
                  />
                </button>
                {sortDropdownOpen &&
                  sortDropdownRect &&
                  typeof document !== "undefined" &&
                  createPortal(
                    <div ref={sortDropdownListRef}>
                      <ul
                        role="listbox"
                        className="fixed z-top overflow-hidden"
                        style={{
                          left: sortDropdownRect.left,
                          top: sortDropdownRect.top,
                          minWidth: 120,
                          borderRadius: 10,
                          border: "1px solid var(--grayscale-gr-100, #EBEBEA)",
                          boxShadow: "0px 4px 8px 0px #0000001A",
                          background: "var(--grayscale-gr-00, #FFFFFF)",
                        }}
                      >
                        {SORT_OPTIONS.map((opt, index) => (
                          <li
                            key={opt.value}
                            role="option"
                            aria-selected={sortBy === opt.value}
                            style={
                              index < SORT_OPTIONS.length - 1
                                ? { borderBottom: "1px solid var(--grayscale-gr-100, #EBEBEA)" }
                                : undefined
                            }
                          >
                            <button
                              type="button"
                              onClick={() => {
                                onSortByChange(opt.value);
                                setSortDropdownOpen(false);
                              }}
                              className="w-full text-left hover:bg-gray-50"
                              style={{
                                minWidth: 120,
                                height: 40,
                                padding: "10px 14px",
                                background: "var(--grayscale-gr-00, #FFFFFF)",
                                fontWeight: 400,
                                fontSize: 14,
                                lineHeight: "140%",
                                color: "var(--grayscale-gr-900, #1A1A1A)",
                              }}
                            >
                              {opt.label}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>,
                    document.body,
                  )}
              </div>
            ) : (
              <span style={tabButtonStyle}>거리순</span>
            )}

            {onListFilterChange && (
              <>
                <Icon name="line1" width={1} height={12} className="shrink-0" aria-hidden />
                <MapStoreListFilter
                  listFilter={listFilter}
                  onListFilterChange={onListFilterChange}
                  onPanelOpenChange={onFilterPanelOpenChange}
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* 스토어 목록: 상단 영역 overflow와 무관하게 컨테이너 너비만 사용 */}
      <ul
        className={`flex min-w-0 flex-col gap-7 ${sortedStores.length === 0 ? "flex-1 min-h-0" : ""}`}
        style={{ padding: "0 20px 12px 20px" }}
      >
        {sortedStores.length === 0 ? (
          <li className="flex flex-1 min-h-0 flex-col items-center justify-center">
            <EmptyState message="검색 결과가 없어요" />
          </li>
        ) : (
          sortedStores.map((store) => (
            <li key={store.id}>
              <MapStoreCardContent
                store={store}
                userLocation={userLocation ?? null}
                variant="list"
                imageWidth={120}
                imageHeight={90}
                imageGap={4}
              />
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
