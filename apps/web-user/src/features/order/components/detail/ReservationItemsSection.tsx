import Link from "next/link";
import {
  OrderItemResponse,
  OrderResponse,
  OrderStatus,
} from "@/apps/web-user/features/order/types/order.type";
import { PATHS } from "@/apps/web-user/common/constants/paths.constant";
import { OrderDetailSectionTitle } from "./OrderDetailSectionTitle";
import { ReservationItemCard } from "./ReservationItemCard";
import { trackEvent } from "@/apps/web-user/common/utils/analytics.util";
import { QuoteOrderCard } from "./QuoteOrderCard";

interface ReservationItemsSectionProps {
  order: OrderResponse;
  onChangeOptions?: (item: OrderItemResponse) => void;
}

const PRE_PAYMENT_CANCELLABLE_STATUSES: OrderStatus[] = [
  OrderStatus.RESERVATION_REQUESTED,
  OrderStatus.PAYMENT_PENDING,
];

const POST_PAYMENT_CANCELLABLE_STATUSES: OrderStatus[] = [
  OrderStatus.PAYMENT_COMPLETED,
  OrderStatus.CONFIRMED,
];

export function ReservationItemsSection({ order, onChangeOptions }: ReservationItemsSectionProps) {
  const isPrePaymentCancellable = PRE_PAYMENT_CANCELLABLE_STATUSES.includes(order.orderStatus);
  const isPostPaymentCancellable = POST_PAYMENT_CANCELLABLE_STATUSES.includes(order.orderStatus);
  const canCancel = isPrePaymentCancellable || isPostPaymentCancellable;

  const renderCancelControl = () => {
    if (!canCancel) return undefined;
    // 결제 전(즉시 취소) / 결제 후(환불 요청) 모두 동일한 /cancel 페이지로 진입,
    // 페이지 내부에서 주문 상태 보고 1단계 폼 분기 처리
    return (
      <Link
        href={PATHS.ORDER.CANCEL(order.id)}
        onClick={() => trackEvent("engage_cancel_reservation", { reservation_id: order.id })}
        className="text-xs text-gray-500 font-bold underline"
      >
        예약취소
      </Link>
    );
  };

  return (
    <section className="px-5">
      <OrderDetailSectionTitle right={renderCancelControl()}>예약 상품</OrderDetailSectionTitle>
      {order.quote && <QuoteOrderCard order={order} />}
      <div className="space-y-3">
        {order.orderItems.map((item) => (
          <ReservationItemCard
            key={item.id}
            order={order}
            item={item}
            onChangeOptions={onChangeOptions}
          />
        ))}
      </div>
    </section>
  );
}
