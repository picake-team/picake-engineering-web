import React from "react";
import type { OrderResponseDto } from "@/apps/web-seller/features/order/types/order.dto";
import { OrderStatus } from "@/apps/web-seller/features/order/types/order.dto";
import {
  getOrderStatusBadgeVariant,
  getOrderStatusLabel,
} from "@/apps/web-seller/features/order/utils/order-status-ui.util";
import { StatusBadge } from "@/apps/web-seller/common/components/badges/StatusBadge";
import { cn } from "@/apps/web-seller/common/utils/classname.util";
import {
  ORDER_DETAIL_MONO,
  ORDER_DETAIL_MUTED,
  ORDER_DETAIL_SHEET,
  ORDER_DETAIL_SHEET_HEADER,
  ORDER_DETAIL_SHEET_TITLE,
  ORDER_DETAIL_TD_CELL,
  ORDER_DETAIL_TH_COL,
} from "@/apps/web-seller/features/order/constants/order-detail-page.constant";
import {
  SheetKvRow,
  SheetSectionRow,
  SheetTable,
} from "@/apps/web-seller/features/order/components/detail/OrderDetailSheetTable";

type NotesRow = { key: string; value: string };

function buildNotesRows(order: OrderResponseDto): NotesRow[] {
  const rows: NotesRow[] = [];
  // 자동 만료 취소는 고객·판매자 취소 사유가 모두 비어 있어 레코드만으로는 구분되지 않습니다.
  // 실제로 입금했으나 완료 처리를 못 한 고객일 수 있어, 사유 목록 맨 위에 명시합니다.
  if (order.paymentPendingExpiredAt) {
    rows.push({
      key: "취소 경위",
      value: `입금 기한 만료로 자동 취소됨 (${new Date(order.paymentPendingExpiredAt).toLocaleString("ko-KR")}) — 고객이 입금했는지 통장 내역 확인이 필요할 수 있습니다`,
    });
  }
  if (order.userCancelReason) {
    rows.push({ key: "고객 입금 전 취소 사유", value: order.userCancelReason });
  }
  if (order.sellerCancelReason) {
    rows.push({ key: "판매자 예약 취소 사유", value: order.sellerCancelReason });
  }
  if (order.sellerNoShowReason) {
    rows.push({ key: "노쇼 사유", value: order.sellerNoShowReason });
  }
  if (order.refundRequestReason) {
    rows.push({ key: "고객 취소·환불 요청 사유", value: order.refundRequestReason });
  }
  if (order.sellerCancelRefundPendingReason) {
    rows.push({
      key: "판매자 취소환불대기 전환 사유",
      value: order.sellerCancelRefundPendingReason,
    });
  }
  if (order.refundBankName || order.refundBankAccountNumber || order.refundAccountHolderName) {
    rows.push({
      key: "환불 계좌 (고객 요청 시)",
      value: [order.refundBankName, order.refundBankAccountNumber, order.refundAccountHolderName]
        .filter(Boolean)
        .join(" · "),
    });
  }
  return rows;
}

function formatSizeLine(item: OrderResponseDto["orderItems"][number]): string {
  if (!item.sizeDisplayName) return "—";
  let s = item.sizeDisplayName;
  if (item.sizeLengthCm) s += ` (${item.sizeLengthCm}cm)`;
  if (item.sizeDescription) s += ` — ${item.sizeDescription}`;
  if (item.sizePrice && item.sizePrice > 0) s += ` (+${item.sizePrice.toLocaleString()}원)`;
  return s;
}

function formatFlavorLine(item: OrderResponseDto["orderItems"][number]): string {
  if (!item.flavorDisplayName) return "—";
  let s = item.flavorDisplayName;
  if (item.flavorPrice && item.flavorPrice > 0) s += ` (+${item.flavorPrice.toLocaleString()}원)`;
  return s;
}

/** 추가 옵션 값 한 줄 (선택형: 옵션값·옵션가, 직접입력형: 입력 문구) */
function formatSelectedOptionValue(
  option: OrderResponseDto["orderItems"][number]["selectedOptions"][number],
): string {
  if (option.type === "TEXT") return option.text ?? "—";
  return (option.choices ?? [])
    .map((choice) =>
      choice.price > 0 ? `${choice.label} (+${choice.price.toLocaleString()}원)` : choice.label,
    )
    .join(", ");
}

export type OrderDetailSpreadsheetViewProps = {
  order: OrderResponseDto;
  onReferenceImageClick: (images: string[], index: number) => void;
};

