"use client";

import { BottomSheet } from "@/apps/web-user/common/components/bottom-sheets/BottomSheet";
import { Button } from "@/apps/web-user/common/components/buttons/Button";

interface RefundConfirmBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  bankLabel: string;
  bankAccountNumber: string;
  accountHolderName: string;
  isPending?: boolean;
  onConfirm: () => void;
}

export function RefundConfirmBottomSheet({
  isOpen,
  onClose,
  bankLabel,
  bankAccountNumber,
  accountHolderName,
  isPending,
  onConfirm,
}: RefundConfirmBottomSheetProps) {
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="환불 계좌를 최종 확인해주세요"
      footer={
        <div className="flex gap-2 px-5 py-3">
          <span className="flex-1">
            <Button variant="outline" onClick={onClose} disabled={isPending}>
              수정
            </Button>
          </span>
          <span className="flex-[2]">
            <Button onClick={onConfirm} loading={isPending}>
              {isPending ? "요청 중…" : "확인했어요"}
            </Button>
          </span>
        </div>
      }
    >
      <dl className="px-5 pt-6 pb-9 space-y-2">
        <div className="flex gap-10">
          <dt className="w-[80px] text-sm text-gray-500">은행</dt>
          <dd className="text-sm text-gray-900">{bankLabel}</dd>
        </div>
        <div className="flex gap-10">
          <dt className="w-[80px] text-sm text-gray-500">환불 계좌번호</dt>
          <dd className="text-sm text-gray-900 break-all">{bankAccountNumber}</dd>
        </div>
        <div className="flex gap-10">
          <dt className="w-[80px] text-sm text-gray-500">예금주명</dt>
          <dd className="text-sm text-gray-900">{accountHolderName}</dd>
        </div>
      </dl>
    </BottomSheet>
  );
}
