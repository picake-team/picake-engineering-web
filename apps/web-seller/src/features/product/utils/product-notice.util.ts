import type { ProductResponseDto } from "@/apps/web-seller/features/product/types/product.dto";
import type { ProductForm } from "@/apps/web-seller/features/product/types/product.ui";

/** 상품정보제공고시 14개 항목 (화면 순서와 같음) */
export const PRODUCT_NOTICE_FIELDS = [
  { key: "productNoticeFoodType", label: "식품의 유형" },
  { key: "productNoticeProducer", label: "제조사" },
  { key: "productNoticeOrigin", label: "원산지" },
  { key: "productNoticeAddress", label: "소재지" },
  { key: "productNoticeManufactureDate", label: "제조연월일" },
  { key: "productNoticeExpirationDate", label: "소비기한 또는 품질유지기한" },
  { key: "productNoticePackageCapacity", label: "포장단위별 용량/수량" },
  { key: "productNoticePackageQuantity", label: "포장 단위별 수량" },
  { key: "productNoticeIngredients", label: "원재료명 및 함량" },
  { key: "productNoticeCalories", label: "영양성분" },
  { key: "productNoticeSafetyNotice", label: "소비자안전을 위한 주의사항" },
  { key: "productNoticeGmoNotice", label: "유전자변형식품에 해당하는 경우의 표시" },
  { key: "productNoticeImportNotice", label: "수입식품의 경우" },
  { key: "productNoticeCustomerService", label: "고객센터" },
] as const;

export type ProductNoticeKey = (typeof PRODUCT_NOTICE_FIELDS)[number]["key"];
export type ProductNoticeValues = Pick<ProductForm, ProductNoticeKey>;

/** 다른 상품의 고시 값을 새 값으로 꺼낸다 (원본 상품과 연결되지 않는 복사본) */
export function pickProductNotice(product: ProductResponseDto): ProductNoticeValues {
  return Object.fromEntries(
    PRODUCT_NOTICE_FIELDS.map(({ key }) => [key, (product[key] ?? "").toString()]),
  ) as ProductNoticeValues;
}

/** 고시 값이 하나라도 입력돼 있는지 */
export function hasAnyProductNotice(values: Partial<ProductNoticeValues>): boolean {
  return PRODUCT_NOTICE_FIELDS.some(({ key }) => (values[key] ?? "").toString().trim() !== "");
}
