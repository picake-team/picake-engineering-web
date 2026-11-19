/**
 * 휴대폰 캘린더 (SC-79, 디자인 4-A · 4-B): 달력 하나(안쪽 탭 없음).
 * 날짜 아래 그날 픽업 = 점(3건까지, Picake 주황·직접 적은 주문 회색, 취소 빼고) 또는 4건부터 숫자.
 * 픽업이 없으면 "휴무"·그날만 바꾼 날 "바꿈". 그 아래 대목 이름(이브·성탄절 등, 기획 I-42).
 * 날짜를 누르면 아래가 그날 픽업(Picake + 직접 적은 주문 시각 순)으로 바뀌고, 화면 아래 "○월 ○일 주문 적기"는
 * 고른 날로 주문 적기를 연다. 오른쪽 위 버튼은 다른 캘린더로 내보내기.
 * 고른 날 아래 한 줄에서 그날만 영업을 바꾼다(DayHoursSheet, PC 캘린더와 같은 창 — 운영자 결정 2026-11-19 "휴대폰에도").
 * 쉬는 요일·매주 영업시간은 스토어 탭 "영업시간".
 */
import React, { useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppScreen, BackHeader, BottomActionBar } from "@/apps/web-seller/common/ui/Screen";
import { ROUTES } from "@/apps/web-seller/common/constants/route-paths.constant";
import { Button } from "@/apps/web-seller/common/ui/Button";

import { Icon } from "@/apps/web-seller/common/ui/icons";
import { cx } from "@/apps/web-seller/common/ui/cx";
import { formatKeyMonthDayWeek, weekdayLabel } from "@/apps/web-seller/common/utils/kst-date.util";

import { cakeDayOf } from "@/apps/web-seller/common/utils/cake-days.util";
import { DayMarks, DayTag } from "@/apps/web-seller/common/ui/DayMarks";

import { CalendarExportSheet } from "@/apps/web-seller/features/manual-order/components/CalendarExportSheet";
import { isActAsMode } from "@/apps/web-seller/common/utils/act-as.util";
import { DayPickupList } from "@/apps/web-seller/features/manual-order/components/DayPickupList";

import { dayMark } from "@/apps/web-seller/features/store/utils/business-day.util";
import { DayHoursSheet } from "@/apps/web-seller/features/store/components/DayHoursSheet";
import { useMonthCalendar } from "@/apps/web-seller/features/manual-order/hooks/useMonthCalendar";
import { DayHoursRow } from "@/apps/web-seller/features/store/components/DayHoursRow";

const SWIPE_PX = 56;

