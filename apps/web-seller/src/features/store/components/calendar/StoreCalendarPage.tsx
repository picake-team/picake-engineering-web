import React from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/apps/web-seller/common/components/tabs/Tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/apps/web-seller/common/components/cards/Card";
import { ContentLoading } from "@/apps/web-seller/common/components/loading/ContentLoading";
import { Button } from "@/apps/web-seller/common/components/buttons/Button";
import { StatusBadge } from "@/apps/web-seller/common/components/badges/StatusBadge";
import { Label } from "@/apps/web-seller/common/components/labels/Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/apps/web-seller/common/components/selects/Select";
import { ROUTES } from "@/apps/web-seller/common/constants/paths.constant";
import { useAlertStore } from "@/apps/web-seller/common/store/alert.store";
import { useStoreDetail } from "@/apps/web-seller/features/store/hooks/queries/useStoreQuery";
import { StoreNaverCalendarCard } from "@/apps/web-seller/features/store/components/naver/StoreNaverCalendarCard";
import { useUpdateStoreBusinessCalendar } from "@/apps/web-seller/features/store/hooks/mutations/useStoreMutation";
import { useCalendarMonthOrders } from "@/apps/web-seller/features/order/hooks/queries/useOrderQuery";
import type { OrderResponseDto } from "@/apps/web-seller/features/order/types/order.dto";
import {
  getOrderStatusBadgeVariant,
  getOrderStatusLabel,
} from "@/apps/web-seller/features/order/utils/order-status-ui.util";
import {
  buildHalfHourTimeOptions,
  defaultBusinessCalendarDto,
  formatBusinessHoursShortLabel,
  formatSeoulPickupHm,
  overridesRecordFromApi,
  parseDateKey,
  toDateKey,
  toSeoulDateKeyFromUtc,
  toStoreBusinessCalendarDto,
  type DayOverride,
  WEEKDAY_LABELS_KO,
} from "@/apps/web-seller/features/store/utils/store-calendar.util";
import {
  findCalendarOrderConflicts,
  formatCalendarConflictMessage,
} from "@/apps/web-seller/features/store/utils/store-calendar-conflict.util";
import { NO_REPLAY } from "@/apps/web-seller/common/constants/replay.constant";
const HALF_HOUR_OPTIONS = buildHalfHourTimeOptions();

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function daysInMonth(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

function baseRuleForWeekday(
  weekday: number,
  weeklyOff: Set<number>,
  standardStart: string,
  standardEnd: string,
): { isOpen: boolean; start: string; end: string } {
  if (weeklyOff.has(weekday)) {
    return { isOpen: false, start: standardStart, end: standardEnd };
  }
  return { isOpen: true, start: standardStart, end: standardEnd };
}

function effectiveForDate(
  dateKey: string,
  weeklyOff: Set<number>,
  standardStart: string,
  standardEnd: string,
  overrides: Record<string, DayOverride>,
): DayOverride {
  const d = parseDateKey(dateKey);
  const w = d.getDay();
  const base = baseRuleForWeekday(w, weeklyOff, standardStart, standardEnd);
  const o = overrides[dateKey];
  if (o) return { ...o };
  return base;
}

function cloneWeekdaySet(s: Set<number>): Set<number> {
  return new Set(s);
}

function computeNextOverridesMap(
  prev: Record<string, DayOverride>,
  selectedKey: string,
  draftOpen: boolean,
  draftStart: string,
  draftEnd: string,
  weeklyOff: Set<number>,
  standardStart: string,
  standardEnd: string,
): Record<string, DayOverride> {
  const effBase = baseRuleForWeekday(
    parseDateKey(selectedKey).getDay(),
    weeklyOff,
    standardStart,
    standardEnd,
  );
  const matchesBase =
    draftOpen === effBase.isOpen && draftStart === effBase.start && draftEnd === effBase.end;
  const next = { ...prev };
  if (matchesBase) delete next[selectedKey];
  else next[selectedKey] = { isOpen: draftOpen, start: draftStart, end: draftEnd };
  return next;
}

function sortOrdersByPickupTime(orders: OrderResponseDto[]): OrderResponseDto[] {
  return [...orders].sort(
    (a, b) => new Date(a.pickupDate).getTime() - new Date(b.pickupDate).getTime(),
  );
}

function reservationDisplayName(order: OrderResponseDto): string {
  return order.reservationContactName?.trim() || "예약자 미입력";
}

function reservationDisplayPhone(order: OrderResponseDto): string {
  return order.reservationPhone?.trim() || "—";
}

export const StoreCalendarPage: React.FC = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const {
    data: store,
    isLoading: storeLoading,
    isError: storeError,
  } = useStoreDetail(storeId ?? "");
  const updateCalendar = useUpdateStoreBusinessCalendar();
  const { addAlert } = useAlertStore();

  const [weeklyOffDays, setWeeklyOffDays] = React.useState<Set<number>>(() => new Set());
  const [standardStart, setStandardStart] = React.useState("00:00");
  const [standardEnd, setStandardEnd] = React.useState("00:00");
  const [basicDraftWeeklyOff, setBasicDraftWeeklyOff] = React.useState<Set<number>>(
    () => new Set(),
  );
  const [basicDraftStart, setBasicDraftStart] = React.useState("00:00");
  const [basicDraftEnd, setBasicDraftEnd] = React.useState("00:00");
  const [monthCursor, setMonthCursor] = React.useState(() => startOfMonth(new Date()));
  const [overrides, setOverrides] = React.useState<Record<string, DayOverride>>({});
  const [selectedKey, setSelectedKey] = React.useState<string | null>(null);

  const year = monthCursor.getFullYear();
  const month = monthCursor.getMonth();
  const monthStartKey = toDateKey(new Date(year, month, 1));
  const monthEndKey = toDateKey(new Date(year, month + 1, 0));

  const {
    data: monthOrdersList,
    isLoading: monthOrdersLoading,
    isError: monthOrdersError,
  } = useCalendarMonthOrders(storeId ?? "", monthStartKey, monthEndKey);

  const ordersByDateKey = React.useMemo(() => {
    const map = new Map<string, OrderResponseDto[]>();
    for (const order of monthOrdersList?.data ?? []) {
      const key = toSeoulDateKeyFromUtc(order.pickupDate);
      const list = map.get(key) ?? [];
      list.push(order);
      map.set(key, list);
    }
    for (const [key, list] of map) {
      map.set(key, sortOrdersByPickupTime(list));
    }
    return map;
  }, [monthOrdersList]);

  const [draftOpen, setDraftOpen] = React.useState(true);
  const [draftStart, setDraftStart] = React.useState("00:00");
  const [draftEnd, setDraftEnd] = React.useState("00:00");

  const weeklyOff = weeklyOffDays;

  const hydrateKeyRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    return () => {
      hydrateKeyRef.current = null;
    };
  }, []);

  React.useEffect(() => {
    if (!store?.id) return;
    const bc = store.businessCalendar ?? defaultBusinessCalendarDto();
    const fingerprint = `${store.id}-${store.updatedAt?.toString?.() ?? ""}-${JSON.stringify(bc)}`;
    if (hydrateKeyRef.current === fingerprint) return;
    hydrateKeyRef.current = fingerprint;

    setWeeklyOffDays(new Set(bc.weeklyClosedWeekdays));
    setBasicDraftWeeklyOff(new Set(bc.weeklyClosedWeekdays));
    setStandardStart(bc.standardOpenTime);
    setStandardEnd(bc.standardCloseTime);
    setBasicDraftStart(bc.standardOpenTime);
    setBasicDraftEnd(bc.standardCloseTime);
    setOverrides(
      overridesRecordFromApi(bc.dayOverrides, bc.standardOpenTime, bc.standardCloseTime),
    );
  }, [store]);

  const syncDraftFromSelection = React.useCallback(() => {
    if (!selectedKey) return;
    const eff = effectiveForDate(selectedKey, weeklyOff, standardStart, standardEnd, overrides);
    setDraftOpen(eff.isOpen);
    setDraftStart(eff.start);
    setDraftEnd(eff.end);
  }, [selectedKey, weeklyOff, standardStart, standardEnd, overrides]);

  React.useEffect(() => {
    syncDraftFromSelection();
  }, [syncDraftFromSelection]);

  const persistCalendar = React.useCallback(
    async (
      nextWeeklyOff: Set<number>,
      nextStandardStart: string,
      nextStandardEnd: string,
      nextOverrides: Record<string, DayOverride>,
      ordersForClientCheck?: OrderResponseDto[],
    ) => {
      if (!storeId) return;
      const dto = toStoreBusinessCalendarDto(
        nextWeeklyOff,
        nextStandardStart,
        nextStandardEnd,
        nextOverrides,
      );

      if (ordersForClientCheck) {
        const conflicts = findCalendarOrderConflicts(dto, ordersForClientCheck);
        if (conflicts.length > 0) {
          addAlert({
            severity: "error",
            message: formatCalendarConflictMessage(conflicts),
            autoHideDuration: null,
          });
          return;
        }
      }

      await updateCalendar.mutateAsync({ storeId, request: dto });
    },
    [storeId, updateCalendar, addAlert],
  );

  const toggleBasicDraftWeekly = (day: number) => {
    setBasicDraftWeeklyOff((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  };

  const handleCancelBasic = () => {
    setBasicDraftWeeklyOff(cloneWeekdaySet(weeklyOffDays));
    setBasicDraftStart(standardStart);
    setBasicDraftEnd(standardEnd);
  };

  const handleSaveBasic = async () => {
    if (!storeId) return;
    try {
      await persistCalendar(basicDraftWeeklyOff, basicDraftStart, basicDraftEnd, overrides);
    } catch {
      /* 알림은 뮤테이션 onError */
    }
  };

  const firstWeekday = new Date(year, month, 1).getDay();
  const dim = daysInMonth(monthCursor);

  const ordersForSelectedDay = React.useMemo(() => {
    if (!selectedKey) return [];
    return ordersByDateKey.get(selectedKey) ?? [];
  }, [selectedKey, ordersByDateKey]);

  const ordersLoading = monthOrdersLoading;
  const ordersError = monthOrdersError;

  const cells: ({ key: string; day: number } | null)[] = [];
  for (let i = 0; i < firstWeekday; i += 1) cells.push(null);
  for (let day = 1; day <= dim; day += 1) {
    const d = new Date(year, month, day);
    cells.push({ key: toDateKey(d), day });
  }

  const goPrevMonth = () => setMonthCursor(new Date(year, month - 1, 1));
  const goNextMonth = () => setMonthCursor(new Date(year, month + 1, 1));

  const runDetailPersist = React.useCallback(
    (nextOverrides: Record<string, DayOverride>, ordersForClientCheck: OrderResponseDto[]) => {
      void (async () => {
        try {
          await persistCalendar(
            weeklyOffDays,
            standardStart,
            standardEnd,
            nextOverrides,
            ordersForClientCheck,
          );
        } catch {
          /* onError */
        }
      })();
    },
    [persistCalendar, weeklyOffDays, standardStart, standardEnd],
  );

  const draftOverrides = React.useMemo(() => {
    if (!selectedKey) return overrides;
    return computeNextOverridesMap(
      overrides,
      selectedKey,
      draftOpen,
      draftStart,
      draftEnd,
      weeklyOff,
      standardStart,
      standardEnd,
    );
  }, [
    selectedKey,
    overrides,
    draftOpen,
    draftStart,
    draftEnd,
    weeklyOff,
    standardStart,
    standardEnd,
  ]);

  const detailSaveConflicts = React.useMemo(() => {
    if (!selectedKey) return [];
    const dto = toStoreBusinessCalendarDto(
      weeklyOffDays,
      standardStart,
      standardEnd,
      draftOverrides,
    );
    return findCalendarOrderConflicts(dto, ordersForSelectedDay);
  }, [
    selectedKey,
    weeklyOffDays,
    standardStart,
    standardEnd,
    draftOverrides,
    ordersForSelectedDay,
  ]);

  const detailSaveConflictMessage =
    detailSaveConflicts.length > 0 ? formatCalendarConflictMessage(detailSaveConflicts) : null;

  const handleSaveClick = () => {
    if (!selectedKey) return;
    runDetailPersist(draftOverrides, ordersForSelectedDay);
  };

  const handleCancelDetail = () => {
    syncDraftFromSelection();
  };

  const selectedDateLabel = selectedKey
    ? (() => {
        const d = parseDateKey(selectedKey);
        return `${d.getMonth() + 1}월 ${d.getDate()}일(${WEEKDAY_LABELS_KO[d.getDay()]})`;
      })()
    : "";

  const selectedUsesOverride = selectedKey ? Boolean(overrides[selectedKey]) : false;

  const saving = updateCalendar.isPending;

  if (!storeId) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">스토어 캘린더</h1>
        <p className="text-muted-foreground">스토어가 선택되지 않았습니다.</p>
      </div>
    );
  }

  if (storeLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">스토어 캘린더</h1>
        <ContentLoading
          variant="page"
          message="스토어와 캘린더를 불러오는 중…"
          className="border-0 shadow-none"
        />
      </div>
    );
  }

  if (storeError || !store) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">스토어 캘린더</h1>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">스토어 캘린더</h1>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="basic">기본 운영 관리</TabsTrigger>
          <TabsTrigger value="calendar">캘린더</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="mt-6 space-y-6">
          <StoreNaverCalendarCard
            storeId={storeId}
            connected={store.naverPlace ?? null}
            current={{ weeklyOff: basicDraftWeeklyOff, start: basicDraftStart, end: basicDraftEnd }}
            onApply={(patch) => {
              if (patch.weeklyOff) setBasicDraftWeeklyOff(new Set(patch.weeklyOff));
              if (patch.start) setBasicDraftStart(patch.start);
              if (patch.end) setBasicDraftEnd(patch.end);
            }}
            disabled={saving}
          />
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">정기 휴무 설정</CardTitle>
              <p className="text-sm text-muted-foreground font-normal pt-1">
                체크한 요일은 달력에서 자동으로 &apos;휴무&apos;로 표시됩니다. 매주 반복됩니다.
              </p>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              {WEEKDAY_LABELS_KO.map((label, idx) => (
                <label
                  key={label}
                  className="flex cursor-pointer items-center gap-2 rounded-md border border-input px-3 py-2 text-sm shadow-sm hover:bg-accent/40"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-input"
                    checked={basicDraftWeeklyOff.has(idx)}
                    onChange={() => toggleBasicDraftWeekly(idx)}
                    disabled={saving}
                  />
                  <span>{label}요일 휴무</span>
                </label>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">표준 영업 시간</CardTitle>
              <p className="text-sm text-muted-foreground font-normal pt-1">
                00:00~00:00은 전일 영업(모든 시각)입니다. 그 외는 30분 단위이며 서버에 저장됩니다.
              </p>
            </CardHeader>
            <CardContent className="flex flex-wrap items-end gap-4">
              <div className="space-y-2 min-w-[140px]">
                <Label>시작 시간</Label>
                <Select
                  value={basicDraftStart}
                  onValueChange={setBasicDraftStart}
                  disabled={saving}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="시작" />
                  </SelectTrigger>
                  <SelectContent>
                    {HALF_HOUR_OPTIONS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <span className="pb-2 text-muted-foreground">~</span>
              <div className="space-y-2 min-w-[140px]">
                <Label>종료 시간</Label>
                <Select value={basicDraftEnd} onValueChange={setBasicDraftEnd} disabled={saving}>
                  <SelectTrigger>
                    <SelectValue placeholder="종료" />
                  </SelectTrigger>
                  <SelectContent>
                    {HALF_HOUR_OPTIONS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center gap-2 border-t pt-4">
            <Button type="button" variant="outline" onClick={handleCancelBasic} disabled={saving}>
              취소
            </Button>
            <Button type="button" onClick={() => void handleSaveBasic()} disabled={saving}>
              저장
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_minmax(280px,360px)]">
            <Card>
              <CardContent className="p-4 sm:p-5">
                <div className="mb-4 flex items-center justify-center gap-1">
                  <Button type="button" variant="ghost" size="icon" onClick={goPrevMonth}>
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <span className="text-xl font-semibold">
                    {year}년 {month + 1}월
                  </span>
                  <Button type="button" variant="ghost" size="icon" onClick={goNextMonth}>
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
                <div className="mb-2 grid grid-cols-7 gap-1.5 text-center text-sm font-semibold text-muted-foreground">
                  {WEEKDAY_LABELS_KO.map((d) => (
                    <div key={d} className="py-1.5">
                      {d}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                  {cells.map((cell, i) => {
                    if (!cell) {
                      return <div key={`empty-${i}`} className="min-h-[6.5rem] sm:min-h-[7rem]" />;
                    }
                    const eff = effectiveForDate(
                      cell.key,
                      weeklyOff,
                      standardStart,
                      standardEnd,
                      overrides,
                    );
                    const hasOverride = Boolean(overrides[cell.key]);
                    const isSelected = selectedKey === cell.key;
                    const dayOrders = ordersByDateKey.get(cell.key) ?? [];
                    const previewOrders = dayOrders.slice(0, 2);
                    const hiddenOrderCount = dayOrders.length - previewOrders.length;
                    return (
                      <button
                        key={cell.key}
                        type="button"
                        onClick={() => setSelectedKey(cell.key)}
                        className={[
                          "flex min-h-[6.5rem] flex-col rounded-md border p-2 text-left transition-colors sm:min-h-[7rem] sm:p-2.5",
                          isSelected
                            ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                            : "border-border hover:bg-accent/50",
                          !eff.isOpen ? "bg-zinc-100" : "",
                          dayOrders.length > 0 ? "border-blue-200/80" : "",
                        ].join(" ")}
                      >
                        <span className="text-lg font-semibold leading-none tabular-nums sm:text-xl">
                          {cell.day}
                        </span>
                        <div className="mt-auto flex flex-col gap-1 pt-1">
                          <span
                            className={[
                              "text-xs font-semibold leading-tight sm:text-sm",
                              hasOverride ? "text-primary" : "text-muted-foreground",
                            ].join(" ")}
                          >
                            {hasOverride ? "개별 설정" : "기본 운영"}
                          </span>
                          <span
                            className={[
                              "text-xs font-medium leading-tight sm:text-sm",
                              eff.isOpen ? "text-emerald-700" : "text-rose-600",
                            ].join(" ")}
                          >
                            {formatBusinessHoursShortLabel(eff.isOpen, eff.start, eff.end)}
                          </span>
                          {dayOrders.length > 0 ? (
                            <div className="mt-0.5 flex flex-col gap-0.5 border-t border-border/60 pt-1">
                              <span className="text-[10px] font-semibold leading-tight text-blue-700 sm:text-xs">
                                예약 {dayOrders.length}건
                              </span>
                              {previewOrders.map((order) => (
                                <span
                                  key={order.id}
                                  className={`${NO_REPLAY} truncate text-[10px] leading-tight text-foreground/85 sm:text-xs`}
                                  title={`${formatSeoulPickupHm(order.pickupDate)} ${reservationDisplayName(order)} ${reservationDisplayPhone(order)}`}
                                >
                                  {formatSeoulPickupHm(order.pickupDate)}{" "}
                                  {reservationDisplayName(order)}
                                </span>
                              ))}
                              {hiddenOrderCount > 0 ? (
                                <span className="text-[10px] leading-tight text-muted-foreground sm:text-xs">
                                  +{hiddenOrderCount}건 더
                                </span>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="min-h-[420px]">
              <CardHeader>
                <CardTitle className="text-lg">
                  {selectedKey ? `${selectedDateLabel} 상세 설정` : "날짜를 선택하세요"}
                </CardTitle>
                {selectedKey && (
                  <p
                    className={[
                      "pt-2 text-sm font-medium",
                      selectedUsesOverride ? "text-primary" : "text-muted-foreground",
                    ].join(" ")}
                  >
                    {selectedUsesOverride
                      ? "이 날짜는 개별 설정이 적용된 상태입니다."
                      : "이 날짜는 기본 운영(정기 휴무·표준 영업 시간)이 적용됩니다."}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                {selectedKey ? (
                  <>
                    <div className="space-y-3 border-b border-border pb-6">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <Label className="text-base font-medium">예약</Label>
                        <span className="text-sm text-muted-foreground">
                          {ordersLoading ? "…" : `${ordersForSelectedDay.length}건`}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        픽업 예정일이 이 날짜(서울 기준)인 주문입니다. 항목을 누르면 주문 상세로
                        이동합니다.
                      </p>
                      {!ordersLoading && !ordersError && ordersForSelectedDay.length === 0 ? (
                        <p className="rounded-md border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
                          이 날짜에 해당하는 픽업 예약이 없습니다.
                        </p>
                      ) : null}
                      {!ordersLoading && !ordersError && ordersForSelectedDay.length > 0 ? (
                        <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
                          {ordersForSelectedDay.map((o) => (
                            <li key={o.id}>
                              <Link
                                to={ROUTES.STORE_DETAIL_ORDERS_DETAIL(storeId, o.id)}
                                className="block cursor-pointer rounded-lg border border-border/80 bg-card px-4 py-3.5 shadow-sm outline-none ring-offset-background transition-colors hover:border-border hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                              >
                                <p className="line-clamp-2 text-[0.9375rem] font-semibold leading-snug text-foreground">
                                  {o.productName}
                                </p>
                                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                                  <span className="inline-flex items-center rounded-md border border-border/60 bg-muted/50 px-2 py-0.5 text-xs font-medium tabular-nums text-foreground">
                                    픽업 {formatSeoulPickupHm(o.pickupDate)}
                                  </span>
                                  <StatusBadge variant={getOrderStatusBadgeVariant(o.orderStatus)}>
                                    {getOrderStatusLabel(o.orderStatus)}
                                  </StatusBadge>
                                </div>
                                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-border/60 pt-3 text-xs sm:grid-cols-3">
                                  <div className="min-w-0 sm:col-span-1">
                                    <dt className="text-muted-foreground">예약자명</dt>
                                    <dd
                                      className={`${NO_REPLAY} mt-0.5 truncate font-medium text-foreground`}
                                    >
                                      {reservationDisplayName(o)}
                                    </dd>
                                  </div>
                                  <div className="min-w-0 sm:col-span-1">
                                    <dt className="text-muted-foreground">휴대폰</dt>
                                    <dd
                                      className={`${NO_REPLAY} mt-0.5 truncate font-medium tabular-nums text-foreground`}
                                    >
                                      {reservationDisplayPhone(o)}
                                    </dd>
                                  </div>
                                  <div className="min-w-0 sm:col-span-1">
                                    <dt className="text-muted-foreground">주문번호</dt>
                                    <dd className="mt-0.5 truncate font-medium text-foreground">
                                      {o.orderNumber}
                                    </dd>
                                  </div>
                                  <div>
                                    <dt className="text-muted-foreground">수량</dt>
                                    <dd className="mt-0.5 font-medium tabular-nums text-foreground">
                                      {o.totalQuantity}개
                                    </dd>
                                  </div>
                                  <div className="col-span-2 sm:col-span-1">
                                    <dt className="text-muted-foreground">결제</dt>
                                    <dd className="mt-0.5 font-semibold tabular-nums text-foreground">
                                      {o.totalPrice.toLocaleString()}원
                                    </dd>
                                  </div>
                                </dl>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>

                    <div className="space-y-3">
                      <Label className="text-base font-medium">영업 여부</Label>
                      <p className="text-sm text-muted-foreground">저장 시 서버에 반영됩니다.</p>
                      {detailSaveConflictMessage ? (
                        <div
                          role="alert"
                          className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-relaxed text-rose-800 whitespace-pre-line"
                        >
                          {detailSaveConflictMessage}
                        </div>
                      ) : null}
                      <div className="flex gap-4">
                        <label className="flex cursor-pointer items-center gap-2 text-base">
                          <input
                            type="radio"
                            name="biz"
                            checked={draftOpen}
                            onChange={() => setDraftOpen(true)}
                            className="h-4 w-4"
                            disabled={saving}
                          />
                          정상영업
                        </label>
                        <label className="flex cursor-pointer items-center gap-2 text-base">
                          <input
                            type="radio"
                            name="biz"
                            checked={!draftOpen}
                            onChange={() => setDraftOpen(false)}
                            className="h-4 w-4"
                            disabled={saving}
                          />
                          영업 휴무
                        </label>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-base font-medium">오늘의 영업 시간</Label>
                      <p className="text-sm text-muted-foreground">
                        00:00~00:00은 전일 영업으로 해석됩니다.
                      </p>
                      <div
                        className={`flex flex-wrap items-end gap-3 ${!draftOpen ? "opacity-40 pointer-events-none" : ""}`}
                      >
                        <div className="space-y-2 min-w-[120px] flex-1">
                          <Select
                            value={draftStart}
                            onValueChange={setDraftStart}
                            disabled={!draftOpen || saving}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {HALF_HOUR_OPTIONS.map((t) => (
                                <SelectItem key={t} value={t}>
                                  {t}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <span className="pb-2 text-muted-foreground">~</span>
                        <div className="space-y-2 min-w-[120px] flex-1">
                          <Select
                            value={draftEnd}
                            onValueChange={setDraftEnd}
                            disabled={!draftOpen || saving}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {HALF_HOUR_OPTIONS.map((t) => (
                                <SelectItem key={t} value={t}>
                                  {t}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-center gap-2 border-t pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancelDetail}
                        disabled={saving}
                      >
                        취소
                      </Button>
                      <Button
                        type="button"
                        onClick={handleSaveClick}
                        disabled={saving || detailSaveConflicts.length > 0}
                      >
                        저장
                      </Button>
                    </div>
                  </>
                ) : (
                  <p className="text-base text-muted-foreground py-8 text-center">
                    캘린더에서 날짜를 눌러 상세 설정을 열 수 있습니다.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
