/**
 * 휴대폰 디자인으로 아직 다시 그리지 않은 긴 입력 화면(상품 등록·수정, 피드, 스토어 정보).
 * 지금 PC 화면을 휴대폰 틀(뒤로 + 제목) 안에 담아 휴대폰에서도 모든 기능을 쓴다.
 */
import React, { useEffect, useState } from "react";
import { canGoBackInApp } from "@/apps/web-seller/common/hooks/useLeaveAfterSave";
import { useNavigate, useParams } from "react-router-dom";
import { ROUTES } from "@/apps/web-seller/common/constants/route-paths.constant";
import { MobileFrame } from "@/apps/web-seller/common/components/layouts/MobileFrame";
import { Button, ButtonPair, HeaderIconButton } from "@/apps/web-seller/common/ui/Button";
import { BottomSheet } from "@/apps/web-seller/common/ui/Sheet";
import { useMyStores } from "@/apps/web-seller/features/store/hooks/queries/useMyStores";
import { useLogout } from "@/apps/web-seller/features/auth/hooks/mutations/useAuthMutation";
import { StoreDetailProductCreatePage } from "@/apps/web-seller/pages/store/detail/products/Create";
import { StoreDetailProductDetailPage } from "@/apps/web-seller/pages/store/detail/products/Detail";
import { StoreDetailFeedListPage } from "@/apps/web-seller/pages/store/detail/feed/List";
import { StoreDetailFeedCreatePage } from "@/apps/web-seller/pages/store/detail/feed/Create";
import { StoreDetailFeedDetailPage } from "@/apps/web-seller/pages/store/detail/feed/Detail";
import { StoreDetailEditPage } from "@/apps/web-seller/pages/store/detail/Edit";
import { StoreCreatePage } from "@/apps/web-seller/pages/store/Create";

export const StoreDetailProductCreateMobilePage: React.FC = () => (
  <MobileFrame title="상품 등록">
    <StoreDetailProductCreatePage />
  </MobileFrame>
);

export const StoreDetailProductDetailMobilePage: React.FC = () => (
  <MobileFrame title="상품 수정">
    <StoreDetailProductDetailPage />
  </MobileFrame>
);

export const StoreDetailFeedListMobilePage: React.FC = () => {
  const { storeId = "" } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  return (
    <MobileFrame
      title="피드"
      actions={
        <HeaderIconButton
          icon="plus"
          label="피드 등록"
          onClick={() => navigate(ROUTES.STORE_DETAIL_FEED_CREATE(storeId))}
        />
      }
    >
      <StoreDetailFeedListPage />
    </MobileFrame>
  );
};

export const StoreDetailFeedCreateMobilePage: React.FC = () => (
  <MobileFrame title="피드 등록">
    <StoreDetailFeedCreatePage />
  </MobileFrame>
);

export const StoreDetailFeedDetailMobilePage: React.FC = () => (
  <MobileFrame title="피드 수정">
    <StoreDetailFeedDetailPage />
  </MobileFrame>
);

export const StoreDetailEditMobilePage: React.FC = () => (
  <MobileFrame title="스토어 정보">
    <StoreDetailEditPage />
  </MobileFrame>
);

/**
 * 스토어 만들기(SC-65·66, 디자인 8-E·8-F): 휴대폰 틀 안에서 진행 막대·단계 제목·가득 찬 버튼으로 그린다.
 * 위쪽 줄(기획 SC-65·66):
 * - 스토어가 없으면 1단계에 "←"가 없고 오른쪽 위 "로그아웃"(다른 계정으로 바꾸기)
 * - 스토어가 있으면(스토어 고르기 창에서 옴) "←"로 돌아간다. 앞 화면이 없으면 첫 화면(마지막 스토어 홈)
 * - 2단계의 "←"는 1단계로(넣은 값은 남는다)
 */
export const StoreCreateMobilePage: React.FC = () => {
  const navigate = useNavigate();
  const { stores, isSuccess } = useMyStores();
  const logout = useLogout();
  const [step, setStep] = useState(1);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const noStore = isSuccess && stores.length === 0;
  const firstStep = step === 1;

  // 단계를 옮기면 새 단계 맨 위부터 보인다
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  const back = () => {
    if (!firstStep) setStep(step - 1);
    else if (canGoBackInApp()) navigate(-1);
    else navigate(ROUTES.ROOT, { replace: true });
  };

  return (
    <MobileFrame
      title="스토어 만들기"
      noBack={firstStep && noStore}
      onBack={back}
      actions={
        firstStep && noStore ? (
          <Button variant="quiet" onClick={() => setLogoutOpen(true)}>
            로그아웃
          </Button>
        ) : undefined
      }
    >
      <StoreCreatePage step={step} onStepChange={setStep} />
      <BottomSheet
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        title="로그아웃할까요?"
        footer={
          <ButtonPair>
            <Button variant="secondary" onClick={() => setLogoutOpen(false)}>
              돌아가기
            </Button>
            <Button loading={logout.isPending} onClick={() => logout.mutate()}>
              로그아웃
            </Button>
          </ButtonPair>
        }
      />
    </MobileFrame>
  );
};
