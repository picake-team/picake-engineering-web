import React from "react";
import { useMypageProfile } from "@/apps/web-seller/features/mypage/hooks/queries/useMypageProfileQuery";
import { ContentLoading } from "@/apps/web-seller/common/components/loading/ContentLoading";
import { MypageProfileSection } from "@/apps/web-seller/features/mypage/components/MypageProfileSection";
import { MypagePhoneSection } from "@/apps/web-seller/features/mypage/components/MypagePhoneSection";
import { MypageWithdrawSection } from "@/apps/web-seller/features/mypage/components/MypageWithdrawSection";
import { MypageTermsSection } from "@/apps/web-seller/features/mypage/components/MypageTermsSection";

/**
 * 판매자 계정 마이페이지
 */
export const MypageIndexPage: React.FC = () => {
  const { data: profile, isLoading } = useMypageProfile();

  if (isLoading || !profile) {
    return (
      <ContentLoading
        variant="page"
        message="마이페이지를 불러오는 중…"
        showLogo
        className="min-h-[280px] border-dashed"
      />
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">마이페이지</h1>
      </div>

      <MypageProfileSection profile={profile} />
      <MypageTermsSection profile={profile} />
      <MypagePhoneSection />
      <MypageWithdrawSection />
    </div>
  );
};
