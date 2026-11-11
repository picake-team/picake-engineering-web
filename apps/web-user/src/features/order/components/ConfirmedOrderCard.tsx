"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Icon } from "@/apps/web-user/common/components/icons";
import { PATHS } from "@/apps/web-user/common/constants/paths.constant";
import { OrderResponse } from "@/apps/web-user/features/order/types/order.type";
import { OrderCardContent } from "./OrderCardContent";
import { NavigationBottomSheet } from "@/apps/web-user/common/components/bottom-sheets/NavigationBottomSheet";
import { StoreInquiryBottomSheet } from "@/apps/web-user/common/components/bottom-sheets/StoreInquiryBottomSheet";
import { trackEvent } from "@/apps/web-user/common/utils/analytics.util";

export function ConfirmedOrderCard({ order }: { order: OrderResponse }) {
  const router = useRouter();
  const [isMapSheetOpen, setIsMapSheetOpen] = useState(false);
  const [isInquirySheetOpen, setIsInquirySheetOpen] = useState(false);

  // 마이페이지 상단 예약 상태 카드 노출
  useEffect(() => {
    trackEvent("view_mypage_reservation_card", {
      card_status: "confirmed",
      reservation_id: order.id,
    });
  }, [order.id]);

  return (
    <>
      <div
        onClick={() => router.push(`${PATHS.ORDER.DETAIL(order.id)}?entry_point=mypage_card`)}
        className="rounded-xl overflow-hidden border border-primary-100 cursor-pointer"
        style={{ background: "linear-gradient(180deg, #FFEFEB 0%, #FFFFFF 30%)" }}
      >
        <div className="py-4 px-[18px]">
          <h2 className="text-sm font-bold text-primary">예정된 예약이 있어요</h2>
          <div className="pt-2.5">
            <OrderCardContent order={order} />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsInquirySheetOpen(true);
                }}
                className="flex-1 h-[32px] flex items-center justify-center gap-0.5 rounded-lg border border-gray-100 text-xs font-bold text-gray-900 bg-white"
              >
                <Icon name="reviewQna" width={16} height={16} className="text-gray-700" />
                스토어 문의
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMapSheetOpen(true);
                }}
                className="flex-1 h-[32px] flex items-center justify-center gap-0.5 rounded-lg border border-gray-100 text-xs font-bold text-gray-900 bg-white"
              >
                <Icon name="map" width={16} height={16} className="text-gray-700" />
                길찾기
              </button>
            </div>
          </div>
        </div>
      </div>

      {createPortal(
        <NavigationBottomSheet
          isOpen={isMapSheetOpen}
          onClose={() => setIsMapSheetOpen(false)}
          latitude={order.pickupLatitude}
          longitude={order.pickupLongitude}
          storeName={order.storeName}
        />,
        document.body,
      )}
      {createPortal(
        <StoreInquiryBottomSheet
          isOpen={isInquirySheetOpen}
          onClose={() => setIsInquirySheetOpen(false)}
          storeId={order.storeId}
          phoneNumber={order.storePhoneNumber}
        />,
        document.body,
      )}
    </>
  );
}