export const OrderDetailSpreadsheetView: React.FC<OrderDetailSpreadsheetViewProps> = ({
  order,
  onReferenceImageClick,
}) => {
  const status = order.orderStatus;
  const variant = getOrderStatusBadgeVariant(status);
  const notesRows = buildNotesRows(order);
  const hasNotes = notesRows.length > 0;

  const pickupHint =
    status === OrderStatus.CONFIRMED || status === OrderStatus.PAYMENT_COMPLETED
      ? status === OrderStatus.PAYMENT_COMPLETED
        ? "고객 입금이 완료되었습니다. 예약 확정을 진행한 뒤, 픽업 예정 시각이 되면 상태가 자동으로 '픽업대기'로 바뀝니다."
        : "픽업 예정 시각이 되면 상태가 자동으로 '픽업대기'로 바뀝니다."
      : null;

  return (
    <div className="space-y-4">
      {/* 주문 항목 */}
      <div className={ORDER_DETAIL_SHEET}>
        <div className={ORDER_DETAIL_SHEET_HEADER}>
          <h2 className={ORDER_DETAIL_SHEET_TITLE}>주문 항목</h2>
        </div>
        <div className="overflow-x-auto">
          <SheetTable className="min-w-[800px]">
            <thead>
              <tr>
                <th className={ORDER_DETAIL_TH_COL}>#</th>
                <th className={ORDER_DETAIL_TH_COL}>사이즈</th>
                <th className={ORDER_DETAIL_TH_COL}>맛</th>
                <th className={cn(ORDER_DETAIL_TH_COL, "text-right")}>수량</th>
                <th className={cn(ORDER_DETAIL_TH_COL, "text-right")}>단가</th>
                <th className={cn(ORDER_DETAIL_TH_COL, "text-right")}>소계</th>
                <th className={ORDER_DETAIL_TH_COL}>추가 옵션</th>
                <th className={ORDER_DETAIL_TH_COL}>요청</th>
              </tr>
            </thead>
            <tbody>
              {order.orderItems.map((item, index) => {
                const lineTotal = item.itemPrice * item.quantity;
                return (
                  <tr key={item.id} className="even:bg-slate-50/40">
                    <td
                      className={cn(
                        ORDER_DETAIL_TD_CELL,
                        "text-center tabular-nums text-slate-500",
                      )}
                    >
                      {index + 1}
                    </td>
                    <td className={cn(ORDER_DETAIL_TD_CELL, "min-w-[120px] whitespace-pre-wrap")}>
                      {formatSizeLine(item)}
                    </td>
                    <td className={cn(ORDER_DETAIL_TD_CELL, "min-w-[100px] whitespace-pre-wrap")}>
                      {formatFlavorLine(item)}
                    </td>
                    <td className={cn(ORDER_DETAIL_TD_CELL, "text-right tabular-nums")}>
                      {item.quantity}
                    </td>
                    <td className={cn(ORDER_DETAIL_TD_CELL, "text-right tabular-nums")}>
                      {item.itemPrice.toLocaleString()}원
                    </td>
                    <td
                      className={cn(
                        ORDER_DETAIL_TD_CELL,
                        "text-right font-semibold tabular-nums text-slate-900",
                      )}
                    >
                      {lineTotal.toLocaleString()}원
                    </td>
                    <td className={cn(ORDER_DETAIL_TD_CELL, "min-w-[200px] max-w-[280px]")}>
                      {item.selectedOptions.length > 0 ? (
                        <ul className="space-y-1">
                          {item.selectedOptions.map((option) => (
                            <li key={option.optionId} className="whitespace-pre-wrap">
                              <span className="text-slate-500">{option.name}: </span>
                              {option.type === "IMAGE" ? (
                                <span className="mt-1 flex flex-wrap gap-1.5">
                                  {(option.imageUrls ?? []).map((url, idx) => (
                                    <button
                                      key={`${item.id}-${option.optionId}-img-${idx}`}
                                      type="button"
                                      onClick={() =>
                                        onReferenceImageClick(option.imageUrls ?? [], idx)
                                      }
                                      className="relative h-9 w-9 shrink-0 overflow-hidden rounded border border-slate-200 bg-slate-100 transition hover:border-primary hover:ring-1 hover:ring-primary/30 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
                                      aria-label={`${option.name} ${idx + 1} 크게 보기`}
                                    >
                                      <img
                                        src={url}
                                        alt=""
                                        className="h-full w-full object-cover"
                                      />
                                    </button>
                                  ))}
                                </span>
                              ) : (
                                formatSelectedOptionValue(option)
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className={ORDER_DETAIL_MUTED}>—</span>
                      )}
                    </td>
                    <td className={cn(ORDER_DETAIL_TD_CELL, "max-w-[200px] whitespace-pre-wrap")}>
                      {item.requestMessage?.trim() || "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </SheetTable>
        </div>
      </div>

      {/* 주문 기본 정보 */}
      <div className={ORDER_DETAIL_SHEET}>
        <div className={ORDER_DETAIL_SHEET_HEADER}>
          <h2 className={ORDER_DETAIL_SHEET_TITLE}>주문 정보</h2>
        </div>
        <div className="overflow-x-auto">
          <SheetTable>
            <tbody>
              <SheetSectionRow>픽업</SheetSectionRow>
              <SheetKvRow label="픽업일시">
                {order.pickupDate ? new Date(order.pickupDate).toLocaleString("ko-KR") : "—"}
              </SheetKvRow>
              <SheetKvRow label="픽업 주소">
                <div className="space-y-0.5 whitespace-pre-wrap">
                  <div>{order.pickupRoadAddress || order.pickupAddress || "—"}</div>
                  {order.pickupAddress && order.pickupRoadAddress && (
                    <div className="text-slate-500">{order.pickupAddress}</div>
                  )}
                  {order.pickupDetailAddress && (
                    <div className="text-slate-500">{order.pickupDetailAddress}</div>
                  )}
                </div>
              </SheetKvRow>

              <SheetSectionRow>예약자 연락</SheetSectionRow>
              <SheetKvRow label="입금자명">{order.depositorName?.trim() || "—"}</SheetKvRow>
              <SheetKvRow label="예약자명">
                {order.reservationContactName?.trim() || "—"}
              </SheetKvRow>
              <SheetKvRow label="연락처">{order.reservationPhone?.trim() || "—"}</SheetKvRow>

              <SheetSectionRow>기본</SheetSectionRow>
              <SheetKvRow label="상품명">{order.productName || "—"}</SheetKvRow>
              <SheetKvRow label="상품 이미지">
                {order.productImages && order.productImages.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {order.productImages.map((url, idx) => (
                      <button
                        key={`product-img-${idx}`}
                        type="button"
                        onClick={() => onReferenceImageClick(order.productImages, idx)}
                        className="relative h-14 w-14 shrink-0 overflow-hidden rounded border border-slate-200 bg-slate-100 transition hover:border-primary hover:ring-1 hover:ring-primary/30 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
                        aria-label={`상품 이미지 ${idx + 1} 크게 보기`}
                      >
                        <img src={url} alt="" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <span className={ORDER_DETAIL_MUTED}>—</span>
                )}
              </SheetKvRow>
              <SheetKvRow label="주문 번호">{order.orderNumber}</SheetKvRow>
              <SheetKvRow label="주문 상태">
                <StatusBadge variant={variant} className="text-xs font-semibold">
                  {getOrderStatusLabel(status)}
                </StatusBadge>
              </SheetKvRow>
              <SheetKvRow label="주문일시">
                {new Date(order.createdAt).toLocaleString("ko-KR")}
              </SheetKvRow>
              <SheetKvRow label="총 수량">{`${order.totalQuantity}개`}</SheetKvRow>
              <SheetKvRow label="총 금액">
                <span className="font-semibold text-primary">{`${order.totalPrice.toLocaleString()}원`}</span>
              </SheetKvRow>
            </tbody>
          </SheetTable>
        </div>
        {pickupHint && (
          <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-[13px] leading-relaxed text-slate-600">
            {pickupHint}
          </div>
        )}
      </div>

      {/* 취소·환불·사유 */}
      {hasNotes && (
        <div className={ORDER_DETAIL_SHEET}>
          <div className={ORDER_DETAIL_SHEET_HEADER}>
            <h2 className={ORDER_DETAIL_SHEET_TITLE}>취소·환불·사유</h2>
          </div>
          <div className="overflow-x-auto">
            <SheetTable>
              <thead>
                <tr>
                  <th className={cn(ORDER_DETAIL_TH_COL, "w-[min(28%,200px)]")}>구분</th>
                  <th className={ORDER_DETAIL_TH_COL}>내용</th>
                </tr>
              </thead>
              <tbody>
                {notesRows.map((row) => (
                  <tr key={row.key} className="even:bg-slate-50/40">
                    <td
                      className={cn(
                        ORDER_DETAIL_TD_CELL,
                        "bg-slate-50/90 font-medium text-slate-600",
                      )}
                    >
                      {row.key}
                    </td>
                    <td
                      className={cn(ORDER_DETAIL_TD_CELL, ORDER_DETAIL_MONO, "whitespace-pre-wrap")}
                    >
                      {row.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </SheetTable>
          </div>
        </div>
      )}
    </div>
  );
};
