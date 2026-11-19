/**
 * 주문·매출 엑셀 내려받기(PC에만, 기획 I-54, 운영자 결정 2026-11-19).
 * 기간(픽업 날)의 Picake 주문과 직접 적은 주문(기획 I-42)을 한 표로. 장부·세금 신고용이라 금액·상태를 꼭 넣고,
 * 손님 휴대폰 번호는 넣지 않는다(장부에 필요 없음, 파일로 퍼지지 않게). 예약자 이름은 주문을 알아보려고 넣는다.
 *
 * 엑셀이 한글을 깨뜨리지 않게 UTF-8 BOM을 붙인 CSV로 만든다(엑셀·구글 시트·Numbers 모두 열림).
 */
import { kstDateKey, kstTime } from "@/apps/web-seller/common/utils/kst-date.util";
import type { OrderResponseDto } from "@/apps/web-seller/features/order/types/order.dto";
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
    예약자: m.customerName?.trim() || "",
  };
}

/** 픽업 날·시각 순 표(맨 위 이름 줄 포함) */
export function buildOrdersCsv(orders: OrderResponseDto[], manuals: ManualOrderDto[]): string {
  const rows = [...orders.map(orderRow), ...manuals.map(manualRow)].sort((a, b) => {
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
