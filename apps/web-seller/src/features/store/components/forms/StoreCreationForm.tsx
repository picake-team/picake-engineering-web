import React, { useState, useEffect } from "react";
import type { StoreForm } from "@/apps/web-seller/features/store/types/store.ui";
import {
  validateStoreName,
  validateStoreDescription,
  validateStorePhoneNumber,
  validateDetailAddress,
  validateBankAccountNumber,
  validateAccountHolderName,
  STORE_DESCRIPTION_MAX_LENGTH,
} from "@/apps/web-seller/features/store/utils/validator.util";
import { STORE_BANK_OPTIONS } from "@/apps/web-seller/features/store/constants/store.constants";
import type {
  StoreBankName,
  StoreNaverPlaceDto,
} from "@/apps/web-seller/features/store/types/store.dto";
import { StoreNaverPlaceCard } from "@/apps/web-seller/features/store/components/naver/StoreNaverPlaceCard";
import { SelectBox } from "@/apps/web-seller/common/components/selects/SelectBox";
import { ImageMultiUpload } from "@/apps/web-seller/features/upload/components/ImageMultiUpload";
import { BaseButton as Button } from "@/apps/web-seller/common/components/buttons/BaseButton";
import { Card, CardContent } from "@/apps/web-seller/common/components/cards/Card";
import { BaseInput as Input } from "@/apps/web-seller/common/components/inputs/BaseInput";
import { Label } from "@/apps/web-seller/common/components/labels/Label";
import { AddressInput } from "@/apps/web-seller/common/components/inputs/AddressInput";
import { StoreRefundCancellationPolicyFields } from "@/apps/web-seller/features/store/components/StoreRefundCancellationPolicyFields";
import {
  createInitialRefundCancellationPolicy,
  validateRefundCancellationPolicy,
} from "@/apps/web-seller/features/store/utils/refund-cancellation-policy.util";

interface Props {
  onSubmit: (data: StoreForm) => void;
  onPrevious?: () => void;
  initialValue?: StoreForm;
  onChange?: (data: StoreForm) => void;
  submitButtonText?: string;
  /** 네이버 플레이스에서 가져오기 카드를 보여 준다. 수정 화면이면 storeId와 연결 정보를 넘긴다 */
  naverPlace?: { storeId?: string; connected?: StoreNaverPlaceDto | null };
}

export const defaultForm: StoreForm = {
  name: "",
  description: "",
  phoneNumber: "",
  logoImageUrl: "",
  kakaoChannelId: "",
  instagramId: "",
  bankAccountNumber: "",
  bankName: "",
  accountHolderName: "",
  address: "",
  roadAddress: "",
  detailAddress: "",
  zonecode: "",
  latitude: 0,
  longitude: 0,
  refundCancellationPolicy: createInitialRefundCancellationPolicy(),
};

