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
  useNaverRegister,
  useSendPhoneVerification,
  useVerifyPhoneCode,
} from "@/apps/web-user/features/auth/hooks/mutations/useAuthMutation";
import { OAuthRegisterDuplicateAccountScreen } from "@/apps/web-user/features/auth/components/OAuthRegisterDuplicateAccountScreen";
import { AUTH_ERROR_MESSAGES } from "@/apps/web-user/features/auth/constants/auth.constant";
import type {
  DuplicateAccountPayload,
  KakaoRegisterRequestDto,
  NaverRegisterRequestDto,
} from "@/apps/web-user/features/auth/types/auth.dto";
import { PHONE_VERIFICATION_PURPOSE } from "@/apps/web-user/features/auth/types/auth.dto";
import { PATHS } from "@/apps/web-user/common/constants/paths.constant";
import {
  isValidPhone,
  isValidVerificationCode,
  normalizePhone,
} from "@/apps/web-user/common/utils/validator.util";
import {
  PHONE_INPUT_MAX_LENGTH,
  toPhoneDigits,
} from "@/apps/web-user/common/utils/phone-input.util";
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
import { useKeyboardOpen } from "@/apps/web-user/common/hooks/useKeyboardOpen";
import { trackEvent } from "@/apps/web-user/common/utils/analytics.util";
import { resolvePhoneVerificationFailReason } from "@/apps/web-user/features/auth/utils/phone-verification-error.util";
import {
  readRegisterTicketSavedAt,
  hasAllKakaoConsumerTerms,
  clearRegisterTicket,
  isRegisterTicketExpired,
  formatPhoneForDisplay,
  readRegisterTicket,
  readRegisterTicketHints,
  type RegisterTicketHints,
} from "@/apps/web-user/features/auth/utils/register-ticket.util";

/** 가입 요청 실패는 mutation onError가 이미 알렸다 — 화면 함수가 처리 안 된 오류로 끝나지 않게(Sentry에 4xx가 쌓이지 않게, 11-16 검토) */
function ignoreHandledError(): undefined {
  return undefined;
}

