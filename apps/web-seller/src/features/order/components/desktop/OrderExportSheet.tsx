/**
 * 주문·매출 엑셀 내려받기 창(PC에만, 기획 I-54). 픽업 날 기준 기간을 골라 Picake 주문 + 직접 적은 주문을 한 파일로.
 * 내용(칸·휴대폰 번호 빼기)은 order-export.util이 정한다.
 */
import { useState } from "react";
import { BottomSheet } from "@/apps/web-seller/common/ui/Sheet";
import { Button, ButtonPair } from "@/apps/web-seller/common/ui/Button";
import { ChipGroup } from "@/apps/web-seller/common/ui/Choice";
import { DateRangeSheet } from "@/apps/web-seller/common/ui/DateRangeSheet";
import { useAlertStore } from "@/apps/web-seller/common/store/alert.store";
import {
  formatKeyMonthDayWeek,
  monthEndKey,
  monthStartKey,
  shiftMonthKey,
} from "@/apps/web-seller/common/utils/kst-date.util";
import { useKstTodayKey } from "@/apps/web-seller/common/hooks/useKstTodayKey";
import { orderApi } from "@/apps/web-seller/features/order/apis/order.api";
import {
  OrderSortBy,
  type OrderResponseDto,
} from "@/apps/web-seller/features/order/types/order.dto";
import { manualOrderApi } from "@/apps/web-seller/features/manual-order/apis/manual-order.api";
import type { ManualOrderDto } from "@/apps/web-seller/features/manual-order/types/manual-order.dto";
import {
  buildOrdersCsv,
  downloadCsv,
  exportFileName,
  splitDateRange,
} from "@/apps/web-seller/features/order/utils/order-export.util";
import { trackSellerEvent } from "@/apps/web-seller/common/utils/analytics.util";

type Preset = "thisMonth" | "lastMonth" | "last3" | "custom";

const PAGE = 100;
/** 한 번에 받는 최대 주문 수(서버 부담을 막는 안전장치). 넘으면 일부만 담지 않고 기간을 줄여 달라고 한다 */
const MAX_PAGES = 50;
/** 직접 적은 주문 목록을 한 번에 물을 수 있는 날 수(서버 MANUAL_ORDER_LIMITS.LIST_MAX_DAYS) */
const MANUAL_LIST_MAX_DAYS = 62;

class TooManyOrdersError extends Error {}

function rangeForPreset(preset: Exclude<Preset, "custom">, todayKey: string) {
  const thisMonth = monthStartKey(todayKey);
  if (preset === "thisMonth") return { start: thisMonth, end: monthEndKey(thisMonth) };
  if (preset === "lastMonth") {
    const last = shiftMonthKey(thisMonth, -1);
    return { start: last, end: monthEndKey(last) };
  }
  const start = shiftMonthKey(thisMonth, -2);
  return { start, end: monthEndKey(thisMonth) };
}

async function fetchAllOrders(
  storeId: string,
  start: string,
  end: string,
): Promise<OrderResponseDto[]> {
  const out: OrderResponseDto[] = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const res = await orderApi.getOrders({
      page,
      limit: PAGE,
      sortBy: OrderSortBy.LATEST,
      storeId,
      pickupStartDate: start,
      pickupEndDate: end,
    });
    out.push(...res.data);
    if (!res.meta?.hasNext) return out;
  }
  // 5,000건을 넘으면 일부만 담긴 장부가 되지 않게 멈춘다
  throw new TooManyOrdersError();
}

/** 직접 적은 주문: 62일씩 나눠 받아 합친다(실패하면 빠진 채로 만들지 않게 그대로 던진다) */
async function fetchAllManualOrders(
  storeId: string,
  start: string,
  end: string,
): Promise<ManualOrderDto[]> {
  const out: ManualOrderDto[] = [];
  for (const r of splitDateRange(start, end, MANUAL_LIST_MAX_DAYS)) {
    out.push(...(await manualOrderApi.list(storeId, r.start, r.end)));
  }
  return out;
}

export function OrderExportSheet({
  open,
  onClose,
  storeId,
  storeName,
}: {
  open: boolean;
  onClose: () => void;
  storeId: string;
  storeName: string;
}) {
  const todayKey = useKstTodayKey();
  const [preset, setPreset] = useState<Preset>("thisMonth");
  const [custom, setCustom] = useState<{ start: string; end: string } | null>(null);
  const [rangeOpen, setRangeOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const range = preset === "custom" ? custom : rangeForPreset(preset, todayKey);

  const run = async () => {
    if (!range) return;
    setBusy(true);
    try {
      const [orders, manuals] = await Promise.all([
        fetchAllOrders(storeId, range.start, range.end),
        fetchAllManualOrders(storeId, range.start, range.end),
      ]);
      downloadCsv(
        exportFileName(storeName, range.start, range.end),
        buildOrdersCsv(orders, manuals),
      );
      // 사용량만(운영자 결정 2026-11-20): 기간 종류·날 수·건수. 같은 주문이 두 쪽에 걸쳐 올 수 있어 id로 센다
      trackSellerEvent("success_order_export", {
        range_preset: preset,
        days: Math.round((Date.parse(range.end) - Date.parse(range.start)) / 86_400_000) + 1,
        order_count: new Set(orders.map((x) => x.id)).size,
        manual_order_count: new Set(manuals.map((x) => x.id)).size,
        surface: "pc",
      });
      onClose();
    } catch (e) {
      useAlertStore.getState().addAlert({
        severity: "error",
        message:
          e instanceof TooManyOrdersError
            ? "주문이 너무 많아요. 기간을 나눠 내려받아 주세요"
            : "엑셀 파일을 만들지 못했어요. 잠시 뒤 다시 해 주세요",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <BottomSheet
        open={open && !rangeOpen}
        onClose={onClose}
        dismissible={!busy}
        title="엑셀 내려받기"
        footer={
          <ButtonPair>
            <Button variant="secondary" onClick={onClose} disabled={busy}>
              돌아가기
            </Button>
            <Button
              onClick={() => void run()}
              disabled={!range}
              loading={busy}
              loadingLabel="만드는 중"
            >
              내려받기
            </Button>
          </ButtonPair>
        }
      >
        <div className="flex flex-col gap-3">
          <p className="text-sub font-bold text-ink-700">픽업 날</p>
          <ChipGroup
            label="기간"
            value={preset}
            onChange={(v) => {
              setPreset(v);
              if (v === "custom") setRangeOpen(true);
            }}
            options={[
              { value: "thisMonth", label: "이번 달" },
              { value: "lastMonth", label: "지난달" },
              { value: "last3", label: "최근 3개월" },
              { value: "custom", label: "기간 고르기" },
            ]}
          />
          {range ? (
            <p className="text-sub tabular-nums text-ink-600">
              {formatKeyMonthDayWeek(range.start)} ~ {formatKeyMonthDayWeek(range.end)}
            </p>
          ) : null}
        </div>
      </BottomSheet>
      <DateRangeSheet
        open={open && rangeOpen}
        onClose={() => setRangeOpen(false)}
        start={custom?.start}
        end={custom?.end ?? todayKey}
        title="픽업 날 기간"
        applyLabel="이 기간으로"
        onApply={(start, end) => {
          setCustom({ start, end });
          setRangeOpen(false);
        }}
      />
    </>
  );
}
