"use client";

import { formatOrderItemSummary } from "@/apps/web-user/features/product/utils/custom-option.util";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { OrderResponse, OrderStatus } from "@/apps/web-user/features/order/types/order.type";
import { useCancelBeforePayment } from "@/apps/web-user/features/order/hooks/mutations/useCancelBeforePayment";
import { RadioGroup, RadioOption } from "@/apps/web-user/common/components/inputs/RadioGroup";
import { Icon } from "@/apps/web-user/common/components/icons";
import { usePendingToastStore } from "@/apps/web-user/common/store/pending-toast.store";
import { useCancelFlowStore } from "@/apps/web-user/common/store/cancel-flow.store";
import { PATHS } from "@/apps/web-user/common/constants/paths.constant";
import { trackEvent } from "@/apps/web-user/common/utils/analytics.util";

const PRE_PAYMENT_CANCELLABLE_STATUSES: OrderStatus[] = [
  OrderStatus.RESERVATION_REQUESTED,
  OrderStatus.PAYMENT_PENDING,
];

const POST_PAYMENT_CANCELLABLE_STATUSES: OrderStatus[] = [
  OrderStatus.PAYMENT_COMPLETED,
  OrderStatus.CONFIRMED,
];

type ReasonOption = "CHANGE_OF_MIND" | "ORDER_MISTAKE" | "OTHER";

const REASON_LABELS: Record<ReasonOption, string> = {
  CHANGE_OF_MIND: "단순 변심",
  ORDER_MISTAKE: "주문 실수 (디자인 변경, 옵션 누락 등)",
  OTHER: "기타",
};

const REASON_OPTIONS: RadioOption<ReasonOption>[] = (
  Object.keys(REASON_LABELS) as ReasonOption[]
).map((value) => ({ value, label: REASON_LABELS[value] }));

type DepositAnswer = "YES" | "NO";

const DEPOSIT_OPTIONS: RadioOption<DepositAnswer>[] = [
  { value: "NO", label: "아직 입금하지 않았어요" },
  { value: "YES", label: "이미 입금했어요 (환불 필요)" },
];

interface OrderCancelViewProps {
  order: OrderResponse;
}