function formatCountdownMmSs(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

/** 소셜 서비스가 준 번호로 문자 인증 없이 가입하는 소셜(기획 I-59) — 카카오·네이버가 같은 화면을 쓴다 */
type TicketPhoneProvider = "kakao" | "naver";

const PROVIDER_CONFIG = {
  kakao: {
    purpose: PHONE_VERIFICATION_PURPOSE.KAKAO_REGISTRATION,
    idPrefix: "kakao-register",
  },
  naver: {
    purpose: PHONE_VERIFICATION_PURPOSE.NAVER_REGISTRATION,
    idPrefix: "naver-register",
  },
} as const;

/**
 * 카카오·네이버 가입 화면 — 소셜 서비스가 준 번호를 "번호 칸 + [다른 번호]"로 보여 주고 문자 인증 없이 가입한다.
 * "다른 번호"면 문자 인증. 이름은 소셜 이름으로 채워 두고 고칠 수 있다. 화면에 따로 설명 글은 넣지 않는다(운영자 11-16).
 * 약관: 카카오는 간편가입에서 필수 약관에 다 동의했으면 약관 칸을 뺀다. 네이버는 약관을 동의 화면에 넣을 수 없어 늘 받는다.
 */
export function KakaoRegisterVerificationScreen() {
  return <TicketPhoneRegisterScreen provider="kakao" />;
}

export function NaverRegisterVerificationScreen() {
  return <TicketPhoneRegisterScreen provider="naver" />;
}

function TicketPhoneRegisterScreen({ provider }: { provider: TicketPhoneProvider }) {
  const { purpose, idPrefix } = PROVIDER_CONFIG[provider];
  const router = useRouter();
  const searchParams = useSearchParams();
  const sendPhoneVerificationMutation = useSendPhoneVerification();
  const verifyPhoneCodeMutation = useVerifyPhoneCode();

  const [duplicateAccount, setDuplicateAccount] = useState<DuplicateAccountPayload | null>(null);
  const handleDuplicateAccount = useCallback(
    (payload: DuplicateAccountPayload) => {
      setDuplicateAccount(payload);
      // duplicate_type: 현재 백엔드는 휴대폰 번호 기준 중복만 감지 (existing_user_id는 응답에 없어 미전송)
      trackEvent("view_duplicate_account", { provider, duplicate_type: "phone_number" });
    },
    [provider],
  );
  const { showAlert } = useAlertStore();
  // 키보드가 올라오면 하단 고정 '가입하기' 바가 키보드 위로 따라 올라와 인증번호 입력을 가리므로 숨긴다
  const isKeyboardOpen = useKeyboardOpen();
  // 훅은 늘 둘 다 부르고(훅 규칙) 이 화면의 소셜 것만 쓴다
  const kakaoRegisterMutation = useKakaoRegister({ onDuplicateAccount: handleDuplicateAccount });
  const naverRegisterMutation = useNaverRegister({ onDuplicateAccount: handleDuplicateAccount });
  const registerPendingAny =
    provider === "kakao" ? kakaoRegisterMutation.isPending : naverRegisterMutation.isPending;
  /** 가입 요청 — 카카오는 약관 칸을 생략할 수 있고(간편가입), 네이버는 늘 약관 칸이 있다(buildTermsPart) */
  const registerWith = (payload: KakaoRegisterRequestDto) =>
    provider === "kakao"
      ? kakaoRegisterMutation.mutateAsync(payload)
      : naverRegisterMutation.mutateAsync(payload as NaverRegisterRequestDto);

  const [loginData, setLoginData] = useState<{ registerToken: string } | null>(null);
  const [booting, setBooting] = useState(true);
  // 소셜 서비스가 준 번호·이름·약관 동의(가입표 안, 화면 표시용 — 기획 I-59 B)
  const [hints, setHints] = useState<RegisterTicketHints>({});
  // 소셜 번호로 가입(문자 인증 없음). "다른 번호"를 누르면 지금처럼 문자 인증
  const [useTicketPhone, setUseTicketPhone] = useState(false);
  // 카카오 간편가입에서 필수 약관에 다 동의했으면 약관을 다시 받지 않는다(네이버는 늘 받음)
  const termsFromKakao = provider === "kakao" && hasAllKakaoConsumerTerms(hints.terms);

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
    // 가입표(로그인 때 서버가 확인한 소셜 ID가 들어 있음, 30분) — 가입은 이 값으로만 한다
    const registerToken = readRegisterTicket(provider, searchParams.get("registerToken"));
    if (!registerToken) {
      router.replace(PATHS.HOME);
      setBooting(false);
      return;
    }
    // 30분이 이미 지났으면 문자를 보내기 전에 다시 로그인하게 한다
    if (
      isRegisterTicketExpired(
        registerToken,
        Date.now(),
        readRegisterTicketSavedAt(provider, registerToken),
      )
    ) {
      clearRegisterTicket(provider);
      router.replace(PATHS.HOME);
      showAlert({
        type: "error",
        title: "오류",
        message: "가입 시간이 지났어요. 다시 로그인해 주세요.",
      });
      setBooting(false);
      return;
    }
    const fromTicket = readRegisterTicketHints(registerToken);
    setHints(fromTicket);
    setUseTicketPhone(!!fromTicket.phone);
    if (fromTicket.name) setDisplayName(fromTicket.name);
    setLoginData({ registerToken });
    setBooting(false);
    trackEvent(
      "view_phone_verification",
      provider === "kakao"
        ? { provider, kakao_phone_offered: !!fromTicket.phone }
        : { provider, naver_phone_offered: !!fromTicket.phone },
    );
  }, [provider, router, searchParams, showAlert]);

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
    // 기기 자동완성("010-1234-5678", "+82 10-1234-5678")도 숫자만으로
    const value = toPhoneDigits(e.target.value);
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
    trackEvent("request_phone_verification", { provider });
    const normalized = normalizePhone(phone);
    const { expiresAt } = await sendPhoneVerificationMutation.mutateAsync({
      phone: normalized,
      purpose,
    });
    setCodeExpiresAt(expiresAt);
    setIsCodeSent(true);
    // 재전송 시 이전 인증번호가 남아 있으면 maxLength(6)에 막혀 문자 자동완성 값이 들어가지 않는다
    setVerificationCode("");
    setVerificationCodeError("");
  };

  // 발송(재전송 포함) 직후 인증번호 입력으로 포커스를 옮겨, 문자가 오면 키보드의 인증번호 제안을 바로 누를 수 있게 한다
  useEffect(() => {
    if (!isCodeSent || !codeExpiresAt) return;
    focusElementById(`${idPrefix}-code`);
  }, [idPrefix, isCodeSent, codeExpiresAt]);

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
    if (!loginData) return;
    if (!validateDisplayName(displayName)) return;
    if (useTicketPhone && hints.phone) {
      await submitWithTicketPhone();
      return;
    }
    if (!isCodeSent || remainingSeconds <= 0) return;
    if (!phone || !verificationCode || phoneError || verificationCodeError) return;
    const termsPart = buildTermsPart();
    if (!termsPart) return;

    const normalized = normalizePhone(phone);
    try {
      await verifyPhoneCodeMutation.mutateAsync({
        phone: normalized,
        verificationCode,
        purpose,
      });
    } catch (error) {
      trackEvent("fail_phone_verification", {
        fail_reason: resolvePhoneVerificationFailReason(error),
      });
      return;
    }
    trackEvent("success_phone_verification", { provider });

    trackEvent("request_signup", {
      provider,
      phone_source: "sms",
      terms_source: termsFromKakao ? "kakao" : "screen",
    });
    await registerWith({
      ...loginData,
      phone: normalized,
      name: displayName.trim(),
      ...termsPart,
    }).catch(ignoreHandledError);
  };

  /**
   * 가입 요청에 넣을 약관 칸. 카카오에서 필수 약관에 다 동의했으면 빈 칸(서버가 가입표로 확인 — 번호를 카카오로 받든 문자로 받든 같다).
   * 네이버는 늘 화면 체크.
   * 아니면 화면 체크 — 필수가 빠졌거나 약관을 못 불러왔으면 null(보내지 않음).
   */
  const buildTermsPart = (): Partial<KakaoRegisterRequestDto> | null => {
    if (termsFromKakao) return {};
    if (!isRequiredTermsAllChecked(termsState)) return null;
    const termsDocumentIds = buildConsumerTermsDocumentIds(termsState, activeTermsDocIds);
    if (!termsDocumentIds) {
      showAlert({
        type: "warning",
        title: "약관 동의",
        message: "약관 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
      });
      return null;
    }
    return {
      agreedToTerms: termsState.termsOfService,
      agreedToPrivacy: termsState.privacyPolicy,
      agreedToThirdParty: termsState.thirdPartyConsent,
      agreedToLocationTerms: termsState.locationTerms,
      termsDocumentIds,
    };
  };

  /** 소셜 번호로 가입 — 문자 인증 없이. 약관은 카카오에서 다 동의했으면 다시 받지 않는다 */
  const submitWithTicketPhone = async () => {
    if (!loginData) return;
    const termsPart = buildTermsPart();
    if (!termsPart) return;
    trackEvent("request_signup", {
      provider,
      phone_source: provider,
      terms_source: termsFromKakao ? "kakao" : "screen",
    });
    await registerWith({
      ...loginData,
      useTicketPhone: true,
      name: displayName.trim(),
      ...termsPart,
    }).catch(ignoreHandledError);
  };

  const sendPending = sendPhoneVerificationMutation.isPending;
  const verifyPending = verifyPhoneCodeMutation.isPending;
  const registerPending = registerPendingAny;
  const actionPending = verifyPending || registerPending;

  const termsReady = termsFromKakao || isRequiredTermsAllChecked(termsState);
  const canSubmit = useTicketPhone
    ? !!displayName.trim() && !nameError && !actionPending && termsReady
    : displayName.trim() &&
      !nameError &&
      phone &&
      verificationCode &&
      !phoneError &&
      !verificationCodeError &&
      isCodeSent &&
      remainingSeconds > 0 &&
      !sendPending &&
      !actionPending &&
      termsReady;

  if (booting) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white">
        <p className="text-sm text-gray-600">불러오는 중...</p>
      </div>
    );
  }

  if (!loginData) {
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
    <div className="flex min-h-dvh flex-col bg-white pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))]">
      <Header variant="back-title" title="회원가입" />

      <div className="flex-1 px-5 pt-6">
        <h2 className="text-xl font-bold leading-snug tracking-tight text-gray-900">
          {useTicketPhone ? "가입 정보를 확인해 주세요." : "핸드폰 번호 인증을 진행해주세요."}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-gray-500">
          예약자 확인 및 연락을 위해 필요해요.
        </p>

        <div className="mt-8 flex flex-col">
          <div className="flex flex-col gap-[10px] py-3">
            <label htmlFor={`${idPrefix}-name`} className="text-sm font-bold text-gray-900">
              이름
            </label>
            <Input
              variant="register"
              id={`${idPrefix}-name`}
              type="text"
              name="displayName"
              value={displayName}
              onChange={handleDisplayNameChange}
              error={nameError}
              placeholder="이름을 입력해주세요."
              maxLength={50}
              autoComplete="name"
              enterKeyHint="next"
              onKeyDown={onEnterKey(() => focusElementById(`${idPrefix}-phone`))}
              aria-invalid={!!nameError}
            />
          </div>

          {useTicketPhone && hints.phone ? (
            <div className="mt-4 flex flex-col gap-[10px]">
              <label htmlFor={`${idPrefix}-phone`} className="text-sm font-bold text-gray-900">
                핸드폰 번호
              </label>
              <div className="flex flex-row items-start gap-2">
                <div className="min-w-0 flex-1">
                  <Input
                    variant="register"
                    id={`${idPrefix}-phone`}
                    type="tel"
                    name="phone"
                    value={formatPhoneForDisplay(hints.phone)}
                    readOnly
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setUseTicketPhone(false)}
                  className="box-border inline-flex !h-[42px] !max-h-[42px] !min-h-[42px] shrink-0 !w-auto !items-center !justify-center !rounded-lg !border !border-gray-100 !bg-white !px-5 !py-0 !text-sm !font-bold !leading-tight !text-gray-900 sm:!w-auto"
                >
                  다른 번호
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex flex-col gap-[10px]">
              <label htmlFor={`${idPrefix}-phone`} className="text-sm font-bold text-gray-900">
                핸드폰 번호
              </label>
              <div className="flex flex-row items-start gap-2">
                <div className="min-w-0 flex-1">
                  <Input
                    variant="register"
                    id={`${idPrefix}-phone`}
                    type="tel"
                    name="phone"
                    autoComplete="tel"
                    value={phone}
                    onChange={handlePhoneChange}
                    error={phoneError}
                    placeholder="핸드폰 번호를 입력해주세요."
                    maxLength={PHONE_INPUT_MAX_LENGTH}
                    aria-invalid={!!phoneError}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSendVerificationCode}
                  disabled={!phone || !!phoneError || sendPending}
                  className="box-border inline-flex !h-[42px] !max-h-[42px] !min-h-[42px] shrink-0 !w-auto !items-center !justify-center !rounded-lg !border !border-gray-100 !bg-white !px-5 !py-0 !text-sm !font-bold !leading-tight !text-gray-900 sm:!w-auto disabled:!border-gray-100 disabled:!bg-gray-50 disabled:!text-gray-400"
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
                    id={`${idPrefix}-code`}
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
                  <p className="text-right text-xs font-normal text-blue-400" aria-live="polite">
                    {formatCountdownMmSs(remainingSeconds)} 내 입력
                  </p>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* 약관 동의 — 카카오에서 필수 약관에 모두 동의했으면 다시 받지 않는다(안내 글 없이 칸을 뺌). 네이버는 늘 받는다 */}
        {termsFromKakao ? null : (
          <TermsAgreementSection value={termsState} onChange={setTermsState} />
        )}
      </div>

      <div
        className={`fixed bottom-0 left-0 right-0 z-40 border-t border-gray-100 bg-white px-5 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-3 sm:mx-auto sm:max-w-[640px] ${isKeyboardOpen ? "hidden" : ""}`}
      >
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
