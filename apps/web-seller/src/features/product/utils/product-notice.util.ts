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

/**
 * 받을 고시 항목 (2026-11 법 검토로 원산지만).
 * - 동네 가게가 근처 손님에게 파는 음식료는 전자상거래법 제3조 ④로 상품정보제공 고시(제13조)가 적용되지 않는다.
 * - 원산지는 원산지표시법에 따라 통신판매에서도 표시해야 해서 남긴다.
 * 14개를 다시 받으려면 "ALL"로 바꾼다(화면·검증·고시 복사가 함께 돌아온다. 서버는 원산지만 필수).
 */
export const PRODUCT_NOTICE_MODE = "ORIGIN_ONLY" as "ORIGIN_ONLY" | "ALL";

/** 저장할 때 꼭 채워야 하는 고시 항목 */
export const REQUIRED_PRODUCT_NOTICE_KEYS: readonly ProductNoticeKey[] =
  PRODUCT_NOTICE_MODE === "ALL"
    ? PRODUCT_NOTICE_FIELDS.map(({ key }) => key)
    : ["productNoticeOrigin"];
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
