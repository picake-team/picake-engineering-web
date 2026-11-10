/**
 * 휴대폰 주문 통계 (SC-92, 디자인 A92). 기간 빠른 선택(오늘·최근 7일·이번주·이번달·최근 90일 = PC "누적")과 직접 고르기,
 * 매출·주문건수, 잘 팔린 상품(매출 순·주문건수 순), 요일·시간대 그래프는 접어 둔다.
 * 고른 기간은 늘 고르는 칸(PickerButton)에 보이고, 누르면 앱 달력 창(DateRangeSheet)에서 직접 고른다(휴대폰 기본 날짜 창은 앱 디자인과 달라 쓰지 않음).
 * 집계된 주문이 없으면 남은 칸 가운데에 빈 화면(주문 탭과 같은 모양).
 * 세는 기준은 지금 PC와 같다(주문 접수일 기준, 픽업 완료한 주문만).
 */
import React, { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { AppScreen, BackHeader } from "@/apps/web-seller/common/ui/Screen";
import { ChipGroup, SegmentedTabs } from "@/apps/web-seller/common/ui/Choice";
import { GroupTitle } from "@/apps/web-seller/common/ui/List";
import { PickerButton } from "@/apps/web-seller/common/ui/Field";
import { DateRangeSheet } from "@/apps/web-seller/common/ui/DateRangeSheet";
import { EmptyState, LoadErrorState } from "@/apps/web-seller/common/ui/Surface";
import { Icon } from "@/apps/web-seller/common/ui/icons";
import { cx } from "@/apps/web-seller/common/ui/cx";
import {
  addDaysToKey,
  formatKeyMonthDayWeek,
  kstDateKey,
  mondayOfKey,
} from "@/apps/web-seller/common/utils/kst-date.util";
import { useStatisticsOverviewQuery } from "@/apps/web-seller/features/statistics/hooks/queries/useStatisticsOverviewQuery";
import {
  STATISTICS_ACCUMULATED_DAY_OFFSET,
  STATISTICS_DEFAULT_DAY_OFFSET,
} from "@/apps/web-seller/features/statistics/constants/statistics.constant";
import type {
  OrderStatisticsHourlyDto,
  OrderStatisticsWeekdayDto,
} from "@/apps/web-seller/features/statistics/types/statistics.dto";
import { formatWon } from "@/apps/web-seller/features/order/utils/order-mobile.util";

type Preset = "today" | "recent7" | "week" | "month" | "recent90" | "custom";

function rangeFor(preset: Exclude<Preset, "custom">, today: string) {
  switch (preset) {
    case "today":
      return { start: today, end: today };
    case "recent7":
      return { start: addDaysToKey(today, STATISTICS_DEFAULT_DAY_OFFSET), end: today };
    case "week":
      return { start: mondayOfKey(today), end: today };
    case "month":
      return { start: `${today.slice(0, 8)}01`, end: today };
    case "recent90":
      return { start: addDaysToKey(today, STATISTICS_ACCUMULATED_DAY_OFFSET), end: today };
  }
}

function Bars({
  rows,
  format,
}: {
  rows: { key: string; label: string; value: number }[];
  format: (v: number) => string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="flex flex-col gap-3">
      {rows.map((r) => (
        <div key={r.key} className="flex flex-col gap-2">
          <span className="flex justify-between gap-3 text-body text-ink-900">
            <span className="min-w-0 truncate">{r.label}</span>
            <b className="shrink-0 tabular-nums">{format(r.value)}</b>
          </span>
          <span className="block h-2 overflow-hidden rounded-check bg-ink-50" aria-hidden="true">
            <span
              className="block h-full bg-brand"
              style={{ width: `${(r.value / max) * 100}%` }}
            />
          </span>
        </div>
      ))}
    </div>
  );
}

function ColumnChart({
  title,
  values,
  labels,
}: {
  title: string;
  values: number[];
  labels: string[];
}) {
  const max = Math.max(1, ...values);
  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="text-sub font-bold text-ink-700">{title}</figcaption>
      <div
        className="flex h-24 items-end gap-0.5"
        role="img"
        aria-label={`${title}: ${labels.map((l, i) => `${l} ${values[i]}`).join(", ")}`}
      >
        {values.map((v, i) => (
          <span key={i} className="flex h-full min-w-0 flex-1 items-end">
            <span
              className={cx("block w-full rounded-t-[3px]", v > 0 ? "bg-brand" : "bg-ink-100")}
              style={{ height: `${Math.max(4, (v / max) * 100)}%` }}
            />
          </span>
        ))}
      </div>
      <div className="flex justify-between text-tab text-ink-600" aria-hidden="true">
        {labels.length === 7 ? (
          labels.map((l) => <span key={l}>{l}</span>)
        ) : (
          <>
            <span>0시</span>
            <span>12시</span>
            <span>23시</span>
          </>
        )}
      </div>
    </figure>
  );
}

function weekdayValues(rows: OrderStatisticsWeekdayDto[]) {
  const sorted = [...rows].sort((a, b) => a.weekday - b.weekday);
  return { values: sorted.map((r) => r.total), labels: sorted.map((r) => r.label.slice(0, 1)) };
}

function hourlyValues(rows: OrderStatisticsHourlyDto[]) {
  const out = Array.from({ length: 24 }, () => 0);
  for (const r of rows) if (r.hour >= 0 && r.hour < 24) out[r.hour] = r.count;
  return out;
}