export function OrderCancelView({ order }: OrderCancelViewProps) {
  const router = useRouter();
  const { mutate: cancelOrder, isPending } = useCancelBeforePayment();
  const setPendingToast = usePendingToastStore((s) => s.setPendingToast);
  const setCancelReason = useCancelFlowStore((s) => s.setReason);

  const [selectedReason, setSelectedReason] = useState<ReasonOption | null>(null);
  const [otherReasonText, setOtherReasonText] = useState("");
  // 입금대기 단계에서만 묻습니다. 서버는 입금 여부를 알 수 없어 손님 신고에 의존합니다.
  const [hasDeposited, setHasDeposited] = useState<DepositAnswer | null>(null);
  // 취소 성공 직후 invalidate로 인한 refetch가 navigation보다 먼저 끝나
  // 가드 텍스트가 깜빡이는 걸 방지하는 플래그
  const [isLeaving, setIsLeaving] = useState(false);

  const isPrePayment = PRE_PAYMENT_CANCELLABLE_STATUSES.includes(order.orderStatus);
  const isPostPayment = POST_PAYMENT_CANCELLABLE_STATUSES.includes(order.orderStatus);
  const isCancellable = isPrePayment || isPostPayment;

  if (isLeaving) return null;

  if (!isCancellable) {
    return (
      <div className="px-5 py-10 text-center">
        <p className="text-sm text-gray-500">
          현재 주문 상태에서는 이 취소 화면을 사용할 수 없습니다.
        </p>
      </div>
    );
  }

  const buildReason = (): string => {
    if (selectedReason === "OTHER") return otherReasonText.trim();
    if (selectedReason) return REASON_LABELS[selectedReason];
    return "";
  };

  // 입금대기 상태에서만 입금 여부를 묻습니다.
  // 예약신청 단계는 판매자가 계좌를 안내하기 전이라 입금 자체가 불가능합니다.
  const shouldAskDeposit = order.orderStatus === OrderStatus.PAYMENT_PENDING;

  const isValid = (() => {
    if (!selectedReason) return false;
    if (selectedReason === "OTHER" && otherReasonText.trim().length === 0) return false;
    if (shouldAskDeposit && hasDeposited === null) return false;
    return true;
  })();

  const handleSubmit = () => {
    if (!isValid || isPending) return;
    const reason = buildReason();

    // 결제 후: 사유를 store에 저장하고 환불 계좌 입력 페이지(2/2)로 이동
    if (isPostPayment) {
      setCancelReason(reason);
      router.push(PATHS.ORDER.CANCEL_REFUND(order.id));
      return;
    }

    // 입금대기인데 이미 입금했다고 신고한 경우: 결제 후와 동일하게 환불 계좌를 받아야 합니다.
    if (shouldAskDeposit && hasDeposited === "YES") {
      setCancelReason(reason);
      router.push(PATHS.ORDER.CANCEL_REFUND(order.id));
      return;
    }

    // 결제 전: cancel-before-payment API 즉시 호출
    trackEvent("request_cancel_reservation", {
      reservation_id: order.id,
      cancel_reason: reason,
      status: order.orderStatus,
      refund_status: "before_payment",
    });
    cancelOrder(
      { orderId: order.id, reason },
      {
        onSuccess: () => {
          setIsLeaving(true);
          setPendingToast({
            message: "취소완료",
            iconName: "checkCircle",
            iconClassName: "text-green-400",
            variant: "column",
            position: "center",
          });
          router.replace(PATHS.ORDER.DETAIL(order.id));
        },
      },
    );
  };

  const productImage = order.productImages?.[0];

  return (
    <div className="pt-8 pb-[106px]">
      <div className="px-5">
        {/* 취소상품 */}
        <section>
          <h2 className="text-lg/[25px] font-bold text-gray-900 mb-3">취소상품</h2>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-5 px-5">
            {order.orderItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 border border-gray-100 rounded-2lg p-3 bg-white flex-shrink-0 w-[278px]"
              >
                <div className="relative w-[72px] h-[72px] flex-shrink-0 rounded overflow-hidden">
                  {productImage ? (
                    <Image
                      src={productImage}
                      alt={order.productName}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="mb-0.5 text-xs text-gray-500">{order.storeName}</p>
                  <p className="mb-2 text-sm text-gray-900 truncate">{order.productName}</p>
                  <p className="text-2xs text-gray-400 truncate">{formatOrderItemSummary(item)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 취소사유 */}
        <section className="mt-14">
          <h2 className="text-lg/[25px] font-bold text-gray-900 mb-4">취소사유</h2>
          <RadioGroup<ReasonOption>
            value={selectedReason}
            onChange={setSelectedReason}
            options={REASON_OPTIONS}
          />

          {selectedReason === "OTHER" && (
            <input
              type="text"
              value={otherReasonText}
              onChange={(e) => setOtherReasonText(e.target.value)}
              placeholder="내용을 입력해주세요."
              maxLength={2000}
              className="mt-1.5 w-full px-3 py-2.5 border border-gray-200 rounded-md text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary"
            />
          )}
        </section>

        {/* 입금 여부 확인 — 입금했는데 취소하면 환불 계좌를 받아야 하므로 반드시 묻습니다 */}
        {shouldAskDeposit && (
          <section className="mt-14">
            <h2 className="text-lg/[25px] font-bold text-gray-900 mb-1.5">입금하셨나요?</h2>
            <p className="mb-4 text-xs text-gray-500">
              입금하셨다면 환불이 필요해요. 환불받으실 계좌를 다음 단계에서 입력해 주세요.
            </p>
            <RadioGroup<DepositAnswer>
              value={hasDeposited}
              onChange={setHasDeposited}
              options={DEPOSIT_OPTIONS}
            />
          </section>
        )}
      </div>

      {/* 하단 취소 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 mx-auto max-w-[638px] bg-white p-5 pt-2.5 pb-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isValid || isPending}
          className={`w-full h-[52px] rounded-xl text-base font-bold border-none ${
            isValid && !isPending
              ? "bg-primary text-white cursor-pointer"
              : "bg-gray-200 text-gray-300 cursor-not-allowed"
          }`}
        >
          {isPostPayment ? (
            <span className="inline-flex items-center justify-center gap-1">
              환불 계좌 입력
              <Icon name="arrow" width={20} height={20} className="rotate-90" />
            </span>
          ) : isPending ? (
            "취소 중..."
          ) : (
            "예약취소"
          )}
        </button>
      </div>
    </div>
  );
}
