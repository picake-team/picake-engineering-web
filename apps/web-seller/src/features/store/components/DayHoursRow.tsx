/**
 * 고른 날 영업 한 줄 + "영업 바꾸기"(휴대폰·PC 캘린더 공용, 기획 I-42·I-54). 누르면 그날만 바꾸는 창(DayHoursSheet)을 연다.
 */
import { Button } from "@/apps/web-seller/common/ui/Button";
import {
  formatHoursRange,
  type DayRule,
} from "@/apps/web-seller/features/store/utils/business-day.util";

export function DayHoursRow({
  rule,
  disabled,
  onChange,
}: {
  rule: DayRule & { overridden: boolean };
  disabled: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-control bg-ink-50 py-1.5 pl-4 pr-1.5">
      <span className="min-w-0 flex-1 text-sub text-ink-700">
        {rule.isOpen ? `영업 ${formatHoursRange(rule.start, rule.end)}` : "휴무"}
        {rule.overridden ? " · 이날만 바꿈" : ""}
      </span>
      <Button variant="secondary" size="md" className="px-3" disabled={disabled} onClick={onChange}>
        영업 바꾸기
      </Button>
    </div>
  );
}
