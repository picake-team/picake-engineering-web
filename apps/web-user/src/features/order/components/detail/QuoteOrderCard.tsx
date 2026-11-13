import Link from "next/link";
import { Icon } from "@/apps/web-user/common/components/icons";
import { PATHS } from "@/apps/web-user/common/constants/paths.constant";
import { cn } from "@/apps/web-user/common/lib/utils";
import { NO_REPLAY } from "@/apps/web-user/common/constants/replay.constant";
import type { OrderResponse } from "@/apps/web-user/features/order/types/order.type";

/**
 * 견적으로 만든 예약(기획 I-01)의 "예약 상품" 칸. 상품 대신 가게 견적(금액·비슷한 정도·사장님 메모)과
 * 요청서 요약을 보여 주고, 견적 화면으로 잇는다.
 */
export function QuoteOrderCard({ order }: { order: OrderResponse }) {
  const q = order.quote;
  if (!q) return null;
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
          <p className="text-sm font-bold text-gray-900 [overflow-wrap:anywhere]">
            {order.productName}
          </p>
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
      <Link
        href={PATHS.QUOTE.DETAIL(q.quoteRequestId)}
        className="-mb-[8px] mt-[2px] inline-block py-[8px] text-xs font-bold text-gray-900"
      >
        견적 요청 보기 ›
      </Link>
    </div>
  );
}
