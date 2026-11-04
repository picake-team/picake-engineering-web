import React, { useState } from "react";
import { Link } from "react-router-dom";
import { BaseButton as Button } from "@/apps/web-seller/common/components/buttons/BaseButton";
import { Card, CardContent } from "@/apps/web-seller/common/components/cards/Card";
import { Checkbox } from "@/apps/web-seller/common/components/inputs/Checkbox";
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
 * 불러오기만으로는 저장하지 않는다. 저장할 때 진행 중인 예약과 겹치면 서버가 막고 겹친 예약을 알려 준다.
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
  const [preview, setPreview] = useState<NaverPlacePreviewResponseDto | null>(null);
  const [selected, setSelected] = useState<RowKey[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  if (!connected) {
    return (
      <Card>
        <CardContent className="p-6 space-y-1">
          <h2 className="text-lg font-semibold">네이버 영업시간으로 채우기</h2>
          <p className="text-sm text-muted-foreground">
            네이버 매장을 연결하면 네이버 영업시간을 참고해 정기 휴무와 표준 영업시간을 채울 수
            있어요.{" "}
            <Link
              to={ROUTES.STORE_DETAIL_EDIT(storeId)}
              className="text-primary underline-offset-4 hover:underline"
            >
              스토어 수정에서 연결하기
            </Link>
          </p>
        </CardContent>
      </Card>
    );
  }

  const suggestion = preview?.calendarSuggestion;
  const naverWeeklyOff = suggestion?.weeklyClosedWeekdays ?? null;
  const naverHours =
    suggestion?.standardOpenTime && suggestion?.standardCloseTime
      ? { start: suggestion.standardOpenTime, end: suggestion.standardCloseTime }
      : null;

  const rows: {
    key: RowKey;
    label: string;
    currentText: string;
    naverText: string | null;
    status: "missing" | "same" | "changed";
  }[] = preview
    ? [
        {
          key: "weeklyOff",
          label: "정기 휴무",
          currentText: formatWeekdays(current.weeklyOff),
          naverText: naverWeeklyOff ? formatWeekdays(naverWeeklyOff) : null,
          status: !naverWeeklyOff
            ? "missing"
            : formatWeekdays(naverWeeklyOff) === formatWeekdays(current.weeklyOff)
              ? "same"
              : "changed",
        },
        {
          key: "hours",
          label: "표준 영업시간 (손님이 고르는 픽업 가능 시간)",
          currentText: formatHours(current.start, current.end),
          naverText: naverHours ? formatHours(naverHours.start, naverHours.end) : null,
          status: !naverHours
            ? "missing"
            : naverHours.start === current.start && naverHours.end === current.end
              ? "same"
              : "changed",
        },
      ]
    : [];

  const load = async () => {
    const result = await previewMutation.mutateAsync(connected.placeId);
    setPreview(result);
    setSelected([]);
    setNotice(null);
  };

  const apply = () => {
    const patch: Partial<StoreCalendarBasicValues> = {};
    if (selected.includes("weeklyOff") && naverWeeklyOff) patch.weeklyOff = new Set(naverWeeklyOff);
    if (selected.includes("hours") && naverHours) {
      patch.start = naverHours.start;
      patch.end = naverHours.end;
    }
    onApply(patch);
    setSelected([]);
    setNotice(
      "선택한 항목을 아래 칸에 넣었어요. 확인하고 '저장'을 눌러야 반영돼요. 진행 중인 예약과 겹치면 저장되지 않고 겹친 예약을 알려 드려요.",
    );
  };

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex flex-wrap items-start gap-2">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold">네이버 영업시간으로 채우기</h2>
            <p className="text-sm text-muted-foreground">
              네이버 영업시간은 매장 문을 여는 시간이라 픽업 가능 시간과 다를 수 있어요. 비교해 보고
              필요한 것만 고르세요.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={disabled || previewMutation.isPending}
            onClick={load}
          >
            {previewMutation.isPending
              ? "불러오는 중…"
              : preview
                ? "네이버에서 다시 불러오기"
                : "네이버 영업시간 불러오기"}
          </Button>
        </div>

        {preview && (
          <>
            {suggestion && suggestion.warnings.length > 0 && (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
                <p className="text-xs font-medium text-amber-900">직접 설정해야 해요</p>
                <ul className="mt-1 list-disc pl-4 space-y-0.5">
                  {suggestion.warnings.map((w) => (
                    <li key={w} className="text-xs text-amber-800">
                      {w}
                    </li>
                  ))}
                </ul>
                <p className="mt-1 text-xs text-amber-800">
                  요일마다 다른 시간은 &apos;캘린더&apos; 탭에서 날짜별로 정해 주세요.
                </p>
              </div>
            )}

            <div className="divide-y rounded-md border">
              {rows.map((row) => (
                <div key={row.key} className="flex gap-3 p-3">
                  <Checkbox
                    checked={selected.includes(row.key)}
                    onChange={(checked) =>
                      setSelected((prev) =>
                        checked ? [...prev, row.key] : prev.filter((k) => k !== row.key),
                      )
                    }
                    disabled={disabled || row.status !== "changed"}
                    className="items-start pt-0.5"
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-sm font-medium">
                      {row.label}
                      {row.status === "same" && (
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          지금 값과 같음
                        </span>
                      )}
                      {row.status === "missing" && (
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          네이버 값을 옮길 수 없음 (지금 값 유지)
                        </span>
                      )}
                    </p>
                    {row.naverText && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">네이버 · </span>
                        {row.naverText}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">지금 · {row.currentText}</p>
                  </div>
                </div>
              ))}
            </div>

            <details className="rounded-md border p-3">
              <summary className="cursor-pointer text-sm font-medium">
                네이버에 적힌 영업시간 전체
              </summary>
              <ul className="mt-2 space-y-0.5">
                {preview.businessHours.days.map((day) => (
                  <li key={day.day} className="text-sm">
                    {formatNaverBusinessDay(day)}
                  </li>
                ))}
              </ul>
              {preview.businessHours.freeText && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {preview.businessHours.freeText}
                </p>
              )}
            </details>

            <Button
              type="button"
              size="sm"
              disabled={disabled || selected.length === 0}
              onClick={apply}
            >
              선택한 항목 채우기
            </Button>
            {notice && <p className="text-sm text-emerald-700">{notice}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
};
