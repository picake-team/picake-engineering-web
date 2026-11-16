import { ProductCategoryType } from "@/apps/web-user/features/product/types/product.type";
import { productCategoryFromKeyword } from "@/apps/web-user/features/product/constants/product-category.constant";
import { MAP_LIST_SIZE_OPTIONS } from "@/apps/web-user/features/store/constants/map.constant";
import type { StoreListFilter } from "@/apps/web-user/features/store/types/store.type";

/**
 * 검색어를 조건으로 알아듣기(2026-11-16): "생일 레터링 1호 3만원 이하" → 카테고리 생일·레터링 + 1호 + 3만원까지.
 * 알아들은 말은 필터로 바꾸고, 남은 말만 검색어로 보낸다. 서버를 부르지 않는다.
 * 동네·날짜는 알아듣지 않는다(동네는 맨 위 동네 고르기, 상품 검색은 날짜로 거르지 못함).
 * 친 말에서 알아들은 조건은 그 검색에만 걸리고, 필터 창에서 고른 것은 다음 검색에도 남는다.
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

/** 같은 뜻 표(서버와 같음)에 없어 여기서만 당일픽업으로 읽는 말 */
const EXTRA_CATEGORY_WORDS: Record<string, ProductCategoryType> = {
  오늘: ProductCategoryType.SAME_DAY_PICKUP,
  오늘픽업: ProductCategoryType.SAME_DAY_PICKUP,
};

// 가격: "3만원", "3만", "2.5만원". 범위 "2~3만원"·"2만~3만원", 대 "5만원대", 위·아래 "3만원 이상", "5만 이하"
const NUM = String.raw`(\d+(?:\.\d+)?)`;
const UNIT = String.raw`\s*만\s*원?`;
const RANGE_RE = new RegExp(String.raw`${NUM}(?:${UNIT})?\s*[~\-]\s*${NUM}${UNIT}(?:\s*대)?`);
const BAND_RE = new RegExp(String.raw`${NUM}${UNIT}\s*대`);
const MIN_RE = new RegExp(String.raw`${NUM}${UNIT}\s*(?:이상|부터|넘는|넘게|초과)`);
const MAX_RE = new RegExp(String.raw`${NUM}${UNIT}\s*(?:이하|까지|미만|아래|안쪽|이내|밑)`);
/** 꾸미는 말 없이 "3만원"이면 예산으로 본다(원은 꼭 있어야 한다) */
const BARE_RE = new RegExp(String.raw`${NUM}\s*만\s*원`);

const won = (n: string) => Math.round(Number(n) * MAN);

/** 가격 말을 읽어 filter에 넣고, 읽은 말을 뺀 나머지를 돌려준다 */
function takePrice(text: string, filter: StoreListFilter): string {
  let rest = text;
  const take = (re: RegExp): RegExpMatchArray | null => {
    const m = rest.match(re);
    if (m) rest = rest.replace(m[0], " ");
    return m;
  };
  const range = take(RANGE_RE);
  if (range) {
    filter.minPrice = won(range[1]);
    filter.maxPrice = won(range[2]);
  } else {
    const band = take(BAND_RE);
    if (band) {
      filter.minPrice = won(band[1]);
      filter.maxPrice = won(band[1]) + MAN;
    } else {
      const min = take(MIN_RE);
      const max = take(MAX_RE);
      if (min) filter.minPrice = won(min[1]);
      if (max) filter.maxPrice = won(max[1]);
      if (!min && !max) {
        const bare = take(BARE_RE);
        if (bare) filter.maxPrice = won(bare[1]);
      }
    }
  }
  if (filter.minPrice != null && filter.maxPrice != null && filter.minPrice > filter.maxPrice) {
    [filter.minPrice, filter.maxPrice] = [filter.maxPrice, filter.minPrice];
  }
  return rest;
}

