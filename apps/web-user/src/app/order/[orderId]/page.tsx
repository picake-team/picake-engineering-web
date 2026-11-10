"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Header from "@/apps/web-user/common/components/headers/Header";
import { PATHS } from "@/apps/web-user/common/constants/paths.constant";
import { Toast } from "@/apps/web-user/common/components/toast/Toast";
import { useOrderDetail } from "@/apps/web-user/features/order/hooks/queries/useOrderDetail";
import { OrderDetailView } from "@/apps/web-user/features/order/components/detail/OrderDetailView";
import {
  PendingToast,
  usePendingToastStore,
} from "@/apps/web-user/common/store/pending-toast.store";
import { trackEvent } from "@/apps/web-user/common/utils/analytics.util";
import type { ReservationDetailEntryPoint } from "@/apps/web-user/common/types/analytics.type";

const RESERVATION_DETAIL_ENTRY_POINTS: ReservationDetailEntryPoint[] = [
  "mypage_card",
  "reservation_list",
  "payment_alarm",
  "reservation_complete",
];

export default function OrderDetailPage() {
  const params = useParams<{ orderId: string }>();
  const orderId = params?.orderId ?? "";
  const searchParams = useSearchParams();
  const entryPointParam = searchParams.get("entry_point");
  const entryPoint: ReservationDetailEntryPoint = RESERVATION_DETAIL_ENTRY_POINTS.includes(
    entryPointParam as ReservationDetailEntryPoint,
  )
    ? (entryPointParam as ReservationDetailEntryPoint)
    : "reservation_list";
  const { data: order, isLoading } = useOrderDetail(orderId);

  const consumePendingToast = usePendingToastStore((s) => s.consumePendingToast);
  const [toast, setToast] = useState<PendingToast | null>(null);

  useEffect(() => {
    const pending = consumePendingToast();
    if (pending) setToast(pending);
  }, [consumePendingToast]);

  // 예약 상세 페이지 노출
  useEffect(() => {
    if (!order) return;
    trackEvent("view_reservation_detail", {
      reservation_id: order.id,
      status: order.orderStatus,
      entry_point: entryPoint,
    });
  }, [order?.id, order?.orderStatus, entryPoint]);

  return (
    <div>
      <Header variant="back-title" title="예약 상세" backFallbackPath={PATHS.MY_ORDERS} />
      {isLoading ? (
        <div className="px-5 py-8 space-y-4 animate-pulse">
          <div className="h-5 w-40 bg-gray-100 rounded" />
          <div className="h-6 w-56 bg-gray-100 rounded" />
          <div className="h-[72px] w-full bg-gray-50 rounded" />
          <div className="h-[72px] w-full bg-gray-50 rounded" />
        </div>
      ) : order ? (
        <OrderDetailView order={order} />
      ) : (
        <p className="px-5 py-10 text-sm text-gray-500 text-center">
          예약 정보를 불러오지 못했어요.
        </p>
      )}

      {toast && (
        <Toast
          message={toast.message}
          iconName={toast.iconName}
          iconClassName={toast.iconClassName}
          variant={toast.variant ?? "column"}
          position={toast.position ?? "bottom"}
          duration={toast.duration ?? 2000}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
