import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, RefreshCw } from "lucide-react";
import PhoneVerificationForm from "@/apps/web-seller/features/auth/components/forms/PhoneVerificationForm";
import { useFindAccount } from "@/apps/web-seller/features/auth/hooks/mutations/useAuthMutation";
import {
  PHONE_VERIFICATION_PURPOSE,
  type FindAccountResponseDto,
} from "@/apps/web-seller/features/auth/types/auth.dto";
import { ROUTES } from "@/apps/web-seller/common/constants/paths.constant";
import { AuthBrandedCard } from "@/apps/web-seller/common/components/layouts/AuthBrandedCard";
import { LoadingSpinner } from "@/apps/web-seller/common/components/loading/LoadingSpinner";
import { cn } from "@/apps/web-seller/common/utils/classname.util";

/**
 * 판매자 계정 찾기 — 휴대폰 인증(`FIND_ACCOUNT`) 후 `POST /v1/seller/auth/find-account`
 */
export function FindAccountPage() {
  const findAccountMutation = useFindAccount();
  const [result, setResult] = useState<FindAccountResponseDto | null>(null);

  const handleVerificationComplete = async (phone: string) => {
    try {
      const data = await findAccountMutation.mutateAsync({ phone });
      setResult(data);
    } catch {
      // 오류는 useFindAccount에서 알림 처리
    }
  };

  return (
    <AuthBrandedCard
      title="계정 찾기"
      description="가입 시 사용한 휴대폰 번호로 인증하면, 연결된 소셜 계정 정보를 확인할 수 있습니다."
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
      {result ? (
        <div
          className={cn(
            "rounded-lg border border-zinc-200 bg-zinc-50/90 p-5 shadow-sm",
            result.loginEmail && "border-emerald-200/90 bg-emerald-50/50",
          )}
        >
          <div className="mb-3 flex items-center gap-2.5">
            <div
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-lg",
                result.loginEmail
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-zinc-200/90 text-zinc-600",
              )}
            >
              <Mail className="size-4" strokeWidth={2} aria-hidden />
            </div>
            <p className="text-sm font-semibold text-zinc-900">조회 결과</p>
          </div>
          {result.loginType === "naver" ? (
            // 네이버는 이메일을 받지 않아 로그인 수단만 보인다
            <p className="text-[15px] leading-relaxed text-zinc-800">
              <span className="text-zinc-500">연결된 계정</span>
              <br />
              <span className="text-base font-semibold text-zinc-900">네이버</span>
            </p>
          ) : result.loginEmail ? (
            <p className="break-all text-[15px] leading-relaxed text-zinc-800">
              <span className="text-zinc-500">
                연결된 {result.loginType === "kakao" ? "카카오" : "구글"} 계정
              </span>
              <br />
              <span className="text-base font-semibold text-zinc-900">{result.loginEmail}</span>
            </p>
          ) : (
            <p className="text-sm leading-relaxed text-zinc-600">
              해당 번호로 등록된 계정은 있으나, 이메일 정보가 연동되어 있지 않습니다.
            </p>
          )}
          <button
            type="button"
            onClick={() => setResult(null)}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900"
          >
            <RefreshCw className="size-3.5" aria-hidden />
            다시 조회하기
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <PhoneVerificationForm
            onVerificationComplete={handleVerificationComplete}
            purpose={PHONE_VERIFICATION_PURPOSE.FIND_ACCOUNT}
          />
          {findAccountMutation.isPending ? (
            <div
              className="flex items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50/80 py-3 text-sm font-medium text-zinc-600"
              role="status"
              aria-live="polite"
            >
              <LoadingSpinner size="sm" className="text-zinc-500" aria-hidden />
              계정 정보를 조회하는 중…
            </div>
          ) : null}
        </div>
      )}
    </AuthBrandedCard>
  );
}
