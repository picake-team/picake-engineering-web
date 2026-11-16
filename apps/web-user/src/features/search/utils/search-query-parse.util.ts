import { ProductCategoryType } from "@/apps/web-user/features/product/types/product.type";
import { productCategoryFromKeyword } from "@/apps/web-user/features/product/constants/product-category.constant";
import { MAP_LIST_SIZE_OPTIONS } from "@/apps/web-user/features/store/constants/map.constant";
import type { StoreListFilter } from "@/apps/web-user/features/store/types/store.type";

/**
 * 검색어를 조건으로 알아듣기(2026-11-16): "생일 레터링 1호 3만원 이하" → 카테고리 생일·레터링 + 1호 + 3만원까지.
 * 알아들은 말은 필터로 바꾸고, 남은 말만 검색어로 보낸다. 서버를 부르지 않는다.
 * 동네·날짜는 알아듣지 않는다(동네는 맨 위 동네 고르기, 상품 검색은 날짜로 거르지 못함).
 */
export interface ParsedSearchQuery {
  /** 서버에 보낼 남은 말(알아들은 말을 뺀 것) */
  keyword: string;
  /** 알아들은 조건(없으면 빈 객체) */
  filter: StoreListFilter;
}

const MAN = 10_000;

/** 검색어에서 빼는 말: 결과를 좁히지 않고 이름 검색만 막는 말 */
const FILLER_WORDS = new Set([
  "케이크",
  "케익",
  "주문",
  "주문제작",
  "제작",
  "맞춤",
  "예약",
  "추천",
  "근처",
  "가게",
  "집",
  "파는곳",
  "파는",
  "곳",
  "선물",
  "용",
]);

/** "오늘"은 같은 뜻 표에 없어 여기서만 당일픽업으로 읽는다 */
const EXTRA_CATEGORY_WORDS: Record<string, ProductCategoryType> = {
  오늘: ProductCategoryType.SAME_DAY_PICKUP,
  오늘픽업: ProductCategoryType.SAME_DAY_PICKUP,
};

const PRICE_PATTERNS: {
  re: RegExp;
  apply: (m: RegExpMatchArray, f: StoreListFilter) => void;
}[] = [
  {
    // 2~3만원
    re: /(\d+)\s*[~-]\s*(\d+)\s*만\s*원?/,
    apply: (m, f) => {
      f.minPrice = Number(m[1]) * MAN;
      f.maxPrice = Number(m[2]) * MAN;
    },
  },
  {
    // 5만원대
    re: /(\d+)\s*만\s*원?\s*대/,
    apply: (m, f) => {
      f.minPrice = Number(m[1]) * MAN;
      f.maxPrice = (Number(m[1]) + 1) * MAN;
    },
  },
  {
    // 3만원 이상
    re: /(\d+)\s*만\s*원?\s*(이상|부터|넘는)/,
    apply: (m, f) => {
      f.minPrice = Number(m[1]) * MAN;
    },
  },
  {
    // 3만원 이하·까지·미만, 그냥 "3만원"도 예산으로 본다
    re: /(\d+)\s*만\s*원(\s*(이하|까지|미만|아래|안쪽|내))?/,
    apply: (m, f) => {
      f.maxPrice = Number(m[1]) * MAN;
    },
  },
];

function stripCake(token: string): string {
  const t = token.replace(/^#/, "");
  const stripped = t.replace(/(케이크|케익)$/, "");
  return stripped || t;
}

export function parseSearchQuery(query: string): ParsedSearchQuery {
  let rest = query.trim().replace(/\s+/g, " ");
  const filter: StoreListFilter = {};

  for (const { re, apply } of PRICE_PATTERNS) {
    const m = rest.match(re);
    if (!m) continue;
    apply(m, filter);
    rest = rest.replace(m[0], " ");
    break;
  }

  const categories: ProductCategoryType[] = [];
  const sizes: string[] = [];
  const leftover: string[] = [];
  const tokens = rest.split(" ").filter(Boolean);

  for (const token of tokens) {
    const word = stripCake(token);
    if (FILLER_WORDS.has(token) || FILLER_WORDS.has(word)) continue;
    const size = MAP_LIST_SIZE_OPTIONS.find((s) => s === word);
    if (size) {
      if (!sizes.includes(size)) sizes.push(size);
      continue;
    }
    const category = EXTRA_CATEGORY_WORDS[word] ?? productCategoryFromKeyword(word);
    if (category) {
      if (!categories.includes(category)) categories.push(category);
      continue;
    }
    leftover.push(token);
  }

  // 카테고리 말 하나만 친 검색("생일", "남친")은 지금처럼 서버가 이름·태그·같은 뜻으로 찾게 둔다
  // (필터로 바꾸면 카테고리를 안 붙인 상품 이름 검색이 빠진다)
  const onlyOneCategory =
    categories.length === 1 &&
    sizes.length === 0 &&
    filter.minPrice == null &&
    filter.maxPrice == null &&
    leftover.length === 0;
  if (onlyOneCategory) return { keyword: query.trim(), filter: {} };

  if (categories.length) filter.productCategoryTypes = categories;
  if (sizes.length) filter.sizes = sizes;
  // 알아들은 조건이 없으면 지금처럼 친 말 그대로 찾는다
  if (!hasParsedFilter(filter)) return { keyword: query.trim(), filter: {} };
  return { keyword: leftover.join(" "), filter };
}

export function hasParsedFilter(f: StoreListFilter): boolean {
  return (
    !!f.productCategoryTypes?.length ||
    !!f.sizes?.length ||
    f.minPrice != null ||
    f.maxPrice != null
  );
}
