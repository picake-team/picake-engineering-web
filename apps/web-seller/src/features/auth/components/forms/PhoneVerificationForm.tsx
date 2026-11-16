import { useEffect, useMemo, useState } from "react";
import refreshIcon from "@/apps/web-seller/assets/images/refresh.png";
import { Input } from "@/apps/web-seller/common/components/inputs/Input";
import { Button } from "@/apps/web-seller/common/components/buttons/Button";
import { cn } from "@/apps/web-seller/common/utils/classname.util";
import { LoadingSpinner } from "@/apps/web-seller/common/components/loading/LoadingSpinner";
import {
  useSendPhoneVerification,
  useVerifyPhoneCode,
} from "@/apps/web-seller/features/auth/hooks/mutations/useAuthMutation";
import { AUTH_ERROR_MESSAGES } from "@/apps/web-seller/features/auth/constants/auth.constant";
import {
  isValidPhone,
  isValidVerificationCode,
  normalizePhone,
} from "@/apps/web-seller/common/utils/validator.util";
import type { PhoneVerificationPurpose } from "@/apps/web-seller/features/auth/types/auth.dto";

function formatCountdownMmSs(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

interface PhoneVerificationFormProps {
  onVerificationComplete: (phone: string) => void;
  purpose: PhoneVerificationPurpose;
  /** false이면 인증 완료 버튼 비활성 (예: 필수 약관 미동의) */
  canComplete?: boolean;
}

export default function PhoneVerificationForm({
  onVerificationComplete,
  purpose,
  canComplete = true,
}: PhoneVerificationFormProps) {
  const sendPhoneVerificationMutation = useSendPhoneVerification();
  const verifyPhoneCodeMutation = useVerifyPhoneCode();

  const [phone, setPhone] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [verificationCodeError, setVerificationCodeError] = useState("");
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [codeExpiresAt, setCodeExpiresAt] = useState<string | null>(null);
  const [countdownTick, setCountdownTick] = useState(0);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    setPhone(value);
    setIsCodeSent(false);
    setCodeExpiresAt(null);
    setVerificationCode("");
    setVerificationCodeError("");

    if (!isValidPhone(value)) {
      setPhoneError(AUTH_ERROR_MESSAGES.PHONE_INVALID_FORMAT);
      return;
    }

    setPhoneError("");
  };

  const handleVerificationCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    setVerificationCode(value);

    if (!isValidVerificationCode(value)) {
      setVerificationCodeError(AUTH_ERROR_MESSAGES.VERIFICATION_CODE_INVALID_FORMAT);
      return;
    }

    setVerificationCodeError("");
  };

  const handleSendVerificationCode = async () => {
    const normalized = normalizePhone(phone);
    const { expiresAt } = await sendPhoneVerificationMutation.mutateAsync({
      phone: normalized,
      purpose,
    });
    setCodeExpiresAt(expiresAt);
    setIsCodeSent(true);
  };

  useEffect(() => {
    if (!isCodeSent || !codeExpiresAt) return;
    const id = window.setInterval(() => {
      setCountdownTick((t) => t + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [isCodeSent, codeExpiresAt]);

  const remainingSeconds = useMemo(() => {
    if (!codeExpiresAt) return 0;
    const end = new Date(codeExpiresAt).getTime();
    if (Number.isNaN(end)) return 0;
    return Math.max(0, Math.floor((end - Date.now()) / 1000));
  }, [codeExpiresAt, countdownTick]);

  const handleVerifyCode = async () => {
    if (remainingSeconds <= 0) return;
    const normalized = normalizePhone(phone);
    await verifyPhoneCodeMutation.mutateAsync({
      phone: normalized,
      verificationCode,
      purpose,
    });
    onVerificationComplete(normalized);
  };

  const sendPending = sendPhoneVerificationMutation.isPending;
  const verifyPending = verifyPhoneCodeMutation.isPending;

  const canVerify =
    canComplete &&
    !!phone &&
    !!verificationCode &&
    !phoneError &&
    !verificationCodeError &&
    isCodeSent &&
    remainingSeconds > 0 &&
    !verifyPending;

  return (
    <form className="w-full space-y-5" onSubmit={(e) => e.preventDefault()}>
      <div className="flex flex-col gap-2.5">
        <label htmlFor="auth-phone" className="text-sm font-medium text-zinc-700">
          휴대폰 번호
        </label>
        <div className="flex flex-row items-start gap-2">
          <div className="min-w-0 flex-1">
            <Input
              id="auth-phone"
              type="tel"
              name="phone"
              value={phone}
              onChange={handlePhoneChange}
              error={phoneError}
              placeholder="01012345678"
              maxLength={11}
              className="rounded-lg font-mono tabular-nums tracking-wide"
              aria-invalid={!!phoneError}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleSendVerificationCode}
            disabled={!phone || !!phoneError || sendPending}
            className={cn(
              "h-12 shrink-0 rounded-lg border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-800 shadow-sm",
              "hover:bg-zinc-50 hover:text-zinc-900",
              "disabled:border-zinc-100 disabled:bg-zinc-50 disabled:text-zinc-400",
            )}
          >
            {sendPending ? (
              <span className="inline-flex items-center gap-2">
                <LoadingSpinner size="sm" aria-hidden />
                발송 중
              </span>
            ) : isCodeSent ? (
              <span className="inline-flex items-center gap-1">
                재전송
                <img
                  src={refreshIcon}
                  alt=""
                  width={18}
                  height={18}
                  className="size-[18px] shrink-0 opacity-80"
                  aria-hidden
                />
              </span>
            ) : (
              "인증번호 전송"
            )}
          </Button>
        </div>

        {isCodeSent ? (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="auth-code" className="sr-only">
              인증번호
            </label>
            <Input
              id="auth-code"
              type="text"
              name="verificationCode"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={verificationCode}
              onChange={handleVerificationCodeChange}
              error={verificationCodeError}
              placeholder="인증번호 6자리"
              maxLength={6}
              className="rounded-lg text-base font-medium text-zinc-900 placeholder:text-zinc-400"
              aria-label="인증번호"
              aria-invalid={!!verificationCodeError}
            />
            <p
              className="text-right text-xs font-medium text-zinc-500 tabular-nums"
              aria-live="polite"
            >
              {formatCountdownMmSs(remainingSeconds)} 내 입력
            </p>
          </div>
        ) : null}
      </div>

      <Button
        type="button"
        disabled={!canVerify}
        onClick={handleVerifyCode}
        className="h-[50px] w-full rounded-lg text-[15px] font-medium shadow-sm"
      >
        {verifyPending ? (
          <span className="inline-flex items-center gap-2">
            <LoadingSpinner size="sm" aria-hidden />
            인증 중
          </span>
        ) : (
          "인증 완료"
        )}
      </Button>
    </form>
  );
}
