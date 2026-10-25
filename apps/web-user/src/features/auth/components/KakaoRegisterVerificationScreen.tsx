"use client";

import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import Header from "@/apps/web-user/common/components/headers/Header";
import { Input } from "@/apps/web-user/common/components/inputs/Input";
import { Button } from "@/apps/web-user/common/components/buttons/Button";
import {
  useKakaoRegister,
  useSendPhoneVerification,
  useVerifyPhoneCode,
} from "@/apps/web-user/features/auth/hooks/mutations/useAuthMutation";
import { OAuthRegisterDuplicateAccountScreen } from "@/apps/web-user/features/auth/components/OAuthRegisterDuplicateAccountScreen";
import { AUTH_ERROR_MESSAGES } from "@/apps/web-user/features/auth/constants/auth.constant";
import type { DuplicateAccountPayload } from "@/apps/web-user/features/auth/types/auth.dto";
import { PHONE_VERIFICATION_PURPOSE } from "@/apps/web-user/features/auth/types/auth.dto";
import { PATHS } from "@/apps/web-user/common/constants/paths.constant";
import {
  isValidPhone,
  isValidVerificationCode,
  normalizePhone,
} from "@/apps/web-user/common/utils/validator.util";
import {
  TermsAgreementSection,
  INITIAL_TERMS_STATE,
  isRequiredTermsAllChecked,
  type TermsAgreementState,
} from "@/apps/web-user/features/auth/components/TermsAgreementSection";
import { useAlertStore } from "@/apps/web-user/common/store/alert.store";
import { useConsumerActiveTerms } from "@/apps/web-user/features/terms/hooks/queries/useTermsQuery";
import {
  buildConsumerTermsDocumentIds,
  mapConsumerActiveTermsToDocIds,
} from "@/apps/web-user/features/terms/utils/terms-consent.util";
import { focusElementById, onEnterKey } from "@/apps/web-user/common/utils/enter-next.util";
import { trackEvent } from "@/apps/web-user/common/utils/analytics.util";
import { resolvePhoneVerificationFailReason } from "@/apps/web-user/features/auth/utils/phone-verification-error.util";

