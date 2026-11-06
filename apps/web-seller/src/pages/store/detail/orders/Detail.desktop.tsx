import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useOrderDetail } from "@/apps/web-seller/features/order/hooks/queries/useOrderQuery";
import { useUpdateOrderStatus } from "@/apps/web-seller/features/order/hooks/mutations/useOrderMutation";
import {
  OrderStatus,
  type UpdateOrderStatusRequestDto,
} from "@/apps/web-seller/features/order/types/order.dto";
import { BaseButton as Button } from "@/apps/web-seller/common/components/buttons/BaseButton";
import { ImageLightbox } from "@/apps/web-seller/common/components/images/ImageLightbox";
import { Textarea } from "@/apps/web-seller/common/components/textareas/Textarea";
import { isSellerTransitionAllowed } from "@/apps/web-seller/features/order/utils/order-seller-transition.util";
import {
  getOrderStatusBadgeVariant,
  getOrderStatusLabel,
} from "@/apps/web-seller/features/order/utils/order-status-ui.util";
import { StatusBadge } from "@/apps/web-seller/common/components/badges/StatusBadge";
import { ORDER_STATUS_FLOW_LINES_FOR_SELLER } from "@/apps/web-seller/features/order/utils/order-status-seller-guide.util";
import { OrderStatusGuideHelpButton } from "@/apps/web-seller/features/order/components/OrderStatusGuideHelpButton";
import { OrderStatusGuideModal } from "@/apps/web-seller/features/order/components/OrderStatusGuideModal";
import { PaymentPendingCountdown } from "@/apps/web-seller/features/order/components/detail/PaymentPendingCountdown";
import { OrderStatusFlowStepper } from "@/apps/web-seller/features/order/components/detail/OrderStatusFlowStepper";
import { OrderDetailSpreadsheetView } from "@/apps/web-seller/features/order/components/detail/OrderDetailSpreadsheetView";
import { CancelOrderModal } from "@/apps/web-seller/features/order/components/detail/CancelOrderModal";
import {
  ORDER_DETAIL_ACTION_BTN,
  ORDER_DETAIL_PAGE_META,
  ORDER_DETAIL_PAGE_TITLE,
  ORDER_DETAIL_SHEET,
  ORDER_DETAIL_TD_BLOCK,
} from "@/apps/web-seller/features/order/constants/order-detail-page.constant";
import {
  SheetSectionRow,
  SheetTable,
} from "@/apps/web-seller/features/order/components/detail/OrderDetailSheetTable";
import { cn } from "@/apps/web-seller/common/utils/classname.util";
import { ContentLoading } from "@/apps/web-seller/common/components/loading/ContentLoading";
import { useConfirmStore } from "@/apps/web-seller/common/store/confirm.store";

type ReasonTarget = OrderStatus.NO_SHOW | OrderStatus.CANCEL_REFUND_PENDING | null;

const IRREVERSIBLE_ACTION_CONFIRM_MESSAGE =
  "이 작업은 처리 후 되돌릴 수 없습니다. 계속하시겠습니까?";

