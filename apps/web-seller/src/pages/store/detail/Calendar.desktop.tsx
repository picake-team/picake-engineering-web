/**
 * PC 캘린더(기획 I-54, 시안 D): 한 달 달력 | 고른 날 칸.
 *
 * - 달력 칸마다 그날 픽업 수, 넓으면 앞의 픽업 셋(시각 · 케이크), 쉬는 날 "휴무", 그날만 바꾼 날 "바꿈", 대목(이브 등).
 *   하이케이크·케끄 월 달력과 같은 방식(케이크 가게 서비스 근거).
 * - 고른 날 칸: 그날 영업(영업 바꾸기 창 — 휴대폰 캘린더와 같은 DayHoursSheet), 그날 픽업(Picake + 직접 적은 주문),
 *   주문 적기, 이날 주문서 인쇄(PC에만).
 * - 다른 캘린더로 내보내기·고른 날 주소(?date=)·자정이 지나면 오늘 바꾸기는 휴대폰 캘린더와 같다.
 * 1200보다 좁으면 고른 날 칸이 달력 아래로 내려간다.
 */
import React, { useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PcPage, PcPanel } from "@/apps/web-seller/common/ui/PcPage";
import { Button } from "@/apps/web-seller/common/ui/Button";
import { Icon } from "@/apps/web-seller/common/ui/icons";
import { cx } from "@/apps/web-seller/common/ui/cx";
import { useElementWidth } from "@/apps/web-seller/common/hooks/useElementWidth";
import { ROUTES } from "@/apps/web-seller/common/constants/route-paths.constant";
import {
  addDaysToKey,
  formatKeyMonthDayWeek,
  kstTime,
  monthEndKey,
  monthStartKey,
  shiftMonthKey,
  weekdayLabel,
  weekdayOfKey,
} from "@/apps/web-seller/common/utils/kst-date.util";
import { useFollowToday, useKstTodayKey } from "@/apps/web-seller/common/hooks/useKstTodayKey";
import { useDateParam } from "@/apps/web-seller/common/hooks/useDateParam";
import { cakeDayOf } from "@/apps/web-seller/common/utils/cake-days.util";
import { isActAsMode } from "@/apps/web-seller/common/utils/act-as.util";
import { CalendarExportSheet } from "@/apps/web-seller/features/manual-order/components/CalendarExportSheet";
import { DayPickupList } from "@/apps/web-seller/features/manual-order/components/DayPickupList";
import { useDayPickups } from "@/apps/web-seller/features/manual-order/hooks/queries/useDayPickups";
import { mergeDayPickups } from "@/apps/web-seller/features/manual-order/utils/day-pickups.util";
import { useStoreDetail } from "@/apps/web-seller/features/store/hooks/queries/useStoreQuery";
import {
  calendarOrDefault,
  dayMark,
  effectiveRule,
  formatHoursRange,
} from "@/apps/web-seller/features/store/utils/business-day.util";
import { DayHoursSheet } from "@/apps/web-seller/features/store/components/DayHoursSheet";
import { orderItemsShort } from "@/apps/web-seller/features/order/utils/order-mobile.util";
import { printOrdersPath } from "@/apps/web-seller/features/order/utils/order-print.util";
import { canExportOrPrint } from "@/apps/web-seller/common/utils/pc-extras.util";

/** 칸 안에 픽업 줄을 보여 줄 달력 넓이(좁으면 수만) */
const DETAIL_GRID_MIN = 600;
const MAX_LINES = 3;

