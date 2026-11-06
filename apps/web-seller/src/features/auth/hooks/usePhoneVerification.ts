import { useEffect, useState } from "react";
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

/**
 * 휴대폰 인증 상태(번호·인증번호·남은 시간)와 보내기·확인. 서버 호출과 검사는 PC `PhoneVerificationForm`과 같다.
 * 회원가입(가입하기 한 번에 확인 + 가입)과 휴대폰 번호 변경·계정 찾기(확인 버튼)가 같이 쓴다.
 */
export function usePhoneVerification(purpose: PhoneVerificationPurpose) {
  const send = useSendPhoneVerification();
  const verify = useVerifyPhoneCode();
  const [phone, setPhoneRaw] = useState("");
  const [code, setCodeRaw] = useState("");
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!expiresAt) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [expiresAt]);

  // tick이 1초마다 바뀌어 다시 그리면서 남은 시간을 다시 센다
  const end = expiresAt ? new Date(expiresAt).getTime() : Number.NaN;
  const remaining =
    Number.isNaN(end) || tick < 0 ? 0 : Math.max(0, Math.floor((end - Date.now()) / 1000));

  const phoneError =
    phone && !isValidPhone(phone) ? AUTH_ERROR_MESSAGES.PHONE_INVALID_FORMAT : null;
  const codeError =
    code && !isValidVerificationCode(code)
      ? AUTH_ERROR_MESSAGES.VERIFICATION_CODE_INVALID_FORMAT
      : null;
  const sent = expiresAt !== null;

  return {
    phone,
    setPhone: (v: string) => {
      setPhoneRaw(v.replace(/[^0-9]/g, ""));
      setExpiresAt(null);
      setCodeRaw("");
    },
    code,
    setCode: (v: string) => setCodeRaw(v.replace(/[^0-9]/g, "")),
    sent,
    remaining,
    phoneError,
    codeError,
    sending: send.isPending,
    verifying: verify.isPending,
    canSend: Boolean(phone) && !phoneError,
    /** 인증번호를 다 넣었는지(시간 안에) */
    readyToVerify: sent && remaining > 0 && Boolean(code) && !codeError && !phoneError,
    sendCode: async () => {
      const res = await send.mutateAsync({ phone: normalizePhone(phone), purpose });
      setExpiresAt(res.expiresAt);
      setCodeRaw("");
    },
    /** 인증번호를 확인하고 정규화한 번호를 돌려준다(실패하면 throw) */
    verifyCode: async () => {
      const normalized = normalizePhone(phone);
      await verify.mutateAsync({ phone: normalized, verificationCode: code, purpose });
      return normalized;
    },
  };
}

export type PhoneVerificationState = ReturnType<typeof usePhoneVerification>;
