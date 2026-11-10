"use client";

import { useParams } from "next/navigation";
import Header from "@/apps/web-user/common/components/headers/Header";
import { PATHS } from "@/apps/web-user/common/constants/paths.constant";
import { useOrderDetail } from "@/apps/web-user/features/order/hooks/queries/useOrderDetail";
import { OrderStatus } from "@/apps/web-user/features/order/types/order.type";
import { OrderCancelView } from "@/apps/web-user/features/order/components/cancel/OrderCancelView";

const POST_PAYMENT_STATUSES: OrderStatus[] = [OrderStatus.PAYMENT_COMPLETED, OrderStatus.CONFIRMED];

export default function OrderCancelPage() {
  const params = useParams<{ orderId: string }>();
  const orderId = params?.orderId ?? "";
  const { data: order, isLoading } = useOrderDetail(orderId);

  const isPostPayment = order ? POST_PAYMENT_STATUSES.includes(order.orderStatus) : false;
  const headerTitle = isPostPayment ? "예약취소 (1/2)" : "예약취소";

  return (
    <div>
      <Header
        variant="back-title"
        title={headerTitle}
        backFallbackPath={PATHS.ORDER.DETAIL(orderId)}
      />
      {isLoading ? (
        <div className="px-5 py-8 space-y-4 animate-pulse">
          <div className="h-5 w-40 bg-gray-100 rounded" />
          <div className="h-[96px] w-full bg-gray-50 rounded" />
          <div className="h-6 w-40 bg-gray-100 rounded" />
          <div className="h-6 w-56 bg-gray-100 rounded" />
        </div>
      ) : order ? (
        <OrderCancelView order={order} />
      ) : (
        <p className="px-5 py-10 text-sm text-gray-500 text-center">
          예약 정보를 불러오지 못했어요.
        </p>
      )}
    </div>
  );
}
