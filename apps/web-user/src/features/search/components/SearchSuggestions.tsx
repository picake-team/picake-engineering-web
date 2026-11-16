"use client";

import { useMemo } from "react";
import { Icon } from "@/apps/web-user/common/components/icons";
import {
  recommendedSearchKeywords,
  type SearchSuggestion,
} from "@/apps/web-user/features/search/utils/search-suggest.util";

/** 자동완성 목록 id(입력 칸의 aria-controls) */
export const SEARCH_SUGGESTIONS_ID = "search-suggestions";

/** 어디서 골랐는지(기록용) */
export type SearchPickSource = "recent" | "recommended" | "suggestion";

interface SearchSuggestionsProps {
  query: string;
  /** 치는 중 자동완성 줄(화면이 `suggestSearchKeywords`로 한 번만 계산해 넘긴다) */
  suggestions: SearchSuggestion[];
  recent: string[];
  onPick: (term: string, source: SearchPickSource) => void;
  onRemoveRecent: (term: string) => void;
  onClearRecent: () => void;
}

/** 필터 창 둥근 칸과 같은 모양(SearchFilterSheet) */
const CHIP =
  "press inline-flex h-[34px] shrink-0 items-center gap-1 rounded-full border border-gray-100 bg-white px-3 text-sm text-gray-900";
const SECTION_TITLE = "flex h-[45px] items-center text-sm font-bold text-gray-900";

/**
 * 검색 입력 아래: 비어 있으면 최근 검색어·추천 검색어, 치는 중이면 자동완성(2026-11-16).
 * 누르면 바로 찾는다. 입력 칸 포커스를 잃지 않게 누르기 전에 막는다(키보드가 내려가며 줄이 사라지지 않게).
 */
export function SearchSuggestions({
  query,
  suggestions,
  recent,
  onPick,
  onRemoveRecent,
  onClearRecent,
}: SearchSuggestionsProps) {
  const recommended = useMemo(() => recommendedSearchKeywords(), []);
  const keepFocus = (e: React.MouseEvent) => e.preventDefault();

  if (query.trim()) {
    if (!suggestions.length) return null;
    return (
      <ul
        id={SEARCH_SUGGESTIONS_ID}
        className="py-2"
        aria-label="검색어 자동완성"
        onMouseDown={keepFocus}
      >
        {suggestions.map((s) => (
          <li key={`${s.kind}:${s.text}`}>
            <button
              type="button"
              onClick={() => onPick(s.text, s.kind === "recent" ? "recent" : "suggestion")}
              className="press-bg flex h-[48px] w-full items-center gap-3 px-5 text-left"
            >
              <Icon
                name={s.kind === "recent" ? "recent" : "search"}
                width={20}
                height={20}
                className="shrink-0 text-gray-400"
              />
              <HighlightedText suggestion={s} />
            </button>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="pb-10" onMouseDown={keepFocus}>
      {recent.length > 0 && (
        <section>
          <div className="flex items-center justify-between px-5">
            <h2 className={SECTION_TITLE}>최근 검색어</h2>
            <button
              type="button"
              onClick={onClearRecent}
              className="-mr-2 px-2 py-3 text-xs text-gray-500"
            >
              전체 삭제
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {recent.map((term) => (
              <span key={term} className={`${CHIP} pr-0`}>
                <button
                  type="button"
                  onClick={() => onPick(term, "recent")}
                  className="max-w-[160px] truncate"
                >
                  {term}
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveRecent(term)}
                  aria-label={`${term} 지우기`}
                  className="flex h-full w-8 items-center justify-center"
                >
                  <Icon name="close" width={14} height={14} className="text-gray-400" />
                </button>
              </span>
            ))}
          </div>
        </section>
      )}
      <section className="mt-4 px-5">
        <h2 className={SECTION_TITLE}>추천 검색어</h2>
        <div className="flex flex-wrap gap-2">
          {recommended.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => onPick(term, "recommended")}
              className={CHIP}
            >
              {term}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function HighlightedText({ suggestion }: { suggestion: SearchSuggestion }) {
  const { text, highlight } = suggestion;
  const [start, end] = highlight;
  return (
    <span className="min-w-0 truncate text-base text-gray-700">
      {text.slice(0, start)}
      <strong className="font-bold text-gray-900">{text.slice(start, end)}</strong>
      {text.slice(end)}
    </span>
  );
}
