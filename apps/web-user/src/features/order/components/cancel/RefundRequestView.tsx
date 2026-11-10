"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { InfoNotice } from "@/apps/web-user/common/components/notice/InfoNotice";
import { Button } from "@/apps/web-user/common/components/buttons/Button";
import { SelectTrigger } from "@/apps/web-user/common/components/selectboxs/SelectTrigger";
import { OrderResponse, OrderStatus } from "@/apps/web-user/features/order/types/order.type";
import { BankItem } from "@/apps/web-user/common/constants/banks.constant";
import { useCancelFlowStore } from "@/apps/web-user/common/store/cancel-flow.store";
import { usePendingToastStore } from "@/apps/web-user/common/store/pending-toast.store";
import { PATHS } from "@/apps/web-user/common/constants/paths.constant";
import { useRequestRefund } from "@/apps/web-user/features/order/hooks/mutations/useRequestRefund";
import { useCancelBeforePayment } from "@/apps/web-user/features/order/hooks/mutations/useCancelBeforePayment";
import { useMypageProfile } from "@/apps/web-user/features/mypage/hooks/queries/useMypageProfile";
import { trackEvent } from "@/apps/web-user/common/utils/analytics.util";
import { BankSelectBottomSheet } from "./BankSelectBottomSheet";
import { RefundConfirmBottomSheet } from "./RefundConfirmBottomSheet";

interface RefundRequestViewProps {
  order: OrderResponse;
}

