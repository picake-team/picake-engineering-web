import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { formatPhoneDisplay } from "@/apps/web-seller/common/utils/phone-display.util";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { authApi } from "@/apps/web-seller/features/auth/apis/auth.api";
import {
  useKakaoRegister,
  useNaverRegister,
} from "@/apps/web-seller/features/auth/hooks/mutations/useAuthMutation";
import { useOAuthCodeOnce } from "@/apps/web-seller/features/auth/hooks/useOAuthCodeOnce";
import { useAuthStore } from "@/apps/web-seller/features/auth/store/auth.store";
import PhoneVerificationForm from "@/apps/web-seller/features/auth/components/forms/PhoneVerificationForm";
import { Input } from "@/apps/web-seller/common/components/inputs/Input";
import { PHONE_VERIFICATION_PURPOSE } from "@/apps/web-seller/features/auth/types/auth.dto";
import { ROUTES } from "@/apps/web-seller/common/constants/paths.constant";
import { useAlertStore } from "@/apps/web-seller/common/store/alert.store";
import getApiMessage from "@/apps/web-seller/common/utils/getApiMessage";
import { AUTH_ERROR_MESSAGES } from "@/apps/web-seller/features/auth/constants/auth.constant";
import { AuthBrandedCard } from "@/apps/web-seller/common/components/layouts/AuthBrandedCard";
import { ContentLoading } from "@/apps/web-seller/common/components/loading/ContentLoading";
import {
  SellerTermsAgreementSection,
  INITIAL_SELLER_TERMS_STATE,
  isRequiredSellerTermsAllChecked,
  type SellerTermsAgreementState,
} from "@/apps/web-seller/features/auth/components/SellerTermsAgreementSection";
import {
  getPendingOAuthRegister,
  setPendingOAuthRegister,
  clearPendingOAuthRegister,
  type PendingOAuthRegister,
} from "@/apps/web-seller/features/auth/utils/oauth-callback-pending.util";
import {
  consumeNaverOAuthState,
  isNaverOAuthStateValid,
} from "@/apps/web-seller/features/auth/utils/naver-oauth-state.util";
import type {
  KakaoRegisterRequestDto,
  NaverRegisterRequestDto,
} from "@/apps/web-seller/features/auth/types/auth.dto";
import { useSellerActiveTerms } from "@/apps/web-seller/features/terms/hooks/queries/useTermsQuery";
import { Button } from "@/apps/web-seller/common/components/buttons/Button";
import {
  hasAllKakaoSellerTerms,
  readRegisterTicketHints,
} from "@/apps/web-seller/features/auth/utils/register-ticket-hints.util";
import {
  buildSellerTermsDocumentIds,
  mapSellerActiveTermsToDocIds,
} from "@/apps/web-seller/features/terms/utils/terms-consent.util";
import { saveLastLoginProvider } from "@/apps/web-seller/features/auth/utils/last-login-provider.util";

/** 가입 요청 실패는 mutation onError가 이미 알렸다 — 화면 함수가 처리 안 된 오류로 끝나지 않게(Sentry에 4xx가 쌓이지 않게, 11-16 검토). 대기 중 가입 정보는 성공했을 때만 지운다 */
function ignoreHandledError(): undefined {
  return undefined;
}

/** 소셜 서비스가 준 번호로 문자 인증 없이 가입하는 소셜(기획 I-59) — 카카오·네이버가 같은 화면을 쓴다 */
type TicketPhoneProvider = "kakao" | "naver";

const PROVIDER_CONFIG = {
  kakao: {
    label: "카카오",
    purpose: PHONE_VERIFICATION_PURPOSE.KAKAO_REGISTRATION,
    idPrefix: "kakao-auth",
  },
  naver: {
    label: "네이버",
    purpose: PHONE_VERIFICATION_PURPOSE.NAVER_REGISTRATION,
    idPrefix: "naver-auth",
  },
} as const;

function readInitialLoginData(provider: TicketPhoneProvider): PendingOAuthRegister | null {
  const pending = getPendingOAuthRegister();
  return pending?.provider === provider ? pending : null;
}

