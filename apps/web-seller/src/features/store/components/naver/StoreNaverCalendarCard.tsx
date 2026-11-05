import React, { useState } from "react";
import { Link } from "react-router-dom";
import { BaseButton as Button } from "@/apps/web-seller/common/components/buttons/BaseButton";
import { Checkbox } from "@/apps/web-seller/common/components/inputs/Checkbox";
import { Dialog } from "@/apps/web-seller/common/components/dialogs/Dialog";
import { useAlertStore } from "@/apps/web-seller/common/store/alert.store";
import { ROUTES } from "@/apps/web-seller/common/constants/paths.constant";
import type {
  NaverPlacePreviewResponseDto,
  StoreNaverPlaceDto,
} from "@/apps/web-seller/features/store/types/store.dto";
import { usePreviewNaverPlace } from "@/apps/web-seller/features/store/hooks/mutations/useStoreMutation";
import { WEEKDAY_LABELS_KO } from "@/apps/web-seller/features/store/utils/store-calendar.util";
import { formatNaverBusinessDay } from "@/apps/web-seller/features/store/utils/naver-place.util";

export interface StoreCalendarBasicValues {
  weeklyOff: Set<number>;
  start: string;
  end: string;
}

interface Props {
  storeId: string;
  connected: StoreNaverPlaceDto | null;
  /** 지금 '기본 운영 관리' 칸의 값 (아직 저장 전 값 포함) */
  current: StoreCalendarBasicValues;
  /** 고른 네이버 값을 '기본 운영 관리' 칸에 넣는다 (저장은 아래 '저장' 버튼으로) */
  onApply: (patch: Partial<StoreCalendarBasicValues>) => void;
  disabled?: boolean;
}

type RowKey = "weeklyOff" | "hours";

const formatWeekdays = (days: Iterable<number>) => {
  const sorted = [...days].sort((a, b) => a - b);
  return sorted.length ? sorted.map((d) => WEEKDAY_LABELS_KO[d]).join(", ") : "없음";
};
const formatHours = (start: string, end: string) =>
  start === "00:00" && end === "00:00" ? "하루 전체" : `${start}~${end}`;

/**
 * 네이버 영업시간으로 정기 휴무·표준 영업시간 채우기 (I-10 3단계)
 * 화면에는 한 줄 안내만 두고, 비교·선택은 창에서 한다. 불러오기만으로는 저장하지 않는다.
 * 저장할 때 진행 중인 예약과 겹치면 서버가 막고 겹친 예약을 알려 준다.
 * 요일마다 다른 시간과 쉬는 시간은 한 가지 표준 시간으로 줄이지 않고, 날짜별로 직접 설정하도록 안내한다.
 */
