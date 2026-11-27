import React, { useEffect, useRef, useState } from "react";
import { isActAsMode } from "@/apps/web-seller/common/utils/act-as.util";
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
import { StoreContactChannels } from "@/apps/web-seller/features/store/components/StoreContactChannels";
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
  { id: "section-store-basic", keys: ["name", "description"] },
  { id: "section-store-contact", keys: ["phoneNumber"] },
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
    errors.address = "주소 검색으로 스토어 주소를 정해 주세요.";
  }
  set("detailAddress", validateDetailAddress(form.detailAddress));
  if (!form.bankName) errors.bankName = "은행을 골라 주세요.";
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
  // 운영자 대신 입력 중(기획 I-41)에는 정산 계좌를 바꿀 수 없다(서버도 막음) — 칸을 잠근다
  const bankLocked = !!initialValue && isActAsMode();
  // 손님 연락 채널 "손님에게 보이기"는 사장님만 바꾼다(상품의 손님에게 보이기와 같게, 서버도 다르면 403, 기획 I-01·P-93)
  const visibilityLocked = isActAsMode();
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  // 주소 검색·네이버 가져오기처럼 나중에 돌아오는 값도 최신 폼에 합친다
  const formRef = useRef(form);

  useEffect(() => {
    // 스토어 만들기는 칸을 고칠 때마다 onChange로 받은 값을 initialValue로 다시 내려준다. 방금 보낸 값이면 다시 채우지 않는다
    // (다시 채우면 고칠 곳이 모두 지워졌다, 11-20 검토). 수정 화면은 서버에서 새로 받은 값일 때만 바뀐다
    if (initialValue && initialValue !== formRef.current) {
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
              placeholder="스토어 소개, 주문 방법, 픽업 안내 등을 적어 주세요. 손님 화면에서는 길면 접어서 보여 줘요."
              rows={6}
              maxLength={STORE_DESCRIPTION_MAX_LENGTH}
              value={form.description || ""}
              onChange={handleChange("description")}
              className={errors.description ? "border-destructive" : undefined}
            />
          </Field>
        </div>
      </FormSection>

      {/* 전화번호만 꼭 적는다(판매자 정보로도 쓰는 번호, 기획 P-46). 손님에게 보일지는 스위치로 정한다(P-95) */}
      <FormSection
        id="section-store-contact"
        title="손님 연락 채널"
        description="켜 둔 곳으로 손님이 문의해요."
        error={sectionHasError("section-store-contact")}
      >
        <StoreContactChannels
          form={form}
          patch={patch}
          phoneError={errors.phoneNumber}
          locked={visibilityLocked}
        />
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
              disabled={bankLocked}
            />
          </div>
          <Field label="계좌번호" required error={errors.bankAccountNumber}>
            <Input
              placeholder="예: 1103021234567"
              inputMode="numeric"
              value={form.bankAccountNumber}
              onChange={handleChange("bankAccountNumber")}
              disabled={bankLocked}
              className={errors.bankAccountNumber ? "border-destructive" : ""}
            />
          </Field>
          <Field label="예금주" required error={errors.accountHolderName}>
            <Input
              placeholder="예: 홍길동"
              value={form.accountHolderName}
              onChange={handleChange("accountHolderName")}
              disabled={bankLocked}
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
        // 휴대폰: 고칠 곳 n개(누르면 첫 고칠 곳으로) | 등록하기·저장하기.
        // 앞 단계로는 위쪽 ←로 간다(넣은 값은 남음). "이전"까지 셋을 두면 360 폭에서 버튼이 좁아진다
        <FrameSubmitBar>
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
            className={cn(FRAME_SUBMIT_BUTTON_CLASS, errorKeys.length > 0 && "flex-[2]")}
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
            {submitButtonText || (initialValue ? "저장하기" : "등록하기")}
          </Button>
        </div>
      )}
    </form>
  );
};
