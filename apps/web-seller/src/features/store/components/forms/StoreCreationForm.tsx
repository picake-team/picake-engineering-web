import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/apps/web-seller/common/utils/classname.util";
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
import {
  FRAME_SUBMIT_BUTTON_CLASS,
  useInMobileFrame,
} from "@/apps/web-seller/common/components/layouts/mobile-frame.context";
import { FrameSubmitBar } from "@/apps/web-seller/common/components/layouts/FrameSubmitBar";

import { Textarea } from "@/apps/web-seller/common/components/textareas/Textarea";
import { BaseInput as Input } from "@/apps/web-seller/common/components/inputs/BaseInput";
import { AddressInput } from "@/apps/web-seller/common/components/inputs/AddressInput";
import { FormSection } from "@/apps/web-seller/common/components/sections/FormSection";
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
  /** 네이버 플레이스에서 가져오기 안내를 보여 준다. 수정 화면이면 storeId와 연결 정보를 넘긴다 */
  naverPlace?: { storeId?: string; connected?: StoreNaverPlaceDto | null };
  /** 저장 요청 중이면 버튼을 막아 두 번 보내지 않게 한다 */
  submitting?: boolean;
}

type Errors = Partial<Record<keyof StoreForm | "refundCancellationPolicy", string>>;

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

/** 에러가 난 칸 → 화면의 섹션 (위에서부터 이 순서로 찾아 이동한다) */
const SECTION_ORDER: { id: string; keys: string[] }[] = [
  { id: "section-store-basic", keys: ["name", "description", "phoneNumber"] },
  { id: "section-store-location", keys: ["address", "detailAddress"] },
  { id: "section-store-bank", keys: ["bankName", "bankAccountNumber", "accountHolderName"] },
  { id: "section-store-refund", keys: ["refundCancellationPolicy"] },
];

function validateStoreForm(form: StoreForm): Errors {
  const errors: Errors = {};
  const set = (key: keyof Errors, message: string | null) => {
    if (message) errors[key] = message;
  };
  set("name", validateStoreName(form.name));
  set("description", validateStoreDescription(form.description));
  set("phoneNumber", validateStorePhoneNumber(form.phoneNumber));
  // 주소는 주소 검색으로만 정한다(비어 있으면 서버가 영어 오류를 돌려줘서 여기서 먼저 막는다)
  if (!form.roadAddress?.trim() && !form.address?.trim()) {
    errors.address = "주소 검색으로 가게 위치를 정해 주세요.";
  }
  set("detailAddress", validateDetailAddress(form.detailAddress));
  if (!form.bankName) errors.bankName = "은행을 선택해 주세요.";
  set("bankAccountNumber", validateBankAccountNumber(form.bankAccountNumber));
  set("accountHolderName", validateAccountHolderName(form.accountHolderName));
  set("refundCancellationPolicy", validateRefundCancellationPolicy(form.refundCancellationPolicy));
  return errors;
}

/** 칸 이름 + 필수 표시 + 아래 오류 문구 */
function Field({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      {children}
      {hint}
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
    </div>
  );
}

/**
 * 스토어 등록·수정 폼 (상품 폼과 같은 모양)
 * - 위에서 아래로: 네이버 가져오기 안내 → 기본 정보 → 손님 연락 채널 → 위치 → 정산 계좌 → 환불·취소 규정
 * - 저장 버튼은 화면 아래에 붙어 있고, 막는 칸이 있으면 그 섹션으로 이동한다
 */
