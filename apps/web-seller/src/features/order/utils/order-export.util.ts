/**
 * 주문·매출 엑셀 내려받기(PC에만, 기획 I-54, 운영자 결정 2026-11-19).
 * 기간(픽업 날)의 Picake 주문과 직접 적은 주문(기획 I-42)을 한 표로. 장부·세금 신고용이라 금액·상태를 꼭 넣고,
 * 손님 휴대폰 번호는 넣지 않는다(장부에 필요 없음, 파일로 퍼지지 않게). 예약자 이름은 주문을 알아보려고 넣는다.
 *
 * 엑셀이 한글을 깨뜨리지 않게 UTF-8 BOM을 붙인 CSV로 만든다(엑셀·구글 시트·Numbers 모두 열림).
 */
import { addDaysToKey, kstDateKey, kstTime } from "@/apps/web-seller/common/utils/kst-date.util";
import {
  OrderStatus,
  type OrderResponseDto,
} from "@/apps/web-seller/features/order/types/order.dto";
import type { ManualOrderDto } from "@/apps/web-seller/features/manual-order/types/manual-order.dto";
import { MANUAL_ORDER_SOURCE_LABEL } from "@/apps/web-seller/features/manual-order/constants/manual-order.constant";
import { orderItemsDetailText } from "@/apps/web-seller/features/order/utils/order-item-text.util";
import { getOrderStatusLabel } from "@/apps/web-seller/features/order/utils/order-status-ui.util";

export const EXPORT_COLUMNS = [
  "받은 곳",
  "주문번호",
  "주문받은 날",
  "픽업 날",
  "픽업 시각",
  "상태",
  "상품",
  "사이즈·옵션",
  "수량",
  "금액",
  "매출",
  "예약자",
] as const;

type Row = Record<(typeof EXPORT_COLUMNS)[number], string | number>;

/** CSV 칸 하나: 쉼표·따옴표·줄바꿈이 있으면 따옴표로 감싸고, 수식으로 읽히는 첫 글자(= + - @)는 막는다 */
export function csvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return String(value);
  let s = value;
  // 엑셀이 셀을 수식으로 실행하지 않게(CSV 주입 방지)
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  if (/[",\n\r]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

function orderRow(o: OrderResponseDto): Row {
  return {
    "받은 곳": "Picake",
    주문번호: o.orderNumber,
    "주문받은 날": kstDateKey(o.createdAt),
    "픽업 날": kstDateKey(o.pickupDate),
    "픽업 시각": kstTime(o.pickupDate),
    상태: getOrderStatusLabel(o.orderStatus),
    상품: o.productName,
    "사이즈·옵션": orderItemsDetailText(o),
    수량: o.totalQuantity,
    금액: o.totalPrice,
    // 앱 매출과 같은 기준: Picake 주문은 픽업 완료만(취소·노쇼·예약신청은 0) — 이 칸을 더하면 매출
    매출: o.orderStatus === OrderStatus.PICKUP_COMPLETED ? o.totalPrice : 0,
    예약자: o.reservationContactName?.trim() || "",
  };
}

function manualRow(m: ManualOrderDto): Row {
  return {
    "받은 곳": `직접 적음(${MANUAL_ORDER_SOURCE_LABEL[m.source]})`,
    주문번호: "",
    "주문받은 날": kstDateKey(m.createdAt),
    "픽업 날": m.pickupDate,
    "픽업 시각": m.pickupTime ?? "",
    상태: m.paid === false ? "입금 전" : m.paid === true ? "입금 받음" : "",
    상품: m.cakeName,
    "사이즈·옵션": m.lettering?.trim() ? `레터링 "${m.lettering.trim()}"` : "",
    수량: 1,
    금액: m.price ?? "",
    // 직접 적은 주문은 매출에 넣는다(통계·홈 이번 주 매출과 같음)
    매출: m.price ?? 0,
    예약자: m.customerName?.trim() || "",
  };
}

/** 픽업 날·시각 순 표(맨 위 이름 줄 포함) */
export function buildOrdersCsv(orders: OrderResponseDto[], manuals: ManualOrderDto[]): string {
  // 쪽을 넘겨 받는 사이 새 주문이 들어오면 같은 주문이 두 번 올 수 있어 id로 한 번만
  const uniqueOrders = [...new Map(orders.map((o) => [o.id, o])).values()];
  const uniqueManuals = [...new Map(manuals.map((m) => [m.id, m])).values()];
  const rows = [...uniqueOrders.map(orderRow), ...uniqueManuals.map(manualRow)].sort((a, b) => {
    const ka = `${a["픽업 날"]} ${a["픽업 시각"] || "99:99"}`;
    const kb = `${b["픽업 날"]} ${b["픽업 시각"] || "99:99"}`;
    return ka < kb ? -1 : ka > kb ? 1 : 0;
  });
  const lines = [
    EXPORT_COLUMNS.map(csvCell).join(","),
    ...rows.map((r) => EXPORT_COLUMNS.map((c) => csvCell(r[c])).join(",")),
  ];
  return lines.join("\r\n");
}

/**
 * 기간을 maxDays일 이하 조각으로 나눈다(양 끝 포함). 직접 적은 주문 목록은 서버가 한 번에 62일까지만 준다 —
 * "최근 3개월"(90일 안팎)을 한 번에 물으면 거절돼 엑셀에서 빠졌다(11-19 검토)
 */
export function splitDateRange(
  startKey: string,
  endKey: string,
  maxDays: number,
): { start: string; end: string }[] {
  const out: { start: string; end: string }[] = [];
  let s = startKey;
  while (s <= endKey) {
    const last = addDaysToKey(s, maxDays - 1);
    const e = last < endKey ? last : endKey;
    out.push({ start: s, end: e });
    s = addDaysToKey(e, 1);
  }
  return out;
}

/** 파일 이름: "주문_달콤스토어_2026-11-01_2026-11-30.csv" (파일 이름에 못 쓰는 글자는 뺀다) */
export function exportFileName(storeName: string, startKey: string, endKey: string): string {
  const safe = storeName.replace(/[\\/:*?"<>|]/g, "").trim() || "스토어";
  return `주문_${safe}_${startKey}_${endKey}.csv`;
}

/** 브라우저에서 파일로 내려받는다(엑셀용 BOM 포함) */
export function downloadCsv(fileName: string, csv: string): void {
  const blob = new Blob(["﻿", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
