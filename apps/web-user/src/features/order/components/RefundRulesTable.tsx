import {
  formatRefundRulePeriodLabel,
  visibleRefundRules,
  type RefundCancellationPolicy,
} from "@/apps/web-user/features/store/types/store.type";

/** 가게가 정한 환불·취소 규정 표(주문 상세 안내 사항·취소 화면이 같이 쓴다) */
export function RefundRulesTable({ policy }: { policy?: RefundCancellationPolicy }) {
  const refundRules = visibleRefundRules(policy);
  if (refundRules.length === 0) {
    return <p className="text-2sm text-gray-500">등록된 환불·취소 규정이 없어요.</p>;
  }
  return (
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
  );
}
