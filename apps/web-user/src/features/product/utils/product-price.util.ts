/** salePrice < originalPrice 이면 할인 중 */
export function isProductOnSale(originalPrice: number, salePrice: number): boolean {
  return salePrice < originalPrice;
}

/** 할인율(0~100). 할인 없으면 null */
export function getProductDiscountRate(originalPrice: number, salePrice: number): number | null {
  if (!isProductOnSale(originalPrice, salePrice)) {
    return null;
  }

  return Math.round((1 - salePrice / originalPrice) * 100);
}

/**
 * 가격 뒤 물결(~)을 붙일지(운영자 2026-11-19, 기획 I-01).
 * - 견적 받기 상품: 늘 붙인다(값은 사장님이 디자인을 보고 정함)
 * - 보이는 크기·옵션에 추가금이 있으면 붙인다(가장 작은 크기 값이 판매가)
 * - 추가금이 없으면 딱 그 값이라 뺀다
 * 옛 서버 응답(hasExtraPrice 없음)은 지금처럼 붙인다.
 */
export function showsFromPrice(product: {
  orderMethod?: "RESERVATION" | "QUOTE";
  hasExtraPrice?: boolean;
}): boolean {
  if (product.orderMethod === "QUOTE") return true;
  return product.hasExtraPrice !== false;
}

/** "35,000원~" 또는 "35,000원" */
export function formatProductPrice(product: {
  salePrice: number;
  orderMethod?: "RESERVATION" | "QUOTE";
  hasExtraPrice?: boolean;
}): string {
  return `${product.salePrice.toLocaleString()}원${showsFromPrice(product) ? "~" : ""}`;
}