export const StoreDetailCalendarDesktopPage: React.FC = () => {
  const { storeId = "" } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const todayKey = useKstTodayKey();
  const { selectedKey, setSelectedKey, pickDay } = useDateParam(todayKey);
  const [monthKey, setMonthKey] = useState(() => monthStartKey(selectedKey));
  useFollowToday(todayKey, (prev, next) => {
    setSelectedKey((s) => (s === prev ? next : s));
    setMonthKey((m) => (m === monthStartKey(prev) ? monthStartKey(next) : m));
  });
  const [exportOpen, setExportOpen] = useState(false);
  const [hoursOpen, setHoursOpen] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const detailed = useElementWidth(gridRef) >= DETAIL_GRID_MIN;

  const { data: store } = useStoreDetail(storeId);
  const cal = calendarOrDefault(store?.businessCalendar);
  const monthEnd = monthEndKey(monthKey);
  const month = useDayPickups(storeId, monthKey, monthEnd);
  const { byDay, manualByDay, counts } = month;

  const [y, m] = monthKey.split("-").map(Number);
  const firstWeekday = weekdayOfKey(monthKey);
  const days: string[] = [];
  for (let k = monthKey; k <= monthEnd; k = addDaysToKey(k, 1)) days.push(k);

  const goMonth = (delta: number) => {
    const next = shiftMonthKey(monthKey, delta);
    setMonthKey(next);
    pickDay(next === monthStartKey(todayKey) ? todayKey : next);
  };

  const selectedPickups = useMemo(
    () => mergeDayPickups(byDay[selectedKey] ?? [], manualByDay[selectedKey] ?? []),
    [byDay, manualByDay, selectedKey],
  );
  const selectedRule = effectiveRule(selectedKey, cal);
  const selectedTag = cakeDayOf(selectedKey);
  const inMonth = selectedKey.slice(0, 7) === monthKey.slice(0, 7);

  return (
    <PcPage
      title="캘린더"
      actions={
        // 내보내기 주소는 사장님 비밀 주소라 운영자 대신 입력 중(기획 I-41)에는 감춘다(서버도 막음)
        isActAsMode() ? undefined : (
          <Button variant="secondary" size="md" onClick={() => setExportOpen(true)}>
            <Icon name="share" size={16} strokeWidth={1.9} />
            다른 캘린더로 내보내기
          </Button>
        )
      }
    >
      <div className="grid items-start gap-4 nav:grid-cols-[minmax(0,1fr)_380px]">
        <PcPanel
          title={`${y}년 ${m}월`}
          labelledBy="calendar-month"
          action={
            <>
              <button
                type="button"
                aria-label="지난달"
                onClick={() => goMonth(-1)}
                className="inline-flex size-9 items-center justify-center rounded-full text-ink-700 hover:bg-ink-50"
              >
                <Icon name="back" size={20} strokeWidth={2} />
              </button>
              <button
                type="button"
                aria-label="다음 달"
                onClick={() => goMonth(1)}
                className="inline-flex size-9 items-center justify-center rounded-full text-ink-700 hover:bg-ink-50"
              >
                <Icon name="chevronRight" size={20} strokeWidth={2} />
              </button>
              <Button
                variant="secondary"
                size="md"
                className="ml-1 px-3"
                onClick={() => {
                  setMonthKey(monthStartKey(todayKey));
                  pickDay(todayKey);
                }}
              >
                오늘
              </Button>
            </>
          }
        >
          <div ref={gridRef} className="flex flex-col gap-1">
            <div
              className="grid grid-cols-7 gap-1 text-center text-caption text-ink-600"
              aria-hidden="true"
            >
              {Array.from({ length: 7 }, (_, i) => (
                <span key={i}>{weekdayLabel(i)}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1" role="grid" aria-label={`${y}년 ${m}월 달력`}>
              {Array.from({ length: firstWeekday }, (_, i) => (
                <span key={`blank-${i}`} aria-hidden="true" />
              ))}
              {days.map((key) => {
                const mark = dayMark(key, cal);
                const count = counts[key];
                const total = (count?.picake ?? 0) + (count?.manual ?? 0);
                const tag = cakeDayOf(key);
                const selected = key === selectedKey;
                const today = key === todayKey;
                const lines = detailed
                  ? mergeDayPickups(byDay[key] ?? [], manualByDay[key] ?? []).slice(0, MAX_LINES)
                  : [];
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={selected}
                    aria-label={`${formatKeyMonthDayWeek(key)}${today ? " 오늘" : ""}${
                      tag ? `, ${tag.full}` : ""
                    }${mark === "closed" ? ", 휴무" : mark === "changed" ? ", 영업 바꿈" : ""}, 픽업 ${total}건`}
                    onClick={() => pickDay(key)}
                    className={cx(
                      "flex min-h-[92px] min-w-0 flex-col gap-1 rounded-control border p-2 text-left transition-colors duration-fast",
                      selected ? "border-brand" : "border-ink-100 hover:bg-ink-50",
                      mark === "closed" && total === 0 && !selected ? "bg-ink-50" : "bg-white",
                    )}
                  >
                    <span className="flex items-baseline gap-1">
                      <span
                        className={cx(
                          "text-sub tabular-nums",
                          today ? "font-bold text-brand-ink" : "font-semibold text-ink-900",
                        )}
                      >
                        {Number(key.slice(8))}
                      </span>
                      {tag ? (
                        <span className="truncate text-caption text-brand-ink">{tag.short}</span>
                      ) : null}
                      {month.loaded && total > 0 ? (
                        <span className="ml-auto text-caption font-bold tabular-nums text-ink-900">
                          {total}건
                        </span>
                      ) : null}
                    </span>
                    {total === 0 && mark === "closed" ? (
                      <span className="text-caption text-ink-500">휴무</span>
                    ) : mark === "changed" ? (
                      <span className="text-caption font-semibold text-brand-ink">영업 바꿈</span>
                    ) : null}
                    {lines.map((p) => (
                      <span key={p.id} className="flex min-w-0 gap-1 text-caption text-ink-700">
                        <span className="shrink-0 tabular-nums text-ink-600">
                          {p.kind === "order"
                            ? kstTime(p.order.pickupDate)
                            : (p.manual.pickupTime ?? "미정")}
                        </span>
                        <span className="min-w-0 truncate">
                          {p.kind === "order" ? orderItemsShort(p.order) : p.manual.cakeName}
                        </span>
                      </span>
                    ))}
                    {detailed && total > MAX_LINES ? (
                      <span className="text-caption text-ink-600">+{total - MAX_LINES}건</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </PcPanel>

        <PcPanel
          title={
            <span className="flex items-baseline gap-2">
              {formatKeyMonthDayWeek(selectedKey)}
              {selectedTag ? (
                <span className="text-sub font-normal text-ink-600">{selectedTag.full}</span>
              ) : null}
            </span>
          }
          labelledBy="calendar-day"
          bodyClassName="gap-3"
        >
          <div className="flex items-center gap-2 rounded-control bg-ink-50 py-1.5 pl-4 pr-1.5">
            <span className="min-w-0 flex-1 text-sub text-ink-700">
              {selectedRule.isOpen
                ? `영업 ${formatHoursRange(selectedRule.start, selectedRule.end)}`
                : "휴무"}
              {selectedRule.overridden ? " · 이날만 바꿈" : ""}
            </span>
            <Button
              variant="secondary"
              size="md"
              className="px-3"
              disabled={!store}
              onClick={() => setHoursOpen(true)}
            >
              영업 바꾸기
            </Button>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-group font-bold text-ink-900">
              픽업 {month.loaded && inMonth ? `${selectedPickups.length}건` : ""}
            </h3>
            {selectedPickups.length > 0 && canExportOrPrint() ? (
              <a
                href={printOrdersPath(storeId, selectedKey)}
                target="_blank"
                rel="noopener"
                className="inline-flex min-h-9 items-center gap-1 rounded-control px-2 text-sub font-semibold text-ink-600 hover:bg-ink-50"
              >
                이날 주문서 인쇄
                <Icon name="external" size={14} strokeWidth={2} />
              </a>
            ) : null}
          </div>
          {inMonth ? (
            <DayPickupList
              pickups={selectedPickups}
              loaded={month.loaded}
              ordersFailed={month.ordersFailed}
              manualFailed={month.manualFailed}
              onRetryOrders={month.refetchOrders}
              onRetryManual={month.refetchManual}
              emptyText={
                selectedRule.isOpen ? "이 날은 픽업이 없어요" : "쉬는 날이라 픽업이 없어요"
              }
              emptyClassName="py-2 text-sub text-ink-600"
            />
          ) : null}
          <Button
            variant="secondary"
            size="md"
            block
            onClick={() =>
              navigate(`${ROUTES.STORE_DETAIL_MANUAL_ORDER_CREATE(storeId)}?date=${selectedKey}`)
            }
          >
            <Icon name="plus" size={16} strokeWidth={2} />
            {Number(selectedKey.slice(5, 7))}월 {Number(selectedKey.slice(8))}일 주문 적기
          </Button>
          <Link
            to={ROUTES.STORE_DETAIL_HOURS(storeId)}
            className="inline-flex min-h-9 items-center gap-0.5 self-start rounded-control px-1 text-sub font-semibold text-ink-600 hover:bg-ink-50"
          >
            쉬는 요일·매주 영업시간
            <Icon name="chevronRight" size={16} />
          </Link>
        </PcPanel>
      </div>

      <CalendarExportSheet
        storeId={storeId}
        open={exportOpen}
        onClose={() => setExportOpen(false)}
      />
      <DayHoursSheet
        open={hoursOpen}
        onClose={() => setHoursOpen(false)}
        storeId={storeId}
        dateKey={selectedKey}
        calendar={cal}
        dayOrders={byDay[selectedKey] ?? []}
      />
    </PcPage>
  );
};
