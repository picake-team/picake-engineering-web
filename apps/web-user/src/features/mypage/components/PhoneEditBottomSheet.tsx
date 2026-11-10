"use client";

import { useEffect, useMemo, useState } from "react";
import { BottomSheet } from "@/apps/web-user/common/components/bottom-sheets/BottomSheet";
import { Button } from "@/apps/web-user/common/components/buttons/Button";
import { Input } from "@/apps/web-user/common/components/inputs/Input";
import { cn } from "@/apps/web-user/common/lib/utils";
import { disabledStyle } from "@/apps/web-user/common/styles/disabled.style";
import {
  isValidPhone,
  isValidVerificationCode,
  normalizePhone,
} from "@/apps/web-user/common/utils/validator.util";
import {
  useSendPhoneVerification,
  useVerifyPhoneCode,
} from "@/apps/web-user/features/auth/hooks/mutations/useAuthMutation";
import { PHONE_VERIFICATION_PURPOSE } from "@/apps/web-user/features/auth/types/auth.dto";
import { useChangePhone } from "@/apps/web-user/features/mypage/hooks/mutations/useChangePhone";

interface PhoneEditBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function PhoneEditBottomSheet({ isOpen, onClose, onSuccess }: PhoneEditBottomSheetProps) {
  const [phone, setPhone] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [codeExpiresAt, setCodeExpiresAt] = useState<string | null>(null);
  const [, setCountdownTick] = useState(0);

  const sendMutation = useSendPhoneVerification();
  const verifyMutation = useVerifyPhoneCode();
  const changePhoneMutation = useChangePhone();

  useEffect(() => {
    if (isOpen) {
      setPhone("");
      setVerificationCode("");
      setCodeExpiresAt(null);
    }
  }, [isOpen]);

  // 인증번호 만료 카운트다운 틱
  useEffect(() => {
    if (!codeExpiresAt) return;
    const id = window.setInterval(() => setCountdownTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [codeExpiresAt]);

  const normalizedPhone = normalizePhone(phone);
  const phoneValid = isValidPhone(normalizedPhone);
  const codeSent = !!codeExpiresAt;
  const codeValid = isValidVerificationCode(verificationCode);

  const remainingSeconds = useMemo(() => {
    if (!codeExpiresAt) return 0;
    const end = new Date(codeExpiresAt).getTime();
    if (Number.isNaN(end)) return 0;
    return Math.max(0, Math.floor((end - Date.now()) / 1000));
  }, [codeExpiresAt]);

  const handleSendCode = async () => {
    if (!phoneValid || sendMutation.isPending) return;
    const { expiresAt } = await sendMutation.mutateAsync({
      phone: normalizedPhone,
      purpose: PHONE_VERIFICATION_PURPOSE.PHONE_CHANGE,
    });
    setCodeExpiresAt(expiresAt);
    setVerificationCode("");
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    await verifyMutation.mutateAsync({
      phone: normalizedPhone,
      verificationCode,
      purpose: PHONE_VERIFICATION_PURPOSE.PHONE_CHANGE,
    });
    await changePhoneMutation.mutateAsync({ newPhone: normalizedPhone });
    onSuccess?.();
    onClose();
  };

  const isSubmitting = verifyMutation.isPending || changePhoneMutation.isPending;
  const canSubmit = phoneValid && codeSent && codeValid && remainingSeconds > 0 && !isSubmitting;

  const formatRemaining = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="전화번호 수정"
      footer={
        <div className="flex gap-2 px-5 py-4">
          <span className="flex-1">
            <Button variant="outline" onClick={onClose}>
              취소
            </Button>
          </span>
          <span className="flex-[2]">
            <Button variant="primary" onClick={handleSubmit} disabled={!canSubmit}>
              수정
            </Button>
          </span>
        </div>
      }
    >
      <div className="px-5 pt-6 pb-10 flex flex-col gap-5">
        <div>
          <p className="text-sm font-bold text-gray-900 mb-2">핸드폰 번호</p>
          <div className="flex gap-2">
            <Input
              variant="register"
              placeholder="핸드폰 번호를 입력해주세요."
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setCodeExpiresAt(null);
                setVerificationCode("");
              }}
              inputMode="tel"
            />
            <button
              type="button"
              onClick={handleSendCode}
              disabled={!phoneValid || sendMutation.isPending}
              className={cn(
                "shrink-0 px-3 h-[42px] text-sm font-bold text-gray-900 border border-gray-100 rounded-md",
                disabledStyle.default,
              )}
            >
              {codeSent ? "재전송" : "인증번호 전송"}
            </button>
          </div>
        </div>

        {codeSent && (
          <div>
            <p className="text-sm font-bold text-gray-900 mb-2">인증번호</p>
            <div className="relative">
              <Input
                variant="register"
                placeholder="6자리 인증번호 입력"
                value={verificationCode}
                onChange={(e) =>
                  setVerificationCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))
                }
                inputMode="numeric"
                autoComplete="one-time-code"
              />
              {remainingSeconds > 0 ? (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-primary font-bold">
                  {formatRemaining(remainingSeconds)}
                </span>
              ) : (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-red-400 font-bold">
                  만료됨
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
