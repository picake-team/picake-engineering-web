/**
 * 주문 항목을 사람이 읽는 글로(주문 상세·PC 주문서 인쇄·엑셀이 같이 쓴다, 기획 I-54).
 * 같은 주문이 화면·종이·엑셀에서 같은 말로 보이게 한 곳에 둔다.
 */
import type {
  OrderItemResponseDto,
  OrderResponseDto,
} from "@/apps/web-seller/features/order/types/order.dto";
import { formatWon } from "@/apps/web-seller/common/utils/won.util";

/** 고르는 옵션 한 줄: "맛 초코 · 초 큰 초(+1,000원)" */
export function optionLine(item: OrderItemResponseDto): string | null {
  const parts: string[] = [];
  for (const o of item.selectedOptions ?? []) {
    if (o.type === "SINGLE_SELECT" || o.type === "MULTI_SELECT") {
      const labels = (o.choices ?? []).map((c) =>
        c.price > 0 ? `${c.label}(+${c.price.toLocaleString("ko-KR")}원)` : c.label,
      );
      if (labels.length) parts.push(`${o.name} ${labels.join(", ")}`);
    }
  }
  return parts.length ? parts.join(" · ") : null;
}

/** 사이즈 · 수량 · 옵션 뺀 금액 */
export function itemPriceLine(item: OrderItemResponseDto): string {
  const unitBeforeOptions = Math.max(0, item.itemPrice - (item.optionsPrice ?? 0));
  const parts = [
    item.sizeDisplayName?.trim(),
    `${item.quantity}개`,
    formatWon(unitBeforeOptions * item.quantity),
  ].filter(Boolean);
  return parts.join(" · ");
}

/** 손님이 올린 참고 사진(사진 옵션 + 항목 사진, 같은 주소는 한 번) */
export function referenceImages(item: OrderItemResponseDto): string[] {
  const urls = [
    ...(item.selectedOptions ?? []).reduce<string[]>(
      (acc, o) => (o.type === "IMAGE" ? acc.concat(o.imageUrls ?? []) : acc),
      [],
    ),
    ...(item.imageUrls ?? []),
  ];
  return Array.from(new Set(urls));
}

/** 손님이 적은 글 옵션(레터링 등). 옛 주문은 letteringMessage 하나 */
export function itemTexts(item: OrderItemResponseDto): { label: string; text: string }[] {
  const texts = (item.selectedOptions ?? [])
    .filter((o) => o.type === "TEXT" && o.text?.trim())
    .map((o) => ({ label: o.name, text: (o.text ?? "").trim() }));
  const legacy = item.letteringMessage?.trim();
  if (texts.length === 0 && legacy) return [{ label: "레터링", text: legacy }];
  return texts;
}

/** 엑셀·주문서 한 칸: 항목마다 "사이즈 · 수량 · 옵션 · 레터링" */
export function orderItemsDetailText(order: OrderResponseDto): string {
  return order.orderItems
    .map((item) => {
      const parts = [
        item.sizeDisplayName?.trim(),
        `${item.quantity}개`,
        optionLine(item),
        ...itemTexts(item).map((t) => `${t.label} "${t.text}"`),
      ].filter(Boolean);
      return parts.join(" · ");
    })
    .join(" / ");
}
