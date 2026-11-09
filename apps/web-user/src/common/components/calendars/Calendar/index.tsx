"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/apps/web-user/common/lib/utils";
import type { StoreBusinessCalendar } from "@/apps/web-user/features/store/types/store.type";
import { isStoreOpenOnSeoulCalendarDay } from "@/apps/web-user/features/store/utils/store-business-calendar.util";

export interface CalendarProps {
  /**
   * 선택된 날짜
   */
  selectedDate?: Date | null;
  /**
   * 날짜 선택 핸들러
   */
  onDateSelect?: (date: Date) => void;
  /**
   * 최소 선택 가능한 날짜
   */
  minDate?: Date;
  /**
   * 최대 선택 가능한 날짜
   */
  maxDate?: Date;
  /**
   * 커스텀 클래스명
   */
  className?: string;
  /**
   * 초기 표시 월 (기본값: 현재 월)
   */
  initialMonth?: Date;
  /**
   * 영업 캘린더 — 정의되면 휴무일/요일이 자동으로 disable 처리됨
   */
  businessCalendar?: StoreBusinessCalendar;
  /**
   * 고른 날짜가 없을 때 오늘(고를 수 있으면)을 자동으로 고를지(기본: 고름, 예약 달력).
   * 손님이 직접 날짜를 골라야 하는 곳(견적 요청서)은 false
   */
  autoSelectToday?: boolean;
}

const DAYS_OF_WEEK = ["일", "월", "화", "수", "목", "금", "토"];

