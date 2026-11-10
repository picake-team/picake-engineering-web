"use client";

import { useEffect, useState } from "react";
import { BottomSheet } from "@/apps/web-user/common/components/bottom-sheets/BottomSheet";
import { Button } from "@/apps/web-user/common/components/buttons/Button";
import { InfoNotice } from "@/apps/web-user/common/components/notice/InfoNotice";
import { RadioGroup, type RadioOption } from "@/apps/web-user/common/components/inputs/RadioGroup";
import { Modal } from "@/apps/web-user/common/components/modals/Modal";
import { useWithdraw } from "@/apps/web-user/features/mypage/hooks/mutations/useWithdraw";

type WithdrawReason = "CAKE_VARIETY" | "ORDER_INCONVENIENT" | "NO_NEEDED_SERVICE" | "OTHER";

const WITHDRAW_REASON_LABELS: Record<WithdrawReason, string> = {
  CAKE_VARIETY: "케이크 종류가 많이 없어서",
  ORDER_INCONVENIENT: "주문 방식이 불편해서",
  NO_NEEDED_SERVICE: "필요한 서비스가 없어서",
  OTHER: "기타",
};

const WITHDRAW_REASON_OPTIONS: RadioOption<WithdrawReason>[] = (
  Object.keys(WITHDRAW_REASON_LABELS) as WithdrawReason[]
).map((value) => ({ value, label: WITHDRAW_REASON_LABELS[value] }));

interface WithdrawBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WithdrawBottomSheet({ isOpen, onClose }: WithdrawBottomSheetProps) {
  const [reason, setReason] = useState<WithdrawReason | null>(null);
  const [otherReasonText, setOtherReasonText] = useState("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const { mutate: withdraw, isPending } = useWithdraw();

  useEffect(() => {
    if (isOpen) {
      setReason(null);
      setOtherReasonText("");
      setIsConfirmOpen(false);
    }
  }, [isOpen]);

  const isValid = (() => {
    if (!reason) return false;
    if (reason === "OTHER") return otherReasonText.trim().length > 0;
    return true;
  })();

  const buildReason = (): string => {
    if (reason === "OTHER") return otherReasonText.trim();
    if (reason) return WITHDRAW_REASON_LABELS[reason];
    return "";
  };

  const handleWithdraw = () => {
    if (!isValid || isPending) return;
    withdraw({ reason: buildReason() });
  };

  return (
    <>
      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title="회원탈퇴"
        footer={
          <div className="flex gap-2 px-5 py-4">
            <span className="w-[100px]">
              <Button variant="outline" onClick={onClose}>
                취소
              </Button>
            </span>
            <span className="flex-1">
              <Button onClick={() => setIsConfirmOpen(true)} disabled={!isValid || isPending}>
                회원탈퇴
              </Button>
            </span>
          </div>
        }
      >
        <div className="px-5 pt-5 pb-10 flex flex-col gap-6">
          <InfoNotice tone="red" message="계정 정보가 모두 지워지고 되돌릴 수 없어요." />
          <div>
            <RadioGroup<WithdrawReason>
              label="탈퇴사유"
              value={reason}
              onChange={setReason}
              options={WITHDRAW_REASON_OPTIONS}
              labelClassName="text-lg"
            />
            {reason === "OTHER" && (
              <input
                type="text"
                value={otherReasonText}
                onChange={(e) => setOtherReasonText(e.target.value)}
                placeholder="내용을 입력해주세요."
                maxLength={2000}
                className="mt-2.5 w-full px-3 py-2.5 border border-gray-200 rounded-md text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary"
              />
            )}
          </div>
        </div>
      </BottomSheet>

      <Modal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        title="회원탈퇴"
        description={
          <>
            계정 정보가 모두 지워지고
            <br />
            되돌릴 수 없어요.
            <br />
            정말 탈퇴할까요?
          </>
        }
        confirmText="취소"
        confirmVariant="outline"
        onConfirm={() => {}}
        cancelText="회원탈퇴"
        cancelVariant="red"
        onCancel={() => {
          setIsConfirmOpen(false);
          handleWithdraw();
        }}
      />
    </>
  );
}
