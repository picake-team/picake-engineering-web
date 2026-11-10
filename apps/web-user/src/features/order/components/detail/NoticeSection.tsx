import { OrderDetailSectionTitle } from "./OrderDetailSectionTitle";
import {
  formatRefundRulePeriodLabel,
  type RefundCancellationPolicy,
} from "@/apps/web-user/features/store/types/store.type";

interface NoticeSectionProps {
  /** 판매자 환불·취소 규정. 없으면 안내 박스만 비워서 노출 */
  refundCancellationPolicy?: RefundCancellationPolicy;
}

export function NoticeSection({ refundCancellationPolicy }: NoticeSectionProps) {
  const refundRules = refundCancellationPolicy?.rules ?? [];
  return (
    <section className="px-5">
      <OrderDetailSectionTitle>안내 사항</OrderDetailSectionTitle>
      <div className="flex flex-col gap-5 mb-16 p-4 bg-gray-50 rounded-lg">
        <div>
          <h3 className="text-2sm font-bold text-gray-900 mb-2.5">환불/취소 규정</h3>
          {refundRules.length === 0 ? (
            <p className="text-2sm text-gray-500">등록된 환불·취소 규정이 없어요.</p>
          ) : (
            <div className="rounded-lg border border-gray-100 bg-white overflow-hidden">
              {refundRules.map(({ daysBeforePickup, refundDescription }, index) => (
                <div
                  key={`${daysBeforePickup}-${index}`}
                  className="flex items-center text-2sm text-gray-900 border-b border-gray-100 last:border-b-0"
                >
                  <span className="w-[110px] px-4 py-3 text-gray-500 border-r border-gray-100 shrink-0">
                    {formatRefundRulePeriodLabel(daysBeforePickup)}
                  </span>
                  <span className="px-4 py-3 text-gray-900">{refundDescription}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <h3 className="text-2sm font-bold text-gray-900 mb-1">노쇼 정책</h3>
          <p className="text-2sm text-gray-900">노쇼하면 서비스 이용이 제한될 수 있어요.</p>
        </div>
        <div>
          <h3 className="text-2sm font-bold text-gray-900 mb-1">날짜 및 옵션 변경 규정</h3>
          <p className="text-2sm text-gray-900">옵션 변경은 예약신청 상태에서만 가능합니다.</p>
          <p className="text-2sm text-gray-900">
            예약 상태: 예약신청 → 입금대기 → 입금완료 → 예약확정
          </p>
        </div>
        <div>
          <h3 className="text-2sm font-bold text-gray-900 mb-1">기타 안내</h3>
          <p className="text-2sm text-gray-900">주문 제작 소요시간: 2 ~ 3일</p>
        </div>
      </div>
    </section>
  );
}
