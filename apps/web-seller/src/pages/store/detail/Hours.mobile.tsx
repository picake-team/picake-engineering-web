/**
 * 휴대폰 영업시간 (SC-81, 디자인 4-D): 쉬는 요일(여러 개) + 영업시간(30분 간격 창) + 네이버 영업시간으로 채우기.
 * 지금 PC "기본 운영 관리"(정기 휴무·표준 영업 시간)와 같은 값을 쉬운 말로. 저장할 때 진행 중인 예약과 겹치면
 * 서버가 막고 겹친 예약을 알려 준다(지금 PC와 같음).
 */
import React, { useEffect, useRef, useState } from "react";
import { Icon } from "@/apps/web-seller/common/ui/icons";
import { ROUTES } from "@/apps/web-seller/common/constants/route-paths.constant";
import { canGoBackInApp } from "@/apps/web-seller/common/hooks/useLeaveAfterSave";
import { useNavigate, useParams } from "react-router-dom";
import { AppScreen, BackHeader, BottomActionBar } from "@/apps/web-seller/common/ui/Screen";
import { Button } from "@/apps/web-seller/common/ui/Button";
import { ChoiceGrid } from "@/apps/web-seller/common/ui/Choice";
import { GroupTitle } from "@/apps/web-seller/common/ui/List";
import { BottomSheet } from "@/apps/web-seller/common/ui/Sheet";
import { Checkbox } from "@/apps/web-seller/common/ui/Toggle";
import { TimeBox, TimeSlotSheet } from "@/apps/web-seller/common/ui/TimeSlotSheet";
import { weekdayLabel } from "@/apps/web-seller/common/utils/kst-date.util";
import { useAlertStore } from "@/apps/web-seller/common/store/alert.store";
import { useStoreDetail } from "@/apps/web-seller/features/store/hooks/queries/useStoreQuery";
import {
  usePreviewNaverPlace,
  useUpdateStoreBusinessCalendar,
} from "@/apps/web-seller/features/store/hooks/mutations/useStoreMutation";
import {
  calendarOrDefault,
  formatHoursRange,
} from "@/apps/web-seller/features/store/utils/business-day.util";
import { formatNaverBusinessDay } from "@/apps/web-seller/features/store/utils/naver-place.util";
import type { NaverPlacePreviewResponseDto } from "@/apps/web-seller/features/store/types/store.dto";

interface HoursDraft {
  closed: number[];
  start: string;
  end: string;
}

const WEEKDAYS = Array.from({ length: 7 }, (_, i) => ({
  value: String(i),
  label: weekdayLabel(i),
}));

function formatWeekdays(days: number[]) {
  return days.length
    ? [...days]
        .sort((a, b) => a - b)
        .map((d) => `${weekdayLabel(d)}요일`)
        .join(", ")
    : "없음";
}

