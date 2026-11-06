/**
 * 휴대폰 인증 칸(디자인 기준 B, 회원가입 8-C와 같은 모양): 번호 + 인증번호 전송(52 흰 버튼) → 인증번호 + 남은 시간.
 * 인증 규칙과 서버 호출은 PC `PhoneVerificationForm`과 같다(같은 훅·검사). 숫자 키패드, 문자 인증번호 자동 채우기.
 */
import { useEffect, useState } from "react";
import { Button } from "@/apps/web-seller/common/ui/Button";
import { Field, TextInput } from "@/apps/web-seller/common/ui/Field";
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

function mmss(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export function PhoneVerifyFields({
  purpose,
  submitLabel = "인증 완료",
  canComplete = true,
  onVerified,
}: {
  purpose: PhoneVerificationPurpose;
  submitLabel?: string;
  /** false면 마지막 버튼을 누를 수 없음(예: 필수 약관 미동의) */
  canComplete?: boolean;
  /** 인증이 끝나면 정규화한 번호로 부른다(실패하면 throw) */
  onVerified: (phone: string) => Promise<void> | void;
}) {
  const send = useSendPhoneVerification();
  const verify = useVerifyPhoneCode();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [completing, setCompleting] = useState(false);

  const phoneError =
    phone && !isValidPhone(phone) ? AUTH_ERROR_MESSAGES.PHONE_INVALID_FORMAT : null;
  const codeError =
    code && !isValidVerificationCode(code)
      ? AUTH_ERROR_MESSAGES.VERIFICATION_CODE_INVALID_FORMAT
      : null;

  useEffect(() => {
    if (!expiresAt) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [expiresAt]);

  // tick이 1초마다 바뀌어 다시 그리면서 남은 시간을 다시 센다
  const end = expiresAt ? new Date(expiresAt).getTime() : Number.NaN;
  const remaining =
    Number.isNaN(end) || tick < 0 ? 0 : Math.max(0, Math.floor((end - Date.now()) / 1000));

  const sent = expiresAt !== null;

  const sendCode = async () => {
    const res = await send.mutateAsync({ phone: normalizePhone(phone), purpose });
    setExpiresAt(res.expiresAt);
    setCode("");
  };

  const complete = async () => {
    if (remaining <= 0) return;
    const normalized = normalizePhone(phone);
    setCompleting(true);
    try {
      await verify.mutateAsync({ phone: normalized, verificationCode: code, purpose });
      await onVerified(normalized);
    } finally {
      setCompleting(false);
    }
  };

  const canVerify =
    canComplete &&
    sent &&
    remaining > 0 &&
    Boolean(code) &&
    !codeError &&
    !phoneError &&
    !completing;

  return (
    <div className="flex flex-col gap-4">
      <Field
        label="휴대폰 번호"
        error={phoneError}
        trailing={
          <Button
            variant="secondary"
            onClick={() => void sendCode()}
            loading={send.isPending}
            loadingLabel="보내는 중"
            disabled={!phone || Boolean(phoneError)}
            className="min-w-[112px]"
          >
            {sent ? "재전송" : "인증번호 전송"}
          </Button>
        }
      >
        {(p) => (
          <TextInput
            id={p.id}
            aria-describedby={p.describedBy}
            invalid={p.invalid}
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="01012345678"
            maxLength={11}
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value.replace(/[^0-9]/g, ""));
              setExpiresAt(null);
              setCode("");
            }}
          />
        )}
      </Field>
      {sent ? (
        <Field
          label="인증번호"
          error={
            codeError ?? (remaining <= 0 ? "인증 시간이 지났어요. 재전송을 눌러 주세요" : null)
          }
          counter={remaining > 0 ? mmss(remaining) : undefined}
        >
          {(p) => (
            <TextInput
              id={p.id}
              aria-describedby={p.describedBy}
              invalid={p.invalid}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="인증번호 6자리"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
            />
          )}
        </Field>
      ) : null}
      <Button
        block
        onClick={() => void complete()}
        disabled={!canVerify}
        loading={completing || verify.isPending}
      >
        {submitLabel}
      </Button>
    </div>
  );
}
