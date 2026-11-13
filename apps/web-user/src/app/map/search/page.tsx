"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Icon } from "@/apps/web-user/common/components/icons";
import { PATHS } from "@/apps/web-user/common/constants/paths.constant";
import { MapPickupDateBottomSheet } from "@/apps/web-user/features/store/components/map/MapPickupDateBottomSheet";
import {
  buildMapPageUrl,
  formatMapPickupFilterInline,
  mapPickupFilterToStoreListQuery,
  parseMapPickupFilterFromUrlSearchParams,
  MAP_PICKUP_URL_DATE_KEY,
  MAP_PICKUP_URL_PERIOD_KEY,
  type MapPickupFilter,
} from "@/apps/web-user/features/store/utils/map.util";
import { trackEvent } from "@/apps/web-user/common/utils/analytics.util";

const RECENT_SEARCHES_KEY = "recentSearches";
const MAX_RECENT = 10;

function getRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveRecentSearch(term: string) {
  const prev = getRecentSearches().filter((t) => t !== term);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify([term, ...prev].slice(0, MAX_RECENT)));
}

export default function MapSearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  const [pickupFilter, setPickupFilter] = useState<MapPickupFilter | null>(null);
  const [pickupCalendarOpen, setPickupCalendarOpen] = useState(false);

  useEffect(() => {
    const q = searchParams.get("q");
    setSearchTerm(q || "");
  }, [searchParams]);

  /** URL에 픽업 쿼리가 있을 때만 동기화 (지도에서 넘어온 선택 등) */
  useEffect(() => {
    const hasPickupInUrl =
      searchParams.has(MAP_PICKUP_URL_DATE_KEY) && searchParams.has(MAP_PICKUP_URL_PERIOD_KEY);
    if (!hasPickupInUrl) return;
    const parsed = parseMapPickupFilterFromUrlSearchParams(searchParams);
    setPickupFilter(parsed);
  }, [searchParams]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handlePickupConfirm = useCallback(
    (f: MapPickupFilter) => {
      setPickupFilter(f);
      const p = new URLSearchParams(searchParams.toString());
      const pq = mapPickupFilterToStoreListQuery(f);
      if (pq) {
        p.set(MAP_PICKUP_URL_DATE_KEY, pq.pickupFilterDate);
        p.set(MAP_PICKUP_URL_PERIOD_KEY, pq.pickupFilterPeriod);
      }
      const qt = searchTerm.trim();
      if (qt) p.set("q", qt);
      else p.delete("q");
      const s = p.toString();
      router.replace(s ? `${PATHS.MAP_SEARCH}?${s}` : PATHS.MAP_SEARCH);
    },
    [router, searchParams, searchTerm],
  );

  const handlePickupClearOnSearch = useCallback(() => {
    setPickupFilter(null);
    const p = new URLSearchParams(searchParams.toString());
    p.delete(MAP_PICKUP_URL_DATE_KEY);
    p.delete(MAP_PICKUP_URL_PERIOD_KEY);
    const qt = searchTerm.trim();
    if (qt) p.set("q", qt);
    else p.delete("q");
    const s = p.toString();
    router.replace(s ? `${PATHS.MAP_SEARCH}?${s}` : PATHS.MAP_SEARCH);
  }, [router, searchParams, searchTerm]);

  const handleSearch = (term: string) => {
    if (!term.trim()) return;
    trackEvent("request_map_search", { keyword: term.trim() });
    saveRecentSearch(term.trim());
    setSearchTerm(term.trim());
    router.push(buildMapPageUrl(term.trim(), pickupFilter));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchTerm);
  };

  const handleClose = () => {
    router.back();
  };

  /** X는 검색어가 있을 때만 — 입력만 지움(픽업과 무관) */
  const handleTrailingClear = () => {
    setSearchTerm("");
  };

  const showTrailingClear = searchTerm.trim().length > 0;

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <header
        className="sticky top-0 left-0 right-0 z-50 flex items-center justify-between bg-white max-w-[638px] mx-auto w-full"
        style={{
          padding: "10px 20px",
          background: "#FFFFFF",
        }}
      >
        <div className="flex items-center gap-1">
          <span className="flex h-4 w-4 shrink-0 items-center justify-center">
            <Icon name="location" width={16} height={16} className="text-primary block" />
          </span>
          <span
            className="font-bold pt-0.5"
            style={{
              fontSize: 13,
              lineHeight: "140%",
              color: "var(--grayscale-gr-900, #1A1A1A)",
            }}
          >
            지도
          </span>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="font-bold underline py-1 px-0 border-0 bg-transparent cursor-pointer"
          style={{
            fontSize: 14,
            lineHeight: "140%",
            color: "var(--grayscale-gr-500, #82817D)",
            textDecoration: "underline",
            textDecorationStyle: "solid",
          }}
        >
          닫기
        </button>
      </header>

      <div
        className="flex items-center"
        style={{
          padding: "16px 20px",
          background: "#FFFFFF",
          borderBottom: "1px solid var(--grayscale-gr-100, #EBEBEA)",
        }}
      >
        <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full min-w-0">
          <Icon name="search" width={20} height={20} className="text-gray-800 shrink-0" />
          <input
            ref={inputRef}
            type="search"
            autoFocus
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch(searchTerm)}
            placeholder="어떤 케이크를 찾으시나요?"
            className="flex-1 min-w-0 text-sm text-gray-900 outline-none placeholder:text-gray-500 [&::-webkit-search-cancel-button]:hidden"
          />
          {/* PillTabs·예약 캘린더와 동일한 회색 세로 구분선 + 12px 간격 (ReservationCalendarView 참고) */}
          <div className="flex shrink-0 items-center gap-[12px]">
            {showTrailingClear && (
              <button
                type="button"
                onClick={handleTrailingClear}
                className="flex h-5 w-5 shrink-0 items-center justify-center p-0"
                aria-label="입력 지우기"
              >
                <Icon name="closeCircle" width={20} height={20} className="text-gray-300" />
              </button>
            )}
            <div className="h-3 w-px shrink-0 bg-gray-100" aria-hidden />
            {pickupFilter != null ? (
              <button
                type="button"
                onClick={() => setPickupCalendarOpen(true)}
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
              <button
                type="button"
                onClick={() => setPickupCalendarOpen(true)}
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
            )}
          </div>
        </form>
      </div>

      <MapPickupDateBottomSheet
        isOpen={pickupCalendarOpen}
        onClose={() => setPickupCalendarOpen(false)}
        selectedFilter={pickupFilter}
        onConfirm={handlePickupConfirm}
        onClearFilter={
          pickupFilter != null
            ? () => {
                handlePickupClearOnSearch();
                setPickupCalendarOpen(false);
              }
            : undefined
        }
      />
    </div>
  );
}