export const StoreDetailOrderDetailPage: React.FC = () => {
  const { storeId, orderId } = useParams<{ storeId: string; orderId: string }>();
  const { data: order, isLoading } = useOrderDetail(orderId || "");
  const updateOrderStatusMutation = useUpdateOrderStatus();
  const openConfirmModal = useConfirmStore((state) => state.showConfirm);
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);
  const [reasonTarget, setReasonTarget] = useState<ReasonTarget>(null);
  const [reasonText, setReasonText] = useState("");
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [flowGuideOpen, setFlowGuideOpen] = useState(false);

  if (!storeId || !orderId) {
    return (
      <div className="flex items-center justify-center py-12">
        <h2 className={ORDER_DETAIL_PAGE_TITLE}>스토어 또는 주문이 선택되지 않았습니다.</h2>
      </div>
    );
  }

  if (isLoading) {
    return (
      <ContentLoading
        variant="page"
        message="주문 정보를 불러오는 중…"
        className="border-0 shadow-none"
      />
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center py-12">
        <h2 className={ORDER_DETAIL_PAGE_TITLE}>주문을 찾을 수 없습니다.</h2>
      </div>
    );
  }

  const status = order.orderStatus;
  const variant = getOrderStatusBadgeVariant(status);

  const requestActionConfirm = (
    onConfirm: () => void,
    message: string = IRREVERSIBLE_ACTION_CONFIRM_MESSAGE,
  ) => {
    openConfirmModal({ message, onConfirm });
  };

  const submitReason = () => {
    if (!reasonTarget || !orderId) return;
    const trimmed = reasonText.trim();
    if (!trimmed) return;
    requestActionConfirm(() => {
      const request: UpdateOrderStatusRequestDto = {
        orderStatus: reasonTarget,
      };
      if (reasonTarget === OrderStatus.NO_SHOW) {
        request.sellerNoShowReason = trimmed;
      } else if (reasonTarget === OrderStatus.CANCEL_REFUND_PENDING) {
        request.sellerCancelRefundPendingReason = trimmed;
      }
      updateOrderStatusMutation.mutate(
        { orderId, request },
        {
          onSuccess: () => {
            setReasonTarget(null);
            setReasonText("");
          },
        },
      );
    });
  };

  const handleCancelOrderConfirm = (reason: string) => {
    if (!orderId) return;
    updateOrderStatusMutation.mutate(
      {
        orderId,
        request: {
          orderStatus: OrderStatus.CANCEL_COMPLETED,
          sellerCancelReason: reason,
        },
      },
      {
        onSuccess: () => setCancelModalOpen(false),
      },
    );
  };

  const cancelReasonFlow = () => {
    setReasonTarget(null);
    setReasonText("");
  };

  const startReason = (target: Exclude<ReasonTarget, null>) => {
    setReasonTarget(target);
    setReasonText("");
  };

  const showAcceptReservation = isSellerTransitionAllowed(status, OrderStatus.PAYMENT_PENDING);
  const showConfirmReservation = isSellerTransitionAllowed(status, OrderStatus.CONFIRMED);
  const showPickupDone = isSellerTransitionAllowed(status, OrderStatus.PICKUP_COMPLETED);
  const showRefundDone = isSellerTransitionAllowed(status, OrderStatus.CANCEL_REFUND_COMPLETED);
  const showCancelOrder = isSellerTransitionAllowed(status, OrderStatus.CANCEL_COMPLETED);
  const showNoShow = isSellerTransitionAllowed(status, OrderStatus.NO_SHOW);
  const showRefundPending = isSellerTransitionAllowed(status, OrderStatus.CANCEL_REFUND_PENDING);

  const paymentWindowStart = order.paymentPendingAt ?? order.createdAt;

  const hasAnyActions =
    !reasonTarget &&
    (showAcceptReservation ||
      showConfirmReservation ||
      showPickupDone ||
      showRefundDone ||
      showCancelOrder ||
      showNoShow ||
      showRefundPending);

  const reasonFieldLabel =
    reasonTarget === OrderStatus.NO_SHOW
      ? "노쇼 사유 (필수)"
      : reasonTarget === OrderStatus.CANCEL_REFUND_PENDING
        ? "취소환불대기 전환 사유 (필수)"
        : "";

  return (
    <div className="space-y-5 pb-8">
      <div>
        <h1 className={ORDER_DETAIL_PAGE_TITLE}>주문 상세</h1>
        <p className={ORDER_DETAIL_PAGE_META}>
          주문번호 <span className="font-mono font-medium text-slate-800">{order.orderNumber}</span>
        </p>
      </div>

      <div className={ORDER_DETAIL_SHEET}>
        <OrderStatusFlowStepper
          status={status}
          headerExtra={
            <>
              <StatusBadge variant={variant} className="text-xs font-semibold">
                {getOrderStatusLabel(status)}
              </StatusBadge>
              <OrderStatusGuideHelpButton
                onClick={() => setFlowGuideOpen(true)}
                className="p-1"
                ariaLabel="상태별 상세 안내 전체 흐름 보기"
                title="상태별 상세 안내 · 전체 흐름"
              />
            </>
          }
        />

        {status === OrderStatus.PAYMENT_PENDING && (
          <div className="border-t border-slate-300 bg-slate-50/80 px-4 py-3">
            <PaymentPendingCountdown
              deadlineAt={order.paymentPendingDeadlineAt ?? undefined}
              windowStartAt={paymentWindowStart}
            />
          </div>
        )}

        {reasonTarget && (
          <div className="overflow-x-auto border-t border-slate-300">
            <SheetTable>
              <tbody>
                <SheetSectionRow>사유 입력</SheetSectionRow>
                <tr>
                  <td colSpan={2} className={ORDER_DETAIL_TD_BLOCK}>
                    <div className="text-[13px] font-medium text-slate-800">{reasonFieldLabel}</div>
                    <Textarea
                      value={reasonText}
                      onChange={(e) => setReasonText(e.target.value)}
                      placeholder="사유를 입력해 주세요."
                      rows={4}
                      className="mt-2 border-slate-300 bg-white text-[13px] leading-snug"
                    />
                    <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(ORDER_DETAIL_ACTION_BTN, "sm:flex-none")}
                        onClick={cancelReasonFlow}
                      >
                        돌아가기
                      </Button>
                      <Button
                        type="button"
                        className={cn(ORDER_DETAIL_ACTION_BTN, "sm:flex-none")}
                        onClick={submitReason}
                        disabled={updateOrderStatusMutation.isPending || !reasonText.trim()}
                      >
                        {updateOrderStatusMutation.isPending ? "처리 중..." : "저장하고 반영"}
                      </Button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </SheetTable>
          </div>
        )}

        {hasAnyActions && (
          <div className="flex flex-wrap gap-2 px-3 pb-4 pt-4">
            {showAcceptReservation && (
              <Button
                className={ORDER_DETAIL_ACTION_BTN}
                onClick={() =>
                  requestActionConfirm(() =>
                    updateOrderStatusMutation.mutate({
                      orderId: order.id,
                      request: { orderStatus: OrderStatus.PAYMENT_PENDING },
                    }),
                  )
                }
                disabled={updateOrderStatusMutation.isPending}
              >
                {updateOrderStatusMutation.isPending ? "처리 중..." : "예약 확인"}
              </Button>
            )}
            {showConfirmReservation && (
              <Button
                className={ORDER_DETAIL_ACTION_BTN}
                onClick={() =>
                  requestActionConfirm(() =>
                    updateOrderStatusMutation.mutate({
                      orderId: order.id,
                      request: { orderStatus: OrderStatus.CONFIRMED },
                    }),
                  )
                }
                disabled={updateOrderStatusMutation.isPending}
              >
                {updateOrderStatusMutation.isPending ? "처리 중..." : "예약 확정"}
              </Button>
            )}
            {showPickupDone && (
              <Button
                className={ORDER_DETAIL_ACTION_BTN}
                onClick={() =>
                  requestActionConfirm(() =>
                    updateOrderStatusMutation.mutate({
                      orderId: order.id,
                      request: { orderStatus: OrderStatus.PICKUP_COMPLETED },
                    }),
                  )
                }
                disabled={updateOrderStatusMutation.isPending}
              >
                {updateOrderStatusMutation.isPending ? "처리 중..." : "픽업 완료"}
              </Button>
            )}
            {showRefundDone && (
              <Button
                className={ORDER_DETAIL_ACTION_BTN}
                onClick={() =>
                  requestActionConfirm(() =>
                    updateOrderStatusMutation.mutate({
                      orderId: order.id,
                      request: { orderStatus: OrderStatus.CANCEL_REFUND_COMPLETED },
                    }),
                  )
                }
                disabled={updateOrderStatusMutation.isPending}
              >
                {updateOrderStatusMutation.isPending ? "처리 중..." : "취소환불 완료"}
              </Button>
            )}
            {showCancelOrder && (
              <Button
                variant="outline"
                className={cn(ORDER_DETAIL_ACTION_BTN, "border-slate-300 bg-white")}
                onClick={() => setCancelModalOpen(true)}
              >
                예약 취소
              </Button>
            )}
            {showNoShow && (
              <Button
                variant="outline"
                className={cn(ORDER_DETAIL_ACTION_BTN, "border-slate-300 bg-white")}
                onClick={() => startReason(OrderStatus.NO_SHOW)}
              >
                노쇼 처리
              </Button>
            )}
            {showRefundPending && (
              <Button
                variant="outline"
                className={cn(ORDER_DETAIL_ACTION_BTN, "border-slate-300 bg-white")}
                onClick={() => startReason(OrderStatus.CANCEL_REFUND_PENDING)}
              >
                취소환불대기로 변경
              </Button>
            )}
          </div>
        )}
      </div>

      <OrderDetailSpreadsheetView
        order={order}
        onReferenceImageClick={(images, index) => setLightbox({ images, index })}
      />

      <OrderStatusGuideModal
        open={flowGuideOpen}
        onClose={() => setFlowGuideOpen(false)}
        ariaLabel="상태별 상세 안내 · 전체 흐름"
        numberedLines={ORDER_STATUS_FLOW_LINES_FOR_SELLER}
      />

      {lightbox && (
        <ImageLightbox
          images={lightbox.images}
          initialIndex={lightbox.index}
          alt="주문 참고 이미지"
          onClose={() => setLightbox(null)}
        />
      )}

      <CancelOrderModal
        open={cancelModalOpen}
        isPending={updateOrderStatusMutation.isPending}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={handleCancelOrderConfirm}
      />
    </div>
  );
};