export function RefundRequestView({ order }: RefundRequestViewProps) {
  const router = useRouter();
  const reason = useCancelFlowStore((s) => s.reason);
  const clearReason = useCancelFlowStore((s) => s.clear);
  const setPendingToast = usePendingToastStore((s) => s.setPendingToast);
  const { mutate: requestRefund, isPending: isRequestingRefund } = useRequestRefund();
  // 입금대기 상태에서 "이미 입금했다"고 신고하고 온 경우는 취소 API가 환불 절차까지 처리합니다.
  const { mutate: cancelWithDeposit, isPending: isCancelling } = useCancelBeforePayment();
  const isPrePaymentDepositReport = order.orderStatus === OrderStatus.PAYMENT_PENDING;
  const isPending = isRequestingRefund || isCancelling;
  const { data: profile } = useMypageProfile();

  const [selectedBank, setSelectedBank] = useState<BankItem | null>(null);
  const [accountNumber, setAccountNumber] = useState("");
  const [holderName, setHolderName] = useState("");
  const [isBankSheetOpen, setIsBankSheetOpen] = useState(false);
  const [isConfirmSheetOpen, setIsConfirmSheetOpen] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const accountNumberRef = useRef<HTMLInputElement>(null);
  const holderNameRef = useRef<HTMLInputElement>(null);

  // 1단계를 거치지 않고 직접 진입했거나 새로고침으로 reason 유실 시 상세로 복귀
  useEffect(() => {
    if (!reason && !isPending && !isLeaving) {
      router.replace(PATHS.ORDER.DETAIL(order.id));
    }
  }, [reason, isPending, isLeaving, order.id, router]);

  // 예금주명 기본값을 사용자 이름으로 (이미 사용자가 입력한 게 있으면 덮어쓰지 않음)
  useEffect(() => {
    if (profile?.name && !holderName) {
      setHolderName(profile.name);
    }
    // holderName을 deps에 넣으면 사용자가 지웠을 때 다시 채워지므로 제외
  }, [profile?.name]);

  if (isLeaving) return null;

  const isValid = !!selectedBank && accountNumber.trim().length > 0 && holderName.trim().length > 0;

  const handleSelectBank = (bank: BankItem) => {
    setSelectedBank(bank);
    // 은행 선택 직후 계좌번호 input으로 자동 포커스
    setTimeout(() => accountNumberRef.current?.focus(), 50);
  };

  const handleAccountNumberKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      holderNameRef.current?.focus();
    }
  };

  const handleHolderNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      holderNameRef.current?.blur();
    }
  };

  const handleSubmitRefund = () => {
    if (!isValid || !selectedBank || isPending) return;
    trackEvent("request_refund_info", { reservation_id: order.id });

    const handleSuccess = () => {
      setIsLeaving(true);
      clearReason();
      setPendingToast({
        message: "취소 요청 완료",
        iconName: "checkCircle",
        iconClassName: "text-green-400",
        variant: "column",
        position: "center",
      });
      setIsConfirmSheetOpen(false);
      router.replace(PATHS.ORDER.DETAIL(order.id));
    };

    // 입금대기 상태는 아직 "입금완료"로 넘어가기 전이라 환불 요청 API를 쓸 수 없습니다.
    // 취소 API에 입금 신고를 실어 보내면 서버가 취소환불대기로 전환해 줍니다.
    if (isPrePaymentDepositReport) {
      cancelWithDeposit(
        {
          orderId: order.id,
          reason,
          deposited: {
            bankName: selectedBank.value,
            bankAccountNumber: accountNumber.trim(),
            accountHolderName: holderName.trim(),
          },
        },
        { onSuccess: handleSuccess },
      );
      return;
    }

    requestRefund(
      {
        orderId: order.id,
        reason,
        bankName: selectedBank.value,
        bankAccountNumber: accountNumber.trim(),
        accountHolderName: holderName.trim(),
      },
      { onSuccess: handleSuccess },
    );
  };

  return (
    <div className="pt-5 pb-[96px]">
      {/* 안내 박스 */}
      <div className="px-5 py-4">
        <InfoNotice message={`환불예정 금액 : ${order.totalPrice.toLocaleString()}원`} />
      </div>

      <div className="px-5">
        {/* 은행 선택 */}
        <section className="py-3">
          <SelectTrigger
            label="은행 선택"
            value={selectedBank?.label ?? null}
            placeholder="은행을 선택해주세요."
            onClick={() => setIsBankSheetOpen(true)}
          />
        </section>

        {/* 환불 계좌번호 */}
        <section className="py-3">
          <label
            htmlFor="refund-account-number"
            className="block text-sm font-bold text-gray-900 mb-2.5"
          >
            환불 계좌번호
          </label>
          <input
            id="refund-account-number"
            ref={accountNumberRef}
            type="text"
            inputMode="numeric"
            enterKeyHint="next"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            onKeyDown={handleAccountNumberKeyDown}
            placeholder="계좌번호를 입력해주세요."
            className="w-full h-[42px] px-3 border border-gray-100 rounded-lg text-sm text-gray-900 placeholder:text-gray-300 outline-none focus:border-primary"
          />
        </section>

        {/* 예금주명 */}
        <section className="py-3 mb-10">
          <label
            htmlFor="refund-holder-name"
            className="block text-sm font-bold text-gray-900 mb-2.5"
          >
            예금주명
          </label>
          <input
            id="refund-holder-name"
            ref={holderNameRef}
            type="text"
            enterKeyHint="done"
            value={holderName}
            onChange={(e) => setHolderName(e.target.value)}
            onKeyDown={handleHolderNameKeyDown}
            placeholder="예금주명을 입력해주세요."
            className="w-full h-[42px] px-3 border border-gray-100 rounded-lg text-sm text-gray-900 placeholder:text-gray-300 outline-none focus:border-primary"
          />
        </section>

        {/* 안내 텍스트 */}
        <ul className="text-xs text-gray-400 space-y-1 list-disc pl-4">
          <li>환불까지 영업일 기준 1~2일 걸릴 수 있어요.</li>
          <li>환불 정보가 정확하지 않으면 환불이 늦어질 수 있어요.</li>
        </ul>
      </div>

      {/* 하단 고정 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 mx-auto max-w-[638px] bg-white p-5 pt-2.5 pb-3">
        <div className="flex gap-2">
          <span className="flex-1">
            <Button variant="outline" onClick={() => router.back()} disabled={isPending}>
              이전
            </Button>
          </span>
          <span className="flex-[2]">
            <Button
              onClick={() => {
                trackEvent("request_cancel_reservation", {
                  reservation_id: order.id,
                  cancel_reason: reason,
                  status: order.orderStatus,
                  refund_status: "available",
                });
                setIsConfirmSheetOpen(true);
              }}
              disabled={!isValid || isPending}
            >
              예약 취소 요청
            </Button>
          </span>
        </div>
      </div>

      <BankSelectBottomSheet
        isOpen={isBankSheetOpen}
        onClose={() => setIsBankSheetOpen(false)}
        onSelect={handleSelectBank}
      />

      <RefundConfirmBottomSheet
        isOpen={isConfirmSheetOpen}
        onClose={() => setIsConfirmSheetOpen(false)}
        bankLabel={selectedBank?.label ?? ""}
        bankAccountNumber={accountNumber.trim()}
        accountHolderName={holderName.trim()}
        isPending={isPending}
        onConfirm={handleSubmitRefund}
      />
    </div>
  );
}
