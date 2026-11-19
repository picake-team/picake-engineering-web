/** 상품 등록 중 손님 화면 미리보기 계산(PC에만, 기획 I-54) */
import { EnableStatus } from "@/apps/web-seller/features/product/types/product.dto";

/** 상세 설명(편집기 HTML)을 글자만 */
export function descriptionText(html: string | undefined): string {
  if (!html) return "";
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return (doc.body.textContent ?? "").replace(/\s+\n/g, "\n").trim();
  } catch {
    return html.replace(/<[^>]+>/g, " ").trim();
  }
}

/** 할인율(%) — 할인하지 않으면 0 */
export function discountRate(original?: number, sale?: number): number {
  if (!original || !sale || sale >= original) return 0;
  return Math.round(((original - sale) / original) * 100);
}

type PricePreviewSource = {
  orderMethod?: "RESERVATION" | "QUOTE";
  cakeSizeOptions?: { visible: EnableStatus; price: number }[];
  customOptions?: {
    visible: EnableStatus;
    choices?: { visible: EnableStatus; price: number }[];
  }[];
};

/**
 * 손님 화면 가격 뒤 물결(~)(기획 I-01, 운영자 2026-11-19). 서버 `productHasExtraPrice`·손님 웹 `showsFromPrice`와 같은 규칙:
 * 견적 받기 상품은 늘, 아니면 보이는 사이즈에 추가금이 있거나 보이는 옵션의 보이는 선택지에 추가금이 있을 때만.
 */
export function showsFromPrice(form: PricePreviewSource): boolean {
  if (form.orderMethod === "QUOTE") return true;
  const sizeExtra = (form.cakeSizeOptions ?? []).some(
    (s) => s.visible === EnableStatus.ENABLE && s.price > 0,
  );
  if (sizeExtra) return true;
  return (form.customOptions ?? []).some(
    (o) =>
      o.visible === EnableStatus.ENABLE &&
      (o.choices ?? []).some((c) => c.visible === EnableStatus.ENABLE && c.price > 0),
  );
}

/** 손님 화면 아래 버튼 글(손님 웹 상품 화면과 같음) */
export function customerButtonLabel(form: {
  orderMethod?: "RESERVATION" | "QUOTE";
  salesStatus?: EnableStatus;
}): string {
  if (form.salesStatus === EnableStatus.DISABLE) return "판매중지된 상품이에요";
  return form.orderMethod === "QUOTE" ? "이 디자인으로 견적 받기" : "예약신청";
}
