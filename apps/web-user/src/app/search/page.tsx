"use client";

import { DesignSearchSection } from "@/apps/web-user/features/design/components/DesignListSections";
import { searchDesigns } from "@/apps/web-user/features/design/utils/design.util";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { SearchProductListSection } from "@/apps/web-user/features/product/components/sections/SearchProductListSection";
import { SearchStoreListSection } from "@/apps/web-user/features/store/components/sections/SearchStoreListSection";
import { Icon } from "@/apps/web-user/common/components/icons";
import {
  SearchFilterSheet,
  type SearchSortBy,
} from "@/apps/web-user/features/search/components/SearchFilterSheet";
import type { StoreListFilter } from "@/apps/web-user/features/store/types/store.type";
import { hasActiveFilter } from "@/apps/web-user/features/store/components/map/MapStoreListFilter";
import { releaseSoftKeyboard } from "@/apps/web-user/common/utils/soft-keyboard.util";
import { trackEvent } from "@/apps/web-user/common/utils/analytics.util";
import { useScrollRestoration } from "@/apps/web-user/common/hooks/useScrollRestoration";
import { REMOVED_PRODUCT_CATEGORIES } from "@/apps/web-user/features/product/constants/product-category.constant";
import {
  SEARCH_CATEGORY_PARAM,
  SEARCH_SIZE_PARAM,
  readSearchCategory,
  readSearchSize,
  searchCategoryLabel,
} from "@/apps/web-user/features/search/utils/search-category.util";
import { useRecentSearches } from "@/apps/web-user/features/search/hooks/useRecentSearches";
import {
  SEARCH_SUGGESTIONS_ID,
  SearchSuggestions,
  type SearchPickSource,
} from "@/apps/web-user/features/search/components/SearchSuggestions";
import {
  mergeSearchFilters,
  parseSearchQuery,
  splitSheetFilter,
  type ParsedSearchQuery,
} from "@/apps/web-user/features/search/utils/search-query-parse.util";
import { suggestSearchKeywords } from "@/apps/web-user/features/search/utils/search-suggest.util";

/** 필터 시트의 기본 정렬. 이 값과 다르면 정렬을 바꾼 것으로 본다 */
const DEFAULT_SORT_BY: SearchSortBy = "distance";