function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export const Calendar: React.FC<CalendarProps> = ({
  selectedDate,
  onDateSelect,
  minDate,
  maxDate,
  className,
  initialMonth,
  businessCalendar,
  autoSelectToday = true,
}) => {
  const displayMonthSource = initialMonth ?? selectedDate ?? null;

  const [currentMonth, setCurrentMonth] = useState(() =>
    displayMonthSource ? getMonthStart(displayMonthSource) : getMonthStart(new Date()),
  );

  const displayMonthKey = displayMonthSource
    ? `${displayMonthSource.getFullYear()}-${displayMonthSource.getMonth()}`
    : null;

  useEffect(() => {
    if (displayMonthSource) {
      setCurrentMonth(getMonthStart(displayMonthSource));
    }
  }, [displayMonthKey]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 현재 월의 첫 번째 날과 마지막 날 계산
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

  // 이전 달의 마지막 날들 계산
  const startDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  // 달력에 표시할 날짜들 생성
  const calendarDays = useMemo(() => {
    const days: (Date | null)[] = [];

    // 이전 달 빈 칸
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // 현재 달의 날짜들
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));
    }

    return days;
  }, [currentMonth, startDayOfWeek, daysInMonth]);

  // 날짜가 비활성화되어 있는지 확인
  const isDateDisabled = (date: Date): boolean => {
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);

    // minDate 체크
    if (minDate) {
      const minDateOnly = new Date(minDate);
      minDateOnly.setHours(0, 0, 0, 0);
      if (dateOnly < minDateOnly) return true;
    }

    // maxDate 체크
    if (maxDate) {
      const maxDateOnly = new Date(maxDate);
      maxDateOnly.setHours(0, 0, 0, 0);
      if (dateOnly > maxDateOnly) return true;
    }

    // 영업 캘린더 휴무일 체크 (정기휴무 + dayOverrides)
    if (businessCalendar && !isStoreOpenOnSeoulCalendarDay(businessCalendar, dateOnly)) {
      return true;
    }

    return false;
  };

  // 날짜가 현재 월에 속하는지 확인
  const isCurrentMonth = (date: Date | null): boolean => {
    if (!date) return false;
    return (
      date.getMonth() === currentMonth.getMonth() &&
      date.getFullYear() === currentMonth.getFullYear()
    );
  };

  // 날짜가 오늘인지 확인
  const isToday = (date: Date | null): boolean => {
    if (!date) return false;
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);
    return dateOnly.getTime() === today.getTime();
  };

  // 날짜가 선택되었는지 확인
  const isSelected = (date: Date | null): boolean => {
    if (!date || !selectedDate) return false;
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);
    const selectedDateOnly = new Date(selectedDate);
    selectedDateOnly.setHours(0, 0, 0, 0);
    return dateOnly.getTime() === selectedDateOnly.getTime();
  };

  useEffect(() => {
    if (autoSelectToday && !selectedDate && onDateSelect && !isDateDisabled(today)) {
      onDateSelect(new Date(today));
    }
  }, [autoSelectToday, selectedDate, onDateSelect, minDate, maxDate, today]);

  // minDate/maxDate가 속한 "월"의 시작일 (월 이동 제한 기준)
  const minMonthStart = minDate ? new Date(minDate.getFullYear(), minDate.getMonth(), 1) : null;
  const maxMonthStart = maxDate ? new Date(maxDate.getFullYear(), maxDate.getMonth(), 1) : null;

  // 현재 표시 월이 minDate 월 이하면 이전 달 이동 불가
  const isPrevMonthDisabled = minMonthStart
    ? currentMonth.getTime() <= minMonthStart.getTime()
    : false;
  // 현재 표시 월이 maxDate 월 이상이면 다음 달 이동 불가
  const isNextMonthDisabled = maxMonthStart
    ? currentMonth.getTime() >= maxMonthStart.getTime()
    : false;

  // 이전 달로 이동
  const goToPreviousMonth = () => {
    if (isPrevMonthDisabled) return;
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  // 다음 달로 이동
  const goToNextMonth = () => {
    if (isNextMonthDisabled) return;
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // 날짜 클릭 핸들러
  const handleDateClick = (date: Date) => {
    if (!isDateDisabled(date) && isCurrentMonth(date) && onDateSelect) {
      onDateSelect(date);
    }
  };

  // 월/년 표시 포맷
  const monthYearLabel = `${currentMonth.getFullYear()}년 ${currentMonth.getMonth() + 1}월`;

  return (
    <div
      className={cn(
        "w-full max-w-sm mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-4",
        className,
      )}
    >
      {/* 헤더: 월/년 네비게이션 */}
      <div className="flex items-center justify-center gap-8 mb-4">
        <button
          type="button"
          onClick={goToPreviousMonth}
          disabled={isPrevMonthDisabled}
          className={cn(
            "p-2 rounded-full transition-colors",
            isPrevMonthDisabled ? "cursor-not-allowed opacity-30" : "hover:bg-gray-100",
          )}
          aria-label="이전 달"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="text-base font-bold leading-[140%] text-gray-900">{monthYearLabel}</h2>
        <button
          type="button"
          onClick={goToNextMonth}
          disabled={isNextMonthDisabled}
          className={cn(
            "p-2 rounded-full transition-colors",
            isNextMonthDisabled ? "cursor-not-allowed opacity-30" : "hover:bg-gray-100",
          )}
          aria-label="다음 달"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS_OF_WEEK.map((day) => (
          <div
            key={day}
            className={cn("text-center text-xs font-normal leading-[130%] text-[#55595E] py-2")}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date, index) => {
          if (!date) {
            return <div key={index} className="aspect-square" />;
          }

          const disabled = isDateDisabled(date);
          const isCurrentMonthDate = isCurrentMonth(date);
          const isTodayDate = isToday(date);
          const isSelectedDate = isSelected(date);

          return (
            <button
              key={index}
              type="button"
              onClick={() => handleDateClick(date)}
              disabled={disabled || !isCurrentMonthDate}
              className={cn(
                "aspect-square text-sm font-normal leading-[22px] transition-colors",
                isSelectedDate ? "rounded-full" : "rounded-md",
                "focus:outline-none",
                !isSelectedDate && "focus:ring-2 focus:ring-primary focus:ring-offset-1",
                // 비활성화된 날짜 스타일
                (!isCurrentMonthDate || disabled) && "text-[#BDBFC0]",
                disabled && "cursor-not-allowed opacity-50",
                // 활성화된 날짜 스타일 (선택되지 않은 경우)
                isCurrentMonthDate && !disabled && !isSelectedDate && "text-[#21272C]",
                isTodayDate &&
                  !isSelectedDate &&
                  "bg-[var(--primary-or-50,#FFEFEB)] text-[var(--primary-or-400,#FF653E)]",
                // 선택된 날짜 스타일
                isSelectedDate && "bg-[#FF653E] text-white hover:bg-[#FF653E]/90 focus:ring-0",
                !isTodayDate &&
                  !isSelectedDate &&
                  isCurrentMonthDate &&
                  !disabled &&
                  "hover:bg-gray-100",
              )}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
};
