"use client";

import { useCallback, useState } from "react";
import { OrderResponse } from "@/apps/web-user/features/order/types/order.type";
import { Icon } from "@/apps/web-user/common/components/icons";
import { Modal } from "@/apps/web-user/common/components/modals/Modal";
import { Toast } from "@/apps/web-user/common/components/toast/Toast";
import { getBankLabel } from "@/apps/web-user/common/utils/bank.util";
import { usePaymentComplete } from "@/apps/web-user/features/order/hooks/mutations/usePaymentComplete";
import { usePaymentCountdown } from "@/apps/web-user/features/order/hooks/usePaymentCountdown";
import { OrderActionButtons } from "./OrderActionButtons";
import { EasyPaymentBottomSheet } from "@/apps/web-user/common/components/bottom-sheets/EasyPaymentBottomSheet";
import { PaymentConfirmBottomSheet } from "@/apps/web-user/common/components/bottom-sheets/PaymentConfirmBottomSheet";
import {
  APP_ONLY_MODAL,
  PAYMENT_COMPLETE_MODAL,
} from "@/apps/web-user/common/constants/messages.constant";
import { trackEvent } from "@/apps/web-user/common/utils/analytics.util";

function isMobileDevice(): boolean {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function PaymentPendingInfo({ order }: { order: OrderResponse }) {
  const { text: countdown } = usePaymentCountdown(order);
  const { mutate: paymentComplete, isPending: isCompleting } = usePaymentComplete();
  const [isPaymentSheetOpen, setIsPaymentSheetOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isEasyPayOpen, setIsEasyPayOpen] = useState(false);
  const [isAppOnlyModalOpen, setIsAppOnlyModalOpen] = useState(false);
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [depositorName, setDepositorName] = useState("");

  const handleCopyAccountNumber = () => {
    navigator.clipboard.writeText(order.storeBankAccountNumber ?? "");
    setShowCopyToast(true);
  };

  const handleCloseCopyToast = useCallback(() => setShowCopyToast(false), []);
  const handleCloseSuccessToast = useCallback(() => setShowSuccessToast(false), []);

  return (
    <div className="mt-2.5 -mx-4">
      {/* 입금 대기 중 헤더 */}
      <div className="flex items-center justify-between bg-blue-50 rounded-lg rounded-b-none px-4 py-2.5">
        <span className="text-sm font-bold text-blue-400">입금 대기 중</span>
        <span className="text-sm font-bold text-blue-400">{countdown}</span>
      </div>

      <div className="py-3.5 px-4">
        <p className="text-2xs text-gray-500 mb-2.5">
          * 시간 안에 입금하지 않으면 예약이 취소돼요.
        </p>

        {/* 총 금액 */}
        <div className="flex items-center mb-3 gap-8">
          <span className="w-[52px] text-sm/5 text-gray-500">총 금액</span>
          <span className="text-sm font-bold text-gray-900">
            {order.totalPrice.toLocaleString()}원
          </span>
        </div>

        <div className="border-t border-gray-100 pt-3 space-y-2">
          {/* 계좌번호 */}
          <div className="flex items-center">
            <span className="w-[52px] text-sm/5 text-gray-500 shrink-0">계좌번호</span>
            <span className="ml-8 text-sm text-gray-900">{order.storeBankAccountNumber}</span>
            <button
              type="button"
              onClick={handleCopyAccountNumber}
              aria-label="계좌번호 복사"
              className="ml-1 text-gray-400 w-5 h-5 cursor-pointer"
            >
              <Icon name="copy" width={20} height={20} />
            </button>
          </div>

          {/* 은행 */}
          <div className="flex items-center gap-8">
            <span className="w-[52px] text-sm/5 text-gray-500 shrink-0">은행</span>
            <span className="text-sm text-gray-900">{getBankLabel(order.storeBankName)}</span>
          </div>

          {/* 예금주명 */}
          <div className="flex items-center gap-8">
            <span className="w-[52px] text-sm/5 text-gray-500 shrink-0">예금주명</span>
            <span className="text-sm text-gray-900">{order.storeAccountHolderName}</span>
          </div>
        </div>
      </div>

      <div className="px-4">
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

      {showCopyToast && (
        <Toast
          message="복사했어요"
          iconName="checkCircle"
          iconClassName="text-green-400"
          variant="row"
          onClose={handleCloseCopyToast}
        />
      )}

      {showSuccessToast && (
        <Toast
          message="입금을 확인하면 예약이 확정돼요."
          iconName="checkCircle"
          iconClassName="text-green-400"
          variant="row"
          duration={3000}
          onClose={handleCloseSuccessToast}
        />
      )}
    </div>
  );
}
