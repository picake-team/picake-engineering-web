/**
 * 휴대폰 소셜 로그인 콜백 (구글·카카오·네이버). 지금 PC 콜백과 같은 서버 흐름이다:
 * code로 로그인 → 휴대폰 미연동이면 회원가입(SC-63: 실명 → 휴대폰 인증 → 약관 동의 → "가입하기")
 * → 그 번호로 다른 소셜 계정이 이미 있으면 "이미 가입한 계정이 있어요"(SC-97)와 그 수단의 로그인 버튼.
 * 손님 앱과 같게 "가입하기"를 눌러야 가입이 끝난다(PC는 "인증 완료"를 누르면 바로 가입).
 */
import React, { useMemo, useRef, useState } from "react";
import { formatPhoneDisplay } from "@/apps/web-seller/common/utils/phone-display.util";
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
import {
  AUTH_ERROR_MESSAGES,
  isRegisterTicketInvalid,
} from "@/apps/web-seller/features/auth/constants/auth.constant";
import {
  PHONE_VERIFICATION_PURPOSE,
  type PhoneVerificationPurpose,
} from "@/apps/web-seller/features/auth/types/auth.dto";
import { usePhoneVerification } from "@/apps/web-seller/features/auth/hooks/usePhoneVerification";
import { PhoneVerifyInputs } from "@/apps/web-seller/features/auth/components/mobile/PhoneVerifyFields";
import { SellerTermsBox } from "@/apps/web-seller/features/auth/components/mobile/SellerTermsBox";
import {
  hasAllKakaoSellerTerms,
  readRegisterTicketHints,
} from "@/apps/web-seller/features/auth/utils/register-ticket-hints.util";
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
  naverAuthorizeUrl,
  SOCIAL_LOGIN_ICON_CLASS,
  SOCIAL_LOGIN_NAVER_ICON_CLASS,
} from "@/apps/web-seller/features/auth/components/mobile/socialLogin";
import { NaverLogoIcon } from "@/apps/web-seller/common/components/icons/NaverLogoIcon";
import {
  clearNaverOAuthState,
  isNaverOAuthStateValid,
} from "@/apps/web-seller/features/auth/utils/naver-oauth-state.util";
import { saveLastLoginProvider } from "@/apps/web-seller/features/auth/utils/last-login-provider.util";

type Provider = "google" | "kakao" | "naver";

/** 가입표(registerToken): 로그인 때 서버가 확인한 소셜 ID가 들어 있다(30분) */
interface SocialIdentity {
  registerToken: string;
}

interface ExistingAccount {
  name?: string;
  phone?: string;
  via: "google" | "kakao" | "apple" | "naver";
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
  naver: {
    label: "네이버",
    purpose: PHONE_VERIFICATION_PURPOSE.NAVER_REGISTRATION as PhoneVerificationPurpose,
    // 네이버는 state를 먼저 확인해야 해서 OAuthCallbackMobile에서 따로 부른다
    login: null,
  },
} as const;

