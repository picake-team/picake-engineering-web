import { ProductCategoryType } from "@/apps/web-user/features/product/types/product.type";
import { MAP_LIST_CATEGORY_OPTIONS } from "@/apps/web-user/features/store/constants/map.constant";
import { OCCASION_LABEL } from "@/apps/web-user/features/design/utils/design.util";

/** 검색 화면 주소의 카테고리 값 이름 (`/search?category=BIRTHDAY`, 홈 카테고리에서 들어올 때) */
export const SEARCH_CATEGORY_PARAM = "category";

const SELECTABLE = new Set<string>(MAP_LIST_CATEGORY_OPTIONS.map((option) => option.value));

/**
 * 주소의 카테고리 값을 읽는다(상품·스토어 탭 거르기). 필터 "유형"에 있는 값만 받는다 —
 * 모르는 값이나 필터에서 뺀 값(커스텀)이면 없는 것으로 본다.
 */
export function readSearchCategory(
  value: string | null | undefined,
): ProductCategoryType | undefined {
  if (!value || !SELECTABLE.has(value)) return undefined;
  return value as ProductCategoryType;
}

/**
 * 주소의 카테고리 값을 디자인 탭 거르기로 읽는다. 디자인 모음의 상황(OCCASION_LABEL)에 있는 값을 받는다.
 * 상품 쪽에서 "커스텀" 표시인 LETTERING이 디자인 모음에서는 "레터링"이라, 상품 필터와 따로 읽는다
 * (함께 읽으면 디자인 상세 #레터링이 레터링 19개가 아니라 디자인 36개 전체를 보였다, 11-15).
 */
export function readDesignCategory(
  value: string | null | undefined,
): ProductCategoryType | undefined {
  // in 대신 자기 키만 본다("constructor" 같은 값이 통과하지 않게)
  if (!value || !Object.prototype.hasOwnProperty.call(OCCASION_LABEL, value)) return undefined;
  return value as ProductCategoryType;
}

/** 카테고리 값의 화면 이름(분석 이벤트 category_name). 필터 "유형" 이름이 먼저, 없으면 디자인 상황 이름 */
export function searchCategoryLabel(value: ProductCategoryType): string {
  return (
    MAP_LIST_CATEGORY_OPTIONS.find((option) => option.value === value)?.label ??
    OCCASION_LABEL[value] ??
    value
  );
}
