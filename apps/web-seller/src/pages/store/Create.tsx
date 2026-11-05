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
import { defaultForm as defaultBusinessRegistrationForm } from "@/apps/web-seller/features/business/components/forms/BusinessRegistrationForm";
import { defaultForm as defaultOnlineTradingCompanyDetailForm } from "@/apps/web-seller/features/business/components/forms/OnlineTradingCompanyDetailForm";
import { defaultForm as defaultStoreForm } from "@/apps/web-seller/features/store/components/forms/StoreCreationForm";

interface StepData {
  businessRegistrationForm: BusinessRegistrationFormValues;
  onlineTradingCompanyDetailForm: OnlineTradingCompanyDetailFormValues;
  storeForm: StoreForm;
}

const TOTAL_STEPS = 3;
const STEPS = ["사업자 정보 등록", "통신판매사업자 정보 등록", "스토어 정보 입력"];

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
    if (!stepData.businessRegistrationForm || !stepData.onlineTradingCompanyDetailForm) {
      return;
    }

    setStepData((prev) => ({
      ...prev,
      storeForm: data,
    }));

    await createStoreMutation.mutateAsync({
      businessValidation: stepData.businessRegistrationForm,
      onlineTradingCompanyDetail: {
        brno: stepData.businessRegistrationForm.b_no,
        prmmiMnno: stepData.onlineTradingCompanyDetailForm.prmmiMnno,
      },
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
    switch (currentStep) {
      case 1:
        return (
          <BusinessRegistrationForm
            onSubmit={handleSubmitStep1}
            initialValue={stepData.businessRegistrationForm}
            onChange={(data) =>
              setStepData((prev) => ({ ...prev, businessRegistrationForm: data }))
            }
          />
        );
      case 2:
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
      case 3:
        return (
          <StoreCreationForm
            onSubmit={handleSubmitStep3}
            onPrevious={handlePreviousStep}
            initialValue={stepData.storeForm}
            onChange={(data) => setStepData((prev) => ({ ...prev, storeForm: data }))}
            submitButtonText="등록하기"
            naverPlace={{}}
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

      {/* 3단계(스토어 정보)는 섹션마다 테두리가 있어 바깥 카드를 씌우지 않는다 */}
      {currentStep === 3 ? (
        renderStep()
      ) : (
        <Card>
          <CardContent className="p-6">{renderStep()}</CardContent>
        </Card>
      )}
    </div>
  );
};