export const StoreDetailStatisticsMobilePage: React.FC = () => {
  const { storeId = "" } = useParams<{ storeId: string }>();
  const [params] = useSearchParams();
  const [today] = useState(() => kstDateKey(new Date()));
  // 처음엔 오늘 포함 최근 7일(지금 PC와 같음, 칩 "최근 7일"이 켜짐), 홈 "이번 주 매출"에서 오면 이번주
  const [preset, setPreset] = useState<Preset>(params.get("range") === "week" ? "week" : "recent7");
  const [range, setRange] = useState(() =>
    rangeFor(params.get("range") === "week" ? "week" : "recent7", today),
  );
  const [sheetOpen, setSheetOpen] = useState(false);
  const [rankBy, setRankBy] = useState<"revenue" | "orders">("revenue");
  const [chartsOpen, setChartsOpen] = useState(false);

  const q = useStatisticsOverviewQuery({ storeId, startDate: range.start, endDate: range.end });
  const data = q.data;
  const empty = data && data.totalOrders === 0;

  const pick = (p: Preset) => {
    // 직접 고르기는 창에서 "이 기간 보기"를 눌러야 바뀐다(닫으면 그대로)
    if (p === "custom") {
      setSheetOpen(true);
      return;
    }
    setPreset(p);
    setRange(rangeFor(p, today));
  };
  // 하루면 날짜 하나만(설명 줄이 두 줄로 꺾이지 않게)
  const rangeText =
    range.start === range.end
      ? formatKeyMonthDayWeek(range.start)
      : `${formatKeyMonthDayWeek(range.start)} ~ ${formatKeyMonthDayWeek(range.end)}`;

  const products = rankBy === "revenue" ? data?.topProductsByRevenue : data?.topProductsByOrders;

  return (
    <AppScreen header={<BackHeader title="주문 통계" />} bodyClassName="pt-2">
      <ChipGroup
        scroll
        label="기간"
        value={preset}
        onChange={pick}
        options={[
          { value: "today", label: "오늘" },
          { value: "recent7", label: "최근 7일" },
          { value: "week", label: "이번주" },
          { value: "month", label: "이번달" },
          { value: "recent90", label: "최근 90일" },
          { value: "custom", label: "직접 고르기" },
        ]}
      />
      {/* 고른 기간은 늘 고르는 칸에 보이고, 누르면 달력 창(고르면 "직접 고르기"로) */}
      <PickerButton aria-label="기간 고르기" value={rangeText} onClick={() => setSheetOpen(true)} />
      <p className="text-caption leading-normal text-ink-600">
        픽업 완료한 주문만, 주문받은 날 기준으로 세어요
      </p>
      <DateRangeSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        start={range.start}
        end={range.end}
        max={today}
        onApply={(start, end) => {
          setPreset("custom");
          setRange({ start, end });
          setSheetOpen(false);
        }}
      />

      {q.isError && !q.data ? (
        <LoadErrorState big onRetry={() => void q.refetch()} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "매출", value: data ? formatWon(data.totalSales) : "–" },
              {
                label: "주문 수",
                value: data ? `${data.totalOrders.toLocaleString("ko-KR")}건` : "–",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="flex flex-col gap-1 rounded-card border border-ink-100 p-4"
              >
                <span className="text-sub text-ink-600">{s.label}</span>
                <span className="text-title font-bold tabular-nums text-ink-900">{s.value}</span>
              </div>
            ))}
          </div>
          {empty ? (
            <EmptyState
              big
              title="이 기간에 픽업 완료한 주문이 없어요"
              description="다른 기간을 골라 보세요"
            />
          ) : data ? (
            <>
              <GroupTitle>잘 팔린 상품</GroupTitle>
              <SegmentedTabs
                label="상품 순위 기준"
                value={rankBy}
                onChange={setRankBy}
                options={[
                  { value: "revenue", label: "매출 순" },
                  { value: "orders", label: "주문 수 순" },
                ]}
              />
              <Bars
                rows={(products ?? []).map((p) => ({
                  key: p.productId,
                  label: p.productName,
                  value: rankBy === "revenue" ? p.revenue : p.orderCount,
                }))}
                format={(v) => (rankBy === "revenue" ? formatWon(v) : `${v}건`)}
              />
              <button
                type="button"
                aria-expanded={chartsOpen}
                onClick={() => setChartsOpen((v) => !v)}
                className="flex min-h-13 items-center gap-3 border-b border-ink-100 text-left"
              >
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="text-body font-semibold text-ink-900">
                    언제 주문·픽업이 많은지
                  </span>
                  <span className="text-caption text-ink-600">요일별·시간대별 주문과 픽업</span>
                </span>
                <span
                  className={cx(
                    "shrink-0 text-ink-400 transition-transform",
                    chartsOpen && "rotate-180",
                  )}
                >
                  <Icon name="chevronDown" size={18} strokeWidth={2} />
                </span>
              </button>
              {chartsOpen ? (
                <div className="flex flex-col gap-6">
                  <ColumnChart
                    title="요일별 주문(접수 기준)"
                    {...weekdayValues(data.weekdayOrders)}
                  />
                  <ColumnChart
                    title="시간대별 주문(접수 기준)"
                    values={hourlyValues(data.hourlyOrders)}
                    labels={[]}
                  />
                  <ColumnChart
                    title="요일별 픽업(픽업 예정 기준)"
                    {...weekdayValues(data.weekdayPickupOrders)}
                  />
                  <ColumnChart
                    title="시간대별 픽업(픽업 예정 기준)"
                    values={hourlyValues(data.hourlyPickupOrders)}
                    labels={[]}
                  />
                </div>
              ) : null}
            </>
          ) : (
            <span className="block h-40 animate-pulse rounded-card bg-ink-50" aria-busy="true" />
          )}
        </>
      )}
    </AppScreen>
  );
};