export const StoreCreationForm: React.FC<Props> = ({
  onSubmit,
  onPrevious,
  initialValue,
  onChange,
  submitButtonText,
  naverPlace,
}) => {
  const [form, setForm] = useState<StoreForm>(initialValue || defaultForm);
  const [errors, setErrors] = useState<
    Partial<Record<keyof StoreForm | "refundCancellationPolicy", string>>
  >({});

  useEffect(() => {
    if (initialValue) {
      setForm(initialValue);
      setErrors({});
    }
  }, [initialValue]);

  const validate = () => {
    const newErrors: Partial<Record<keyof StoreForm | "refundCancellationPolicy", string>> = {};

    // 스토어 이름 검증
    const nameError = validateStoreName(form.name);
    if (nameError) {
      newErrors.name = nameError;
    }
    // 스토어 설명 검증
    const descriptionError = validateStoreDescription(form.description);
    if (descriptionError) {
      newErrors.description = descriptionError;
    }
    const phoneNumberError = validateStorePhoneNumber(form.phoneNumber);
    if (phoneNumberError) {
      newErrors.phoneNumber = phoneNumberError;
    }
    // 상세주소 검증
    const detailAddressError = validateDetailAddress(form.detailAddress);
    if (detailAddressError) {
      newErrors.detailAddress = detailAddressError;
    }
    if (!form.bankName) {
      newErrors.bankName = "은행을 선택해주세요.";
    }
    const bankAccountError = validateBankAccountNumber(form.bankAccountNumber);
    if (bankAccountError) {
      newErrors.bankAccountNumber = bankAccountError;
    }
    const accountHolderError = validateAccountHolderName(form.accountHolderName);
    if (accountHolderError) {
      newErrors.accountHolderName = accountHolderError;
    }

    const refundPolicyError = validateRefundCancellationPolicy(form.refundCancellationPolicy);
    if (refundPolicyError) {
      newErrors.refundCancellationPolicy = refundPolicyError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange =
    (key: keyof StoreForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const next = { ...form, [key]: e.target.value };
      setForm(next);
      onChange?.(next);
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      ...form,
      bankName: form.bankName as StoreBankName,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        {naverPlace && (
          <StoreNaverPlaceCard
            storeId={naverPlace.storeId}
            connected={naverPlace.connected}
            form={form}
            onApply={(patch) => {
              const next = { ...form, ...patch };
              setForm(next);
              onChange?.(next);
            }}
          />
        )}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-2">스토어 기본 정보</h2>
            <div className="border-t mb-6" />

            <div className="grid grid-cols-1 gap-6">
              <div>
                <Label>로고 이미지</Label>
                <ImageMultiUpload
                  width={300}
                  height={300}
                  value={form.logoImageUrl ? [form.logoImageUrl] : []}
                  onChange={(urls) => {
                    const next = { ...form, logoImageUrl: urls[0] || "" };
                    setForm(next);
                    onChange?.(next);
                  }}
                  maxImages={1}
                  enableDragDrop={true}
                />
              </div>
              <div>
                <Label className="after:content-['*'] after:ml-0.5 after:text-destructive">
                  스토어 이름
                </Label>
                <Input
                  placeholder="Picake"
                  value={form.name}
                  onChange={handleChange("name")}
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
              </div>
              <div>
                <Label>스토어 설명</Label>
                <textarea
                  placeholder="맛있는 케이크를 판매하는 스토어입니다."
                  rows={4}
                  maxLength={STORE_DESCRIPTION_MAX_LENGTH}
                  value={form.description || ""}
                  onChange={handleChange("description")}
                  className={`flex min-h-[80px] w-full rounded-md border ${
                    errors.description ? "border-destructive" : "border-input"
                  } bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
                />
                <div className="mt-1 flex items-center justify-between">
                  {errors.description ? (
                    <p className="text-sm text-destructive">{errors.description}</p>
                  ) : (
                    <span />
                  )}
                  <span className="text-xs text-muted-foreground">
                    [{(form.description || "").length}/{STORE_DESCRIPTION_MAX_LENGTH}]
                  </span>
                </div>
              </div>
              <div>
                <Label className="after:content-['*'] after:ml-0.5 after:text-destructive">
                  스토어 연락처
                </Label>
                <Input
                  placeholder="010-1234-5678"
                  value={form.phoneNumber}
                  onChange={handleChange("phoneNumber")}
                  className={errors.phoneNumber ? "border-destructive" : ""}
                />
                {errors.phoneNumber && (
                  <p className="text-sm text-destructive mt-1">{errors.phoneNumber}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-2">채널 정보</h2>
            <div className="border-t mb-6" />

            <div className="grid grid-cols-1 gap-6">
              <div>
                <Label>카카오채널 ID</Label>
                <Input
                  placeholder="Picake_channel"
                  value={form.kakaoChannelId || ""}
                  onChange={handleChange("kakaoChannelId")}
                />
                <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
                  <p className="text-xs font-medium text-amber-900">입력 안내</p>
                  <p className="mt-1 text-xs text-amber-800">
                    카카오비즈니스 파트너센터 &gt; 전체메뉴 &gt; 링크 공유 &gt; 채널 URL에 나오는
                    마지막 ID만 입력해주세요.
                  </p>
                  <p className="mt-1 text-xs text-amber-800">
                    예: <span className="font-mono">http://pf.kakao.com/_xeaCon</span> 인 경우{" "}
                    <span className="font-mono">_xeaCon</span>
                  </p>
                </div>
              </div>
              <div>
                <Label>인스타그램 ID</Label>
                <Input
                  placeholder="Picake_official"
                  value={form.instagramId || ""}
                  onChange={handleChange("instagramId")}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-2">스토어 위치</h2>
            <div className="border-t mb-6" />

            <div className="grid grid-cols-1 gap-6">
              <div>
                <AddressInput
                  value={{
                    address: form.address,
                    roadAddress: form.roadAddress,
                    zonecode: form.zonecode,
                    latitude: form.latitude,
                    longitude: form.longitude,
                  }}
                  onChange={(addressData) => {
                    const next = {
                      ...form,
                      address: addressData.address,
                      roadAddress: addressData.roadAddress,
                      zonecode: addressData.zonecode,
                      latitude: addressData.latitude,
                      longitude: addressData.longitude,
                    };
                    setForm(next);
                    onChange?.(next);
                  }}
                  error={errors.address}
                />
              </div>
              <div>
                <Label className="after:content-['*'] after:ml-0.5 after:text-destructive">
                  상세주소
                </Label>
                <Input
                  placeholder="상세주소를 입력해주세요"
                  value={form.detailAddress}
                  onChange={handleChange("detailAddress")}
                  className={errors.detailAddress ? "border-destructive" : ""}
                />
                {errors.detailAddress && (
                  <p className="text-sm text-destructive mt-1">{errors.detailAddress}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-2">정산 계좌 정보</h2>
            <div className="border-t mb-6" />

            <div className="grid grid-cols-1 gap-6">
              <div>
                <SelectBox
                  label="정산 은행"
                  value={form.bankName}
                  onChange={(v) => {
                    const next = { ...form, bankName: v as StoreBankName | "" };
                    setForm(next);
                    onChange?.(next);
                  }}
                  options={STORE_BANK_OPTIONS}
                  error={errors.bankName}
                  required
                />
              </div>
              <div>
                <Label className="after:content-['*'] after:ml-0.5 after:text-destructive">
                  정산 계좌번호
                </Label>
                <Input
                  placeholder="110-302-1234567"
                  value={form.bankAccountNumber}
                  onChange={handleChange("bankAccountNumber")}
                  className={errors.bankAccountNumber ? "border-destructive" : ""}
                />
                {errors.bankAccountNumber && (
                  <p className="text-sm text-destructive mt-1">{errors.bankAccountNumber}</p>
                )}
              </div>
              <div>
                <Label className="after:content-['*'] after:ml-0.5 after:text-destructive">
                  예금주명
                </Label>
                <Input
                  placeholder="예금주명을 입력해주세요"
                  value={form.accountHolderName}
                  onChange={handleChange("accountHolderName")}
                  className={errors.accountHolderName ? "border-destructive" : ""}
                />
                {errors.accountHolderName && (
                  <p className="text-sm text-destructive mt-1">{errors.accountHolderName}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-2">환불·취소 규정</h2>
            <div className="border-t mb-6" />
            <StoreRefundCancellationPolicyFields
              policy={form.refundCancellationPolicy}
              onChange={(next) => {
                const nextForm = { ...form, refundCancellationPolicy: next };
                setForm(nextForm);
                onChange?.(nextForm);
              }}
              sectionError={errors.refundCancellationPolicy}
            />
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center gap-4 pt-6">
        {onPrevious && (
          <Button type="button" size="lg" variant="outline" onClick={onPrevious}>
            이전
          </Button>
        )}
        <Button type="submit" size="lg">
          {submitButtonText || (initialValue ? "수정하기" : "등록하기")}
        </Button>
      </div>
    </form>
  );
};
