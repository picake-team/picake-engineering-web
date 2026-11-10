"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";
import { cn } from "@/apps/web-user/common/lib/utils";

export interface TimePickerProps {
  /**
   * 선택된 시간 (Date 객체 또는 null)
   */
  selectedTime?: Date | null;
  /**
   * 시간 선택 핸들러
   */
  onTimeSelect?: (time: Date) => void;
  /**
   * 커스텀 클래스명
   */
  className?: string;
  /**
   * 시간 간격 (분 단위, 기본값: 30분)
   */
  interval?: number;
  /**
   * 비활성화할 시간 목록 (Date 배열)
   */
  disabledTimes?: Date[];
  /**
   * 시간 표기 형식 ('12h': 오전/오후, '24h': 24시간제, 기본값: '12h')
   */
  timeFormat?: "12h" | "24h";
  /**
   * 표시할 시간의 시작 분(0~1440, inclusive). 정의되면 이 값 미만의 슬롯은 노출하지 않음.
   */
  minTimeMinutes?: number;
  /**
   * 표시할 시간의 종료 분(0~1440, exclusive). 정의되면 이 값 이상의 슬롯은 노출하지 않음.
   */
  maxTimeMinutes?: number;
}

interface TimeSlot {
  hour: number;
  minute: number;
  displayText: string;
  date: Date;
}

/**
 * 시간을 지정된 형식으로 변환
 */
const formatTime = (hour: number, minute: number, format: "12h" | "24h" = "12h"): string => {
  const displayMinute = minute.toString().padStart(2, "0");

  if (format === "24h") {
    const displayHour = hour.toString().padStart(2, "0");
    return `${displayHour}:${displayMinute}`;
  }

  // 12시간 형식
  const period = hour < 12 ? "오전" : "오후";
  // 오전 12시(00시)는 "오전 00"으로 표시
  const displayHour = hour === 0 ? "00" : hour > 12 ? hour - 12 : hour;
  return `${period} ${displayHour}:${displayMinute}`;
};

/**
 * 시간 슬롯 생성 (24시간, 지정된 간격으로)
 */
const generateTimeSlots = (
  interval: number = 30,
  timeFormat: "12h" | "24h" = "12h",
): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const baseDate = new Date();
  baseDate.setHours(0, 0, 0, 0);

  // interval 유효성 검사: 0 이하이거나 60보다 크면 기본값 30 사용
  const validInterval = interval > 0 && interval <= 60 ? interval : 30;

  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += validInterval) {
      const date = new Date(baseDate);
      date.setHours(hour, minute, 0, 0);
      slots.push({
        hour,
        minute,
        displayText: formatTime(hour, minute, timeFormat),
        date,
      });
    }
  }

  return slots;
};

export const TimePicker: React.FC<TimePickerProps> = ({
  selectedTime,
  onTimeSelect,
  className,
  interval = 30,
  disabledTimes = [],
  timeFormat = "12h",
  minTimeMinutes,
  maxTimeMinutes,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);

  // 시간 슬롯 생성 (영업 시간 범위가 정의되면 그 범위 밖 슬롯은 제외)
  const timeSlots = useMemo(() => {
    const all = generateTimeSlots(interval, timeFormat);
    if (minTimeMinutes == null && maxTimeMinutes == null) return all;
    return all.filter((slot) => {
      const slotMinutes = slot.hour * 60 + slot.minute;
      if (minTimeMinutes != null && slotMinutes < minTimeMinutes) return false;
      if (maxTimeMinutes != null && slotMinutes >= maxTimeMinutes) return false;
      return true;
    });
  }, [interval, timeFormat, minTimeMinutes, maxTimeMinutes]);

  // 비활성화된 시간 목록을 정규화 (hour, minute 형태로)
  const normalizedDisabledTimes = useMemo(() => {
    return disabledTimes.map((time) => ({
      hour: time.getHours(),
      minute: time.getMinutes(),
    }));
  }, [disabledTimes]);

  // 선택된 시간이 슬롯과 일치하는지 확인
  const isTimeSelected = (slot: TimeSlot): boolean => {
    if (!selectedTime) return false;
    return selectedTime.getHours() === slot.hour && selectedTime.getMinutes() === slot.minute;
  };

  // 시간이 비활성화되어 있는지 확인
  const isTimeDisabled = (slot: TimeSlot): boolean => {
    return normalizedDisabledTimes.some(
      (disabled) => disabled.hour === slot.hour && disabled.minute === slot.minute,
    );
  };

  // 시간 클릭 핸들러
  const handleTimeClick = (slot: TimeSlot) => {
    if (!isTimeDisabled(slot) && onTimeSelect) {
      onTimeSelect(slot.date);
    }
  };

  // 선택된 시간으로 스크롤 이동
  useEffect(() => {
    if (selectedTime && scrollContainerRef.current) {
      const selectedIndex = timeSlots.findIndex(
        (slot) =>
          slot.hour === selectedTime.getHours() && slot.minute === selectedTime.getMinutes(),
      );

      if (selectedIndex !== -1) {
        const buttonElement = scrollContainerRef.current.children[selectedIndex] as HTMLElement;
        if (buttonElement) {
          const container = scrollContainerRef.current;
          const buttonLeft = buttonElement.offsetLeft;
          const buttonWidth = buttonElement.offsetWidth;
          const containerWidth = container.offsetWidth;
          const scrollLeft = buttonLeft - containerWidth / 2 + buttonWidth / 2;

          container.scrollTo({
            left: scrollLeft,
            behavior: "smooth",
          });
        }
      }
    }
  }, [selectedTime, timeSlots]);

  // 스크롤 시작 감지
  const handleScrollStart = () => {
    setIsScrolling(true);
  };

  // 스크롤 종료 감지
  const handleScrollEnd = () => {
    setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="relative">
        {/* 가로 스크롤 컨테이너 */}
        <div
          ref={scrollContainerRef}
          onTouchStart={handleScrollStart}
          onTouchEnd={handleScrollEnd}
          onMouseDown={handleScrollStart}
          onMouseUp={handleScrollEnd}
          onMouseLeave={handleScrollEnd}
          className={cn(
            "flex gap-[10px] overflow-x-auto scrollbar-hide",
            "scroll-smooth",
            isScrolling && "cursor-grabbing",
            !isScrolling && "cursor-grab",
          )}
          style={{
            WebkitOverflowScrolling: "touch",
          }}
        >
          {timeSlots.map((slot, index) => {
            const isSelected = isTimeSelected(slot);
            const isDisabled = isTimeDisabled(slot);

            return (
              <button
                key={index}
                type="button"
                onClick={() => handleTimeClick(slot)}
                disabled={isDisabled}
                className={cn(
                  "flex-shrink-0 whitespace-nowrap transition-all duration-base",
                  "outline-none",
                  // 기본 크기 및 폰트 스타일
                  "min-w-[85px] h-[42px] rounded-[6px]",
                  "font-normal text-[14px] leading-[22px]",
                  // 비활성화된 시간 스타일
                  isDisabled &&
                    "bg-gray-50 text-gray-300 border border-gray-100 cursor-not-allowed",
                  // 선택되지 않은 활성화된 시간 스타일 (일반 상태)
                  !isSelected && !isDisabled && "bg-white text-gray-900 border border-gray-100",
                  // 선택된 시간 스타일
                  isSelected && !isDisabled && "bg-primary text-white border-0",
                )}
              >
                {slot.displayText}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
