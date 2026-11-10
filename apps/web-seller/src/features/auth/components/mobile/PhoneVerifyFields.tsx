/**
 * 휴대폰 인증 칸(디자인 기준 B, 회원가입 8-C와 같은 모양): 번호 + 인증번호 전송/재전송(52 흰 버튼) →
 * 인증번호(칸 안 오른쪽에 남은 시간). 숫자 키패드, 문자 인증번호 자동 채우기.
 */
import { Button } from "@/apps/web-seller/common/ui/Button";
import { FrameSubmitBar } from "@/apps/web-seller/common/components/layouts/FrameSubmitBar";
import { Field, TextInput } from "@/apps/web-seller/common/ui/Field";
import {
  usePhoneVerification,
  type PhoneVerificationState,
} from "@/apps/web-seller/features/auth/hooks/usePhoneVerification";
import type { PhoneVerificationPurpose } from "@/apps/web-seller/features/auth/types/auth.dto";

function mmss(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/** 칸만(버튼은 화면이 둔다) */
export function PhoneVerifyInputs({ v, helper }: { v: PhoneVerificationState; helper?: string }) {
  return (
    <>
      <Field
        label="휴대폰 번호"
        error={v.phoneError}
        helper={helper}
        trailing={
          <Button
            variant="secondary"
            onClick={() => void v.sendCode()}
            loading={v.sending}
            loadingLabel="보내는 중"
            disabled={!v.canSend}
            className="min-w-[96px]"
          >
            {v.sent ? "재전송" : "인증번호 전송"}
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
            value={v.phone}
            onChange={(e) => v.setPhone(e.target.value)}
          />
        )}
      </Field>
      {v.sent ? (
        <Field
          label="인증번호"
          error={
            v.codeError ?? (v.remaining <= 0 ? "인증 시간이 지났어요. 재전송을 눌러 주세요" : null)
          }
        >
          {(p) => (
            <div className="relative">
              <TextInput
                id={p.id}
                aria-describedby={p.describedBy}
                invalid={p.invalid}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="6자리"
                maxLength={6}
                value={v.code}
                onChange={(e) => v.setCode(e.target.value)}
                className="pr-20"
              />
              {v.remaining > 0 ? (
                <span
                  aria-live="off"
                  className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-caption font-semibold tabular-nums text-brand-ink"
                >
                  {mmss(v.remaining)}
                </span>
              ) : null}
            </div>
          )}
        </Field>
      ) : null}
    </>
  );
}

/** 칸 + 확인 버튼(휴대폰 번호 변경·계정 찾기). 버튼은 다른 화면처럼 화면 맨 아래 버튼 줄에 붙는다 */
export function PhoneVerifyFields({
  purpose,
  submitLabel = "인증 완료",
  onVerified,
}: {
  purpose: PhoneVerificationPurpose;
  submitLabel?: string;
  /** 인증이 끝나면 정규화한 번호로 부른다(실패하면 throw) */
  onVerified: (phone: string) => Promise<void> | void;
}) {
  const v = usePhoneVerification(purpose);
  const busy = v.verifying;
  return (
    <div className="flex flex-col gap-4">
      <PhoneVerifyInputs v={v} />
      <FrameSubmitBar>
        <Button
          block
          disabled={!v.readyToVerify}
          loading={busy}
          onClick={async () => {
            const phone = await v.verifyCode();
            await onVerified(phone);
          }}
        >
          {submitLabel}
        </Button>
      </FrameSubmitBar>
    </div>
  );
}
