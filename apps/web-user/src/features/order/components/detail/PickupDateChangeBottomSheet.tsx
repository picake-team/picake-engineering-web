"use client";

import { useEffect, useState } from "react";
import { BottomSheet } from "@/apps/web-user/common/components/bottom-sheets/BottomSheet";
import { Button } from "@/apps/web-user/common/components/buttons/Button";
import { ReservationCalendarView } from "@/apps/web-user/features/product/components/sections/reservation-bottom-sheet/ReservationCalendarView";
import { useUpdateReservationPickupDate } from "@/apps/web-user/features/order/hooks/mutations/useUpdateReservationPickupDate";
import type { StoreBusinessCalendar } from "@/apps/web-user/features/store/types/store.type";
import { trackEvent } from "@/apps/web-user/common/utils/analytics.util";

interface PickupDateChangeBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  /** 현재 픽업 일시 (ISO 8601). 시트 오픈 시 초기 선택값으로 사용 */
  initialPickupDate: string;
  onSuccess: () => void;
  /** 스토어 영업 캘린더 — 캘린더에서 휴무일 disable + 영업 시간만 노출 */
  businessCalendar?: StoreBusinessCalendar;
}

export function PickupDateChangeBottomSheet({
  isOpen,
  onClose,
  orderId,
  initialPickupDate,
  onSuccess,
  businessCalendar,
}: PickupDateChangeBottomSheetProps) {
  const { mutate, isPending } = useUpdateReservationPickupDate();

  const [tempDate, setTempDate] = useState<Date | null>(null);
  const [tempTime, setTempTime] = useState<Date | null>(null);

  // 시트 오픈 시 현재 예약된 일시로 초기화
  useEffect(() => {
    if (isOpen) {
      const d = new Date(initialPickupDate);
      setTempDate(d);
      setTempTime(d);
    }
  }, [isOpen, initialPickupDate]);

  const isValid = tempDate !== null && tempTime !== null;

  const handleConfirm = () => {
    if (!isValid || isPending || !tempDate || !tempTime) return;
    const combined = new Date(tempDate);
    combined.setHours(tempTime.getHours());
    combined.setMinutes(tempTime.getMinutes());
    combined.setSeconds(0, 0);
    trackEvent("request_change_reservation", {
      reservation_id: orderId,
      change_type: "pickup_date",
    });
    mutate(
      { orderId, pickupDate: combined.toISOString() },
      {
        onSuccess: () => {
          trackEvent("success_change_reservation", {
            reservation_id: orderId,
            change_type: "pickup_date",
          });
          onClose();
          onSuccess();
        },
      },
    );
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="픽업 날짜 변경"
      footer={
        <div className="flex gap-2 px-5 py-3">
          <span className="flex-1">
            <Button variant="outline" onClick={onClose} disabled={isPending}>
              닫기
            </Button>
          </span>
          <span className="flex-[2]">
            <Button onClick={handleConfirm} disabled={!isValid} loading={isPending}>
              {isPending ? "변경 중…" : "선택완료"}
            </Button>
          </span>
        </div>
      }
    >
      <ReservationCalendarView
        tempSelectedDate={tempDate}
        setTempSelectedDate={setTempDate}
        tempSelectedTime={tempTime}
        setTempSelectedTime={setTempTime}
        businessCalendar={businessCalendar}
      />
    </BottomSheet>
  );
}