function formatCountdownMmSs(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export function KakaoRegisterVerificationScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sendPhoneVerificationMutation = useSendPhoneVerification();
  const verifyPhoneCodeMutation = useVerifyPhoneCode();

  const [duplicateAccount, setDuplicateAccount] = useState<DuplicateAccountPayload | null>(null);
  const handleDuplicateAccount = useCallback((payload: DuplicateAccountPayload) => {
    setDuplicateAccount(payload);
    // duplicate_type: 현재 백엔드는 휴대폰 번호 기준 중복만 감지 (existing_user_id는 응답에 없어 미전송)
    trackEvent("view_duplicate_account", { provider: "kakao", duplicate_type: "phone_number" });
  }, []);
  const { showAlert } = useAlertStore();
  const kakaoRegisterMutation = useKakaoRegister({ onDuplicateAccount: handleDuplicateAccount });

  const [kakaoLoginData, setKakaoLoginData] = useState<{
    kakaoId: string;
    kakaoEmail: string;
  } | null>(null);
  const [booting, setBooting] = useState(true);

  const [displayName, setDisplayName] = useState("");
  const [nameError, setNameError] = useState("");
  const [phone, setPhone] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [verificationCodeError, setVerificationCodeError] = useState("");
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [codeExpiresAt, setCodeExpiresAt] = useState<string | null>(null);
  const [countdownTick, setCountdownTick] = useState(0);
  const [termsState, setTermsState] = useState<TermsAgreementState>(INITIAL_TERMS_STATE);
  const { data: consumerActiveTerms } = useConsumerActiveTerms();
  const activeTermsDocIds = useMemo(
    () => mapConsumerActiveTermsToDocIds(consumerActiveTerms ?? {}),
    [consumerActiveTerms],
  );

  useEffect(() => {
    const kakaoId = searchParams.get("kakaoId")?.trim();
    const kakaoEmail = searchParams.get("kakaoEmail")?.trim();
    if (!kakaoId || !kakaoEmail) {
      router.replace(PATHS.HOME);
      setBooting(false);
      return;
    }
    setKakaoLoginData({ kakaoId, kakaoEmail });
    setBooting(false);
    trackEvent("view_phone_verification", { provider: "kakao" });
  }, [router, searchParams]);

  const validateDisplayName = useCallback((value: string) => {
    const t = value.trim();
    if (!t) {
      setNameError(AUTH_ERROR_MESSAGES.NAME_REQUIRED);
      return false;
    }
    if (t.length > 50) {
      setNameError(AUTH_ERROR_MESSAGES.NAME_MAX_LENGTH);
      return false;
    }
    setNameError("");
    return true;
  }, []);

  const handleDisplayNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDisplayName(value);
    if (value.trim()) validateDisplayName(value);
    else setNameError("");
  };

  const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>) => {
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

  const handleVerificationCodeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    setVerificationCode(value);

    if (!isValidVerificationCode(value)) {
      setVerificationCodeError(AUTH_ERROR_MESSAGES.VERIFICATION_CODE_INVALID_FORMAT);
      return;
    }
    setVerificationCodeError("");
  };

  const handleSendVerificationCode = async () => {
    trackEvent("request_phone_verification", { provider: "kakao" });
    const normalized = normalizePhone(phone);
    const { expiresAt } = await sendPhoneVerificationMutation.mutateAsync({
      phone: normalized,
      purpose: PHONE_VERIFICATION_PURPOSE.KAKAO_REGISTRATION,
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

  const handleSubmit = async () => {
    if (!kakaoLoginData) return;
    if (!validateDisplayName(displayName)) return;
    if (!isCodeSent || remainingSeconds <= 0) return;
    if (!phone || !verificationCode || phoneError || verificationCodeError) return;
    if (!isRequiredTermsAllChecked(termsState)) return;

    const normalized = normalizePhone(phone);
    try {
      await verifyPhoneCodeMutation.mutateAsync({
        phone: normalized,
        verificationCode,
        purpose: PHONE_VERIFICATION_PURPOSE.KAKAO_REGISTRATION,
      });
    } catch (error) {
      trackEvent("fail_phone_verification", {
        fail_reason: resolvePhoneVerificationFailReason(error),
      });
      return;
    }
    trackEvent("success_phone_verification", { provider: "kakao" });

    const termsDocumentIds = buildConsumerTermsDocumentIds(termsState, activeTermsDocIds);
    if (!termsDocumentIds) {
      showAlert({
        type: "warning",
        title: "약관 동의",
        message: "약관 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
      });
      return;
    }

    trackEvent("request_signup", { provider: "kakao" });
    await kakaoRegisterMutation.mutateAsync({
      ...kakaoLoginData,
      phone: normalized,
      name: displayName.trim(),
      agreedToTerms: termsState.termsOfService,
      agreedToPrivacy: termsState.privacyPolicy,
      agreedToThirdParty: termsState.thirdPartyConsent,
      agreedToLocationTerms: termsState.locationTerms,
      termsDocumentIds,
    });
  };

  const sendPending = sendPhoneVerificationMutation.isPending;
  const verifyPending = verifyPhoneCodeMutation.isPending;
  const registerPending = kakaoRegisterMutation.isPending;
  const actionPending = verifyPending || registerPending;

  const canSubmit =
    displayName.trim() &&
    !nameError &&
    phone &&
    verificationCode &&
    !phoneError &&
    !verificationCodeError &&
    isCodeSent &&
    remainingSeconds > 0 &&
    !sendPending &&
    !actionPending &&
    isRequiredTermsAllChecked(termsState);

  if (booting) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white">
        <p className="text-sm text-gray-600">불러오는 중...</p>
      </div>
    );
  }

  if (!kakaoLoginData) {
    return null;
  }

  if (duplicateAccount) {
    return (
      <OAuthRegisterDuplicateAccountScreen
        payload={duplicateAccount}
        onBack={() => setDuplicateAccount(null)}
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))]">
      <Header variant="back-title" title="회원가입" />

      <div className="flex-1 px-5 pt-6">
        <h2 className="text-xl font-bold leading-snug tracking-tight text-[var(--grayscale-gr-900,#1F1F1E)]">
          핸드폰 번호 인증을 진행해주세요.
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-[var(--grayscale-gr-500,#82817D)]">
          예약자 확인 및 연락을 위해 필요해요.
        </p>

        <div className="mt-8 flex flex-col">
          <div className="flex flex-col gap-[10px] py-3">
            <label
              htmlFor="kakao-register-name"
              className="text-sm font-bold text-[var(--grayscale-gr-900,#1F1F1E)]"
            >
              이름
            </label>
            <Input
              variant="register"
              id="kakao-register-name"
              type="text"
              name="displayName"
              value={displayName}
              onChange={handleDisplayNameChange}
              error={nameError}
              placeholder="이름을 입력해주세요."
              maxLength={50}
              autoComplete="name"
              enterKeyHint="next"
              onKeyDown={onEnterKey(() => focusElementById("kakao-register-phone"))}
              aria-invalid={!!nameError}
            />
          </div>

          <div className="mt-4 flex flex-col gap-[10px]">
            <label
              htmlFor="kakao-register-phone"
              className="text-sm font-bold text-[var(--grayscale-gr-900,#1F1F1E)]"
            >
              핸드폰 번호
            </label>
            <div className="flex flex-row items-start gap-2">
              <div className="min-w-0 flex-1">
                <Input
                  variant="register"
                  id="kakao-register-phone"
                  type="tel"
                  name="phone"
                  value={phone}
                  onChange={handlePhoneChange}
                  error={phoneError}
                  placeholder="핸드폰 번호를 입력해주세요."
                  maxLength={11}
                  aria-invalid={!!phoneError}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleSendVerificationCode}
                disabled={!phone || !!phoneError || sendPending}
                className="box-border inline-flex !h-[42px] !max-h-[42px] !min-h-[42px] shrink-0 !w-auto !items-center !justify-center !rounded-lg !border !border-[var(--grayscale-gr-100,#EBEBEA)] !bg-white !px-5 !py-0 !text-sm !font-bold !leading-tight !text-[var(--grayscale-gr-900,#1F1F1E)] sm:!w-auto disabled:!border-[var(--grayscale-gr-100,#EBEBEA)] disabled:!bg-gray-50 disabled:!text-gray-400"
              >
                {sendPending ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    발송 중
                  </span>
                ) : isCodeSent ? (
                  <span className="inline-flex flex-row items-center gap-[4px]">
                    재전송
                    <Image
                      src="/images/contents/refresh.png"
                      alt=""
                      width={20}
                      height={20}
                      className="size-5 shrink-0"
                      aria-hidden
                    />
                  </span>
                ) : (
                  "인증번호 전송"
                )}
              </Button>
            </div>

            {isCodeSent ? (
              <div className="flex flex-col gap-1">
                <Input
                  variant="register"
                  id="kakao-register-code"
                  type="text"
                  name="verificationCode"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={verificationCode}
                  onChange={handleVerificationCodeChange}
                  error={verificationCodeError}
                  placeholder="인증번호를 입력해주세요."
                  maxLength={6}
                  aria-label="인증번호"
                  aria-invalid={!!verificationCodeError}
                />
                <p
                  className="text-right text-xs font-normal text-[var(--system-blu-400,#009BF5)]"
                  aria-live="polite"
                >
                  {formatCountdownMmSs(remainingSeconds)} 내 입력
                </p>
              </div>
            ) : null}
          </div>
        </div>

        {/* 약관 동의 */}
        <TermsAgreementSection value={termsState} onChange={setTermsState} />
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-100 bg-white px-5 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-3 sm:mx-auto sm:max-w-[640px]">
        <Button
          type="button"
          disabled={!canSubmit}
          onClick={() => void handleSubmit()}
          className="h-[52px] w-full text-base font-bold"
        >
          {actionPending ? (
            <span className="inline-flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin shrink-0" aria-hidden />
              처리 중
            </span>
          ) : (
            "가입하기"
          )}
        </Button>
      </div>
    </div>
  );
}