export const StoreCreationForm: React.FC<Props> = ({
  onSubmit,
  onPrevious,
  initialValue,
  onChange,
  submitButtonText,
  naverPlace,
  submitting = false,
}) => {
  const inFrame = useInMobileFrame();
  const [form, setForm] = useState<StoreForm>(initialValue || defaultForm);
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  // 주소 검색·네이버 가져오기처럼 나중에 돌아오는 값도 최신 폼에 합친다
  const formRef = useRef(form);

  useEffect(() => {
    if (initialValue) {
      formRef.current = initialValue;
      setForm(initialValue);
      setErrors({});
      setSubmitted(false);
    }
  }, [initialValue]);

  const patch = (p: Partial<StoreForm>) => {
    const next = { ...formRef.current, ...p };
    formRef.current = next;
    setForm(next);
    onChange?.(next);
    if (submitted) setErrors(validateStoreForm(next));
  };

  const handleChange =
    (key: keyof StoreForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      patch({ [key]: e.target.value } as Partial<StoreForm>);

  const errorKeys = Object.keys(errors);
  const sectionHasError = (id: string) =>
    errorKeys.some((k) => SECTION_ORDER.find((s) => s.id === id)?.keys.includes(k));

  const goToFirstError = (keys: string[]) => {
    const first = SECTION_ORDER.find((s) => s.keys.some((k) => keys.includes(k)));
    if (first) {
      document.getElementById(first.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitted(true);
    const next = validateStoreForm(form);
    setErrors(next);
    if (Object.keys(next).length > 0) return goToFirstError(Object.keys(next));
    onSubmit({ ...form, bankName: form.bankName as StoreBankName });
  };

  return (
    // 브라우저 기본 검사 대신 아래 '고칠 곳 보기'로 같은 방식으로 안내한다
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {naverPlace && (
        <StoreNaverPlaceCard
          storeId={naverPlace.storeId}
          connected={naverPlace.connected}
          form={form}
          onApply={patch}
        />
      )}

      <FormSection
        id="section-store-basic"
        title="기본 정보"
        description="손님이 스토어 화면에서 보는 정보예요."
        error={sectionHasError("section-store-basic")}
      >
        <div className="space-y-5">
          <Field label="로고">
            <ImageMultiUpload
              width={120}
              height={120}
              value={form.logoImageUrl ? [form.logoImageUrl] : []}
              onChange={(urls) => patch({ logoImageUrl: urls[0] || "" })}
              maxImages={1}
              enableDragDrop
              showMinResolutionHint={false}
            />
          </Field>
          <Field label="스토어 이름" required error={errors.name}>
            <Input
              placeholder="예: 달콤케이크"
              value={form.name}
              onChange={handleChange("name")}
              className={errors.name ? "border-destructive" : ""}
            />
          </Field>
          <Field
            label="스토어 설명"
            error={errors.description}
            hint={
              <p className="mt-1 text-right text-xs text-muted-foreground">
                {(form.description || "").length.toLocaleString()}/
                {STORE_DESCRIPTION_MAX_LENGTH.toLocaleString()}자
              </p>
            }
          >
            <Textarea
              placeholder="가게 소개, 주문 방법, 픽업 안내 등을 적어 주세요. 손님 화면에서는 길면 접어서 보여 줘요."
              rows={6}
              maxLength={STORE_DESCRIPTION_MAX_LENGTH}
              value={form.description || ""}
              onChange={handleChange("description")}
              className={errors.description ? "border-destructive" : undefined}
            />
          </Field>
          <Field label="연락처" required error={errors.phoneNumber}>
            <Input
              placeholder="010-1234-5678"
              value={form.phoneNumber}
              onChange={handleChange("phoneNumber")}
              className={errors.phoneNumber ? "border-destructive" : ""}
            />
          </Field>
        </div>
      </FormSection>

      <FormSection
        title="손님 연락 채널"
        hint="(선택)"
        description="손님이 스토어 화면에서 바로 문의할 수 있어요."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="카카오톡 채널 ID"
            hint={
              <details className="mt-1 text-xs text-muted-foreground">
                <summary className="cursor-pointer">ID는 어디서 찾나요?</summary>
                <p className="mt-1">
                  카카오비즈니스 파트너센터 → 전체메뉴 → 링크 공유 → 채널 URL의 마지막 부분이에요.
                  예: <span className="font-mono">pf.kakao.com/_xeaCon</span>이면{" "}
                  <span className="font-mono">_xeaCon</span>
                </p>
              </details>
            }
          >
            <Input
              placeholder="예: _xeaCon"
              value={form.kakaoChannelId || ""}
              onChange={handleChange("kakaoChannelId")}
            />
          </Field>
          <Field label="인스타그램 ID">
            <Input
              placeholder="예: picake_official"
              value={form.instagramId || ""}
              onChange={handleChange("instagramId")}
            />
          </Field>
        </div>
      </FormSection>

      <FormSection
        id="section-store-location"
        title="위치"
        description="손님이 픽업하러 오는 곳이에요. 주소 검색으로 정해요."
        error={sectionHasError("section-store-location")}
      >
        <div className="space-y-5">
          <AddressInput
            value={{
              address: form.address,
              roadAddress: form.roadAddress,
              zonecode: form.zonecode,
              latitude: form.latitude,
              longitude: form.longitude,
            }}
            onChange={(addressData) =>
              patch({
                address: addressData.address,
                roadAddress: addressData.roadAddress,
                zonecode: addressData.zonecode,
                latitude: addressData.latitude,
                longitude: addressData.longitude,
              })
            }
            error={errors.address}
          />
          <Field label="상세주소" required error={errors.detailAddress}>
            <Input
              placeholder="예: 1층 101호"
              value={form.detailAddress}
              onChange={handleChange("detailAddress")}
              className={errors.detailAddress ? "border-destructive" : ""}
            />
          </Field>
        </div>
      </FormSection>

      <FormSection
        id="section-store-bank"
        title="정산 계좌"
        description="주문 금액을 받을 계좌예요. 손님에게는 보이지 않아요."
        error={sectionHasError("section-store-bank")}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <SelectBox
              label="은행"
              value={form.bankName}
              onChange={(v) => patch({ bankName: v as StoreBankName | "" })}
              options={STORE_BANK_OPTIONS}
              error={errors.bankName}
              required
            />
          </div>
          <Field label="계좌번호" required error={errors.bankAccountNumber}>
            <Input
              placeholder="예: 110-302-1234567"
              value={form.bankAccountNumber}
              onChange={handleChange("bankAccountNumber")}
              className={errors.bankAccountNumber ? "border-destructive" : ""}
            />
          </Field>
          <Field label="예금주" required error={errors.accountHolderName}>
            <Input
              placeholder="예: 홍길동"
              value={form.accountHolderName}
              onChange={handleChange("accountHolderName")}
              className={errors.accountHolderName ? "border-destructive" : ""}
            />
          </Field>
        </div>
      </FormSection>

      <FormSection
        id="section-store-refund"
        title={
          <>
            환불·취소 규정 <span className="text-destructive">*</span>
          </>
        }
        description="손님이 예약하기 전에 보고 동의하는 규정이에요."
        error={sectionHasError("section-store-refund")}
      >
        <StoreRefundCancellationPolicyFields
          policy={form.refundCancellationPolicy}
          onChange={(next) => patch({ refundCancellationPolicy: next })}
          sectionError={errors.refundCancellationPolicy}
        />
      </FormSection>

      {/* 저장 버튼은 항상 화면 아래에 */}
      {inFrame ? (
        // 휴대폰(디자인 8-F·A66b): 이전 | 고칠 곳 n개(누르면 첫 고칠 곳으로) | 등록하기·저장하기
        <FrameSubmitBar>
          {onPrevious && (
            <Button
              type="button"
              variant="outline"
              className={FRAME_SUBMIT_BUTTON_CLASS}
              onClick={onPrevious}
            >
              이전
            </Button>
          )}
          {errorKeys.length > 0 && (
            <Button
              type="button"
              variant="outline"
              className={FRAME_SUBMIT_BUTTON_CLASS}
              onClick={() => goToFirstError(errorKeys)}
            >
              고칠 곳 {errorKeys.length}개
            </Button>
          )}
          <Button
            type="submit"
            className={cn(
              FRAME_SUBMIT_BUTTON_CLASS,
              (onPrevious || errorKeys.length > 0) && "flex-[2]",
            )}
            disabled={submitting}
          >
            {submitButtonText || (initialValue ? "저장하기" : "등록하기")}
          </Button>
        </FrameSubmitBar>
      ) : (
        <div className="sticky bottom-0 z-10 flex items-center gap-3 border-t bg-background/95 px-1 py-3 backdrop-blur">
          {onPrevious && (
            <Button type="button" variant="outline" onClick={onPrevious}>
              이전
            </Button>
          )}
          {errorKeys.length > 0 && (
            <button
              type="button"
              className="text-sm text-destructive underline-offset-4 hover:underline"
              onClick={() => goToFirstError(errorKeys)}
            >
              고칠 곳 {errorKeys.length}개 보기
            </button>
          )}
          <Button type="submit" className="ml-auto" disabled={submitting}>
            {submitButtonText || (initialValue ? "수정하기" : "등록하기")}
          </Button>
        </div>
      )}
    </form>
  );
};
