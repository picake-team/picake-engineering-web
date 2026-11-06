/**
 * 휴대폰 계정 찾기 (SC-64, 디자인 A64a·A64b): 휴대폰 인증(FIND_ACCOUNT) → 그 번호로 가입한 로그인 방식과 이메일.
 * 문구는 지금 PC 그대로.
 */
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppScreen, BackHeader, BottomActionBar } from "@/apps/web-seller/common/ui/Screen";
import { Button, ButtonPair } from "@/apps/web-seller/common/ui/Button";
import { InfoRow } from "@/apps/web-seller/common/ui/List";
import { ROUTES } from "@/apps/web-seller/common/constants/route-paths.constant";
import { PhoneVerifyFields } from "@/apps/web-seller/features/auth/components/mobile/PhoneVerifyFields";
import { useFindAccount } from "@/apps/web-seller/features/auth/hooks/mutations/useAuthMutation";
import {
  PHONE_VERIFICATION_PURPOSE,
  type FindAccountResponseDto,
} from "@/apps/web-seller/features/auth/types/auth.dto";

const LOGIN_TYPE_LABEL: Record<string, string> = { kakao: "카카오", google: "구글", apple: "애플" };

export const FindAccountMobilePage: React.FC = () => {
  const navigate = useNavigate();
  const find = useFindAccount();
  const [result, setResult] = useState<FindAccountResponseDto | null>(null);
  const [round, setRound] = useState(0);

  return (
    <AppScreen
      header={
        <BackHeader
          title="계정 찾기"
          onBack={() => navigate(ROUTES.AUTH.LOGIN, { replace: true })}
        />
      }
      bodyClassName="gap-4 pt-2"
      footer={
        result ? (
          <BottomActionBar>
            <ButtonPair>
              <Button
                variant="secondary"
                onClick={() => {
                  setResult(null);
                  setRound((r) => r + 1);
                }}
              >
                다시 조회하기
              </Button>
              <Button onClick={() => navigate(ROUTES.AUTH.LOGIN, { replace: true })}>
                로그인으로 돌아가기
              </Button>
            </ButtonPair>
          </BottomActionBar>
        ) : undefined
      }
    >
      <p className="text-sub leading-normal text-ink-600">
        가입 시 사용한 휴대폰 번호로 인증하면, 연결된 소셜 계정 정보를 확인할 수 있습니다.
      </p>
      {result ? (
        <div className="flex flex-col gap-2 rounded-card border border-ink-100 p-4">
          <span className="text-caption text-ink-600">이 번호로 가입한 계정</span>
          {result.loginEmail ? (
            <InfoRow
              label={LOGIN_TYPE_LABEL[result.loginType ?? ""] ?? "소셜"}
              value={<span className="break-all">{result.loginEmail}</span>}
            />
          ) : (
            <p className="text-sub leading-normal text-ink-700">
              해당 번호로 등록된 계정은 있으나, 이메일 정보가 연동되어 있지 않습니다.
            </p>
          )}
        </div>
      ) : (
        <PhoneVerifyFields
          key={round}
          purpose={PHONE_VERIFICATION_PURPOSE.FIND_ACCOUNT}
          submitLabel="계정 찾기"
          onVerified={async (phone) => {
            setResult(await find.mutateAsync({ phone }));
          }}
        />
      )}
    </AppScreen>
  );
};