/** 네이버 영업시간으로 채우기 창(지금 PC 문구 그대로, 기본 미선택) */
function NaverHoursSheet({
  open,
  placeId,
  current,
  onApply,
  onClose,
}: {
  open: boolean;
  placeId: string;
  current: HoursDraft;
  onApply: (patch: Partial<HoursDraft>) => void;
  onClose: () => void;
}) {
  const preview = usePreviewNaverPlace();
  const [data, setData] = useState<NaverPlacePreviewResponseDto | null>(null);
  const [picked, setPicked] = useState<("closed" | "hours")[]>([]);
  const { mutateAsync } = preview;
  // 부모가 매번 새 함수를 넘겨도 다시 불러오지 않게
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    setData(null);
    setPicked([]);
    mutateAsync(placeId)
      .then(setData)
      .catch(() => closeRef.current());
  }, [open, placeId, mutateAsync]);

  const s = data?.calendarSuggestion;
  const naverClosed = s?.weeklyClosedWeekdays ?? null;
  const naverHours =
    s?.standardOpenTime && s?.standardCloseTime
      ? { start: s.standardOpenTime, end: s.standardCloseTime }
      : null;
  const rows = data
    ? [
        {
          key: "closed" as const,
          label: "쉬는 요일",
          now: formatWeekdays(current.closed),
          naver: naverClosed ? formatWeekdays(naverClosed) : null,
        },
        {
          key: "hours" as const,
          label: "영업시간 (손님이 고르는 픽업 가능 시간)",
          now: formatHoursRange(current.start, current.end),
          naver: naverHours ? formatHoursRange(naverHours.start, naverHours.end) : null,
        },
      ].filter((r) => r.naver && r.naver !== r.now)
    : [];

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      showClose
      title="네이버 영업시간으로 채우기"
      description="네이버 영업시간은 매장 문을 여는 시간이라 픽업 시간과 다를 수 있어요. 필요한 것만 고르세요."
      footer={
        data && rows.length > 0 ? (
          <Button
            block
            disabled={picked.length === 0}
            onClick={() => {
              const patch: Partial<HoursDraft> = {};
              if (picked.includes("closed") && naverClosed) patch.closed = [...naverClosed];
              if (picked.includes("hours") && naverHours) {
                patch.start = naverHours.start;
                patch.end = naverHours.end;
              }
              onApply(patch);
              onClose();
            }}
          >
            고른 것 채우기
          </Button>
        ) : undefined
      }
    >
      {!data ? (
        <p className="py-6 text-center text-sub text-ink-600">네이버에서 불러오는 중…</p>
      ) : rows.length === 0 ? (
        <p className="text-sub text-ink-600">
          지금 설정과 같거나, 그대로 옮길 수 있는 값이 없어요.
        </p>
      ) : (
        <div className="flex flex-col">
          {rows.map((r) => (
            <Checkbox
              key={r.key}
              className="items-start border-b border-ink-100 py-2"
              checked={picked.includes(r.key)}
              onChange={(on) =>
                setPicked((prev) => (on ? [...prev, r.key] : prev.filter((k) => k !== r.key)))
              }
            >
              <span className="flex flex-col gap-0.5">
                <span className="font-semibold">{r.label}</span>
                <span className="text-sub">네이버 · {r.naver}</span>
                <span className="text-caption text-ink-600">지금 · {r.now}</span>
              </span>
            </Checkbox>
          ))}
        </div>
      )}
      {s && s.warnings.length > 0 ? (
        <ul className="list-disc pl-4 text-caption text-brand-ink">
          {s.warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
          <li>요일마다 다른 시간은 캘린더에서 날짜별로 정해 주세요.</li>
        </ul>
      ) : null}
      {data ? (
        <details className="group text-sub text-ink-700">
          {/* 펼치기는 줄 이름 + 오른쪽 ⌄(▶ 글자 쓰지 않음) */}
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 py-2 text-ink-600 [&::-webkit-details-marker]:hidden">
            <span className="flex-1">네이버에 적힌 영업시간 전체</span>
            <span className="shrink-0 text-ink-400 transition-transform group-open:rotate-180">
              <Icon name="chevronDown" size={18} strokeWidth={2} />
            </span>
          </summary>
          <ul className="flex flex-col gap-0.5">
            {data.businessHours.days.map((day) => (
              <li key={day.day}>{formatNaverBusinessDay(day)}</li>
            ))}
          </ul>
          {data.businessHours.freeText ? (
            <p className="mt-1 text-ink-600">{data.businessHours.freeText}</p>
          ) : null}
        </details>
      ) : null}
    </BottomSheet>
  );
}

