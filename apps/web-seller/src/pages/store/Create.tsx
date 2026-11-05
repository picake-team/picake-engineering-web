import React, { useState } from "react";
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
const TOTAL_STEPS = STEP_KEYS.length;

export const StoreCreatePage: React.FC = () => {
  const verifyBusinessRegistrationMutation = useVerifyBusinessRegistration();
  const getOnlineTradingCompanyDetailMutation = useGetOnlineTradingCompanyDetail();
  const createStoreMutation = useCreateStore();

  const [currentStep, setCurrentStep] = useState(1);
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">스토어 만들기</h1>
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
