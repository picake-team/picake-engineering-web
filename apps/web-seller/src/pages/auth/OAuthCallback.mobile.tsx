/**
 * 휴대폰 소셜 로그인 콜백 (구글·카카오). 지금 PC 콜백과 같은 서버 흐름이다:
 * code로 로그인 → 휴대폰 미연동이면 회원가입(SC-63: 실명 → 휴대폰 인증 → 약관 동의 → "가입하기")
 * → 그 번호로 다른 소셜 계정이 이미 있으면 "이미 가입한 계정이 있어요"(SC-97)와 그 수단의 로그인 버튼.
 * 손님 앱과 같게 "가입하기"를 눌러야 가입이 끝난다(PC는 "인증 완료"를 누르면 바로 가입).
 */
import React, { useMemo, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { AppScreen, BackHeader, BottomActionBar } from "@/apps/web-seller/common/ui/Screen";
import { Button } from "@/apps/web-seller/common/ui/Button";
import { Field, TextInput } from "@/apps/web-seller/common/ui/Field";
import { InfoRow } from "@/apps/web-seller/common/ui/List";
import { cx } from "@/apps/web-seller/common/ui/cx";
import { ROUTES } from "@/apps/web-seller/common/constants/route-paths.constant";
import { useAlertStore } from "@/apps/web-seller/common/store/alert.store";
import getApiMessage from "@/apps/web-seller/common/utils/getApiMessage";
import googleIcon from "@/apps/web-seller/assets/images/google.png";
import kakaoIcon from "@/apps/web-seller/assets/images/kakaotalk.png";
import { authApi } from "@/apps/web-seller/features/auth/apis/auth.api";
import { useAuthStore } from "@/apps/web-seller/features/auth/store/auth.store";
import { useOAuthCodeOnce } from "@/apps/web-seller/features/auth/hooks/useOAuthCodeOnce";
import { AUTH_ERROR_MESSAGES } from "@/apps/web-seller/features/auth/constants/auth.constant";
import {
  PHONE_VERIFICATION_PURPOSE,
  type PhoneVerificationPurpose,
} from "@/apps/web-seller/features/auth/types/auth.dto";
import { usePhoneVerification } from "@/apps/web-seller/features/auth/hooks/usePhoneVerification";
import { PhoneVerifyInputs } from "@/apps/web-seller/features/auth/components/mobile/PhoneVerifyFields";
import { SellerTermsBox } from "@/apps/web-seller/features/auth/components/mobile/SellerTermsBox";
import {
  INITIAL_SELLER_TERMS_STATE,
  isRequiredSellerTermsAllChecked,
  type SellerTermsAgreementState,
} from "@/apps/web-seller/features/auth/components/SellerTermsAgreementSection";
import {
  clearPendingOAuthRegister,
  getPendingOAuthRegister,
  setPendingOAuthRegister,
} from "@/apps/web-seller/features/auth/utils/oauth-callback-pending.util";
import { useSellerActiveTerms } from "@/apps/web-seller/features/terms/hooks/queries/useTermsQuery";
import {
  buildSellerTermsDocumentIds,
  mapSellerActiveTermsToDocIds,
} from "@/apps/web-seller/features/terms/utils/terms-consent.util";
import {
  googleAuthorizeUrl,
  kakaoAuthorizeUrl,
} from "@/apps/web-seller/features/auth/components/mobile/socialLogin";

type Provider = "google" | "kakao";

interface SocialIdentity {
  id: string;
  email: string;
}

interface ExistingAccount {
  name?: string;
  phone?: string;
  via: "google" | "kakao" | "apple";
}

const PROVIDER = {
  google: {
    label: "구글",
    purpose: PHONE_VERIFICATION_PURPOSE.GOOGLE_REGISTRATION as PhoneVerificationPurpose,
    login: authApi.googleLogin,
  },
  kakao: {
    label: "카카오",
    purpose: PHONE_VERIFICATION_PURPOSE.KAKAO_REGISTRATION as PhoneVerificationPurpose,
    login: authApi.kakaoLogin,
  },
} as const;

/** 서버 오류에서 본문(data)과 메시지를 꺼낸다 */
function errorPayload(error: unknown): Record<string, unknown> {
  const e = error as {
    response?: { data?: { data?: Record<string, unknown> } & Record<string, unknown> };
  };
  return (e?.response?.data?.data ?? e?.response?.data ?? {}) as Record<string, unknown>;
}

/** "이미 등록된 ○○ 계정이 있습니다"(409)면 그 계정 정보 */
function existingAccountFrom(error: unknown): ExistingAccount | null {
  const p = errorPayload(error);
  const message = String(p.message ?? "");
  const via = message.includes("카카오")
    ? "kakao"
    : message.includes("구글")
      ? "google"
      : message.includes("애플")
        ? "apple"
        : null;
  if (!via || !message.includes("이미 등록된")) return null;
  return { via, name: p.name as string | undefined, phone: p.phone as string | undefined };
}

function SocialLoginButton({ via }: { via: ExistingAccount["via"] }) {
  if (via === "apple") {
    return (
      <span className="flex h-12 items-center justify-center rounded-control bg-black text-body font-bold text-white">
        Apple 계정으로 가입돼 있어요
      </span>
    );
  }
  const google = via === "google";
  return (
    <a
      href={google ? googleAuthorizeUrl() : kakaoAuthorizeUrl()}
      className={cx(
        "flex h-12 w-full items-center justify-center gap-2 rounded-control text-body font-bold text-ink-900",
        google ? "border border-ink-100 bg-white" : "bg-kakao",
      )}
    >
      <img src={google ? googleIcon : kakaoIcon} alt="" width={20} height={20} className="size-5" />
      {google ? "구글로 로그인" : "카카오로 로그인"}
    </a>
  );
}

function SignUp({
  provider,
  identity,
  onExisting,
}: {
  provider: Provider;
  identity: SocialIdentity;
  onExisting: (a: ExistingAccount) => void;
}) {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const addAlert = useAlertStore((s) => s.addAlert);
  const v = usePhoneVerification(PROVIDER[provider].purpose);
  const [name, setName] = useState("");
  const [terms, setTerms] = useState<SellerTermsAgreementState>(INITIAL_SELLER_TERMS_STATE);
  const [submitting, setSubmitting] = useState(false);
  const { data: activeTerms } = useSellerActiveTerms();
  const docIds = useMemo(() => mapSellerActiveTermsToDocIds(activeTerms ?? {}), [activeTerms]);

  const nameError = name && name.trim().length > 50 ? AUTH_ERROR_MESSAGES.NAME_MAX_LENGTH : null;
  const termsOk = isRequiredSellerTermsAllChecked(terms);
  const ready = Boolean(name.trim()) && !nameError && v.readyToVerify && termsOk;
  const reason = !name.trim()
    ? "실명을 적어 주세요"
    : !v.sent
      ? "휴대폰 인증번호를 받아 주세요"
      : !v.readyToVerify
        ? "인증번호를 넣어 주세요"
        : !termsOk
          ? "필수 약관에 동의해 주세요"
          : null;

  const submit = async () => {
    if (!ready || submitting) return;
    const termsDocumentIds = buildSellerTermsDocumentIds(terms, docIds);
    if (!termsDocumentIds) {
      addAlert({
        severity: "warning",
        message: "약관을 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요.",
      });
      return;
    }
    setSubmitting(true);
    try {
      const phone = await v.verifyCode();
      const body = {
        name: name.trim(),
        phone,
        agreedToTerms: terms.termsOfService,
        agreedToPrivacy: terms.privacyPolicy,
        termsDocumentIds,
      };
      const tokens =
        provider === "google"
          ? await authApi.googleRegister({
              ...body,
              googleId: identity.id,
              googleEmail: identity.email,
            })
          : await authApi.kakaoRegister({
              ...body,
              kakaoId: identity.id,
              kakaoEmail: identity.email,
            });
      clearPendingOAuthRegister();
      login({ navigate, accessToken: tokens.accessToken });
    } catch (error) {
      const existing = existingAccountFrom(error);
      if (existing) onExisting(existing);
      else addAlert({ severity: "error", message: getApiMessage.error(error) });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppScreen
      header={
        <BackHeader
          title="회원가입"
          onBack={() => navigate(ROUTES.AUTH.LOGIN, { replace: true })}
        />
      }
      bodyClassName="gap-4 pt-2"
      footer={
        <BottomActionBar reason={ready ? undefined : reason}>
          <Button block onClick={() => void submit()} disabled={!ready} loading={submitting}>
            가입하기
          </Button>
        </BottomActionBar>
      }
    >
      <Field label="실명" error={nameError}>
        {(p) => (
          <TextInput
            id={p.id}
            aria-describedby={p.describedBy}
            invalid={p.invalid}
            autoComplete="name"
            maxLength={50}
            placeholder="예: 홍길동"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        )}
      </Field>
      <PhoneVerifyInputs v={v} helper="계정 확인과 계정 찾기에 써요" />
      <SellerTermsBox value={terms} onChange={setTerms} />
    </AppScreen>
  );
}

function ExistingAccountScreen({
  account,
  onBack,
}: {
  account: ExistingAccount;
  onBack: () => void;
}) {
  const via = { google: "구글", kakao: "카카오", apple: "애플" }[account.via];
  return (
    <AppScreen
      header={<BackHeader title="회원가입" onBack={onBack} />}
      bodyClassName="gap-5 pt-0"
      footer={
        <BottomActionBar>
          <SocialLoginButton via={account.via} />
        </BottomActionBar>
      }
    >
      <div className="flex flex-col gap-2">
        <h1 className="text-title font-bold text-ink-900">이미 가입한 계정이 있어요.</h1>
        <p className="text-sub text-ink-600">아래 계정으로 로그인해 주세요.</p>
      </div>
      <div className="flex flex-col gap-1 rounded-card border border-ink-100 p-4">
        {account.name ? (
          <InfoRow labelClassName="w-[88px]" label="이름" value={account.name} />
        ) : null}
        {account.phone ? (
          <InfoRow labelClassName="w-[88px]" label="휴대폰 번호" value={account.phone} />
        ) : null}
        <InfoRow labelClassName="w-[88px]" label="로그인 수단" value={via} />
      </div>
    </AppScreen>
  );
}

function LoadingScreen({ label }: { label: string }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-white font-app text-sub text-ink-600">
      <span className="inline-block size-7 animate-spin rounded-full border-[3px] border-ink-100 border-t-brand" />
      {label} 로그인 중…
    </div>
  );
}

function OAuthCallbackMobile({ provider }: { provider: Provider }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const login = useAuthStore((s) => s.login);
  const addAlert = useAlertStore((s) => s.addAlert);
  const code = params.get("code");

  const pending = getPendingOAuthRegister();
  const initial: SocialIdentity | null =
    pending?.provider === "google" && provider === "google"
      ? { id: pending.googleId, email: pending.googleEmail }
      : pending?.provider === "kakao" && provider === "kakao"
        ? { id: pending.kakaoId, email: pending.kakaoEmail }
        : null;
  const [identity, setIdentity] = useState<SocialIdentity | null>(initial);
  const [existing, setExisting] = useState<ExistingAccount | null>(null);

  useOAuthCodeOnce(code, async (c) => {
    try {
      const data = await PROVIDER[provider].login(c);
      clearPendingOAuthRegister();
      login({ navigate, accessToken: data.accessToken });
    } catch (error) {
      const p = errorPayload(error);
      const message = String(p.message ?? "");
      const id = (provider === "google" ? p.googleId : p.kakaoId) as string | undefined;
      const email = (provider === "google" ? p.googleEmail : p.kakaoEmail) as string | undefined;
      if (message.includes(AUTH_ERROR_MESSAGES.PHONE_VERIFICATION_REQUIRED) && id) {
        const next = { id, email: email ?? "" };
        setPendingOAuthRegister(
          provider === "google"
            ? { provider: "google", googleId: next.id, googleEmail: next.email }
            : { provider: "kakao", kakaoId: next.id, kakaoEmail: next.email },
        );
        setIdentity(next);
        // 주소의 code는 한 번만 쓴다
        navigate({ search: "" }, { replace: true });
      } else {
        clearPendingOAuthRegister();
        navigate(ROUTES.AUTH.LOGIN, { replace: true });
        addAlert({ severity: "error", message: getApiMessage.error(error) });
      }
    }
  });

  if (existing)
    return <ExistingAccountScreen account={existing} onBack={() => setExisting(null)} />;
  if (identity) return <SignUp provider={provider} identity={identity} onExisting={setExisting} />;
  if (!code) return <Navigate to={ROUTES.AUTH.LOGIN} replace />;
  return <LoadingScreen label={PROVIDER[provider].label} />;
}

export const GoogleAuthCallbackMobilePage: React.FC = () => (
  <OAuthCallbackMobile provider="google" />
);
export const KakaoAuthCallbackMobilePage: React.FC = () => <OAuthCallbackMobile provider="kakao" />;