export const StoreDetailHoursMobilePage: React.FC = () => {
  const { storeId = "" } = useParams<{ storeId: string }>();
  const { data: store } = useStoreDetail(storeId);
  const save = useUpdateStoreBusinessCalendar();
  const navigate = useNavigate();
  const addAlert = useAlertStore((s) => s.addAlert);
  const [draft, setDraft] = useState<HoursDraft | null>(null);
  const [picking, setPicking] = useState<"start" | "end" | null>(null);
  const [naverOpen, setNaverOpen] = useState(false);

  useEffect(() => {
    if (store && !draft) {
      const cal = calendarOrDefault(store.businessCalendar);
      setDraft({
        closed: cal.weeklyClosedWeekdays,
        start: cal.standardOpenTime,
        end: cal.standardCloseTime,
      });
    }
  }, [store, draft]);

  const submit = () => {
    if (!store || !draft) return;
    const cal = calendarOrDefault(store.businessCalendar);
    save.mutate(
      {
        storeId,
        request: {
          ...cal,
          weeklyClosedWeekdays: [...draft.closed].sort((a, b) => a - b),
          standardOpenTime: draft.start,
          standardCloseTime: draft.end,
        },
      },
      {
        // 스토어 정보처럼 저장하면 들어온 곳(스토어 탭)으로 돌아간다
        onSuccess: () => {
          if (canGoBackInApp()) navigate(-1);
          else navigate(ROUTES.STORE_DETAIL_MENU(storeId), { replace: true });
        },
      },
    );
  };

  const placeId = store?.naverPlace?.placeId;
  // 00:00 ~ 00:00은 하루 종일. 그 밖엔 끝이 시작보다 늦어야 서버가 받는다(저장 전에 바로 알림)
  const allDay = draft ? draft.start === "00:00" && draft.end === "00:00" : false;
  const endTooEarly = draft ? !allDay && draft.end <= draft.start : false;

  return (
    <AppScreen
      header={<BackHeader title="영업시간" />}
      bodyClassName="gap-5 pt-2"
      footer={
        <BottomActionBar>
          <Button block onClick={submit} loading={save.isPending} disabled={!draft || endTooEarly}>
            저장하기
          </Button>
        </BottomActionBar>
      }
    >
      <p className="text-sub leading-normal text-ink-600">
        매주 똑같이 적용돼요. 특정 날만 바꾸는 것은 PC 캘린더에서 할 수 있어요.
      </p>
      {draft ? (
        <>
          <div className="flex flex-col gap-3">
            <GroupTitle>쉬는 요일</GroupTitle>
            <ChoiceGrid
              label="쉬는 요일"
              large
              options={WEEKDAYS}
              selected={draft.closed.map(String)}
              onToggle={(v) => {
                const d = Number(v);
                setDraft({
                  ...draft,
                  closed: draft.closed.includes(d)
                    ? draft.closed.filter((x) => x !== d)
                    : [...draft.closed, d],
                });
              }}
            />
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col">
              <GroupTitle>영업시간</GroupTitle>
              <p className="-mt-1 text-sub text-ink-600">손님이 고르는 픽업 시간이에요</p>
            </div>
            <div className="flex items-center gap-3">
              <TimeBox label="시작" value={draft.start} onClick={() => setPicking("start")} />
              <span className="text-ink-900">~</span>
              <TimeBox
                label="끝"
                value={draft.end}
                invalid={endTooEarly}
                onClick={() => setPicking("end")}
              />
            </div>
            {endTooEarly ? (
              <p role="alert" className="-mt-1 text-caption font-semibold text-brand-ink">
                끝나는 시각을 시작 시각보다 늦게 골라 주세요
              </p>
            ) : allDay ? (
              <p className="-mt-1 text-caption text-ink-600">00:00 ~ 00:00은 하루 종일이에요</p>
            ) : null}
            {placeId ? (
              <Button
                variant="secondary"
                size="md"
                className="self-start"
                onClick={() => setNaverOpen(true)}
              >
                네이버 영업시간으로 채우기
              </Button>
            ) : null}
          </div>
          <TimeSlotSheet
            open={picking !== null}
            title={picking === "end" ? "끝나는 시각" : "시작 시각"}
            value={picking === "end" ? draft.end : draft.start}
            onPick={(t) =>
              setDraft(picking === "end" ? { ...draft, end: t } : { ...draft, start: t })
            }
            onClose={() => setPicking(null)}
          />
          {placeId ? (
            <NaverHoursSheet
              open={naverOpen}
              placeId={placeId}
              current={draft}
              onClose={() => setNaverOpen(false)}
              onApply={(patch) => {
                setDraft({ ...draft, ...patch });
                addAlert({
                  severity: "success",
                  message:
                    "네이버 값을 채웠어요. 확인하고 '저장하기'를 눌러야 반영돼요. 진행 중인 예약과 겹치면 겹친 예약을 알려 드려요.",
                });
              }}
            />
          ) : null}
        </>
      ) : (
        <span className="block h-40 animate-pulse rounded-card bg-ink-50" aria-busy="true" />
      )}
    </AppScreen>
  );
};
