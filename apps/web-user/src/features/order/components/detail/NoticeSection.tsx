import { OrderDetailSectionTitle } from "./OrderDetailSectionTitle";
import type { RefundCancellationPolicy } from "@/apps/web-user/features/store/types/store.type";
import { RefundRulesTable } from "@/apps/web-user/features/order/components/RefundRulesTable";

interface NoticeSectionProps {
  /** 판매자 환불·취소 규정. 없으면 안내 박스만 비워서 노출 */
  refundCancellationPolicy?: RefundCancellationPolicy;
  /** 견적으로 만든 예약(기획 I-01): 옵션이 없어 날짜 변경 규정만 */
  isQuote?: boolean;
}

export function NoticeSection({ refundCancellationPolicy, isQuote = false }: NoticeSectionProps) {
  return (
    <section className="px-5">
      <OrderDetailSectionTitle>안내 사항</OrderDetailSectionTitle>
      <div className="flex flex-col gap-5 mb-16 p-4 bg-gray-50 rounded-lg">
        <div>
          <h3 className="text-2sm font-bold text-gray-900 mb-2.5">환불/취소 규정</h3>
          <RefundRulesTable policy={refundCancellationPolicy} />
        </div>
        <div>
          <h3 className="text-2sm font-bold text-gray-900 mb-1">노쇼 정책</h3>
          <p className="text-2sm text-gray-900">노쇼하면 서비스 이용이 제한될 수 있어요.</p>
        </div>
        <div>
          <h3 className="text-2sm font-bold text-gray-900 mb-1">
            {isQuote ? "날짜 변경 규정" : "날짜 및 옵션 변경 규정"}
          </h3>
          <p className="text-2sm text-gray-900">
            {isQuote
              ? "픽업 날짜는 예약신청 상태에서만 바꿀 수 있어요. 케이크 내용은 채팅으로 가게와 정해요."
              : "옵션은 예약신청 상태에서만 바꿀 수 있어요."}
          </p>
          <p className="text-2sm text-gray-900">
            예약 상태: 예약신청 → 입금대기 → 입금완료 → 예약확정
          </p>
        </div>
      </div>
    </section>
  );
}
