import { matchHangul } from "@/apps/web-user/common/utils/hangul-match.util";
import {
  KEYWORD_CATEGORY,
  PRODUCT_CATEGORY_OPTIONS,
} from "@/apps/web-user/features/product/constants/product-category.constant";
import { MAP_LIST_SIZE_OPTIONS } from "@/apps/web-user/features/store/constants/map.constant";
import { visibleDesigns } from "@/apps/web-user/features/design/utils/design.util";

/** 자동완성 한 줄 */
export interface SearchSuggestion {
  text: string;
  /** recent: 내가 전에 찾은 말(시계), keyword: Picake가 아는 말(돋보기) */
  kind: "recent" | "keyword";
  /** 굵게 보일 곳 [start, end) */
  highlight: [number, number];
}

const MAX_SUGGESTIONS = 8;
const MAX_RECENT_IN_SUGGESTIONS = 3;

/**
 * 자동완성에 쓰는 말(2026-11-16, 서버를 부르지 않는다). 앞일수록 같은 점수에서 위에 보인다.
 * 카테고리 이름 → 크기 → 같은 뜻 말(남친·어버이날) → 디자인 모음의 모양 말(체리·빈티지)
 */
let dictionaryCache: string[] | null = null;
function dictionary(): string[] {
  if (dictionaryCache) return dictionaryCache;
  const words = [
    ...PRODUCT_CATEGORY_OPTIONS.flatMap((o) => o.label.split("·")),
    ...MAP_LIST_SIZE_OPTIONS,
    ...KEYWORD_CATEGORY.flatMap(([, ws]) => ws),
    ...visibleDesigns().map((d) => d.style),
  ];
  dictionaryCache = [...new Set(words.map((w) => w.trim()).filter(Boolean))];
  return dictionaryCache;
}

/**
 * 아는 말 중 맞는 것. 두 단어 이상이면 앞말은 그대로 두고 마지막 단어만 이어 준다("생일 레" → "생일 레터링")
 */
function keywordMatches(query: string) {
  const typed = query.replace(/^\s+/, "").replace(/\s+/g, " ");
  const lastSpace = typed.lastIndexOf(" ");
  if (lastSpace < 0) {
    return dictionary().flatMap((text, order) => {
      const m = matchHangul(typed, text);
      return m
        ? [{ text, order, score: m.score, highlight: [m.start, m.end] as [number, number] }]
        : [];
    });
  }
  const head = typed.slice(0, lastSpace).trim();
  const tail = typed.slice(lastSpace + 1);
  if (!head || !tail) return [];
  return dictionary().flatMap((word, order) => {
    const m = matchHangul(tail, word);
    // 앞에서 맞는 말만 잇는다(굵게 보일 곳이 앞말부터 한 덩어리가 되게)
    if (!m || m.start !== 0) return [];
    const text = `${head} ${word}`;
    return [
      { text, order, score: m.score, highlight: [0, head.length + 1 + m.end] as [number, number] },
    ];
  });
}

/** 치는 중인 검색어에 맞는 말(내가 찾았던 말 먼저, 최대 8줄) */
export function suggestSearchKeywords(
  query: string,
  recent: readonly string[],
): SearchSuggestion[] {
  if (!query.trim()) return [];
  const recentRows = recent
    .map((text) => ({ text, m: matchHangul(query, text) }))
    .filter((r) => r.m)
    .slice(0, MAX_RECENT_IN_SUGGESTIONS)
    .map(
      ({ text, m }): SearchSuggestion => ({
        text,
        kind: "recent",
        highlight: [m!.start, m!.end],
      }),
    );
  const taken = new Set(recentRows.map((r) => r.text));
  const keywordRows = keywordMatches(query)
    .filter((r) => !taken.has(r.text))
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .slice(0, MAX_SUGGESTIONS - recentRows.length)
    .map(({ text, highlight }): SearchSuggestion => ({ text, kind: "keyword", highlight }));
  return [...recentRows, ...keywordRows];
}

/**
 * 입력 전 화면 "추천 검색어": 달력에 맞춘 말 + 늘 찾는 말(2026-11-16).
 * 모두 카테고리와 같은 뜻으로 이어지는 말만 둔다(찾으면 결과가 나오게). 순위가 아니라 날짜로 정한다.
 */
const SEASONAL_KEYWORDS: { words: string[]; from: [number, number]; to: [number, number] }[] = [
  { words: ["크리스마스", "연말"], from: [11, 1], to: [12, 25] },
  { words: ["연말"], from: [12, 26], to: [12, 31] },
  { words: ["합격"], from: [11, 1], to: [11, 30] },
  { words: ["졸업"], from: [1, 15], to: [2, 28] },
  { words: ["입학"], from: [2, 10], to: [3, 15] },
  { words: ["어버이날"], from: [4, 20], to: [5, 8] },
  { words: ["스승의날"], from: [5, 1], to: [5, 15] },
];
/** 늘 보이는 말: 상용에서 많이 찾은 말(PostHog 검색어, 11-16) */
const EVERGREEN_KEYWORDS = ["생일", "레터링", "연인", "도시락", "100일", "사진"];
const MAX_RECOMMENDED = 8;

function kstMonthDay(now: Date): number {
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return (kst.getUTCMonth() + 1) * 100 + kst.getUTCDate();
}

export function recommendedSearchKeywords(now = new Date()): string[] {
  const today = kstMonthDay(now);
  const seasonal = SEASONAL_KEYWORDS.filter(
    ({ from, to }) => today >= from[0] * 100 + from[1] && today <= to[0] * 100 + to[1],
  ).flatMap((s) => s.words);
  return [...new Set([...seasonal, ...EVERGREEN_KEYWORDS])].slice(0, MAX_RECOMMENDED);
}