function stripCake(token: string): string {
  const t = token.replace(/^#/, "");
  const stripped = t.replace(/(케이크|케익)$/, "");
  return stripped || t;
}

export function hasParsedFilter(f: StoreListFilter): boolean {
  return (
    !!f.productCategoryTypes?.length ||
    !!f.sizes?.length ||
    f.minPrice != null ||
    f.maxPrice != null
  );
}

export function parseSearchQuery(query: string): ParsedSearchQuery {
  const original = query.trim();
  const filter: StoreListFilter = {};
  const rest = takePrice(original.replace(/\s+/g, " "), filter);

  const categories: ProductCategoryType[] = [];
  const sizes: string[] = [];
  const leftover: string[] = [];
  let serverKnowsCategoryWord = false;

  for (const token of rest.split(" ").filter(Boolean)) {
    const word = stripCake(token);
    if (FILLER_WORDS.has(token) || FILLER_WORDS.has(word)) continue;
    const size = MAP_LIST_SIZE_OPTIONS.find((s) => s === word);
    if (size) {
      if (!sizes.includes(size)) sizes.push(size);
      continue;
    }
    const known = productCategoryFromKeyword(word);
    const category = known ?? EXTRA_CATEGORY_WORDS[word];
    if (category) {
      serverKnowsCategoryWord = !!known;
      if (!categories.includes(category)) categories.push(category);
      continue;
    }
    leftover.push(token);
  }

  // 서버가 아는 카테고리 말 하나만 친 검색("생일", "남친")은 지금처럼 서버가 이름·태그·같은 뜻으로 찾게 둔다
  // (필터로 바꾸면 카테고리를 안 붙인 상품 이름 검색이 빠진다). "오늘"은 서버가 몰라 필터로 바꾼다
  const onlyOneCategory =
    categories.length === 1 &&
    serverKnowsCategoryWord &&
    sizes.length === 0 &&
    filter.minPrice == null &&
    filter.maxPrice == null &&
    leftover.length === 0;
  if (onlyOneCategory) return { keyword: original, filter: {} };

  if (categories.length) filter.productCategoryTypes = categories;
  if (sizes.length) filter.sizes = sizes;
  // 알아들은 조건이 없으면 지금처럼 친 말 그대로 찾는다
  if (!hasParsedFilter(filter)) return { keyword: original, filter: {} };
  return { keyword: leftover.join(" "), filter };
}

const union = <T>(a: readonly T[] | undefined, b: readonly T[] | undefined): T[] | undefined => {
  const all = [...new Set([...(a ?? []), ...(b ?? [])])];
  return all.length ? all : undefined;
};

/** 결과·필터 창에 쓰는 값: 필터 창에서 고른 것(picked)에 친 말에서 알아들은 것(typed)을 더한다 */
export function mergeSearchFilters(
  picked: StoreListFilter,
  typed: StoreListFilter,
): StoreListFilter {
  return {
    productCategoryTypes: union(picked.productCategoryTypes, typed.productCategoryTypes),
    sizes: union(picked.sizes, typed.sizes),
    minPrice: typed.minPrice ?? picked.minPrice,
    maxPrice: typed.maxPrice ?? picked.maxPrice,
  };
}

/**
 * 필터 창에서 "결과보기"를 누르면: 친 말에서 온 것 중 창에 남아 있는 것은 계속 그 검색 몫(typed)으로,
 * 나머지는 손님이 고른 것(picked)으로 나눈다. 그래야 다음 검색에서 친 말의 조건은 빠지고 고른 것만 남는다
 */
export function splitSheetFilter(
  sheet: StoreListFilter,
  typed: StoreListFilter,
): { picked: StoreListFilter; typed: StoreListFilter } {
  const typedCats = typed.productCategoryTypes?.filter((c) =>
    sheet.productCategoryTypes?.includes(c),
  );
  const typedSizes = typed.sizes?.filter((s) => sheet.sizes?.includes(s));
  const typedMin =
    typed.minPrice != null && sheet.minPrice === typed.minPrice ? typed.minPrice : undefined;
  const typedMax =
    typed.maxPrice != null && sheet.maxPrice === typed.maxPrice ? typed.maxPrice : undefined;
  const pickedCats = sheet.productCategoryTypes?.filter((c) => !typedCats?.includes(c));
  const pickedSizes = sheet.sizes?.filter((s) => !typedSizes?.includes(s));
  return {
    picked: {
      productCategoryTypes: pickedCats?.length ? pickedCats : undefined,
      sizes: pickedSizes?.length ? pickedSizes : undefined,
      minPrice: typedMin == null ? sheet.minPrice : undefined,
      maxPrice: typedMax == null ? sheet.maxPrice : undefined,
    },
    typed: {
      productCategoryTypes: typedCats?.length ? typedCats : undefined,
      sizes: typedSizes?.length ? typedSizes : undefined,
      minPrice: typedMin,
      maxPrice: typedMax,
    },
  };
}