function stripOAuthCodeFromUrl(
  navigate: ReturnType<typeof useNavigate>,
  location: ReturnType<typeof useLocation>,
  searchParams: URLSearchParams,
) {
  const nextParams = new URLSearchParams(searchParams);
  nextParams.delete("code");
  nextParams.delete("state");
  const search = nextParams.toString();
  navigate({ pathname: location.pathname, search: search ? `?${search}` : "" }, { replace: true });
}

/**
 * 카카오·네이버 로그인 콜백(PC) — 가입이 필요하면 소셜 서비스가 준 번호를 "번호 칸 + [다른 번호]"로 보여 주고 문자 인증 없이 가입한다.
 * 카카오는 간편가입에서 필수 약관에 다 동의했으면 약관 칸을 뺀다. 네이버는 약관을 동의 화면에 넣을 수 없어 늘 받는다.
 * 네이버는 콜백 주소의 state가 이 탭이 만든 값과 같을 때만 서버에 보낸다.
 */
export function KakaoAuthCallbackPage() {
  return <TicketPhoneAuthCallback provider="kakao" />;
}

export function NaverAuthCallbackPage() {
  return <TicketPhoneAuthCallback provider="naver" />;
}

function TicketPhoneAuthCallback({ provider }: { provider: TicketPhoneProvider }) {
  const { label, purpose, idPrefix } = PROVIDER_CONFIG[provider];
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const oauthCode = searchParams.get("code");
  const login = useAuthStore((s) => s.login);
  // 훅은 늘 둘 다 부르고(훅 규칙) 이 화면의 소셜 것만 쓴다
  const kakaoRegisterMutation = useKakaoRegister();
  const naverRegisterMutation = useNaverRegister();
  const registerPending =
    provider === "kakao" ? kakaoRegisterMutation.isPending : naverRegisterMutation.isPending;
  /** 가입 요청 — 카카오는 약관 칸을 생략할 수 있고(간편가입), 네이버는 늘 약관 칸이 있다 */
  const registerWith = (payload: KakaoRegisterRequestDto) =>
    provider === "kakao"
      ? kakaoRegisterMutation.mutateAsync(payload)
      : naverRegisterMutation.mutateAsync(payload as NaverRegisterRequestDto);
  const { addAlert } = useAlertStore();

  const initialPending = readInitialLoginData(provider);
  const [showPhoneVerification, setShowPhoneVerification] = useState(!!initialPending);
  const [loginData, setLoginData] = useState<{ registerToken: string } | null>(
    // provider 칸은 가입 요청에 넣지 않는다(서버가 모르는 칸이면 400)
    initialPending ? { registerToken: initialPending.registerToken } : null,
  );
  const [displayName, setDisplayName] = useState("");
  const [nameError, setNameError] = useState("");
  // 소셜 서비스가 준 번호·이름·약관 동의(가입표 안, 화면 표시용 — 기획 I-59 B)
  const hints = useMemo(
    () => (loginData ? readRegisterTicketHints(loginData.registerToken) : {}),
    [loginData],
  );
  // 처음부터 맞는 모양으로(문자 인증 칸이 한 번 보였다가 바뀌지 않게, 11-16 검토)
  const [useTicketPhone, setUseTicketPhone] = useState(() =>
    initialPending ? Boolean(readRegisterTicketHints(initialPending.registerToken).phone) : false,
  );
  // 카카오 간편가입에서 필수 약관에 다 동의했으면 약관을 다시 받지 않는다(네이버는 늘 받음)
  const termsFromKakao = provider === "kakao" && hasAllKakaoSellerTerms(hints.terms);
  // 가입표를 받으면 소셜 번호·이름으로 미리 채운다(다른 번호를 고르면 지금처럼 문자 인증)
  useEffect(() => {
    if (!loginData) return;
    setUseTicketPhone(Boolean(hints.phone));
    if (hints.name) setDisplayName((cur) => cur || hints.name || "");
  }, [loginData, hints.phone, hints.name]);
  const [termsState, setTermsState] = useState<SellerTermsAgreementState>(
    INITIAL_SELLER_TERMS_STATE,
  );
  const { data: sellerActiveTerms } = useSellerActiveTerms();
  const activeTermsDocIds = useMemo(
    () => mapSellerActiveTermsToDocIds(sellerActiveTerms ?? {}),
    [sellerActiveTerms],
  );

  useEffect(() => {
    if (!oauthCode && !showPhoneVerification && !loginData) {
      navigate(ROUTES.ROOT, { replace: true });
    }
  }, [oauthCode, showPhoneVerification, loginData, navigate]);

  /** 네이버는 state를 먼저 확인한다(이 탭이 만든 값이어야 함). 카카오는 code만 */
  const loginWithCode = (code: string) => {
    if (provider === "kakao") return authApi.kakaoLogin(code);
    const state = searchParams.get("state");
    if (!state || !isNaverOAuthStateValid(state)) {
      throw new Error("NAVER_STATE_MISMATCH");
    }
    // 통과한 state만 지운다(취소·실패로 돌아온 값은 다시 시도할 때 쓴다)
    consumeNaverOAuthState(state);
    return authApi.naverLogin(code, state);
  };

  useOAuthCodeOnce(oauthCode, async (code) => {
    try {
      const data = await loginWithCode(code);
      clearPendingOAuthRegister();
      stripOAuthCodeFromUrl(navigate, location, searchParams);
      saveLastLoginProvider(provider);
      login({ navigate, accessToken: data.accessToken });
    } catch (error: unknown) {
      stripOAuthCodeFromUrl(navigate, location, searchParams);
      if (error instanceof Error && error.message === "NAVER_STATE_MISMATCH") {
        clearPendingOAuthRegister();
        navigate(ROUTES.AUTH.LOGIN, { replace: true });
        addAlert({
          message: "로그인을 확인하지 못했어요. 다시 로그인해 주세요.",
          severity: "error",
        });
        return;
      }

      const err = error as {
        response?: {
          data?: {
            message?: string;
            data?: { registerToken?: string; message?: string };
          };
        };
      };
      const payload = (err?.response?.data?.data ?? err?.response?.data ?? {}) as {
        message?: string;
        registerToken?: string;
      };
      const message = payload.message ?? "";
      // 가입표: 서버가 확인한 소셜 ID가 들어 있어 가입은 이 값으로만 한다(30분)
      const registerToken = payload.registerToken;

      if (
        typeof message === "string" &&
        message.includes(AUTH_ERROR_MESSAGES.PHONE_VERIFICATION_REQUIRED) &&
        registerToken
      ) {
        const pending: PendingOAuthRegister = { provider, registerToken };
        setPendingOAuthRegister(pending);
        setLoginData({ registerToken });
        setUseTicketPhone(Boolean(readRegisterTicketHints(registerToken).phone));
        setShowPhoneVerification(true);
      } else {
        clearPendingOAuthRegister();
        navigate(ROUTES.AUTH.LOGIN, { replace: true });
        addAlert({
          message: getApiMessage.error(error),
          severity: "error",
        });
      }
    }
  });

  const validateDisplayName = (value: string) => {
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
  };

  const handleDisplayNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDisplayName(value);
    if (value.trim()) validateDisplayName(value);
    else setNameError("");
  };

  /** 소셜 번호로 가입 — 문자 인증 없이. 약관은 카카오에서 다 동의했으면 다시 받지 않는다 */
  const handleTicketPhoneRegister = async () => {
    if (!loginData) return;
    if (!validateDisplayName(displayName)) return;
    let termsPart: {
      agreedToTerms?: boolean;
      agreedToPrivacy?: boolean;
      termsDocumentIds?: string[];
    } = {};
    if (!termsFromKakao) {
      if (!isRequiredSellerTermsAllChecked(termsState)) {
        addAlert({
          message: "필수 약관에 모두 동의해 주세요.",
          title: "약관 동의",
          severity: "warning",
        });
        return;
      }
      const termsDocumentIds = buildSellerTermsDocumentIds(termsState, activeTermsDocIds);
      if (!termsDocumentIds) {
        addAlert({
          message: "약관 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
          title: "약관 동의",
          severity: "warning",
        });
        return;
      }
      termsPart = {
        agreedToTerms: termsState.termsOfService,
        agreedToPrivacy: termsState.privacyPolicy,
        termsDocumentIds,
      };
    }
    await registerWith({
      ...loginData,
      useTicketPhone: true,
      name: displayName.trim(),
      ...termsPart,
    }).then(clearPendingOAuthRegister, ignoreHandledError);
  };

  const handlePhoneVerificationComplete = async (phone: string) => {
    if (!loginData) return;
    if (!validateDisplayName(displayName)) return;
    if (termsFromKakao) {
      // 약관은 카카오에서 동의함(서버가 가입표로 확인) — 문자로 받은 번호로만 가입
      await registerWith({
        ...loginData,
        phone,
        name: displayName.trim(),
      }).then(clearPendingOAuthRegister, ignoreHandledError);
      return;
    }
    if (!isRequiredSellerTermsAllChecked(termsState)) {
      addAlert({
        message: "필수 약관에 모두 동의해 주세요.",
        title: "약관 동의",
        severity: "warning",
      });
      return;
    }

    const termsDocumentIds = buildSellerTermsDocumentIds(termsState, activeTermsDocIds);
    if (!termsDocumentIds) {
      addAlert({
        message: "약관 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
        title: "약관 동의",
        severity: "warning",
      });
      return;
    }

    await registerWith({
      ...loginData,
      phone,
      name: displayName.trim(),
      agreedToTerms: termsState.termsOfService,
      agreedToPrivacy: termsState.privacyPolicy,
      termsDocumentIds,
    }).then(clearPendingOAuthRegister, ignoreHandledError);
  };

  if (showPhoneVerification) {
    return (
      <AuthBrandedCard
        title="회원가입"
        footer={
          <div className="flex justify-center">
            <Link
              to={ROUTES.AUTH.LOGIN}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-white hover:text-zinc-900"
            >
              <ArrowLeft className="size-4" aria-hidden />
              로그인으로 돌아가기
            </Link>
          </div>
        }
      >
        <div className="flex flex-col gap-8">
          <div className="space-y-2">
            <label
              htmlFor={`${idPrefix}-display-name`}
              className="text-sm font-medium text-zinc-700"
            >
              이름
            </label>
            <Input
              id={`${idPrefix}-display-name`}
              type="text"
              name="displayName"
              value={displayName}
              onChange={handleDisplayNameChange}
              error={nameError}
              placeholder="실명을 입력해 주세요"
              maxLength={50}
              autoComplete="name"
              className="rounded-lg"
              aria-invalid={!!nameError}
            />
          </div>
          {useTicketPhone && hints.phone ? (
            <div className="flex flex-col gap-2.5">
              <label htmlFor={`${idPrefix}-phone`} className="text-sm font-medium text-zinc-700">
                휴대폰 번호
              </label>
              <div className="flex flex-row items-start gap-2">
                <div className="min-w-0 flex-1">
                  <Input
                    id={`${idPrefix}-phone`}
                    type="tel"
                    name="phone"
                    value={formatPhoneDisplay(hints.phone)}
                    readOnly
                    className="rounded-lg font-mono tabular-nums tracking-wide"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setUseTicketPhone(false)}
                  className="h-12 shrink-0 rounded-lg border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-800 shadow-sm hover:bg-zinc-50 hover:text-zinc-900"
                >
                  다른 번호
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <PhoneVerificationForm
                onVerificationComplete={handlePhoneVerificationComplete}
                purpose={purpose}
                canComplete={termsFromKakao || isRequiredSellerTermsAllChecked(termsState)}
              />
            </div>
          )}
          {termsFromKakao ? null : (
            <SellerTermsAgreementSection value={termsState} onChange={setTermsState} />
          )}
          {useTicketPhone && hints.phone ? (
            <Button
              type="button"
              disabled={
                !displayName.trim() ||
                !!nameError ||
                registerPending ||
                !(termsFromKakao || isRequiredSellerTermsAllChecked(termsState))
              }
              onClick={() => void handleTicketPhoneRegister()}
              className="h-[50px] w-full rounded-lg text-[15px] font-medium shadow-sm"
            >
              {registerPending ? "가입하는 중" : "가입하기"}
            </Button>
          ) : null}
        </div>
      </AuthBrandedCard>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-100 px-4 py-12">
      <ContentLoading
        variant="page"
        message={`${label} 로그인 처리 중…`}
        showLogo
        className="min-h-0 py-10"
      />
    </div>
  );
}