/** 소셜 서비스가 준 번호로 문자 인증 없이 가입할 수 있는 소셜(카카오·네이버, 기획 I-59) */
function offersTicketPhone(provider: Provider): provider is "kakao" | "naver" {
  return provider === "kakao" || provider === "naver";
}

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
        : message.includes("네이버")
          ? "naver"
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
  if (via === "naver") {
    return (
      <a
        href={naverAuthorizeUrl()}
        className="relative flex h-12 w-full items-center justify-center rounded-control bg-naver text-body font-bold text-white"
      >
        <NaverLogoIcon className={SOCIAL_LOGIN_NAVER_ICON_CLASS} />
        네이버로 로그인
      </a>
    );
  }
  const google = via === "google";
  return (
    <a
      href={google ? googleAuthorizeUrl() : kakaoAuthorizeUrl()}
      className={cx(
        "relative flex h-12 w-full items-center justify-center rounded-control text-body font-bold text-ink-900",
        google ? "border border-ink-100 bg-white" : "bg-kakao",
      )}
    >
      <img
        src={google ? googleIcon : kakaoIcon}
        alt=""
        width={20}
        height={20}
        className={SOCIAL_LOGIN_ICON_CLASS}
      />
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
  // 소셜 서비스가 준 번호·이름·약관 동의(가입표 안, 화면 표시용 — 기획 I-59 B). 구글은 이름만 온다
  const hints = useMemo(
    () => readRegisterTicketHints(identity.registerToken),
    [identity.registerToken],
  );
  const [name, setName] = useState(hints.name ?? "");
  // 소셜 번호로 가입(문자 인증 없음, 카카오·네이버). "다른 번호"를 누르면 지금처럼 문자 인증
  const [useTicketPhone, setUseTicketPhone] = useState(
    offersTicketPhone(provider) && Boolean(hints.phone),
  );
  const termsFromKakao = provider === "kakao" && hasAllKakaoSellerTerms(hints.terms);
  const [terms, setTerms] = useState<SellerTermsAgreementState>(INITIAL_SELLER_TERMS_STATE);
  const [submitting, setSubmitting] = useState(false);
  const { data: activeTerms } = useSellerActiveTerms();
  const docIds = useMemo(() => mapSellerActiveTermsToDocIds(activeTerms ?? {}), [activeTerms]);

  const nameError = name && name.trim().length > 50 ? AUTH_ERROR_MESSAGES.NAME_MAX_LENGTH : null;
  const termsOk = termsFromKakao || isRequiredSellerTermsAllChecked(terms);
  const phoneOk = useTicketPhone || v.readyToVerify;
  const ready = Boolean(name.trim()) && !nameError && phoneOk && termsOk;
  const reason = !name.trim()
    ? "실명을 적어 주세요"
    : !useTicketPhone && !v.sent
      ? "휴대폰 인증번호를 받아 주세요"
      : !phoneOk
        ? "인증번호를 넣어 주세요"
        : !termsOk
          ? "필수 약관에 동의해 주세요"
          : null;

  const submit = async () => {
    if (!ready || submitting) return;
    let termsPart: {
      agreedToTerms?: boolean;
      agreedToPrivacy?: boolean;
      termsDocumentIds?: string[];
    } = {};
    if (!termsFromKakao) {
      const termsDocumentIds = buildSellerTermsDocumentIds(terms, docIds);
      if (!termsDocumentIds) {
        addAlert({
          severity: "warning",
          message: "약관을 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요.",
        });
        return;
      }
      termsPart = {
        agreedToTerms: terms.termsOfService,
        agreedToPrivacy: terms.privacyPolicy,
        termsDocumentIds,
      };
    }
    setSubmitting(true);
    try {
      // 네이버는 약관이 늘 화면 체크(termsPart가 비지 않음)
      const naverTerms = {
        agreedToTerms: terms.termsOfService,
        agreedToPrivacy: terms.privacyPolicy,
        termsDocumentIds: termsPart.termsDocumentIds,
      };
      const tokens =
        offersTicketPhone(provider) && useTicketPhone
          ? provider === "naver"
            ? await authApi.naverRegister({
                registerToken: identity.registerToken,
                useTicketPhone: true,
                name: name.trim(),
                ...naverTerms,
              })
            : await authApi.kakaoRegister({
                registerToken: identity.registerToken,
                useTicketPhone: true,
                name: name.trim(),
                ...termsPart,
              })
          : await (async () => {
              const phone = await v.verifyCode();
              if (provider === "google") {
                return await authApi.googleRegister({
                  registerToken: identity.registerToken,
                  name: name.trim(),
                  phone,
                  agreedToTerms: terms.termsOfService,
                  agreedToPrivacy: terms.privacyPolicy,
                  termsDocumentIds: termsPart.termsDocumentIds,
                });
              }
              if (provider === "naver") {
                return await authApi.naverRegister({
                  registerToken: identity.registerToken,
                  name: name.trim(),
                  phone,
                  ...naverTerms,
                });
              }
              // 카카오에서 약관에 동의했으면 termsPart는 빈 칸 — 화면 체크(안 한 값)를 보내지 않는다
              return await authApi.kakaoRegister({
                registerToken: identity.registerToken,
                name: name.trim(),
                phone,
                ...termsPart,
              });
            })();
      clearPendingOAuthRegister();
      saveLastLoginProvider(provider);
      login({ navigate, accessToken: tokens.accessToken });
    } catch (error) {
      const existing = existingAccountFrom(error);
      if (existing) onExisting(existing);
      else {
        if (isRegisterTicketInvalid(error)) {
          // 가입표가 30분 지났거나 잘못됨 — 이 화면에서는 가입할 수 없어 로그인부터 다시
          clearPendingOAuthRegister();
          navigate(ROUTES.AUTH.LOGIN, { replace: true });
        }
        addAlert({ severity: "error", message: getApiMessage.error(error) });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppScreen
      header={
        <BackHeader
          title="회원가입"
          onBack={() => {
            // 뒤로 가면 이 가입표는 버린다 — 다음 로그인에서 옛 가입 화면이 먼저 뜨지 않게
            clearPendingOAuthRegister();
            navigate(ROUTES.AUTH.LOGIN, { replace: true });
          }}
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
      {useTicketPhone && hints.phone ? (
        <Field
          label="휴대폰 번호"
          trailing={
            <Button
              variant="secondary"
              onClick={() => setUseTicketPhone(false)}
              className="min-w-[96px]"
            >
              다른 번호
            </Button>
          }
        >
          {(p) => (
            <TextInput
              id={p.id}
              aria-describedby={p.describedBy}
              readOnly
              value={formatPhoneDisplay(hints.phone ?? "")}
            />
          )}
        </Field>
      ) : (
        <PhoneVerifyInputs v={v} />
      )}
      {termsFromKakao ? null : <SellerTermsBox value={terms} onChange={setTerms} />}
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
  const via = { google: "구글", kakao: "카카오", apple: "애플", naver: "네이버" }[account.via];
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
    pending?.provider === provider ? { registerToken: pending.registerToken } : null;
  const [identity, setIdentity] = useState<SocialIdentity | null>(initial);
  const [existing, setExisting] = useState<ExistingAccount | null>(null);
  // 확인을 마친 네이버 state(로그인 요청에 같이 보냄)
  const naverStateRef = useRef("");

  useOAuthCodeOnce(code, async (c) => {
    if (provider === "naver") {
      // 네이버: 주소의 state가 이 탭이 만든 값과 같을 때만(남이 만든 로그인 결과를 받지 않게)
      const state = params.get("state");
      const stateValid = isNaverOAuthStateValid(state);
      clearNaverOAuthState();
      if (!stateValid || !state) {
        clearPendingOAuthRegister();
        navigate(ROUTES.AUTH.LOGIN, { replace: true });
        addAlert({
          severity: "error",
          message: "로그인을 확인하지 못했어요. 다시 로그인해 주세요.",
        });
        return;
      }
      naverStateRef.current = state;
    }
    try {
      const login_ = PROVIDER[provider].login;
      const data = login_ ? await login_(c) : await authApi.naverLogin(c, naverStateRef.current);
      clearPendingOAuthRegister();
      saveLastLoginProvider(provider);
      login({ navigate, accessToken: data.accessToken });
    } catch (error) {
      const p = errorPayload(error);
      const message = String(p.message ?? "");
      // 가입표: 서버가 확인한 소셜 ID가 들어 있어 가입은 이 값으로만 한다(30분)
      const registerToken = typeof p.registerToken === "string" ? p.registerToken : undefined;
      if (message.includes(AUTH_ERROR_MESSAGES.PHONE_VERIFICATION_REQUIRED) && registerToken) {
        setPendingOAuthRegister({ provider, registerToken });
        setIdentity({ registerToken });
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
  if (identity)
    return (
      <SignUp
        key={identity.registerToken}
        provider={provider}
        identity={identity}
        onExisting={setExisting}
      />
    );
  if (!code) return <Navigate to={ROUTES.AUTH.LOGIN} replace />;
  return <LoadingScreen label={PROVIDER[provider].label} />;
}

export const GoogleAuthCallbackMobilePage: React.FC = () => (
  <OAuthCallbackMobile provider="google" />
);
export const KakaoAuthCallbackMobilePage: React.FC = () => <OAuthCallbackMobile provider="kakao" />;
export const NaverAuthCallbackMobilePage: React.FC = () => <OAuthCallbackMobile provider="naver" />;
