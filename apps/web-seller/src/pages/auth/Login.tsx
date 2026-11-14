import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { ROUTES } from "@/apps/web-seller/common/constants/paths.constant";
import { SELLER_INTRO_URL } from "@/apps/web-seller/common/constants/seller-intro.constant";
import { AuthBrandedCard } from "@/apps/web-seller/common/components/layouts/AuthBrandedCard";
import googleIcon from "@/apps/web-seller/assets/images/google.png";
import kakaoIcon from "@/apps/web-seller/assets/images/kakaotalk.png";

export function LoginPage() {
  return (
    <AuthBrandedCard
      title="Picake 판매자 센터"
      description="아래에서 로그인 방식을 선택해 주세요."
      footer={
        <div className="flex items-center justify-center gap-2">
          {/* 처음 온 사장님이 무엇인지 볼 곳(기획 I-49). 글자는 "처음이세요?"만(운영자 11-14), 화면 읽기에는 가는 곳을 말한다 */}
          <a
            href={SELLER_INTRO_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="처음이세요? 픽케이크 사장님 소개 보기"
            className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-white hover:text-zinc-900"
          >
            처음이세요?
            <ChevronRight className="size-4 opacity-60" aria-hidden />
          </a>
          <span aria-hidden className="h-3 w-px bg-zinc-200" />
          <Link
            to={ROUTES.AUTH.FIND_ACCOUNT}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-white hover:text-zinc-900"
          >
            계정을 잊으셨나요?
            <ChevronRight className="size-4 opacity-60" aria-hidden />
          </Link>
        </div>
      }
    >
      <div className="flex flex-col gap-3" role="group" aria-label="소셜 로그인">
        <a
          href={`https://accounts.google.com/o/oauth2/v2/auth?client_id=${import.meta.env.VITE_PUBLIC_GOOGLE_CLIENT_ID}&redirect_uri=${window.location.origin}${ROUTES.AUTH.GOOGLE_REDIRECT_URI}&response_type=code&scope=email+profile&prompt=select_account`}
          className="flex h-[50px] w-full items-center justify-center gap-3 rounded-lg border border-zinc-200 bg-white text-[15px] font-medium text-zinc-800 shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
        >
          <img src={googleIcon} alt="" width={20} height={20} className="size-5 shrink-0" />
          Google로 계속하기
        </a>
        <a
          href={`https://kauth.kakao.com/oauth/authorize?client_id=${import.meta.env.VITE_PUBLIC_KAKAO_RESTAPI_KEY}&redirect_uri=${window.location.origin}${ROUTES.AUTH.KAKAO_REDIRECT_URI}&response_type=code`}
          className="flex h-[50px] w-full items-center justify-center gap-3 rounded-lg bg-[#FEE500] text-[15px] font-medium text-[#191919] shadow-sm transition-colors hover:bg-[#f5dc00] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#191919]/25 focus-visible:ring-offset-2"
        >
          <img src={kakaoIcon} alt="" width={20} height={20} className="size-5 shrink-0" />
          Kakao로 계속하기
        </a>
      </div>
    </AuthBrandedCard>
  );
}
