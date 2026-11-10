import React, { useRef, useState } from "react";
import { cx } from "@/apps/web-seller/common/ui/cx";
import { PageTitle } from "@/apps/web-seller/common/components/layouts/MobileFrame";
import { useInMobileFrame } from "@/apps/web-seller/common/components/layouts/mobile-frame.context";
import { Card, CardContent } from "@/apps/web-seller/common/components/cards/Card";
import { ProgressBar } from "@/apps/web-seller/common/components/progressbars";
import { BusinessRegistrationForm } from "@/apps/web-seller/features/business/components/forms/BusinessRegistrationForm";
import { OnlineTradingCompanyDetailForm } from "@/apps/web-seller/features/business/components/forms/OnlineTradingCompanyDetailForm";
import { StoreCreationForm } from "@/apps/web-seller/features/store/components/forms/StoreCreationForm";
import type {
  BusinessRegistrationFormValues,
  OnlineTradingCompanyDetailFormValues,
} from "@/apps/web-seller/features/business/types/business.ui";
import type { StoreBankName } from "@/apps/web-seller/features/store/types/store.dto";
import type { StoreForm } from "@/apps/web-seller/features/store/types/store.ui";
import {
  useGetOnlineTradingCompanyDetail,
  useVerifyBusinessRegistration,
} from "@/apps/web-seller/features/business/hooks/mutations/useBusinessMutation";
import { useCreateStore } from "@/apps/web-seller/features/store/hooks/mutations/useStoreMutation";
import { REQUIRE_ONLINE_TRADING_REGISTRATION } from "@/apps/web-seller/features/store/constants/store.constants";
import { defaultForm as defaultBusinessRegistrationForm } from "@/apps/web-seller/features/business/components/forms/BusinessRegistrationForm";
import { defaultForm as defaultOnlineTradingCompanyDetailForm } from "@/apps/web-seller/features/business/components/forms/OnlineTradingCompanyDetailForm";
import { defaultForm as defaultStoreForm } from "@/apps/web-seller/features/store/components/forms/StoreCreationForm";

interface StepData {
  businessRegistrationForm: BusinessRegistrationFormValues;
  onlineTradingCompanyDetailForm: OnlineTradingCompanyDetailFormValues;
  storeForm: StoreForm;
}

type StepKey = "business" | "onlineTrading" | "store";
/** 통신판매업 단계는 REQUIRE_ONLINE_TRADING_REGISTRATION이 켜져 있을 때만 (법 검토로 지금은 끔) */
const STEP_KEYS: StepKey[] = REQUIRE_ONLINE_TRADING_REGISTRATION
  ? ["business", "onlineTrading", "store"]
  : ["business", "store"];
const STEP_LABELS: Record<StepKey, string> = {
  business: "사업자 정보 등록",
  onlineTrading: "통신판매사업자 정보 등록",
  store: "스토어 정보 입력",
};
const STEPS = STEP_KEYS.map((key) => STEP_LABELS[key]);
/** 휴대폰 틀 단계 머리(큰 제목 + 한 줄 설명) */
const FRAME_STEP_HEAD: Record<StepKey, { title: string; description: string }> = {
  business: {
    title: "사업자 정보를 알려 주세요",
    description: "국세청에서 정상 영업인지 확인해요",
  },
  onlineTrading: {
    title: "통신판매업 정보를 알려 주세요",
    description: "정부24에서 신고한 번호를 확인해요",
  },
  store: { title: "스토어 정보를 알려 주세요", description: "나중에 스토어 탭에서 고칠 수 있어요" },
};
const TOTAL_STEPS = STEP_KEYS.length;

interface StoreCreatePageProps {
  /**
   * 지금 단계(1부터). 휴대폰 틀은 위쪽 줄 "←"로 앞 단계에 가야 해서 단계를 밖에서 들고 넘긴다(SC-66
   * "2단계에서 ←로 돌아와도 넣은 값이 남는다"). 넘기지 않으면(PC) 이 화면이 직접 든다.
   */
  step?: number;
  onStepChange?: (step: number) => void;
}

