"use client";

import Link from "next/link";
import { Icon } from "@/apps/web-user/common/components/icons";
import { PATHS } from "@/apps/web-user/common/constants/paths.constant";
import { OrderResponse, OrderStatus } from "@/apps/web-user/features/order/types/order.type";
import { OrderActionButtons } from "@/apps/web-user/features/mypage/order/components/OrderActionButtons";
import { OrderDetailSectionTitle } from "./OrderDetailSectionTitle";

// 버튼 자체를 숨기는 상태

function formatPickupDateTime(iso: string) {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const day = days[d.getDay()];
  const h = d.getHours();
  const ampm = h < 12 ? "오전" : "오후";
  const h12 = ((h + 11) % 12) + 1;
  const min = String(d.getMinutes()).padStart(2, "0");
  const timePart = min === "00" ? `${h12}시` : `${h12}:${min}`;
  return `${yyyy}.${mm}.${dd}(${day}) · ${ampm} ${timePart}`;
}

interface ReservationInfoSectionProps {
  order: OrderResponse;
  onInquiryClick: () => void;
  onMapClick: () => void;
  onChangePickupDate: () => void;
}

export function ReservationInfoSection({
  order,
  onInquiryClick,
  onMapClick,
  onChangePickupDate,
}: ReservationInfoSectionProps) {
  const showChangePickup = order.orderStatus === OrderStatus.RESERVATION_REQUESTED;

  return (
    <section className="px-5">
      <OrderDetailSectionTitle>예약 정보</OrderDetailSectionTitle>
      <dl className="space-y-2">
        <div className="flex items-center gap-10 pb-3 border-b border-gray-50">
          <dt className="w-[70px] text-sm text-gray-500 shrink-0">예약번호</dt>
          <dd className="text-sm text-gray-900">{order.orderNumber}</dd>
        </div>
        <div className="flex items-center gap-10 pt-1">
          <dt className="w-[70px] text-sm text-gray-500 shrink-0">픽업날짜</dt>
          <dd className="text-sm text-gray-900">{formatPickupDateTime(order.pickupDate)}</dd>
        </div>
        <div className="flex gap-10">
          <dt className="w-[70px] text-sm text-gray-500 shrink-0">픽업장소</dt>
          <dd className="flex-1 min-w-0 text-sm text-gray-900">
            <Link
              href={PATHS.STORE.DETAIL(order.storeId)}
              className="inline-flex items-center gap-0.5"
            >
              {order.storeName}
              <Icon name="arrow" width={16} height={16} className="text-gray-300 rotate-90" />
            </Link>
            <p className="flex items-center text-sm text-gray-900">
              {order.pickupRoadAddress || order.pickupAddress}
              {order.pickupDetailAddress && ` ${order.pickupDetailAddress}`}{" "}
              <button
                type="button"
                onClick={onMapClick}
                className="text-gray-500 underline ml-1.5 text-xs font-bold"
              >
                길찾기
              </button>
            </p>
          </dd>
        </div>
      </dl>
      <div className="mt-5">
        <OrderActionButtons
          buttons={[
            { label: "스토어 문의", icon: "reviewQna", onClick: onInquiryClick },
            ...(showChangePickup ? [{ label: "픽업 날짜 변경", onClick: onChangePickupDate }] : []),
          ]}
        />
      </div>
    </section>
  );
}