export default function SearchPage() {
  const searchParams = useSearchParams();
  // 홈 카테고리·어떤 날·해시태그에서 들어오면 검색어 없이 그 카테고리를 필터에 넣고 결과를 바로 보인다
  // (상품·스토어·디자인 탭이 같은 값을 쓴다. 11-15 전 값은 새 값으로 읽는다)
  const rawCategoryParam = searchParams.get(SEARCH_CATEGORY_PARAM);
  const categoryParam = readSearchCategory(rawCategoryParam);
  // 없앤 값(빈티지·입체)으로 온 옛 주소는 빈 검색 화면 대신 카테고리 없이 결과를 바로 보인다(11-15 밤)
  const enteredWithRemovedCategory =
    !!rawCategoryParam && REMOVED_PRODUCT_CATEGORIES.has(rawCategoryParam);
  // 홈 도시락·미니 칸에서 들어오면 그 사이즈를 필터에 넣는다
  const sizeParam = readSearchSize(searchParams.get(SEARCH_SIZE_PARAM));
  const enteredFromHome = !!categoryParam || !!sizeParam || enteredWithRemovedCategory;
  // 뒤로 오면 보던 자리 그대로(새로 들어오면 맨 위부터). 검색어를 바꿔도 이 화면이 그대로 남아 있어
  // 저장 이름에 검색어를 넣는다(넣지 않으면 처음 검색어 이름으로 저장돼 돌아왔을 때 못 찾는다)
  useScrollRestoration(
    `/search?q=${searchParams.get("q") ?? ""}&category=${categoryParam ?? ""}&size=${sizeParam ?? ""}`,
  );
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  const [submittedTerm, setSubmittedTerm] = useState(searchParams.get("q") || "");
  const [activeTab, setActiveTab] = useState<"product" | "store" | "design">(() =>
    searchParams.get("tab") === "design" ? "design" : "product",
  );
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [listFilter, setListFilter] = useState<StoreListFilter>(() => ({
    ...(categoryParam ? { productCategoryTypes: [categoryParam] } : {}),
    ...(sizeParam ? { sizes: [sizeParam] } : {}),
  }));
  const [sortBy, setSortBy] = useState<SearchSortBy>(DEFAULT_SORT_BY);
  const recentSearches = useRecentSearches();
  // 검색어에서 알아들은 조건(카테고리·크기·가격). 필터 창에서 고치면 필터로 옮기고 여기서는 비운다
  const [parsed, setParsed] = useState<ParsedSearchQuery>(() =>
    parseSearchQuery(searchParams.get("q") || ""),
  );
  // 결과를 보는 중에 검색어를 고치기 시작하면 결과 대신 자동완성을 보인다
  const [editing, setEditing] = useState(false);
  // 필터 창·결과에 쓰는 값: 손님이 고른 필터(listFilter)에 검색어에서 알아들은 조건을 더한다
  // (같은 객체로 둬야 필터 창이 열린 채 다시 그려져도 고르던 값이 풀리지 않는다)
  const effectiveFilter = useMemo(
    () => mergeSearchFilters(listFilter, parsed.filter),
    [listFilter, parsed.filter],
  );
  const searchKeyword = submittedTerm.trim() ? parsed.keyword : submittedTerm;
  // 새 결과를 받을 때마다 새 객체로 바꿔, 개수가 같아도 아래 이벤트 효과가 다시 돈다
  const [result, setResult] = useState<{ count: number } | undefined>(undefined);
  const resultCount = result?.count;
  const handleResultCount = useCallback((count: number) => setResult({ count }), []);
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
  const effectiveFilterRef = useRef(effectiveFilter);
  effectiveFilterRef.current = effectiveFilter;
  // 검색어 없이 카테고리로 결과를 보는 중. 홈 카테고리로 들어왔으면 필터에서 그 카테고리를 꺼도
  // 결과(전체 상품)와 필터 버튼을 그대로 둔다(끄는 순간 빈 검색 화면이 되어 돌아갈 길이 없던 것)
  const isBrowsingCategory =
    !submittedTerm.trim() &&
    (enteredFromHome || (listFilter.productCategoryTypes?.length ?? 0) > 0);
  const isBrowsingCategoryRef = useRef(isBrowsingCategory);
  isBrowsingCategoryRef.current = isBrowsingCategory;

  // 주소의 검색어가 바뀌면(검색·뒤로 가기·앞으로 가기) 입력 칸과 결과를 함께 그 검색어로.
  // 전에는 입력 칸만 바뀌어 뒤로 가면 칸은 "하트"인데 결과는 "리본"으로 남았다(11-16)
  const qParam = searchParams.get("q") ?? "";
  useEffect(() => {
    setSearchTerm(qParam);
    setSubmittedTerm(qParam);
    setParsed(parseSearchQuery(qParam));
    setEditing(false);
  }, [qParam]);

  // 이 화면에 있는 채로 주소의 카테고리·사이즈만 바뀌면(뒤로 가기 등) 필터도 그 값으로
  useEffect(() => {
    if (!categoryParam) return;
    setListFilter((prev) => ({ ...prev, productCategoryTypes: [categoryParam] }));
  }, [categoryParam]);
  useEffect(() => {
    if (!sizeParam) return;
    setListFilter((prev) => ({ ...prev, sizes: [sizeParam] }));
  }, [sizeParam]);

  // 검색어 없이 진입한 경우(홈의 검색 버튼 등)에는 바로 입력할 수 있도록 키보드를 올린다.
  // 홈 카테고리로 들어와 결과를 보는 중이면 키보드를 올리지 않는다.
  // 홈에서 미리 띄워둔 임시 입력은 실제 입력에 포커스를 넘긴 뒤 정리한다.
  useEffect(() => {
    // 디자인 탭으로 바로 온 경우(홈 매거진 "더 보기"·저장 탭)는 둘러보기라 키보드를 올리지 않는다(11-14).
    // 상품 탭으로 바로 온 경우(홈 새 화면 상품 칸 "더 보기")도 같다
    if (!searchParams.get("q") && !enteredFromHome && !searchParams.get("tab")) {
      inputRef.current?.focus({ preventScroll: true });
    }
    releaseSoftKeyboard();
  }, []);

  // 검색 화면(입력 전) 노출. 홈 카테고리로 와서 결과를 바로 보는 것은 검색 화면 노출로 세지 않는다
  // (세면 "검색 화면을 열고 검색한 비율"이 카테고리 방문만큼 낮게 보인다)
  useEffect(() => {
    if (enteredFromHome || searchParams.get("tab")) return;
    trackEvent("view_search");
  }, []);

  // 카테고리 상세 화면 노출(기획 이벤트 표 "홈/검색" view_category_detail): 홈 카테고리·어떤 날·디자인 해시태그처럼
  // 카테고리를 들고 들어올 때(도시락·미니는 사이즈 이름). 이 화면에 있는 채로 주소만 바뀌어도(뒤로 가기) 다시 센다
  const enteredCategoryName = categoryParam ? searchCategoryLabel(categoryParam) : sizeParam;
  useEffect(() => {
    if (!enteredCategoryName) return;
    trackEvent("view_category_detail", { category_name: enteredCategoryName });
  }, [enteredCategoryName]);

  // 필터 적용 후 또는 검색 결과가 바뀔 때 result_count가 갱신되면 해당 이벤트를 전송
  // (submittedTerm/activeTab/sortBy/listFilter는 ref로만 읽어 탭 전환 시 이전 카운트로 조기 발화되지 않게 함)
  useEffect(() => {
    const submitted = submittedTermRef.current;
    if (resultCount == null) return;
    // 결과를 보이지 않는 상태(검색어도 카테고리도 없음)면 보내지 않는다
    if (!submitted.trim() && !isBrowsingCategoryRef.current) return;
    // 카테고리로 보는 중에 필터를 적용해도 success_filter_apply로 처리한다
    // (처리하지 않으면 플래그가 남아, 나중에 검색어로 찾을 때 엉뚱하게 "필터 적용"으로 보내진다)
    if (pendingFilterApplyRef.current) {
      pendingFilterApplyRef.current = false;
      const filter = effectiveFilterRef.current;
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
    // 검색어 없이 카테고리로 보는 중에는 검색어 이벤트(view_search_result)를 보내지 않는다
    if (!submitted.trim()) return;
    const key = `${activeTabRef.current}:${submitted}`;
    if (lastViewedResultKeyRef.current === key) return;
    lastViewedResultKeyRef.current = key;
    trackEvent("view_search_result", { keyword: submitted, result_count: resultCount });
  }, [result]);

  const handleSearch = (term: string) => {
    if (!term.trim()) return;
    // 키보드를 먼저 내린다: 한글을 치는 중에 줄을 누르면 내리면서 끝 글자가 입력되는데, 그 값을 아래에서 덮어쓴다
    inputRef.current?.blur();
    trackEvent("request_search", { keyword: term.trim() });
    recentSearches.add(term.trim());
    setSearchTerm(term.trim());
    setSubmittedTerm(term.trim());
    setParsed(parseSearchQuery(term.trim()));
    setEditing(false);
    router.push(`/search?q=${encodeURIComponent(term.trim())}`);
  };

  const handlePick = (term: string, source: SearchPickSource) => {
    trackEvent("engage_search_suggestion", { keyword: term, source, page: "search" });
    handleSearch(term);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchTerm);
  };

  // 홈 매거진 "더 보기"(?tab=design)로 들어오면 검색어 없이 디자인 모음 전체를 보인다
  const browsingDesigns = searchParams.get("tab") === "design";
  // 홈 새 화면 상품 칸 "더 보기"(?tab=product)로 오면 검색어 없이 상품 전체를 보인다(맨 위에서 고른 동네로 걸러짐)
  const browsingProducts = searchParams.get("tab") === "product";
  const isSearching =
    !!submittedTerm.trim() || isBrowsingCategory || browsingDesigns || browsingProducts;
  // 필터 시트에서 조건이나 정렬을 바꾼 상태면 아이콘을 on으로 표시
  const isFilterActive = hasActiveFilter(effectiveFilter) || sortBy !== DEFAULT_SORT_BY;
  // 결과가 없을 때는 늘, 결과를 보는 중에는 검색어를 고치는 동안만 최근·추천 검색어나 자동완성을 보인다
  // (고치는 중이라도 맞는 말이 없으면 결과를 가리지 않는다)
  const typingSuggestions = useMemo(
    () => suggestSearchKeywords(searchTerm, recentSearches.items),
    [searchTerm, recentSearches.items],
  );
  const showSuggestions =
    !isSearching ||
    (editing &&
      searchTerm.trim() !== submittedTerm.trim() &&
      (!searchTerm.trim() || typingSuggestions.length > 0));
  const suggestionListOpen = showSuggestions && !!searchTerm.trim() && typingSuggestions.length > 0;

  return (
    <div className="w-full">
      {/* 검색 입력 */}
      <div className="flex items-center px-5 h-[52px] border-b border-gray-100">
        <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full">
          <Icon name="search" width={20} height={20} className="text-gray-800 shrink-0" />
          <input
            ref={inputRef}
            type="search"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={suggestionListOpen}
            aria-controls={suggestionListOpen ? SEARCH_SUGGESTIONS_ID : undefined}
            enterKeyHint="search"
            autoComplete="off"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setEditing(true);
            }}
            onBlur={() => setEditing(false)}
            placeholder="어떤 케이크를 찾으시나요?"
            className="flex-1 text-sm text-gray-900 outline-none placeholder:text-gray-500 [&::-webkit-search-cancel-button]:hidden"
          />
          {searchTerm && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setSearchTerm("");
                setEditing(true);
                inputRef.current?.focus();
              }}
              aria-label="검색어 지우기"
              className="w-5 h-5"
            >
              <Icon name="closeCircle" width={20} height={20} className="text-gray-300" />
            </button>
          )}
        </form>
      </div>

      {showSuggestions && (
        <SearchSuggestions
          query={searchTerm}
          suggestions={typingSuggestions}
          recent={recentSearches.items}
          onPick={handlePick}
          onRemoveRecent={(term) => {
            recentSearches.remove(term);
            trackEvent("engage_recent_search_delete", { scope: "one" });
          }}
          onClearRecent={() => {
            recentSearches.clear();
            trackEvent("engage_recent_search_delete", { scope: "all" });
          }}
        />
      )}

      {/* 탭 + 검색 결과(자동완성을 보는 동안은 숨기기만 해 스크롤·불러온 목록을 그대로 둔다) */}
      {isSearching && (
        <div className={showSuggestions ? "hidden" : undefined}>
          {/* 탭 줄 위아래 여백(11-15 운영자: 너무 커서 줄임, 안쪽 16px 겹쳐 있던 것 뺌) */}
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
            <div className="relative flex flex-1 items-center gap-[12px] after:content-[''] after:absolute after:-left-[12px] after:top-1/2 after:-translate-y-1/2 after:h-3 after:w-[1px] after:bg-gray-50">
              {[
                { key: "product", label: "상품" },
                { key: "store", label: "스토어" },
                { key: "design", label: "디자인" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as "product" | "store" | "design")}
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
          <div className="px-5 pb-10">
            {activeTab === "design" ? (
              <DesignSearchSection
                categories={effectiveFilter.productCategoryTypes ?? []}
                sizes={effectiveFilter.sizes ?? []}
                search={searchKeyword}
              />
            ) : activeTab === "product" ? (
              <SearchProductListSection
                search={searchKeyword}
                minPrice={effectiveFilter.minPrice}
                maxPrice={effectiveFilter.maxPrice}
                productCategoryTypes={effectiveFilter.productCategoryTypes}
                sizes={effectiveFilter.sizes}
                sortBy={sortBy}
                entryPoint={isBrowsingCategory ? "category" : "search"}
                onResultCountChange={handleResultCount}
              />
            ) : (
              <SearchStoreListSection
                search={searchKeyword}
                filter={effectiveFilter}
                sortBy={sortBy}
                entryPoint={isBrowsingCategory ? "category" : "search"}
                onResultCountChange={handleResultCount}
              />
            )}
          </div>
        </div>
      )}

      <SearchFilterSheet
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filter={effectiveFilter}
        onFilterChange={(f) => {
          // 창에서 고친 값이 정본: 친 말에서 온 것 중 남은 것은 이 검색 몫으로, 나머지는 고른 필터로
          const { picked, typed } = splitSheetFilter(f, parsed.filter);
          setListFilter(picked);
          setParsed((prev) => ({ ...prev, filter: typed }));
          // 디자인 탭은 결과 수를 화면이 바로 셀 수 있어 그 자리에서 보낸다(기다리면 다음 상품·스토어 결과에 잘못 붙는다)
          if (activeTab === "design") {
            const { items, matched } = searchDesigns({
              categories: f.productCategoryTypes ?? [],
              sizes: f.sizes ?? [],
              q: searchKeyword,
            });
            trackEvent("success_filter_apply", {
              sort_type: sortBy,
              size_filter: f.sizes?.join(",") || undefined,
              price_min: f.minPrice,
              price_max: f.maxPrice,
              type_filter: f.productCategoryTypes?.join(",") || undefined,
              result_count: matched ? items.length : 0,
            });
            return;
          }
          pendingFilterApplyRef.current = true;
        }}
        sortBy={sortBy}
        onSortByChange={setSortBy}
      />
    </div>
  );
}
