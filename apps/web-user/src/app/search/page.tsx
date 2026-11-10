"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { SearchProductListSection } from "@/apps/web-user/features/product/components/sections/SearchProductListSection";
import { SearchStoreListSection } from "@/apps/web-user/features/store/components/sections/SearchStoreListSection";
import { Icon } from "@/apps/web-user/common/components/icons";
import {
  QuoteStickyBar,
  buildQuoteNewHref,
} from "@/apps/web-user/features/quote/components/entry/QuoteEntry";
import {
  SearchFilterSheet,
  type SearchSortBy,
} from "@/apps/web-user/features/search/components/SearchFilterSheet";
import type { StoreListFilter } from "@/apps/web-user/features/store/types/store.type";
import { hasActiveFilter } from "@/apps/web-user/features/store/components/map/MapStoreListFilter";
import { releaseSoftKeyboard } from "@/apps/web-user/common/utils/soft-keyboard.util";
import { trackEvent } from "@/apps/web-user/common/utils/analytics.util";
import { useScrollRestoration } from "@/apps/web-user/common/hooks/useScrollRestoration";

const RECENT_SEARCHES_KEY = "recentSearches";
const MAX_RECENT = 10;
/** 필터 시트의 기본 정렬. 이 값과 다르면 정렬을 바꾼 것으로 본다 */
const DEFAULT_SORT_BY: SearchSortBy = "distance";

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

