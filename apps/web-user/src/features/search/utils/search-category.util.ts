import { PATHS } from "@/apps/web-user/common/constants/paths.constant";
import { ProductCategoryType } from "@/apps/web-user/features/product/types/product.type";
import {
  LEGACY_PRODUCT_CATEGORY,
  PRODUCT_CATEGORY_LABEL,
} from "@/apps/web-user/features/product/constants/product-category.constant";
// 없앤 값(VINTAGE 등)은 PRODUCT_CATEGORY_LABEL에 없어 아래에서 걸러진다
import { MAP_LIST_SIZE_OPTIONS } from "@/apps/web-user/features/store/constants/map.constant";

/** 검색 화면 주소의 카테고리 값 이름 (`/search?category=BIRTHDAY`, 홈 카테고리·어떤 날·해시태그에서 들어올 때) */
export const SEARCH_CATEGORY_PARAM = "category";
/** 검색 화면 주소의 사이즈 값 이름 (`/search?size=도시락`, 홈 도시락·미니 칸에서 들어올 때) */
export const SEARCH_SIZE_PARAM = "size";

/**
 * 주소의 카테고리 값을 읽는다(상품·스토어·디자인 탭 같은 값). 11-15 전 값(LOVER 등)은 새 값으로 바꿔 읽고,
 * 모르는 값이면 없는 것으로 본다.
 */
export function readSearchCategory(
  value: string | null | undefined,
): ProductCategoryType | undefined {
  if (!value) return undefined;
  const mapped = Object.prototype.hasOwnProperty.call(LEGACY_PRODUCT_CATEGORY, value)
    ? LEGACY_PRODUCT_CATEGORY[value]
    : value;
  // in 대신 자기 키만 본다("constructor" 같은 값이 통과하지 않게)
  if (!Object.prototype.hasOwnProperty.call(PRODUCT_CATEGORY_LABEL, mapped)) return undefined;
  return mapped as ProductCategoryType;
}

/** 주소의 사이즈 값을 읽는다. 필터 사이즈(도시락·미니·1~3호)에 있는 값만 */
export function readSearchSize(value: string | null | undefined): string | undefined {
  return value && MAP_LIST_SIZE_OPTIONS.includes(value) ? value : undefined;
}

/** 카테고리 값의 화면 이름(분석 이벤트 category_name) */
export function searchCategoryLabel(value: ProductCategoryType): string {
  return PRODUCT_CATEGORY_LABEL[value] ?? value;
}

/** 이 카테고리로 좁힌 검색 결과 주소. 검색 화면이 category 값을 필터에 넣는다 */
export function buildCategorySearchHref(category: ProductCategoryType, tab?: "design"): string {
  return `${PATHS.SEARCH}?${tab ? `tab=${tab}&` : ""}${SEARCH_CATEGORY_PARAM}=${category}`;
}

/** 이 사이즈로 좁힌 검색 결과 주소(도시락·미니) */
export function buildSizeSearchHref(size: string): string {
  return `${PATHS.SEARCH}?${SEARCH_SIZE_PARAM}=${encodeURIComponent(size)}`;
}
