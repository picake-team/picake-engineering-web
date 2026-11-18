"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/apps/web-user/common/components/icons";
import { useMypageProfile } from "@/apps/web-user/features/mypage/hooks/queries/useMypageProfile";
import { BottomSheet } from "./BottomSheet";
import { trackEvent } from "@/apps/web-user/common/utils/analytics.util";

interface PaymentConfirmBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  /** 입금하려는 예약 고유 식별자 (애널리틱스용) */
  reservationId: string;
  amount: number;
  onConfirm: (depositorName: string) => void;
  /** 입금자명 기본값 (미지정 시 프로필 이름) */
  defaultDepositorName?: string | null;
  /** 오버레이·시트 스택 순서 (다른 시트 위에 띄울 때 사용) */
  zIndexClassName?: string;
}

export function PaymentConfirmBottomSheet({
  isOpen,
  onClose,
  reservationId,
  amount,
  onConfirm,
  defaultDepositorName,
  zIndexClassName,
}: PaymentConfirmBottomSheetProps) {
  const { data: profile } = useMypageProfile();
  const [depositorName, setDepositorName] = useState("");

  // 시트가 열릴 때 기본값(미지정 시 사용자 이름)을 채워줌
  useEffect(() => {
    if (isOpen) {
      setDepositorName(defaultDepositorName?.trim() || profile?.name || "");
    }
  }, [isOpen, profile?.name, defaultDepositorName]);

  // "입금정보확인" 바텀시트 노출
  useEffect(() => {
    if (isOpen) {
      trackEvent("view_payment_info_confirm", { reservation_id: reservationId });
    }
  }, [isOpen, reservationId]);

  const handleClose = () => {
    setDepositorName("");
    onClose();
  };

  const handleConfirm = () => {
    onConfirm(depositorName);
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      title="입금정보 확인"
      zIndexClassName={zIndexClassName}
      footerShadow={false}
      footer={
        <div className="flex gap-2 px-5 py-2">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 h-[52px] rounded-xl border border-gray-100 text-base font-bold text-gray-900"
          >
            취소
          </button>
          <button
            type="button"
            disabled={!depositorName.trim()}
            onClick={handleConfirm}
            className="flex-[2] h-[52px] rounded-xl bg-primary text-base font-bold text-white disabled:opacity-40"
          >
            확인했어요
          </button>
        </div>
      }
    >
      <div className="px-5 pt-6 pb-[84px]">
        <div className="flex items-center gap-2 px-3 py-2.5 bg-primary-50 rounded-lg mb-8">
          <Icon name="warning" width={16} height={16} className="text-primary shrink-0" />
          <p className="text-2sm text-gray-900">
            입금자명과 입금금액을 확인해주세요.
            <br />
            입금 확인을 위해 필요한 절차예요.
          </p>
        </div>

        <div className="mb-5">
          <p className="text-sm font-bold text-gray-900 mb-2.5">입금자명</p>
          <div className="relative">
            <input
              type="text"
              value={depositorName}
              onChange={(e) => setDepositorName(e.target.value)}
              placeholder="입금자명을 입력해주세요"
              className="w-full h-[42px] px-3 border border-gray-100 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 outline-none"
            />
            {depositorName && (
              <button
                type="button"
                aria-label="입력 지우기"
                onClick={() => setDepositorName("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center"
              >
                <Icon name="closeCircle" width={20} height={20} className="text-gray-300" />
              </button>
            )}
          </div>
        </div>

        <div>
          <p className="text-sm font-bold text-gray-900 mb-2.5">입금금액</p>
          <div className="w-full h-[42px] px-3 flex items-center border border-gray-100 rounded-lg text-sm text-gray-300 bg-gray-50">
            {amount.toLocaleString()}원
          </div>
        </div>
      </div>
    </BottomSheet>
  );
}
