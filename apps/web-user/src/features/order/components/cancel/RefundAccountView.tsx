"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { InfoNotice } from "@/apps/web-user/common/components/notice/InfoNotice";
import { Button } from "@/apps/web-user/common/components/buttons/Button";
import { SelectTrigger } from "@/apps/web-user/common/components/selectboxs/SelectTrigger";
import { OrderResponse } from "@/apps/web-user/features/order/types/order.type";
import { BankItem, BANK_LIST } from "@/apps/web-user/common/constants/banks.constant";
import { usePendingToastStore } from "@/apps/web-user/common/store/pending-toast.store";
import { PATHS } from "@/apps/web-user/common/constants/paths.constant";
import { useSubmitRefundAccount } from "@/apps/web-user/features/order/hooks/mutations/useSubmitRefundAccount";
import { useMypageProfile } from "@/apps/web-user/features/mypage/hooks/queries/useMypageProfile";
import { BankSelectBottomSheet } from "./BankSelectBottomSheet";

interface RefundAccountViewProps {
  order: OrderResponse;
}

/**
 * 환불 계좌 입력 화면.
 *
 * 취소·환불 "요청"(`RefundRequestView`)과 달리 이미 환불 처리가 시작된 주문에 계좌만 채웁니다.
 * 관리자가 취소완료 주문을 되돌린 경우 환불 계좌가 비어 있어 이 화면으로 안내됩니다.
 * 취소 사유를 다시 받지 않으므로 취소 플로우 스토어에 의존하지 않습니다.
 */
export function RefundAccountView({ order }: RefundAccountViewProps) {
  const router = useRouter();
  const setPendingToast = usePendingToastStore((s) => s.setPendingToast);
  const { mutate: submitRefundAccount, isPending } = useSubmitRefundAccount();
  const { data: profile } = useMypageProfile();

  const [selectedBank, setSelectedBank] = useState<BankItem | null>(null);
  const [accountNumber, setAccountNumber] = useState("");
  const [holderName, setHolderName] = useState("");
  const [isBankSheetOpen, setIsBankSheetOpen] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const accountNumberRef = useRef<HTMLInputElement>(null);
  const holderNameRef = useRef<HTMLInputElement>(null);

  // 이미 입력된 계좌가 있으면 수정할 수 있도록 초기값으로 채웁니다.
  useEffect(() => {
    if (order.refundBankName && !selectedBank) {
      setSelectedBank(BANK_LIST.find((bank) => bank.value === order.refundBankName) ?? null);
    }
    if (order.refundBankAccountNumber && !accountNumber) {
      setAccountNumber(order.refundBankAccountNumber);
    }
    if (order.refundAccountHolderName && !holderName) {
      setHolderName(order.refundAccountHolderName);
    }
    // 최초 1회만 채우고, 이후 사용자가 지운 값을 되살리지 않도록 order.id에만 반응합니다.
  }, [order.id]);

  // 예금주명 기본값을 사용자 이름으로 (이미 입력한 게 있으면 덮어쓰지 않음)
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
    setTimeout(() => accountNumberRef.current?.focus(), 50);
  };

  const handleSubmit = () => {
    if (!isValid || !selectedBank || isPending) return;
    submitRefundAccount(
      {
        orderId: order.id,
        bankName: selectedBank.value,
        bankAccountNumber: accountNumber.trim(),
        accountHolderName: holderName.trim(),
      },
      {
        onSuccess: () => {
          setIsLeaving(true);
          setPendingToast({
            message: "환불 계좌가 등록되었어요",
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

  return (
    <div className="pt-5 pb-[96px]">
      <div className="px-5 py-4">
        <InfoNotice message={`환불예정 금액 : ${order.totalPrice.toLocaleString()}원`} />
      </div>

      <div className="px-5">
        <p className="mb-2 text-sm text-gray-500">
          입금이 확인되어 환불을 진행하고 있어요. 환불받으실 계좌를 입력해 주세요.
        </p>

        <section className="py-3">
          <SelectTrigger
            label="은행 선택"
            value={selectedBank?.label ?? null}
            placeholder="은행을 선택해주세요."
            onClick={() => setIsBankSheetOpen(true)}
          />
        </section>

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
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                holderNameRef.current?.focus();
              }
            }}
            placeholder="계좌번호를 입력해주세요."
            className="w-full h-[42px] px-3 border border-gray-100 rounded-lg text-sm text-gray-900 placeholder:text-gray-300 outline-none focus:border-primary"
          />
        </section>

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
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                holderNameRef.current?.blur();
              }
            }}
            placeholder="예금주명을 입력해주세요."
            className="w-full h-[42px] px-3 border border-gray-100 rounded-lg text-sm text-gray-900 placeholder:text-gray-300 outline-none focus:border-primary"
          />
        </section>

        <ul className="text-xs text-gray-400 space-y-1 list-disc pl-4">
          <li>환불까지 영업일 기준 1~2일 걸릴 수 있어요.</li>
          <li>환불 정보가 정확하지 않으면 환불이 늦어질 수 있어요.</li>
        </ul>
      </div>

      <div className="fixed bottom-0 left-1/2 w-full max-w-[600px] -translate-x-1/2 bg-white px-5 py-4">
        <Button onClick={handleSubmit} disabled={!isValid} loading={isPending}>
          {isPending ? "등록 중…" : "환불 계좌 등록"}
        </Button>
      </div>

      <BankSelectBottomSheet
        isOpen={isBankSheetOpen}
        onClose={() => setIsBankSheetOpen(false)}
        onSelect={handleSelectBank}
      />
    </div>
  );
}
