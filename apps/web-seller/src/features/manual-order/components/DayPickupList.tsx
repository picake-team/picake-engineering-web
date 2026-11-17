/**
 * 그날 픽업 목록(홈 고른 날·캘린더 고른 날): Picake 주문과 직접 적은 주문(기획 I-42)을 시각 순으로.
 * 불러오는 동안 회색 뼈대, Picake 주문을 못 불러오면 다시 시도, 없으면 한 줄.
 * 직접 적은 주문만 못 불러오면 Picake 주문은 보이고 그 아래에 다시 시도.
 */
import { LoadErrorState } from "@/apps/web-seller/common/ui/Surface";
import { PickupRow } from "@/apps/web-seller/features/order/components/mobile/OrderCards";
import { ManualPickupRow } from "@/apps/web-seller/features/manual-order/components/ManualPickupRow";
import type { mergeDayPickups } from "@/apps/web-seller/features/manual-order/utils/day-pickups.util";

export function DayPickupList({
  pickups,
  loaded,
  ordersFailed,
  manualFailed,
  onRetryOrders,
  onRetryManual,
  emptyText,
  emptyClassName,
  listClassName,
}: {
  pickups: ReturnType<typeof mergeDayPickups>;
  loaded: boolean;
  ordersFailed: boolean;
  manualFailed: boolean;
  onRetryOrders: () => void;
  onRetryManual: () => void;
  emptyText: string;
  emptyClassName?: string;
  listClassName?: string;
}) {
  if (ordersFailed) return <LoadErrorState onRetry={onRetryOrders} />;
  // 불러오는 동안은 회색 뼈대(글자 "불러오는 중…" 대신, 다른 화면과 같게)
  if (!loaded) {
    return <span className="block h-16 animate-pulse rounded-card bg-ink-50" aria-busy="true" />;
  }
  const manualRetry = manualFailed ? (
    <LoadErrorState title="직접 적은 주문을 불러오지 못했어요" onRetry={onRetryManual} />
  ) : null;
  if (pickups.length === 0) {
    return manualRetry ?? <p className={emptyClassName}>{emptyText}</p>;
  }
  return (
    <>
      <div className={listClassName}>
        {pickups.map((p, i) =>
          p.kind === "order" ? (
            <PickupRow key={p.id} order={p.order} last={i === pickups.length - 1} />
          ) : (
            <ManualPickupRow key={p.id} manual={p.manual} last={i === pickups.length - 1} />
          ),
        )}
      </div>
      {manualRetry}
    </>
  );
}
