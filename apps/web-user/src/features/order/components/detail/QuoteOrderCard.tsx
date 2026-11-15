import Link from "next/link";
import { Icon } from "@/apps/web-user/common/components/icons";
import { PATHS } from "@/apps/web-user/common/constants/paths.constant";
import { cn } from "@/apps/web-user/common/lib/utils";
import { NO_REPLAY } from "@/apps/web-user/common/constants/replay.constant";
import { OrderStatusBadge } from "@/apps/web-user/features/order/components/OrderStatusBadge";
import { OrderStatus, type OrderResponse } from "@/apps/web-user/features/order/types/order.type";

/**
 * 견적으로 만든 예약(기획 I-01)의 "예약 상품" 칸. 상품 대신 가게 견적(금액·비슷한 정도·사장님 메모)과
 * 요청서 요약을 보여 주고, 견적 화면으로 잇는다.
 */
export function QuoteOrderCard({
  order,
  hideCancelDetailButton = false,
}: {
  order: OrderResponse;
  /** 취소 상세 화면 안에서는 "취소 상세"를 숨긴다 */
  hideCancelDetailButton?: boolean;
}) {
  const q = order.quote;
  if (!q) return null;
  // 견적 예약은 주문 상품 줄이 없어 상품 카드의 배지·"취소 상세"가 안 보이던 것을 여기서 보인다(11-15 검토)
  const isCancelled =
    order.orderStatus === OrderStatus.CANCEL_REFUND_PENDING ||
    order.orderStatus === OrderStatus.CANCEL_REFUND_COMPLETED ||
    order.orderStatus === OrderStatus.CANCEL_COMPLETED;
  const image = q.quotePhotoUrls[0] ?? order.productImages[0] ?? null;
  return (
    <div className="mb-3 rounded-lg border border-gray-100 bg-gray-50 p-[12px]">
      <div className="flex gap-[12px]">
        <div className="h-[64px] w-[64px] shrink-0 overflow-hidden rounded-lg bg-white">
          {image ? (
            <img src={image} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Icon name="logoPicake" width={32} height={32} />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <OrderStatusBadge status={order.orderStatus} />
            <p className="min-w-0 text-sm font-bold text-gray-900 [overflow-wrap:anywhere]">
              {order.productName}
            </p>
          </div>
          <p className="mt-[2px] text-xs text-gray-500">
            {order.totalQuantity}개 · {order.totalPrice.toLocaleString("ko-KR")}원 ·{" "}
            {q.similarityLabel}
          </p>
          {q.memo && (
            <p className="mt-[6px] whitespace-pre-wrap text-xs text-gray-700">
              <span className="font-bold text-gray-500">사장님 메모 </span>
              {q.memo}
            </p>
          )}
        </div>
      </div>
      {q.description && (
        <p
          className={cn(
            "mt-[10px] line-clamp-3 whitespace-pre-wrap rounded-lg bg-white px-[10px] py-[8px] text-xs text-gray-700",
            NO_REPLAY,
          )}
        >
          {q.description}
        </p>
      )}
      <div className="flex items-center justify-between">
        <Link
          href={PATHS.QUOTE.DETAIL(q.quoteRequestId)}
          className="-mb-[8px] mt-[2px] inline-block py-[8px] text-xs font-bold text-gray-900"
        >
          견적 요청 보기 ›
        </Link>
        {isCancelled && !hideCancelDetailButton && (
          <Link
            href={PATHS.ORDER.CANCEL_DETAIL(order.id)}
            className="-mb-[8px] mt-[2px] inline-block py-[8px] text-xs font-bold text-gray-500 underline"
          >
            취소 상세
          </Link>
        )}
      </div>
    </div>
  );
}