export const StoreCreatePage: React.FC<StoreCreatePageProps> = ({ step, onStepChange }) => {
  const inFrame = useInMobileFrame();
  const verifyBusinessRegistrationMutation = useVerifyBusinessRegistration();
  const getOnlineTradingCompanyDetailMutation = useGetOnlineTradingCompanyDetail();
  const createStoreMutation = useCreateStore();

  const [ownStep, setOwnStep] = useState(1);
  const currentStep = step ?? ownStep;
  const setCurrentStep = onStepChange ?? setOwnStep;
  // 휴대폰 틀 안: 다음 단계는 오른쪽에서, 이전 단계는 왼쪽에서 살짝 들어온다(처음 그릴 때는 그대로)
  const prevStepRef = useRef(currentStep);
  const stepDirRef = useRef<"forward" | "backward" | null>(null);
  if (prevStepRef.current !== currentStep) {
    stepDirRef.current = currentStep > prevStepRef.current ? "forward" : "backward";
    prevStepRef.current = currentStep;
  }
  const [stepData, setStepData] = useState<StepData>({
    businessRegistrationForm: defaultBusinessRegistrationForm,
    onlineTradingCompanyDetailForm: defaultOnlineTradingCompanyDetailForm,
    storeForm: defaultStoreForm,
  });

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleNextStep = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSubmitStep1 = async (data: BusinessRegistrationFormValues) => {
    const response = await verifyBusinessRegistrationMutation.mutateAsync(data);
    if (response.available) {
      setStepData((prev) => ({
        ...prev,
        businessRegistrationForm: data,
      }));
      handleNextStep();
    }
  };

  const handleSubmitStep2 = async (data: OnlineTradingCompanyDetailFormValues) => {
    const response = await getOnlineTradingCompanyDetailMutation.mutateAsync({
      brno: stepData.businessRegistrationForm.b_no,
      prmmiMnno: data.prmmiMnno,
    });
    if (response.available) {
      setStepData((prev) => ({
        ...prev,
        onlineTradingCompanyDetailForm: data,
      }));
      handleNextStep();
    }
  };

  const handleSubmitStep3 = async (data: StoreForm) => {
    if (!stepData.businessRegistrationForm) {
      return;
    }

    setStepData((prev) => ({
      ...prev,
      storeForm: data,
    }));

    await createStoreMutation.mutateAsync({
      businessValidation: stepData.businessRegistrationForm,
      ...(REQUIRE_ONLINE_TRADING_REGISTRATION && {
        onlineTradingCompanyDetail: {
          brno: stepData.businessRegistrationForm.b_no,
          prmmiMnno: stepData.onlineTradingCompanyDetailForm.prmmiMnno,
        },
      }),
      name: data.name,
      description: data.description,
      phoneNumber: data.phoneNumber.trim(),
      logoImageUrl: data.logoImageUrl,
      kakaoChannelId: data.kakaoChannelId?.trim(),
      instagramId: data.instagramId?.trim(),
      naverPlaceId: data.naverPlaceId || undefined,
      bankAccountNumber: data.bankAccountNumber.trim(),
      bankName: data.bankName as StoreBankName,
      accountHolderName: data.accountHolderName.trim(),
      address: data.address,
      roadAddress: data.roadAddress,
      detailAddress: data.detailAddress,
      zonecode: data.zonecode,
      latitude: data.latitude,
      longitude: data.longitude,
      refundCancellationPolicy: data.refundCancellationPolicy,
    });
  };

  const renderStep = () => {
    switch (STEP_KEYS[currentStep - 1]) {
      case "business":
        return (
          <BusinessRegistrationForm
            onSubmit={handleSubmitStep1}
            initialValue={stepData.businessRegistrationForm}
            onChange={(data) =>
              setStepData((prev) => ({ ...prev, businessRegistrationForm: data }))
            }
          />
        );
      case "onlineTrading":
        return (
          <OnlineTradingCompanyDetailForm
            onSubmit={handleSubmitStep2}
            onPrevious={handlePreviousStep}
            initialValue={stepData.onlineTradingCompanyDetailForm}
            onChange={(data) =>
              setStepData((prev) => ({ ...prev, onlineTradingCompanyDetailForm: data }))
            }
          />
        );
      case "store":
        return (
          <StoreCreationForm
            onSubmit={handleSubmitStep3}
            onPrevious={handlePreviousStep}
            initialValue={stepData.storeForm}
            onChange={(data) => setStepData((prev) => ({ ...prev, storeForm: data }))}
            submitButtonText="등록하기"
            naverPlace={{}}
            submitting={createStoreMutation.isPending}
          />
        );
      default:
        return null;
    }
  };

  if (inFrame) {
    const key = STEP_KEYS[currentStep - 1];
    return (
      <div className="flex flex-col gap-4 font-app">
        <div className="-mx-5 -mt-2 flex flex-col gap-3">
          <div
            className="h-[3px] bg-ink-100"
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={STEP_KEYS.length}
            aria-valuenow={currentStep}
            aria-label={`스토어 만들기 ${currentStep}/${STEP_KEYS.length}단계`}
          >
            <div
              className="h-full bg-brand transition-[width]"
              style={{ width: `${(currentStep / STEP_KEYS.length) * 100}%` }}
            />
          </div>
        </div>
        {/* 단계마다 같은 머리: n/전체 + 큰 제목 + 한 줄 설명 */}
        <div
          key={currentStep}
          className={cx(
            "flex flex-col gap-4 motion-reduce:animate-none",
            stepDirRef.current === "forward" && "animate-step-in-forward",
            stepDirRef.current === "backward" && "animate-step-in-backward",
          )}
        >
          <div className="flex flex-col gap-1">
            <span className="text-caption text-ink-600">
              {currentStep}/{STEP_KEYS.length}
            </span>
            <h2 className="text-title font-bold text-ink-900">{FRAME_STEP_HEAD[key].title}</h2>
            <p className="text-sub text-ink-600">{FRAME_STEP_HEAD[key].description}</p>
          </div>
          {renderStep()}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <PageTitle className="text-2xl font-bold">스토어 만들기</PageTitle>
        <div className="mt-6">
          <ProgressBar activeStep={currentStep - 1} steps={STEPS} />
        </div>
      </div>

      {/* 스토어 정보 단계는 섹션마다 테두리가 있어 바깥 카드를 씌우지 않는다 */}
      {STEP_KEYS[currentStep - 1] === "store" ? (
        renderStep()
      ) : (
        <Card>
          <CardContent className="p-6">{renderStep()}</CardContent>
        </Card>
      )}
    </div>
  );
};
