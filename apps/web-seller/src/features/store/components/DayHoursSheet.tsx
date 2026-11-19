/**
 * 그날만 영업 바꾸기 창(F-24). 휴대폰 캘린더·PC 캘린더가 같이 쓴다(운영자 결정 2026-11-19, 전에는 PC 캘린더에만).
 * 평소대로 · 영업(시각 고르기) · 휴무 중 하나. 저장하기 전에 그날 진행 중인 예약과 겹치는지 먼저 본다(서버도 다시 본다).
 */
import { useEffect, useState } from "react";
import { BottomSheet } from "@/apps/web-seller/common/ui/Sheet";
import { Button, ButtonPair } from "@/apps/web-seller/common/ui/Button";
import { ChoiceGrid } from "@/apps/web-seller/common/ui/Choice";
import { TimeBox, TimeSlotSheet } from "@/apps/web-seller/common/ui/TimeSlotSheet";
import { formatKeyMonthDayWeek } from "@/apps/web-seller/common/utils/kst-date.util";
import type { StoreBusinessCalendarDto } from "@/apps/web-seller/features/store/types/store.dto";
import type { OrderResponseDto } from "@/apps/web-seller/features/order/types/order.dto";
import { useUpdateStoreBusinessCalendar } from "@/apps/web-seller/features/store/hooks/mutations/useStoreMutation";
import {
  baseRule,
  formatHoursRange,
} from "@/apps/web-seller/features/store/utils/business-day.util";
import {
  findCalendarOrderConflicts,
  formatCalendarConflictMessage,
} from "@/apps/web-seller/features/store/utils/store-calendar-conflict.util";
import {
  calendarWithDay,
  dayHoursTimeError,
  draftForDay,
  type DayHoursDraft,
  type DayHoursMode,
} from "@/apps/web-seller/features/store/utils/day-hours.util";

const MODES: { value: DayHoursMode; label: string }[] = [
  { value: "base", label: "평소대로" },
  { value: "open", label: "영업" },
  { value: "closed", label: "휴무" },
];

export function DayHoursSheet({
  open,
  onClose,
  storeId,
  dateKey,
  calendar,
  dayOrders,
}: {
  open: boolean;
  onClose: () => void;
  storeId: string;
  dateKey: string;
  calendar: StoreBusinessCalendarDto;
  /** 그날 픽업 Picake 주문(겹침 확인) */
  dayOrders: OrderResponseDto[];
}) {
  const save = useUpdateStoreBusinessCalendar();
  const [draft, setDraft] = useState<DayHoursDraft>(() => draftForDay(calendar, dateKey));
  const [picking, setPicking] = useState<"start" | "end" | null>(null);
  const [conflict, setConflict] = useState<string | null>(null);

  // 열 때마다 그날 지금 영업으로 다시 시작
  useEffect(() => {
    if (!open) return;
    setDraft(draftForDay(calendar, dateKey));
    setConflict(null);
  }, [open, calendar, dateKey]);

  const base = baseRule(dateKey, calendar);
  const baseText = base.isOpen ? `평소 ${formatHoursRange(base.start, base.end)}` : "평소 쉬는 날";
  const timeError = dayHoursTimeError(draft);

  const submit = () => {
    if (timeError) return;
    const next = calendarWithDay(calendar, dateKey, draft);
    const conflicts = findCalendarOrderConflicts(next, dayOrders);
    if (conflicts.length > 0) {
      setConflict(formatCalendarConflictMessage(conflicts));
      return;
    }
    save.mutate({ storeId, request: next }, { onSuccess: onClose });
  };

  return (
    <>
      <BottomSheet
        open={open && picking === null}
        onClose={onClose}
        dismissible={!save.isPending}
        title={`${formatKeyMonthDayWeek(dateKey)} 영업`}
        description={baseText}
        footer={
          <ButtonPair>
            <Button variant="secondary" onClick={onClose} disabled={save.isPending}>
              돌아가기
            </Button>
            <Button onClick={submit} loading={save.isPending} disabled={Boolean(timeError)}>
              저장하기
            </Button>
          </ButtonPair>
        }
      >
        <div className="flex flex-col gap-4">
          <ChoiceGrid
            label="이날 영업"
            options={MODES}
            selected={[draft.mode]}
            onToggle={(v) => {
              setConflict(null);
              setDraft({
                ...draft,
                mode: v,
                // "영업"을 처음 고르면 평소 시각으로 시작(쉬는 요일이면 매주 영업시간)
                ...(v === "open" && draft.mode !== "open"
                  ? { start: calendar.standardOpenTime, end: calendar.standardCloseTime }
                  : {}),
              });
            }}
          />
          {draft.mode === "open" ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <TimeBox label="시작" value={draft.start} onClick={() => setPicking("start")} />
                <span className="text-ink-900">~</span>
                <TimeBox
                  label="끝"
                  value={draft.end}
                  invalid={Boolean(timeError)}
                  onClick={() => setPicking("end")}
                />
              </div>
              {timeError ? (
                <p role="alert" className="text-caption font-semibold text-brand-ink">
                  {timeError}
                </p>
              ) : draft.start === "00:00" && draft.end === "00:00" ? (
                <p className="text-caption text-ink-600">00:00 ~ 00:00은 하루 종일이에요</p>
              ) : null}
            </div>
          ) : null}
          {conflict ? (
            <p
              role="alert"
              className="whitespace-pre-line text-caption font-semibold text-brand-ink"
            >
              {conflict}
            </p>
          ) : null}
        </div>
      </BottomSheet>
      <TimeSlotSheet
        open={open && picking !== null}
        title={picking === "end" ? "끝나는 시각" : "시작 시각"}
        value={picking === "end" ? draft.end : draft.start}
        onPick={(t) => {
          setConflict(null);
          setDraft(picking === "end" ? { ...draft, end: t } : { ...draft, start: t });
        }}
        onClose={() => setPicking(null)}
      />
    </>
  );
}
