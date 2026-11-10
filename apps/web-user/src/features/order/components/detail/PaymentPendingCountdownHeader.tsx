"use client";

import { OrderResponse } from "@/apps/web-user/features/order/types/order.type";
import { usePaymentCountdown } from "@/apps/web-user/features/order/hooks/usePaymentCountdown";

interface PaymentPendingCountdownHeaderProps {
  order: OrderResponse;
}

export function PaymentPendingCountdownHeader({ order }: PaymentPendingCountdownHeaderProps) {
  const { text: countdown } = usePaymentCountdown(order);

  return (
    <div className="flex items-center justify-between px-5 py-2.5 bg-blue-50">
      <div className="flex flex-col gap-0.5">
        <p className="text-sm font-bold text-blue-400">입금 대기 중</p>
        <p className="text-2xs text-blue-300">시간 안에 입금하지 않으면 예약이 취소돼요.</p>
      </div>
      <span className="text-lg font-bold text-blue-400">{countdown}</span>
    </div>
  );
}
