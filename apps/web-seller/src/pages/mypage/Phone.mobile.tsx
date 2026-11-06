/**
 * 휴대폰 번호 변경 (SC-94 ③): 새 번호로 휴대폰 인증을 다시 한다(회원가입과 같은 인증 칸).
 */
import React from "react";
import { useNavigate } from "react-router-dom";
import { AppScreen, BackHeader } from "@/apps/web-seller/common/ui/Screen";
import { PhoneVerifyFields } from "@/apps/web-seller/features/auth/components/mobile/PhoneVerifyFields";
import { PHONE_VERIFICATION_PURPOSE } from "@/apps/web-seller/features/auth/types/auth.dto";
import { useMypageChangePhone } from "@/apps/web-seller/features/mypage/hooks/mutations/useMypageMutation";
import { ROUTES } from "@/apps/web-seller/common/constants/route-paths.constant";

export const MypagePhoneMobilePage: React.FC = () => {
  const navigate = useNavigate();
  const change = useMypageChangePhone();
  return (
    <AppScreen header={<BackHeader title="휴대폰 번호 변경" />} bodyClassName="gap-4 pt-2">
      <p className="text-sub leading-normal text-ink-600">
        새 번호로 인증하면 바로 바뀌어요. 로그인 방법(카카오·구글)은 그대로예요.
      </p>
      <PhoneVerifyFields
        purpose={PHONE_VERIFICATION_PURPOSE.PHONE_CHANGE}
        submitLabel="번호 바꾸기"
        onVerified={async (phone) => {
          await change.mutateAsync({ newPhone: phone });
          navigate(ROUTES.MYPAGE, { replace: true });
        }}
      />
    </AppScreen>
  );
};
