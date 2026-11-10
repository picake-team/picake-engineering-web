"use client";

import { useState } from "react";
import { Modal } from "@/apps/web-user/common/components/modals/Modal";
import { Toast } from "@/apps/web-user/common/components/toast/Toast";
import { EasyPaymentBottomSheet } from "@/apps/web-user/common/components/bottom-sheets/EasyPaymentBottomSheet";
import { PaymentConfirmBottomSheet } from "@/apps/web-user/common/components/bottom-sheets/PaymentConfirmBottomSheet";
import { usePaymentComplete } from "@/apps/web-user/features/order/hooks/mutations/usePaymentComplete";
import { OrderResponse } from "@/apps/web-user/features/order/types/order.type";
import { OrderActionButtons } from "@/apps/web-user/features/mypage/order/components/OrderActionButtons";
import {
  APP_ONLY_MODAL,
  PAYMENT_COMPLETE_MODAL,
} from "@/apps/web-user/common/constants/messages.constant";
import { trackEvent } from "@/apps/web-user/common/utils/analytics.util";

function isMobileDevice(): boolean {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

interface PaymentPendingActionsProps {
  order: OrderResponse;
}

export function PaymentPendingActions({ order }: PaymentPendingActionsProps) {
  const { mutate: paymentComplete, isPending: isCompleting } = usePaymentComplete();
  const [isPaymentSheetOpen, setIsPaymentSheetOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isEasyPayOpen, setIsEasyPayOpen] = useState(false);
  const [isAppOnlyModalOpen, setIsAppOnlyModalOpen] = useState(false);
  const [depositorName, setDepositorName] = useState("");
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  return (
    <>
      <div className="mt-5">
        <OrderActionButtons
          direction="column"
          buttons={[
            {
              label: "간편 입금하기",
              images: [
                { src: "/images/contents/toss.png", alt: "토스" },
                { src: "/images/contents/kakao.png", alt: "카카오" },
              ],
              onClick: () => {
                trackEvent("engage_easy_payment", { reservation_id: order.id });
                if (!isMobileDevice()) {
                  setIsAppOnlyModalOpen(true);
                  return;
                }
                setIsEasyPayOpen(true);
              },
            },
            {
              label: isCompleting ? "처리 중..." : "입금 완료했어요",
              onClick: () => {
                trackEvent("engage_payment_complete", { reservation_id: order.id });
                setIsPaymentSheetOpen(true);
              },
            },
          ]}
        />
      </div>

      <PaymentConfirmBottomSheet
        isOpen={isPaymentSheetOpen}
        onClose={() => setIsPaymentSheetOpen(false)}
        reservationId={order.id}
        amount={order.totalPrice}
        onConfirm={(name) => {
          setDepositorName(name);
          setIsConfirmOpen(true);
        }}
      />

      <Modal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        title={PAYMENT_COMPLETE_MODAL.title}
        description={PAYMENT_COMPLETE_MODAL.description}
        confirmText="취소"
        cancelText="입금 완료"
        cancelVariant="primary"
        onConfirm={() => setIsConfirmOpen(false)}
        onCancel={() => {
          paymentComplete(
            { orderId: order.id, depositorName },
            { onSuccess: () => setShowSuccessToast(true) },
          );
          setIsConfirmOpen(false);
          setIsPaymentSheetOpen(false);
        }}
      />

      <Modal
        isOpen={isAppOnlyModalOpen}
        onClose={() => setIsAppOnlyModalOpen(false)}
        title={APP_ONLY_MODAL.title}
        description={APP_ONLY_MODAL.description}
        confirmText="취소"
        confirmVariant="outline"
        cancelText="앱 다운로드"
        cancelVariant="primary"
        onConfirm={() => setIsAppOnlyModalOpen(false)}
        onCancel={() => {
          window.open("https://pickcake.app/download", "_blank");
          setIsAppOnlyModalOpen(false);
        }}
      />

      <EasyPaymentBottomSheet
        isOpen={isEasyPayOpen}
        onClose={() => setIsEasyPayOpen(false)}
        reservationId={order.id}
        bankAccountNumber={order.storeBankAccountNumber}
        bankName={order.storeBankName}
        amount={order.totalPrice}
      />

      {showSuccessToast && (
        <Toast
          message="입금을 확인하면 예약이 확정돼요."
          iconName="checkCircle"
          iconClassName="text-green-400"
          variant="row"
          duration={3000}
          onClose={() => setShowSuccessToast(false)}
        />
      )}
    </>
  );
}
