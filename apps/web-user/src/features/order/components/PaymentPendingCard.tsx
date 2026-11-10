"use client";

import { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Icon } from "@/apps/web-user/common/components/icons";
import { PATHS } from "@/apps/web-user/common/constants/paths.constant";
import { OrderResponse } from "@/apps/web-user/features/order/types/order.type";
import { usePaymentComplete } from "@/apps/web-user/features/order/hooks/mutations/usePaymentComplete";
import { usePaymentCountdown } from "@/apps/web-user/features/order/hooks/usePaymentCountdown";
import { Toast } from "@/apps/web-user/common/components/toast/Toast";
import { Modal } from "@/apps/web-user/common/components/modals/Modal";
import { getBankLabel } from "@/apps/web-user/common/utils/bank.util";
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

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
}

export function PaymentPendingCard({ order }: { order: OrderResponse }) {
  const router = useRouter();
  const countdown = usePaymentCountdown(order);
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [isEasyPayOpen, setIsEasyPayOpen] = useState(false);
  const [isPaymentSheetOpen, setIsPaymentSheetOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isAppOnlyModalOpen, setIsAppOnlyModalOpen] = useState(false);
  const [depositorName, setDepositorName] = useState("");
  const handleCloseCopyToast = useCallback(() => setShowCopyToast(false), []);
  const handleCloseSuccessToast = useCallback(() => setShowSuccessToast(false), []);
  const { mutate: paymentComplete, isPending: isCompleting } = usePaymentComplete();
  const bankName = getBankLabel(order.storeBankName);
  const accountNumber = order.storeBankAccountNumber ?? "";
  const accountHolder = order.storeAccountHolderName ?? "";
  const accountInfo = `${bankName} · ${accountNumber}`;

  // 마이페이지 상단 예약 상태 카드 노출
  useEffect(() => {
    trackEvent("view_mypage_reservation_card", {
      card_status: "pending_payment",
      reservation_id: order.id,
    });
  }, [order.id]);

  return (
    <>
      <div
        onClick={() => router.push(`${PATHS.ORDER.DETAIL(order.id)}?entry_point=mypage_card`)}
        className="rounded-xl overflow-hidden border border-blue-100 cursor-pointer"
        style={{ background: "linear-gradient(180deg, #EBF8FF 0%, #FFFFFF 30%)" }}
      >
        <div className="py-4 px-[18px]">
          {/* 헤더 */}
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-blue-400">입금 대기 중인 예약이 있어요</h2>
            <span
              className={`text-sm font-bold tabular-nums ${countdown.isExpired ? "text-gray-400" : "text-blue-400"}`}
            >
              {countdown.text}
            </span>
          </div>

          {/* 금액 + 계좌 정보 */}
          <div className="pt-[18px] flex flex-col">
            {/* 총 금액 */}
            <div className="flex items-center gap-8 border-b border-gray-50 mb-[9px] pb-2.5">
              <span className="text-sm text-gray-500 w-[52px] shrink-0">총 금액</span>
              <span className="text-sm font-bold text-gray-900">
                {order.totalPrice.toLocaleString()}원
              </span>
            </div>

            {/* 계좌번호 */}
            <div className="flex items-center gap-8 mb-1">
              <span className="text-sm text-gray-500 w-[52px] shrink-0">계좌번호</span>
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-900">{accountInfo}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(accountNumber);
                    setShowCopyToast(true);
                  }}
                  className="p-0 border-none bg-transparent w-5 h-5 flex items-center justify-center cursor-pointer"
                >
                  <Icon name="copy" width={16} height={16} className="text-gray-400" />
                </button>
              </div>
            </div>

            {/* 예금주명 */}
            <div className="flex items-center gap-8 mb-4">
              <span className="text-sm text-gray-500 w-[52px] shrink-0">예금주명</span>
              <span className="text-sm text-gray-900">{accountHolder}</span>
            </div>

            {/* 버튼 */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  trackEvent("engage_easy_payment", { reservation_id: order.id });
                  if (!isMobileDevice()) {
                    setIsAppOnlyModalOpen(true);
                    return;
                  }
                  setIsEasyPayOpen(true);
                }}
                className="flex-1 h-[32px] flex items-center justify-center gap-1 rounded-lg border border-gray-100 text-xs font-bold text-gray-900 bg-white"
              >
                <Image src="/images/contents/toss.png" alt="토스" width={18} height={18} />
                <Image src="/images/contents/kakao.png" alt="카카오" width={18} height={18} />
                간편 입금하기
              </button>
              <button
                type="button"
                disabled={isCompleting}
                onClick={(e) => {
                  e.stopPropagation();
                  trackEvent("engage_payment_complete", { reservation_id: order.id });
                  setIsPaymentSheetOpen(true);
                }}
                className="flex-1 h-[32px] flex items-center justify-center gap-0.5 rounded-lg border border-gray-100 text-xs font-bold text-gray-900 bg-white disabled:opacity-50"
              >
                {isCompleting ? "처리 중..." : "입금 완료했어요"}
              </button>
            </div>
          </div>
        </div>
      </div>
      {createPortal(
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
        />,
        document.body,
      )}
      {createPortal(
        <EasyPaymentBottomSheet
          isOpen={isEasyPayOpen}
          onClose={() => setIsEasyPayOpen(false)}
          reservationId={order.id}
          bankAccountNumber={order.storeBankAccountNumber}
          bankName={order.storeBankName}
          amount={order.totalPrice}
        />,
        document.body,
      )}

      {createPortal(
        <PaymentConfirmBottomSheet
          isOpen={isPaymentSheetOpen}
          onClose={() => setIsPaymentSheetOpen(false)}
          reservationId={order.id}
          amount={order.totalPrice}
          onConfirm={(name) => {
            setDepositorName(name);
            setIsConfirmOpen(true);
          }}
        />,
        document.body,
      )}

      {createPortal(
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
        />,
        document.body,
      )}

      {showSuccessToast &&
        createPortal(
          <Toast
            message="입금을 확인하면 예약이 확정돼요."
            iconName="checkCircle"
            iconClassName="text-green-400"
            variant="row"
            duration={3000}
            onClose={handleCloseSuccessToast}
          />,
          document.body,
        )}
      {showCopyToast &&
        createPortal(
          <Toast
            message="계좌번호를 복사했어요"
            iconName="checkCircle"
            iconClassName="text-green-400"
            duration={3000}
            onClose={handleCloseCopyToast}
          />,
          document.body,
        )}
    </>
  );
}
