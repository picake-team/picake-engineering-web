import { ProductCategoryType as C } from "@/apps/web-user/features/product/types/product.type";

export type ProductCategoryOption = { value: C; label: string };

/**
 * 상품 카테고리 묶음(2026-11-15, 서버 PRODUCT_CATEGORY_GROUPS와 같은 순서): 질문 하나에 묶음 하나.
 * 상황 / 디자인(하트·2단 같은 모양 포함 — 11-15 저녁 "모양" 묶음을 합치고 빈티지·입체를 없앰) / 서비스.
 * 검색·지도 필터에서 묶음 안은 "또는", 묶음끼리는 "그리고"로 거른다(생일 + 캐릭터 = 생일 캐릭터 케이크).
 * 크기(도시락·미니·1~3호)는 사이즈 필터로 따로 고른다.
 */
export const PRODUCT_CATEGORY_GROUPS: {
  key: "situation" | "design" | "service";
  title: string;
  options: ProductCategoryOption[];
}[] = [
  {
    key: "situation",
    title: "상황",
    options: [
      { value: C.BIRTHDAY, label: "생일" },
      { value: C.COUPLE, label: "연인·기념일" },
      { value: C.THANKS, label: "부모님·감사" },
      { value: C.BABY, label: "백일·돌" },
      { value: C.CONGRATS, label: "축하" },
      { value: C.WEDDING, label: "결혼·프로포즈" },
      { value: C.SEASON, label: "시즌" },
    ],
  },
  {
    key: "design",
    title: "디자인",
    options: [
      { value: C.LETTERING, label: "레터링" },
      { value: C.DRAWING, label: "드로잉" },
      { value: C.PHOTO, label: "사진" },
      { value: C.CHARACTER, label: "캐릭터" },
      { value: C.FLOWER, label: "꽃" },
      { value: C.RIBBON, label: "리본" },
      { value: C.FRUIT, label: "과일" },
      { value: C.HEART, label: "하트" },
      { value: C.TWO_TIER, label: "2단" },
      { value: C.SIMPLE, label: "심플" },
    ],
  },
  {
    key: "service",
    title: "서비스",
    options: [{ value: C.SAME_DAY_PICKUP, label: "당일픽업" }],
  },
];

/** 모든 카테고리(묶음 순서 그대로) */
export const PRODUCT_CATEGORY_OPTIONS: ProductCategoryOption[] = PRODUCT_CATEGORY_GROUPS.flatMap(
  (group) => group.options,
);

/** 카테고리 화면 이름 */
export const PRODUCT_CATEGORY_LABEL = Object.fromEntries(
  PRODUCT_CATEGORY_OPTIONS.map((option) => [option.value, option.label]),
) as Record<C, string>;

/** 11-15 전 값 → 새 값(공유된 옛 주소 `/search?category=LOVER` 등, 서버도 같은 규칙) */
export const LEGACY_PRODUCT_CATEGORY: Readonly<Record<string, C>> = {
  LOVER: C.COUPLE,
  ANNIVERSARY: C.COUPLE,
  FAMILY: C.THANKS,
  FRIEND: C.BIRTHDAY,
};

/** 없앤 값(11-15 저녁: 빈티지·입체). 옛 주소로 오면 카테고리 없이 연다(서버도 조용히 뺀다) */
export const REMOVED_PRODUCT_CATEGORIES: ReadonlySet<string> = new Set(["VINTAGE", "SCULPTED"]);

/** 고른 카테고리를 묶음별로 나눈다(빈 묶음은 뺀다) */
export function groupProductCategories(values: readonly C[]): C[][] {
  return PRODUCT_CATEGORY_GROUPS.map((group) =>
    values.filter((value) => group.options.some((option) => option.value === value)),
  ).filter((group) => group.length > 0);
}

/** 화면에서 직접 거를 때(디자인 모음): 묶음마다 하나라도 맞아야 한다 */
export function matchesProductCategories(
  itemValues: readonly C[],
  selected: readonly C[],
): boolean {
  return groupProductCategories(selected).every((group) =>
    group.some((v) => itemValues.includes(v)),
  );
}

/**
 * 검색어와 같은 뜻의 카테고리(서버 product-category.util의 표와 같게 둔다).
 * 손님이 친 말(연인·100일·친구 케이크)과 "누구에게"(엄마·남친·선생님)를 카테고리로 잇는다.
 */
const KEYWORD_CATEGORY: ReadonlyArray<readonly [C, readonly string[]]> = [
  [C.BIRTHDAY, ["생일", "생신", "생파", "생일파티", "벌스데이", "친구"]],
  [
    C.COUPLE,
    [
      "연인",
      "연인기념일",
      "커플",
      "기념일",
      "남친",
      "여친",
      "남자친구",
      "여자친구",
      "애인",
      "100일",
      "200일",
      "300일",
      "1주년",
      "주년",
      "결혼기념일",
    ],
  ],
  [
    C.THANKS,
    [
      "부모님",
      "부모님감사",
      "엄마",
      "아빠",
      "어머니",
      "아버지",
      "어버이날",
      "스승의날",
      "선생님",
      "감사",
      "환갑",
      "칠순",
      "팔순",
      "효도",
    ],
  ],
  [C.BABY, ["백일", "백일돌", "돌", "첫돌", "돌잔치", "백일상", "돌상"]],
  [
    C.CONGRATS,
    ["축하", "합격", "승진", "전역", "개업", "졸업", "입학", "취업", "퇴사", "은퇴", "퇴임"],
  ],
  [C.WEDDING, ["결혼", "결혼프로포즈", "웨딩", "프로포즈", "청혼", "약혼", "브라이덜샤워"]],
  [C.SEASON, ["시즌", "크리스마스", "성탄절", "연말"]],
  [C.LETTERING, ["레터링", "문구"]],
  [C.DRAWING, ["드로잉", "그림"]],
  [C.PHOTO, ["사진", "포토"]],
  [C.CHARACTER, ["캐릭터"]],
  [C.FLOWER, ["꽃", "플라워"]],
  [C.RIBBON, ["리본"]],
  [C.FRUIT, ["과일", "생과일"]],
  [C.SIMPLE, ["심플"]],
  [C.HEART, ["하트"]],
  [C.TWO_TIER, ["2단", "이단"]],
  [C.SAME_DAY_PICKUP, ["당일픽업", "당일"]],
];

const KEYWORD_TO_CATEGORY = new Map<string, C>(
  KEYWORD_CATEGORY.flatMap(([category, words]) => words.map((word) => [word, category] as const)),
);

/** 검색어 → 같은 뜻 카테고리(앞 #·띄어쓰기·가운뎃점을 빼고 끝 "케이크"를 뗀다) */
export function productCategoryFromKeyword(keyword: string): C | undefined {
  const compact = keyword.trim().replace(/^#/, "").replace(/[\s·]/g, "").toLowerCase();
  const key = compact.replace(/케이크$/, "") || compact;
  return key ? KEYWORD_TO_CATEGORY.get(key) : undefined;
}