export default function SearchPage() {
  // 뒤로 오면 보던 자리 그대로(새로 들어오면 맨 위부터)
  useScrollRestoration();
  const searchParams = useSearchParams();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  const [submittedTerm, setSubmittedTerm] = useState(searchParams.get("q") || "");
  const [activeTab, setActiveTab] = useState<"product" | "store">("product");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [listFilter, setListFilter] = useState<StoreListFilter>({});
  const [sortBy, setSortBy] = useState<SearchSortBy>(DEFAULT_SORT_BY);
  const [resultCount, setResultCount] = useState<number | undefined>(undefined);
  // 필터 적용 직후 다음 result_count 갱신을 success_filter_apply로 처리하기 위한 플래그
  const pendingFilterApplyRef = useRef(false);
  // view_search_result 중복 발화 방지 (탭+검색어 조합이 바뀔 때만 재발화)
  const lastViewedResultKeyRef = useRef<string | null>(null);
  // resultCount 이펙트에서 최신값을 읽기 위한 ref (탭 전환 등으로 인한 조기 발화 방지 목적으로 deps에서는 제외)
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;
  const submittedTermRef = useRef(submittedTerm);
  submittedTermRef.current = submittedTerm;
  const sortByRef = useRef(sortBy);
  sortByRef.current = sortBy;
  const listFilterRef = useRef(listFilter);
  listFilterRef.current = listFilter;

  useEffect(() => {
    const q = searchParams.get("q");
    setSearchTerm(q || "");
  }, [searchParams]);

  // 검색어 없이 진입한 경우(홈의 검색 버튼 등)에는 바로 입력할 수 있도록 키보드를 올린다.
  // 홈에서 미리 띄워둔 임시 입력은 실제 입력에 포커스를 넘긴 뒤 정리한다.
  useEffect(() => {
    if (!searchParams.get("q")) {
      inputRef.current?.focus({ preventScroll: true });
    }
    releaseSoftKeyboard();
  }, []);

  // 검색 화면(입력 전) 노출
  useEffect(() => {
    trackEvent("view_search");
  }, []);

  // 필터 적용 후 또는 검색 결과가 바뀔 때 result_count가 갱신되면 해당 이벤트를 전송
  // (submittedTerm/activeTab/sortBy/listFilter는 ref로만 읽어 탭 전환 시 이전 카운트로 조기 발화되지 않게 함)
  useEffect(() => {
    const submitted = submittedTermRef.current;
    if (resultCount == null || !submitted.trim()) return;
    if (pendingFilterApplyRef.current) {
      pendingFilterApplyRef.current = false;
      const filter = listFilterRef.current;
      trackEvent("success_filter_apply", {
        sort_type: sortByRef.current,
        size_filter: filter.sizes?.join(",") || undefined,
        price_min: filter.minPrice,
        price_max: filter.maxPrice,
        type_filter: filter.productCategoryTypes?.join(",") || undefined,
        result_count: resultCount,
      });
      lastViewedResultKeyRef.current = `${activeTabRef.current}:${submitted}`;
      return;
    }
    const key = `${activeTabRef.current}:${submitted}`;
    if (lastViewedResultKeyRef.current === key) return;
    lastViewedResultKeyRef.current = key;
    trackEvent("view_search_result", { keyword: submitted, result_count: resultCount });
  }, [resultCount]);

  const handleSearch = (term: string) => {
    if (!term.trim()) return;
    trackEvent("request_search", { keyword: term.trim() });
    saveRecentSearch(term.trim());
    setSearchTerm(term.trim());
    setSubmittedTerm(term.trim());
    router.push(`/search?q=${encodeURIComponent(term.trim())}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchTerm);
  };

  const isSearching = !!submittedTerm.trim();
  // 필터 시트에서 조건이나 정렬을 바꾼 상태면 아이콘을 on으로 표시
  const isFilterActive = hasActiveFilter(listFilter) || sortBy !== DEFAULT_SORT_BY;

  return (
    <div className="w-full">
      {/* 검색 입력 */}
      <div className="flex items-center px-5 h-[52px] border-b border-gray-100">
        <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full">
          <Icon name="search" width={20} height={20} className="text-gray-800 shrink-0" />
          <input
            ref={inputRef}
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch(searchTerm)}
            placeholder="어떤 케이크를 찾으시나요?"
            className="flex-1 text-sm text-gray-900 outline-none placeholder:text-gray-500 [&::-webkit-search-cancel-button]:hidden"
          />
          {searchTerm && (
            <button type="button" onClick={() => setSearchTerm("")} className="w-5 h-5">
              <Icon name="closeCircle" width={20} height={20} className="text-gray-300" />
            </button>
          )}
        </form>
      </div>

      {/* 탭 + 검색 결과 */}
      {isSearching && (
        <>
          <div className="flex items-center gap-[24px] py-[16px] px-[20px]">
            <button
              type="button"
              onClick={() => {
                trackEvent("engage_filter");
                setIsFilterOpen(true);
              }}
              aria-label="필터"
              aria-pressed={isFilterActive}
              className={`flex items-center justify-center w-[36px] h-[36px] shrink-0 border rounded-full ${
                isFilterActive ? "bg-primary-50 border-primary-100" : "bg-white border-gray-100"
              }`}
            >
              <Icon
                name={isFilterActive ? "filterActive" : "sort"}
                width={20}
                height={20}
                className={isFilterActive ? undefined : "text-gray-500"}
              />
            </button>
            <div className="relative flex flex-1 items-center gap-[12px] py-[16px] after:content-[''] after:absolute after:-left-[12px] after:top-1/2 after:-translate-y-1/2 after:h-3 after:w-[1px] after:bg-gray-50">
              {[
                { key: "product", label: "상품" },
                { key: "store", label: "스토어" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as "product" | "store")}
                  className={`flex-1 h-[36px] text-sm border rounded-full ${
                    activeTab === key
                      ? "text-primary bg-primary-50 border-primary-100"
                      : "text-gray-400 bg-white border-gray-100"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="px-5 pb-[100px]">
            {activeTab === "product" ? (
              <SearchProductListSection
                search={submittedTerm}
                minPrice={listFilter.minPrice}
                maxPrice={listFilter.maxPrice}
                productCategoryTypes={listFilter.productCategoryTypes}
                sortBy={sortBy}
                onResultCountChange={setResultCount}
              />
            ) : (
              <SearchStoreListSection
                search={submittedTerm}
                filter={listFilter}
                sortBy={sortBy}
                onResultCountChange={setResultCount}
              />
            )}
          </div>
          {/* 견적 요청 입구(기획 I-46 SC-13 1): 결과가 있을 때·없을 때 같은 자리 */}
          <QuoteStickyBar
            eyebrow={resultCount === 0 ? "찾는 케이크가 없나요?" : "원하는 케이크가 없나요?"}
            title="사진만 올리면 견적이 와요"
            href={buildQuoteNewHref("SEARCH", activeTab === "product" ? { q: submittedTerm } : {})}
          />
        </>
      )}

      <SearchFilterSheet
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filter={listFilter}
        onFilterChange={(f) => {
          pendingFilterApplyRef.current = true;
          setListFilter(f);
        }}
        sortBy={sortBy}
        onSortByChange={setSortBy}
      />
    </div>
  );
}
