/**
 * 그날 픽업 목록의 직접 적은 주문 한 줄(기획 I-42). Picake 주문 줄(PickupRow)과 같은 모양:
 * 시각(없으면 회색 "미정") · 케이크 · 손님(· 입금 전) · 오른쪽은 상태 대신 받은 곳(회색 테두리 알약)
 */
import { Link } from "react-router-dom";
import { cx } from "@/apps/web-seller/common/ui/cx";
import { StatusPill } from "@/apps/web-seller/common/ui/Badge";
import { ROUTES } from "@/apps/web-seller/common/constants/route-paths.constant";
import { NO_REPLAY } from "@/apps/web-seller/common/constants/replay.constant";
import { MANUAL_ORDER_SOURCE_LABEL } from "@/apps/web-seller/features/manual-order/constants/manual-order.constant";
import type { ManualOrderDto } from "@/apps/web-seller/features/manual-order/types/manual-order.dto";

export function ManualPickupRow({ manual, last }: { manual: ManualOrderDto; last?: boolean }) {
  const sub = manual.customerName?.trim() || "";
  return (
    <Link
      to={ROUTES.STORE_DETAIL_MANUAL_ORDER_DETAIL(manual.storeId, manual.id)}
      className={cx(
        "flex min-h-14 items-center gap-3 active:bg-ink-50",
        !last && "border-b border-ink-100",
      )}
    >
      <span
        className={cx(
          "w-[52px] shrink-0 text-body tabular-nums",
          manual.pickupTime ? "font-bold text-ink-900" : "font-semibold text-ink-600",
        )}
      >
        {manual.pickupTime ?? "미정"}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="line-clamp-2 text-body font-semibold text-ink-900 [overflow-wrap:anywhere]">
          {manual.cakeName}
        </span>
        {sub || manual.paid === false || manual.enteredByOperator ? (
          // 띄어쓰기 없는 인스타 아이디(50자)도 받은 곳 칸을 밀지 않게 한 줄로 줄인다
          <span className="truncate text-sub text-ink-600">
            {/* 운영자가 가게 대신 적은 주문(기획 I-41) — 긴 이름 뒤에서 잘리지 않게 맨 앞에 */}
            {manual.enteredByOperator ? (
              <>
                운영자 입력
                {sub || manual.paid === false ? " · " : null}
              </>
            ) : null}
            {sub ? <span className={NO_REPLAY}>{sub}</span> : null}
            {sub && manual.paid === false ? " · " : null}
            {manual.paid === false ? (
              <span className="font-semibold text-brand-ink">입금 전</span>
            ) : null}
          </span>
        ) : null}
      </span>
      <StatusPill tone="done">{MANUAL_ORDER_SOURCE_LABEL[manual.source]}</StatusPill>
    </Link>
  );
}