export const StoreNaverCalendarCard: React.FC<Props> = ({
  storeId,
  connected,
  current,
  onApply,
  disabled = false,
}) => {
  const previewMutation = usePreviewNaverPlace();
  const { addAlert } = useAlertStore();
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<NaverPlacePreviewResponseDto | null>(null);
  const [selected, setSelected] = useState<RowKey[]>([]);

  if (!connected) {
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-muted/40 px-4 py-3">
        <p className="min-w-0 flex-1 text-sm text-muted-foreground">
          네이버 매장을 연결하면 네이버 영업시간으로 정기 휴무와 영업시간을 채울 수 있어요.
        </p>
        <Link
          to={ROUTES.STORE_DETAIL_EDIT(storeId)}
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          스토어에서 연결하기
        </Link>
      </div>
    );
  }

  const suggestion = preview?.calendarSuggestion;
  const naverWeeklyOff = suggestion?.weeklyClosedWeekdays ?? null;
  const naverHours =
    suggestion?.standardOpenTime && suggestion?.standardCloseTime
      ? { start: suggestion.standardOpenTime, end: suggestion.standardCloseTime }
      : null;

  const rows = preview
    ? [
        {
          key: "weeklyOff" as const,
          label: "정기 휴무",
          currentText: formatWeekdays(current.weeklyOff),
          naverText: naverWeeklyOff ? formatWeekdays(naverWeeklyOff) : null,
        },
        {
          key: "hours" as const,
          label: "영업시간 (손님이 고르는 픽업 가능 시간)",
          currentText: formatHours(current.start, current.end),
          naverText: naverHours ? formatHours(naverHours.start, naverHours.end) : null,
        },
      ].filter((r) => r.naverText && r.naverText !== r.currentText)
    : [];

  const load = async () => {
    setOpen(true);
    setPreview(null);
    try {
      setPreview(await previewMutation.mutateAsync(connected.placeId));
      setSelected([]);
    } catch {
      setOpen(false);
    }
  };

  const apply = () => {
    const patch: Partial<StoreCalendarBasicValues> = {};
    if (selected.includes("weeklyOff") && naverWeeklyOff) patch.weeklyOff = new Set(naverWeeklyOff);
    if (selected.includes("hours") && naverHours) {
      patch.start = naverHours.start;
      patch.end = naverHours.end;
    }
    onApply(patch);
    setOpen(false);
    addAlert({
      severity: "success",
      message:
        "네이버 값을 채웠어요. 확인하고 '저장'을 눌러야 반영돼요. 진행 중인 예약과 겹치면 겹친 예약을 알려 드려요.",
    });
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-muted/40 px-4 py-3">
        <p className="min-w-0 flex-1 text-sm text-muted-foreground">
          네이버 영업시간을 불러와 정기 휴무와 영업시간을 채울 수 있어요.
        </p>
        <Button type="button" size="sm" variant="outline" disabled={disabled} onClick={load}>
          네이버 영업시간 불러오기
        </Button>
      </div>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="네이버 영업시간으로 채우기"
        description="네이버 영업시간은 매장 문을 여는 시간이라 픽업 시간과 다를 수 있어요. 필요한 것만 고르세요."
        footer={
          preview && rows.length > 0 ? (
            <div className="flex justify-end">
              <Button type="button" disabled={selected.length === 0} onClick={apply}>
                고른 것 채우기
              </Button>
            </div>
          ) : null
        }
      >
        {!preview ? (
          <p className="py-8 text-center text-sm text-muted-foreground">네이버에서 불러오는 중…</p>
        ) : (
          <div className="space-y-4">
            {rows.length > 0 ? (
              <div className="divide-y rounded-lg border">
                {rows.map((row) => (
                  <div key={row.key} className="flex gap-3 p-3">
                    <Checkbox
                      checked={selected.includes(row.key)}
                      onChange={(checked) =>
                        setSelected((prev) =>
                          checked ? [...prev, row.key] : prev.filter((k) => k !== row.key),
                        )
                      }
                      className="items-start pt-0.5"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{row.label}</p>
                      <p className="text-sm">네이버 · {row.naverText}</p>
                      <p className="text-xs text-muted-foreground">지금 · {row.currentText}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                지금 설정과 같거나, 그대로 옮길 수 있는 값이 없어요.
              </p>
            )}

            {suggestion && suggestion.warnings.length > 0 && (
              <ul className="list-disc space-y-0.5 pl-4">
                {suggestion.warnings.map((w) => (
                  <li key={w} className="text-xs text-amber-800">
                    {w}
                  </li>
                ))}
                <li className="text-xs text-amber-800">
                  요일마다 다른 시간은 &apos;캘린더&apos; 탭에서 날짜별로 정해 주세요.
                </li>
              </ul>
            )}

            <details className="text-sm">
              <summary className="cursor-pointer text-muted-foreground">
                네이버에 적힌 영업시간 전체
              </summary>
              <ul className="mt-2 space-y-0.5">
                {preview.businessHours.days.map((day) => (
                  <li key={day.day}>{formatNaverBusinessDay(day)}</li>
                ))}
              </ul>
              {preview.businessHours.freeText && (
                <p className="mt-1 text-muted-foreground">{preview.businessHours.freeText}</p>
              )}
            </details>
          </div>
        )}
      </Dialog>
    </>
  );
};