export const StoreDetailCalendarMobilePage: React.FC = () => {
  const { storeId = "" } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const {
    todayKey,
    selectedKey,
    pickDay,
    y,
    m,
    firstWeekday,
    days,
    goMonth,
    cal,
    month,
    counts,
    selectedPickups,
    selectedTag,
    selectedRule,
    inMonth,
    goToday,
    storeLoaded,
    openExport,
    openHours,
    exportSheet,
    hoursSheet,
  } = useMonthCalendar(storeId);
  const [selMonth, selDay] = [Number(selectedKey.slice(5, 7)), Number(selectedKey.slice(8))];
  const touch = useRef<{ x: number; y: number } | null>(null);
  const monthLoaded = month.loaded;

  return (
    // 아래 탭에서 빠지고(채팅 탭, 운영자 결정 11-11) 홈 "캘린더 보기"로 들어오는 안쪽 화면
    <AppScreen
      header={
        <BackHeader
          title="캘린더"
          onBack={() => navigate(ROUTES.STORE_DETAIL_HOME(storeId))}
          actions={
            // 내보내기 주소는 사장님 비밀 주소라 운영자 대신 입력 중(기획 I-41)에는 감춘다(서버도 막음)
            isActAsMode() ? undefined : (
              <button
                type="button"
                aria-label="다른 캘린더로 내보내기"
                onClick={openExport}
                className="mr-1 inline-flex size-11 items-center justify-center rounded-full text-ink-900 active:bg-ink-50"
              >
                <Icon name="share" size={22} strokeWidth={1.8} />
              </button>
            )
          }
        />
      }
      bodyClassName="gap-2"
      footer={
        <BottomActionBar>
          <Button
            block
            onClick={() =>
              navigate(`${ROUTES.STORE_DETAIL_MANUAL_ORDER_CREATE(storeId)}?date=${selectedKey}`)
            }
          >
            {selMonth}월 {selDay}일 주문 적기
          </Button>
        </BottomActionBar>
      }
    >
      <div className="flex items-center justify-between">
        <h2 className="text-heading font-bold text-ink-900" aria-live="polite">
          {y}년 {m}월
        </h2>
        <div className="flex items-center">
          <button
            type="button"
            aria-label="지난달"
            onClick={() => goMonth(-1)}
            className="inline-flex size-11 items-center justify-center rounded-full text-ink-900 active:bg-ink-50"
          >
            <Icon name="back" size={24} strokeWidth={1.8} />
          </button>
          <button
            type="button"
            aria-label="다음 달"
            onClick={() => goMonth(1)}
            className="inline-flex size-11 items-center justify-center rounded-full text-ink-900 active:bg-ink-50"
          >
            <span className="rotate-180">
              <Icon name="back" size={24} strokeWidth={1.8} />
            </span>
          </button>
          <Button variant="secondary" size="md" className="ml-1 px-3" onClick={goToday}>
            오늘
          </Button>
        </div>
      </div>

      <div
        className="touch-pan-y"
        onTouchStart={(e) => {
          touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }}
        onTouchEnd={(e) => {
          const start = touch.current;
          touch.current = null;
          if (!start) return;
          const dx = e.changedTouches[0].clientX - start.x;
          const dy = e.changedTouches[0].clientY - start.y;
          if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy) * 1.5)
            goMonth(dx < 0 ? 1 : -1);
        }}
      >
        <div className="grid grid-cols-7 text-center text-caption text-ink-600" aria-hidden="true">
          {Array.from({ length: 7 }, (_, i) => (
            <span key={i}>{weekdayLabel(i)}</span>
          ))}
        </div>
        <div className="grid grid-cols-7" role="grid" aria-label={`${y}년 ${m}월 달력`}>
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
                  "flex flex-col items-center gap-1 py-1",
                  mark === "closed" && !selected ? "text-ink-500" : "text-ink-900",
                )}
              >
                <span
                  className={cx(
                    "flex size-8 items-center justify-center rounded-full text-body tabular-nums",
                    selected
                      ? "bg-brand font-bold text-white"
                      : today
                        ? "font-bold text-brand-ink"
                        : "font-normal",
                  )}
                >
                  {Number(key.slice(8))}
                </span>
                {/* 픽업이 있으면 쉬는 날에도 픽업을 먼저(직접 적은 주문은 쉬는 날에도 적을 수 있다) */}
                {total === 0 && mark === "closed" ? (
                  <span className="h-[15px] text-tab leading-[15px] text-ink-600">휴무</span>
                ) : total === 0 && mark === "changed" ? (
                  <span className="h-[15px] text-tab font-bold leading-[15px] text-brand-ink">
                    바꿈
                  </span>
                ) : (
                  <DayMarks count={count} />
                )}
                {/* 대목이 있는 날만(그 주만 한 줄 높아지고 다른 주는 그대로) */}
                {tag ? <DayTag label={tag.short} /> : null}
              </button>
            );
          })}
        </div>
      </div>

      <div aria-hidden="true" className="h-px bg-ink-100" />

      {inMonth ? (
        <>
          <h2 className="mt-1 flex items-baseline justify-between gap-2 text-group font-bold text-ink-900">
            <span className="min-w-0">
              {formatKeyMonthDayWeek(selectedKey)} ·{" "}
              {!selectedRule.isOpen && (!monthLoaded || selectedPickups.length === 0)
                ? "쉬는 날"
                : monthLoaded
                  ? `픽업 ${selectedPickups.length}건`
                  : "픽업"}
            </span>
            {selectedTag ? (
              <span className="shrink-0 text-sub font-normal text-ink-600">{selectedTag.full}</span>
            ) : null}
          </h2>
          <DayHoursRow rule={selectedRule} disabled={!storeLoaded} onChange={openHours} />
          <DayPickupList
            pickups={selectedPickups}
            loaded={month.loaded}
            ordersFailed={month.ordersFailed}
            manualFailed={month.manualFailed}
            onRetryOrders={month.refetchOrders}
            onRetryManual={month.refetchManual}
            emptyText={selectedRule.isOpen ? "이 날은 픽업이 없어요" : "쉬는 날이라 픽업이 없어요"}
            emptyClassName="text-sub text-ink-600"
            listClassName="-mt-1"
          />
        </>
      ) : null}
      <CalendarExportSheet {...exportSheet} />
      <DayHoursSheet {...hoursSheet} />
    </AppScreen>
  );
};
