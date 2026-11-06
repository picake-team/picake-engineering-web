/**
 * 휴대폰 날짜 상세 (SC-80, 디자인 A80): 그날만 정상영업·영업 휴무와 영업 시간을 바꾼다.
 * 기본과 같게 하면 그날 바꾼 것이 지워진다. 진행 중인 예약과 맞지 않으면 저장하지 않고 그 예약을 보여 준다(지금 PC와 같음).
 * 위쪽 ←로 나가면 저장하지 않는다.
 */
import React, { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { AppScreen, BackHeader, BottomActionBar } from "@/apps/web-seller/common/ui/Screen";
import { Button } from "@/apps/web-seller/common/ui/Button";
import { ChoiceGrid } from "@/apps/web-seller/common/ui/Choice";
import { WarningBox } from "@/apps/web-seller/common/ui/Surface";
import { TimeBox, TimeSlotSheet } from "@/apps/web-seller/common/ui/TimeSlotSheet";
import { ROUTES } from "@/apps/web-seller/common/constants/route-paths.constant";
import { formatKeyMonthDayWeek } from "@/apps/web-seller/common/utils/kst-date.util";
import { useCalendarDayOrders } from "@/apps/web-seller/features/order/hooks/queries/useOrderQuery";
import { CANCELED_ORDER_STATUSES } from "@/apps/web-seller/features/order/utils/order-mobile.util";
import { useStoreDetail } from "@/apps/web-seller/features/store/hooks/queries/useStoreQuery";
import { useUpdateStoreBusinessCalendar } from "@/apps/web-seller/features/store/hooks/mutations/useStoreMutation";
import {
  calendarOrDefault,
  calendarWithDay,
  dayRuleNow,
  effectiveRule,
  type DayRule,
} from "@/apps/web-seller/features/store/utils/business-day.util";
import {
  findCalendarOrderConflicts,
  formatCalendarConflictMessage,
} from "@/apps/web-seller/features/store/utils/store-calendar-conflict.util";

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

export const StoreDetailCalendarDayMobilePage: React.FC = () => {
  const { storeId = "", dateKey = "" } = useParams<{ storeId: string; dateKey: string }>();
  const navigate = useNavigate();
  const { data: store } = useStoreDetail(storeId);
  const cal = calendarOrDefault(store?.businessCalendar);
  const dayOrders = useCalendarDayOrders(storeId, DATE_KEY.test(dateKey) ? dateKey : null);
  const save = useUpdateStoreBusinessCalendar();

  const [draft, setDraft] = useState<DayRule | null>(null);
  const [picking, setPicking] = useState<"start" | "end" | null>(null);

  // 스토어를 불러오면 그날 지금 영업으로 칸을 채운다
  useEffect(() => {
    if (store && !draft && DATE_KEY.test(dateKey)) {
      const r = effectiveRule(dateKey, calendarOrDefault(store.businessCalendar));
      setDraft({ isOpen: r.isOpen, start: r.start, end: r.end });
    }
  }, [store, draft, dateKey]);

  const orders = dayOrders.data?.data ?? [];
  const pickupCount = orders.filter((o) => !CANCELED_ORDER_STATUSES.includes(o.orderStatus)).length;
  const nextCal = useMemo(
    () => (draft ? calendarWithDay(cal, dateKey, draft) : cal),
    [cal, dateKey, draft],
  );
  const conflicts = useMemo(() => findCalendarOrderConflicts(nextCal, orders), [nextCal, orders]);

  if (!DATE_KEY.test(dateKey))
    return <Navigate to={ROUTES.STORE_DETAIL_CALENDAR(storeId)} replace />;

  const submit = () => {
    if (!draft || conflicts.length > 0) return;
    save.mutate(
      { storeId, request: nextCal },
      { onSuccess: () => navigate(ROUTES.STORE_DETAIL_CALENDAR(storeId), { replace: true }) },
    );
  };

  return (
    <AppScreen
      header={<BackHeader title={`${formatKeyMonthDayWeek(dateKey)} 영업`} />}
      bodyClassName="gap-4"
      footer={
        <BottomActionBar>
          <Button
            block
            onClick={submit}
            loading={save.isPending}
            disabled={!draft || conflicts.length > 0}
          >
            저장
          </Button>
        </BottomActionBar>
      }
    >
      <div className="flex flex-col gap-1 text-sub text-ink-600">
        <p>{dayRuleNow(dateKey, cal)}</p>
        <p>이 날 픽업 {dayOrders.isLoading ? "…" : `${pickupCount}건`}</p>
      </div>
      {draft ? (
        <>
          <ChoiceGrid
            label="이 날 영업"
            columns={2}
            selected={[draft.isOpen ? "open" : "closed"]}
            onToggle={(v) => setDraft({ ...draft, isOpen: v === "open" })}
            options={[
              { value: "open", label: "정상영업" },
              { value: "closed", label: "영업 휴무" },
            ]}
          />
          {draft.isOpen ? (
            <div className="flex flex-col gap-2">
              <p className="mt-1 text-sub font-bold text-ink-700">이 날 영업 시간</p>
              <div className="flex items-center gap-2">
                <TimeBox label="시작" value={draft.start} onClick={() => setPicking("start")} />
                <span className="text-ink-600">~</span>
                <TimeBox label="끝" value={draft.end} onClick={() => setPicking("end")} />
              </div>
              <p className="text-caption text-ink-600">
                30분 단위로 골라요. 이 날만 바뀌고, 기본과 같게 하면 지워져요
              </p>
            </div>
          ) : null}
          {conflicts.length > 0 ? (
            <WarningBox className="whitespace-pre-line rounded-control">
              {formatCalendarConflictMessage(conflicts)}
            </WarningBox>
          ) : null}
          <TimeSlotSheet
            open={picking !== null}
            title={picking === "end" ? "끝나는 시각" : "시작 시각"}
            value={picking === "end" ? draft.end : draft.start}
            onPick={(t) =>
              setDraft(picking === "end" ? { ...draft, end: t } : { ...draft, start: t })
            }
            onClose={() => setPicking(null)}
          />
        </>
      ) : (
        <span className="block h-24 animate-pulse rounded-card bg-ink-50" aria-busy="true" />
      )}
    </AppScreen>
  );
};
