import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { authApi } from "@/apps/web-seller/features/auth/apis/auth.api";
import { useKakaoRegister } from "@/apps/web-seller/features/auth/hooks/mutations/useAuthMutation";
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
  type PendingKakaoRegister,
} from "@/apps/web-seller/features/auth/utils/oauth-callback-pending.util";
import { useSellerActiveTerms } from "@/apps/web-seller/features/terms/hooks/queries/useTermsQuery";
import { Button } from "@/apps/web-seller/common/components/buttons/Button";
import {
  hasAllKakaoSellerTerms,
  maskPhoneForDisplay,
  readRegisterTicketHints,
} from "@/apps/web-seller/features/auth/utils/register-ticket-hints.util";
import {
  buildSellerTermsDocumentIds,
  mapSellerActiveTermsToDocIds,
} from "@/apps/web-seller/features/terms/utils/terms-consent.util";

function readInitialKakaoLoginData(): PendingKakaoRegister | null {
  const pending = getPendingOAuthRegister();
  return pending?.provider === "kakao" ? pending : null;
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

export function KakaoAuthCallbackPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const oauthCode = searchParams.get("code");
  const login = useAuthStore((s) => s.login);
  const kakaoRegisterMutation = useKakaoRegister();
  const { addAlert } = useAlertStore();

  const initialPending = readInitialKakaoLoginData();
  const [showPhoneVerification, setShowPhoneVerification] = useState(!!initialPending);
  const [kakaoLoginData, setKakaoLoginData] = useState<{ registerToken: string } | null>(
    // provider 칸은 가입 요청에 넣지 않는다(서버가 모르는 칸이면 400)
    initialPending ? { registerToken: initialPending.registerToken } : null,
  );
  const [displayName, setDisplayName] = useState("");
  const [nameError, setNameError] = useState("");
  // 카카오가 준 번호·이름·약관 동의(가입표 안, 화면 표시용 — 기획 I-59 B)
  const hints = useMemo(
    () => (kakaoLoginData ? readRegisterTicketHints(kakaoLoginData.registerToken) : {}),
    [kakaoLoginData],
  );
  const [useKakaoPhone, setUseKakaoPhone] = useState(false);
  const termsFromKakao = hasAllKakaoSellerTerms(hints.terms);
  // 가입표를 받으면 카카오 번호·이름으로 미리 채운다(다른 번호를 고르면 지금처럼 문자 인증)
  useEffect(() => {
    if (!kakaoLoginData) return;
    setUseKakaoPhone(Boolean(hints.phone));
    if (hints.name) setDisplayName((cur) => cur || hints.name || "");
  }, [kakaoLoginData, hints.phone, hints.name]);
  const [termsState, setTermsState] = useState<SellerTermsAgreementState>(
    INITIAL_SELLER_TERMS_STATE,
  );
  const { data: sellerActiveTerms } = useSellerActiveTerms();
  const activeTermsDocIds = useMemo(
    () => mapSellerActiveTermsToDocIds(sellerActiveTerms ?? {}),
    [sellerActiveTerms],
  );

  useEffect(() => {
    if (!oauthCode && !showPhoneVerification && !kakaoLoginData) {
      navigate(ROUTES.ROOT, { replace: true });
    }
  }, [oauthCode, showPhoneVerification, kakaoLoginData, navigate]);

  useOAuthCodeOnce(oauthCode, async (code) => {
    try {
      const data = await authApi.kakaoLogin(code);
      clearPendingOAuthRegister();
      stripOAuthCodeFromUrl(navigate, location, searchParams);
      login({ navigate, accessToken: data.accessToken });
    } catch (error: unknown) {
      stripOAuthCodeFromUrl(navigate, location, searchParams);

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
        const pending: PendingKakaoRegister = {
          provider: "kakao",
          registerToken,
        };
        setPendingOAuthRegister(pending);
        setKakaoLoginData({ registerToken });
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

  /** 카카오 번호로 가입 — 문자 인증 없이. 약관은 카카오에서 다 동의했으면 다시 받지 않는다 */
  const handleKakaoPhoneRegister = async () => {
    if (!kakaoLoginData) return;
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
    await kakaoRegisterMutation.mutateAsync({
      ...kakaoLoginData,
      useTicketPhone: true,
      name: displayName.trim(),
      ...termsPart,
    });
    clearPendingOAuthRegister();
  };

  const handlePhoneVerificationComplete = async (phone: string) => {
    if (!kakaoLoginData) return;
    if (!validateDisplayName(displayName)) return;
    if (termsFromKakao) {
      // 약관은 카카오에서 동의함(서버가 가입표로 확인) — 문자로 받은 번호로만 가입
      await kakaoRegisterMutation.mutateAsync({
        ...kakaoLoginData,
        phone,
        name: displayName.trim(),
      });
      clearPendingOAuthRegister();
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

    await kakaoRegisterMutation.mutateAsync({
      ...kakaoLoginData,
      phone,
      name: displayName.trim(),
      agreedToTerms: termsState.termsOfService,
      agreedToPrivacy: termsState.privacyPolicy,
      termsDocumentIds,
    });
    clearPendingOAuthRegister();
  };

  if (showPhoneVerification) {
    return (
      <AuthBrandedCard
        title="회원가입"
        description={
          <>
            {useKakaoPhone && hints.phone ? (
              "카카오에서 받은 정보예요. 맞으면 가입하기를 눌러 주세요."
            ) : (
              <>
                판매자 센터 이용을 위해 <strong className="font-medium text-zinc-700">실명</strong>
                과 <strong className="font-medium text-zinc-700">휴대폰 인증</strong>이 필요합니다.
              </>
            )}
          </>
        }
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
            <label htmlFor="kakao-auth-display-name" className="text-sm font-medium text-zinc-700">
              이름
            </label>
            <Input
              id="kakao-auth-display-name"
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
          {useKakaoPhone && hints.phone ? (
            <div className="space-y-2">
              <span className="text-sm font-medium text-zinc-700">휴대폰 번호</span>
              <div className="flex h-[50px] items-center justify-between rounded-lg border border-zinc-200 px-4">
                <span className="text-[15px] font-medium text-zinc-900">
                  {maskPhoneForDisplay(hints.phone)}
                </span>
                <button
                  type="button"
                  onClick={() => setUseKakaoPhone(false)}
                  className="text-sm font-medium text-zinc-500 underline underline-offset-2 hover:text-zinc-800"
                >
                  다른 번호
                </button>
              </div>
              <p className="text-xs text-zinc-500">
                카카오에 등록된 번호예요. 계정 확인과 계정 찾기에 써요.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {hints.phone ? (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setUseKakaoPhone(true)}
                    className="text-sm font-medium text-zinc-500 underline underline-offset-2 hover:text-zinc-800"
                  >
                    카카오 번호로
                  </button>
                </div>
              ) : null}
              <PhoneVerificationForm
                onVerificationComplete={handlePhoneVerificationComplete}
                purpose={PHONE_VERIFICATION_PURPOSE.KAKAO_REGISTRATION}
                canComplete={termsFromKakao || isRequiredSellerTermsAllChecked(termsState)}
              />
            </div>
          )}
          {termsFromKakao ? (
            <p className="text-sm text-zinc-500">약관은 카카오에서 동의했어요.</p>
          ) : (
            <SellerTermsAgreementSection value={termsState} onChange={setTermsState} />
          )}
          {useKakaoPhone && hints.phone ? (
            <Button
              type="button"
              disabled={
                !displayName.trim() ||
                !!nameError ||
                kakaoRegisterMutation.isPending ||
                !(termsFromKakao || isRequiredSellerTermsAllChecked(termsState))
              }
              onClick={() => void handleKakaoPhoneRegister()}
              className="h-[50px] w-full rounded-lg text-[15px] font-medium shadow-sm"
            >
              {kakaoRegisterMutation.isPending ? "가입하는 중" : "가입하기"}
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
        message="카카오 로그인 처리 중…"
        showLogo
        className="min-h-0 py-10"
      />
    </div>
  );
}
