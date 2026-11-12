import { ProductCategoryType } from "@/apps/web-user/features/product/types/product.type";
import { MAP_LIST_CATEGORY_OPTIONS } from "@/apps/web-user/features/store/constants/map.constant";

/** 검색 화면 주소의 카테고리 값 이름 (`/search?category=BIRTHDAY`, 홈 카테고리에서 들어올 때) */
export const SEARCH_CATEGORY_PARAM = "category";

const SELECTABLE = new Set<string>(MAP_LIST_CATEGORY_OPTIONS.map((option) => option.value));

/**
 * 주소의 카테고리 값을 읽는다. 필터 "유형"에 있는 값만 받는다 —
 * 모르는 값이나 필터에서 뺀 값(커스텀)이면 없는 것으로 본다.
 */
export function readSearchCategory(
  value: string | null | undefined,
): ProductCategoryType | undefined {
  if (!value || !SELECTABLE.has(value)) return undefined;
  return value as ProductCategoryType;
}
