"use client";

import { useEffect, useState } from "react";
import { BottomSheet } from "@/apps/web-user/common/components/bottom-sheets/BottomSheet";
import { Button } from "@/apps/web-user/common/components/buttons/Button";
import { ReservationCalendarView } from "@/apps/web-user/features/product/components/sections/reservation-bottom-sheet/ReservationCalendarView";
import type {
  MapPickupFilter,
  MapPickupPeriodKind,
} from "@/apps/web-user/features/store/utils/map.util";

interface MapPickupDateBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFilter: MapPickupFilter | null;
  onConfirm: (filter: MapPickupFilter) => void;
  onClearFilter?: () => void;
}

export function MapPickupDateBottomSheet({
  isOpen,
  onClose,
  selectedFilter,
  onConfirm,
  onClearFilter,
}: MapPickupDateBottomSheetProps) {
  const [tempDate, setTempDate] = useState<Date | null>(() => selectedFilter?.date ?? null);
  const [tempPeriod, setTempPeriod] = useState<MapPickupPeriodKind | null>(
    () => selectedFilter?.kind ?? null,
  );

  useEffect(() => {
    if (!isOpen) return;
    if (!selectedFilter) {
      setTempDate(null);
      setTempPeriod(null);
      return;
    }
    setTempDate(selectedFilter.date);
    setTempPeriod(selectedFilter.kind);
  }, [isOpen, selectedFilter]);

  const isValid = Boolean(tempDate && tempPeriod);

  const handleConfirm = () => {
    if (!tempDate || !tempPeriod) return;
    onConfirm({ kind: tempPeriod, date: tempDate });
    onClose();
  };

  const handleClear = () => {
    onClearFilter?.();
    onClose();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="픽업 날짜 선택"
      zIndexClassName="z-sheet-top"
      footer={
        <div className="px-[20px] py-[12px] flex flex-col gap-[8px]">
          {selectedFilter != null && onClearFilter != null && (
            <button
              type="button"
              onClick={handleClear}
              className="py-1 text-center text-sm text-gray-500"
            >
              픽업 날짜 필터 해제
            </button>
          )}
          <div className="flex gap-[8px]">
            <span className="w-[100px]">
              <Button variant="outline" onClick={onClose}>
                닫기
              </Button>
            </span>
            <span className="flex-1">
              <Button onClick={handleConfirm} disabled={!isValid}>
                선택완료
              </Button>
            </span>
          </div>
        </div>
      }
    >
      <ReservationCalendarView
        tempSelectedDate={tempDate}
        setTempSelectedDate={setTempDate}
        tempSelectedTime={null}
        setTempSelectedTime={() => {}}
        pickupPeriodMode
        selectedPickupPeriod={tempPeriod}
        onPickupPeriodChange={setTempPeriod}
      />
    </BottomSheet>
  );
}
