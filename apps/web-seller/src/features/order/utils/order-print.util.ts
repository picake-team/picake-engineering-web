/**
 * 그날 주문서 묶음 인쇄(PC에만, 기획 I-54, 운영자 결정 2026-11-19).
 * 픽업 날 아침에 그날 주문을 한 번에 뽑아 주방에서 보며 만든다(스마트스토어 주문서 출력·Shopify 묶음 인쇄 근거).
 *
 * 한 주문 = 한 칸: 픽업 시각 · 케이크 · 사이즈·옵션 · 레터링(크게) · 요청 사항 · 참고 사진 · 예약자 · 주문번호.
 * 손님 휴대폰 번호는 뒷자리 4개만(픽업 때 손님을 알아보는 데 충분, 종이에 번호 전체를 남기지 않음).
 * 취소된 주문은 빼고(달력과 같은 기준), 직접 적은 주문(기획 I-42)도 같이 시각 순으로.
 */
import { ROUTES } from "@/apps/web-seller/common/constants/route-paths.constant";
import { kstTime } from "@/apps/web-seller/common/utils/kst-date.util";
import type { OrderResponseDto } from "@/apps/web-seller/features/order/types/order.dto";
import type { ManualOrderDto } from "@/apps/web-seller/features/manual-order/types/manual-order.dto";
import { MANUAL_ORDER_SOURCE_LABEL } from "@/apps/web-seller/features/manual-order/constants/manual-order.constant";
import {
  groupOrdersByPickupDay,
  mergeDayPickups,
} from "@/apps/web-seller/features/manual-order/utils/day-pickups.util";
import {
  itemTexts,
  optionLine,
  referenceImages,
} from "@/apps/web-seller/features/order/utils/order-item-text.util";
import { formatWon } from "@/apps/web-seller/features/order/utils/order-mobile.util";
import { getOrderStatusLabel } from "@/apps/web-seller/features/order/utils/order-status-ui.util";

export function printOrdersPath(storeId: string, dateKey: string): string {
  return `${ROUTES.STORE_DETAIL_PRINT_ORDERS(storeId)}?date=${dateKey}`;
}

export interface PrintSheet {
  key: string;
  /** "14:30", 직접 적은 주문에 시각이 없으면 "미정" */
  time: string;
  title: string;
  /** 사이즈·수량·옵션 줄(항목마다) */
  lines: string[];
  /** 레터링 등 손님이 적은 글(크게 인쇄) */
  texts: { label: string; text: string }[];
  request: string | null;
  photos: string[];
  customer: string;
  /** 상태(Picake 주문) 또는 받은 곳(직접 적은 주문) */
  tag: string;
  price: string | null;
  orderNumber: string | null;
  memo: string | null;
}

/** 휴대폰 번호는 뒷자리 4개만 */
export function phoneTail(phone: string | null | undefined): string | null {
  const digits = (phone ?? "").replace(/\D/g, "");
  return digits.length >= 4 ? digits.slice(-4) : null;
}

function orderSheet(order: OrderResponseDto): PrintSheet {
  const name = order.reservationContactName?.trim() || "예약자 미입력";
  const tail = phoneTail(order.reservationPhone);
  const photos =
    order.quote?.requestPhotoUrls?.length && !order.quote.contentHidden
      ? order.quote.requestPhotoUrls
      : order.orderItems.flatMap((item) => referenceImages(item));
  const request =
    [
      ...order.orderItems.map((item) => item.requestMessage?.trim()),
      order.quote?.description?.trim(),
      order.quote?.requestNote?.trim(),
    ]
      .filter(Boolean)
      .join("\n") || null;
  return {
    key: `order-${order.id}`,
    time: kstTime(order.pickupDate),
    title: order.productName,
    lines: order.orderItems.map((item) =>
      [item.sizeDisplayName?.trim(), `${item.quantity}개`, optionLine(item)]
        .filter(Boolean)
        .join(" · "),
    ),
    texts: order.orderItems.flatMap((item) => itemTexts(item)),
    request,
    photos: Array.from(new Set(photos)),
    customer: tail ? `${name} (${tail})` : name,
    tag: getOrderStatusLabel(order.orderStatus),
    price: formatWon(order.totalPrice),
    orderNumber: order.orderNumber,
    memo: order.quote?.memo?.trim() || null,
  };
}

function manualSheet(manual: ManualOrderDto): PrintSheet {
  return {
    key: `manual-${manual.id}`,
    time: manual.pickupTime ?? "미정",
    title: manual.cakeName,
    lines: [],
    texts: manual.lettering?.trim() ? [{ label: "레터링", text: manual.lettering.trim() }] : [],
    request: null,
    photos: manual.photoUrls ?? [],
    customer: manual.customerName?.trim() || "",
    tag: `직접 적음 · ${MANUAL_ORDER_SOURCE_LABEL[manual.source]}`,
    price: manual.price != null ? formatWon(manual.price) : null,
    orderNumber: null,
    memo: manual.memo?.trim() || null,
  };
}

/** 그날 주문서(시각 순, 취소 빼고). orders는 그날 픽업 Picake 주문, manuals는 그날 직접 적은 주문 */
export function buildPrintSheets(
  dateKey: string,
  orders: OrderResponseDto[],
  manuals: ManualOrderDto[],
): PrintSheet[] {
  const dayOrders = groupOrdersByPickupDay(orders)[dateKey] ?? [];
  const dayManuals = manuals.filter((m) => m.pickupDate === dateKey);
  return mergeDayPickups(dayOrders, dayManuals).map((p) =>
    p.kind === "order" ? orderSheet(p.order) : manualSheet(p.manual),
  );
}
