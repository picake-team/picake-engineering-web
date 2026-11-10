"use client";

import { useParams } from "next/navigation";
import Header from "@/apps/web-user/common/components/headers/Header";
import { PATHS } from "@/apps/web-user/common/constants/paths.constant";
import { useOrderDetail } from "@/apps/web-user/features/order/hooks/queries/useOrderDetail";
import { OrderResponse, OrderStatus } from "@/apps/web-user/features/order/types/order.type";
import { ReservationItemCard } from "@/apps/web-user/features/order/components/detail/ReservationItemCard";
import { OrderStatusBadge } from "@/apps/web-user/features/order/components/OrderStatusBadge";

function formatCancelDateTime(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");
  const period = hours >= 12 ? "오후" : "오전";
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${year}.${month}.${day} · ${period} ${displayHours}:${minutes}:${seconds}`;
}

function maskAccountNumber(num: string | null | undefined): string {
  if (!num) return "-";
  if (num.length <= 4) return num;
  return num.slice(0, 4) + "*".repeat(num.length - 4);
}

export default function CancelDetailPage() {
  const params = useParams<{ orderId: string }>();
  const orderId = params?.orderId ?? "";
  const { data: order, isLoading } = useOrderDetail(orderId);

  return (
    <div className="pb-10">
      <Header
        variant="back-title"
        title="취소상세"
        backFallbackPath={PATHS.ORDER.DETAIL(orderId)}
      />
      {isLoading ? (
        <div className="px-5 py-8 space-y-4 animate-pulse">
          <div className="h-5 w-24 bg-gray-100 rounded" />
          <div className="h-[120px] w-full bg-gray-50 rounded" />
          <div className="h-5 w-24 bg-gray-100 rounded mt-6" />
          <div className="h-6 w-56 bg-gray-100 rounded" />
        </div>
      ) : order ? (
        <CancelDetailView order={order} />
      ) : (
        <p className="px-5 py-10 text-sm text-gray-500 text-center">
          예약 정보를 불러오지 못했어요.
        </p>
      )}
    </div>
  );
}

function CancelDetailView({ order }: { order: OrderResponse }) {
  const hasRefundInfo =
    order.orderStatus === OrderStatus.CANCEL_REFUND_PENDING ||
    order.orderStatus === OrderStatus.CANCEL_REFUND_COMPLETED ||
    !!order.refundBankName;

  const cancelReason = order.refundRequestReason || order.userCancelReason || "-";

  return (
    <>
      <section className="px-5 pt-5 pb-10">
        <h2 className="text-lg font-bold text-gray-900 mb-1 py-2.5">취소 상품</h2>
        <div className="flex flex-col gap-3">
          {order.orderItems.map((item) => (
            <ReservationItemCard key={item.id} order={order} item={item} hideCancelDetailButton />
          ))}
        </div>
      </section>

      <section className="px-5 mb-10">
        <h2 className="text-lg font-bold text-gray-900 mb-1 py-2.5">취소 정보</h2>
        <dl className="text-sm space-y-2">
          <div className="flex gap-10">
            <dt className="w-[70px] text-gray-500 shrink-0">신청 일시</dt>
            <dd className="text-gray-900">{formatCancelDateTime(order.updatedAt)}</dd>
          </div>
          <div className="flex gap-10">
            <dt className="w-[70px] text-gray-500 shrink-0">취소 사유</dt>
            <dd className="text-gray-900">{cancelReason}</dd>
          </div>
        </dl>
      </section>

      {hasRefundInfo && (
        <section className="px-5">
          <h2 className="text-lg font-bold text-gray-900 mb-1 py-2.5">환불 정보</h2>
          <dl className="text-sm space-y-2">
            <div className="flex gap-10">
              <dt className="w-[70px] text-gray-500 shrink-0">총 결제금액</dt>
              <dd className="text-gray-900">{order.totalPrice.toLocaleString()}원</dd>
            </div>
            <div className="flex items-center gap-10">
              <dt className="w-[70px] text-gray-500 shrink-0">총 환불금액</dt>
              <dd className="flex items-center gap-2">
                <span className="font-bold text-gray-900">
                  {order.totalPrice.toLocaleString()}원
                </span>
                <OrderStatusBadge status={order.orderStatus} />
              </dd>
            </div>
            <hr className="my-3 border-gray-100" />
            <div className="flex gap-10">
              <dt className="w-[70px] text-gray-500 shrink-0">환불 계좌</dt>
              <dd className="text-gray-900">
                {maskAccountNumber(order.refundBankAccountNumber)}
                {order.refundBankName ? ` (${order.refundBankName})` : ""}
              </dd>
            </div>
            <div className="flex gap-10">
              <dt className="w-[70px] text-gray-500 shrink-0">예금주명</dt>
              <dd className="text-gray-900">{order.refundAccountHolderName ?? "-"}</dd>
            </div>
          </dl>
        </section>
      )}
    </>
  );
}
