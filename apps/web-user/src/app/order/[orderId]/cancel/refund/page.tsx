"use client";

import { useParams } from "next/navigation";
import Header from "@/apps/web-user/common/components/headers/Header";
import { PATHS } from "@/apps/web-user/common/constants/paths.constant";
import { useOrderDetail } from "@/apps/web-user/features/order/hooks/queries/useOrderDetail";
import { RefundRequestView } from "@/apps/web-user/features/order/components/cancel/RefundRequestView";

export default function OrderCancelRefundPage() {
  const params = useParams<{ orderId: string }>();
  const orderId = params?.orderId ?? "";
  const { data: order, isLoading } = useOrderDetail(orderId);

  return (
    <div>
      <Header
        variant="back-title"
        title="예약취소 (2/2)"
        backFallbackPath={PATHS.ORDER.CANCEL(orderId)}
      />
      {isLoading ? (
        <div className="px-5 py-8 space-y-4 animate-pulse">
          <div className="h-5 w-40 bg-gray-100 rounded" />
          <div className="h-[42px] w-full bg-gray-50 rounded" />
          <div className="h-[42px] w-full bg-gray-50 rounded" />
          <div className="h-[42px] w-full bg-gray-50 rounded" />
        </div>
      ) : order ? (
        <RefundRequestView order={order} />
      ) : (
        <p className="px-5 py-10 text-sm text-gray-500 text-center">
          예약 정보를 불러오지 못했어요.
        </p>
      )}
    </div>
  );
}
