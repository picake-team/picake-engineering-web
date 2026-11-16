/**
 * 주문 통계용 시작·종료일 (`YYYY-MM-DD`). 최대 구간 길이는 `STATISTICS_MAX_RANGE_DAYS`로 제한합니다.
 */
import React from "react";
import { Label } from "@/apps/web-seller/common/components/labels/Label";
import { BaseInput as Input } from "@/apps/web-seller/common/components/inputs/BaseInput";
import { STATISTICS_MAX_RANGE_DAYS } from "@/apps/web-seller/features/statistics/constants/statistics.constant";
import {
  addDaysISODate,
  countDaysInclusive,
  todayISODateLocal,
} from "@/apps/web-seller/features/statistics/utils/statistics-date.util";

export interface StatisticsDateRangeFieldProps {
  startDate: string;
  endDate: string;
  onChange: (next: { startDate: string; endDate: string }) => void;
}

/** 역전 시 교환 후, 허용 일수를 넘기면 시작일 기준으로 종료일을 잘라냅니다. */
function clampRange(start: string, end: string): { start: string; end: string } {
  let s = start;
  let e = end;
  if (s > e) {
    const t = s;
    s = e;
    e = t;
  }
  const n = countDaysInclusive(s, e);
  if (n <= STATISTICS_MAX_RANGE_DAYS) return { start: s, end: e };
  return {
    start: s,
    end: addDaysISODate(s, STATISTICS_MAX_RANGE_DAYS - 1),
  };
}

export const StatisticsDateRangeField: React.FC<StatisticsDateRangeFieldProps> = ({
  startDate,
  endDate,
  onChange,
}) => {
  const today = todayISODateLocal();

  const applyRange = (s: string, e: string) => {
    // 키보드로 칸 하나를 지우면 값이 ""가 된다 — 그대로 넘기면 끝 날짜가 "NaN-NaN-NaN"이 되고 조회가 꺼진 채
    // 앞 기간 숫자가 남았다. 날짜 모양이 아니면 무시하고 앞 범위를 둔다(11-16 검토)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || !/^\d{4}-\d{2}-\d{2}$/.test(e)) return;
    const { start, end } = clampRange(s, e);
    onChange({ startDate: start, endDate: end });
  };

  const onStart = (v: string) => applyRange(v, endDate);
  const onEnd = (v: string) => applyRange(startDate, v);

  return (
    <div className="space-y-3">
      <div className="flex w-full max-w-[640px] flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid w-full gap-3 md:grid-cols-2 md:gap-3">
          <div className="space-y-2">
            <Label>시작날짜</Label>
            <div>
              <Input
                type="date"
                value={startDate}
                max={endDate}
                onChange={(e) => onStart(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>종료날짜</Label>
            <div>
              <Input
                type="date"
                value={endDate}
                min={startDate}
                max={today}
                onChange={(e) => onEnd(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
