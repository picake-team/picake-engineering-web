import React, { useState, useEffect } from "react";
import type { BusinessRegistrationFormValues } from "@/apps/web-seller/features/business/types/business.ui";
import {
  validateBusinessNo,
  validateRepresentativeName,
  validateStartDate,
  validateBusinessName,
  validateBusinessSector,
  validateBusinessType,
} from "@/apps/web-seller/features/business/utils/validator.util";
import { BaseButton as Button } from "@/apps/web-seller/common/components/buttons/BaseButton";
import { BaseInput as Input } from "@/apps/web-seller/common/components/inputs/BaseInput";
import { NumberInput } from "@/apps/web-seller/common/components/inputs/NumberInput";
import { Label } from "@/apps/web-seller/common/components/labels/Label";
import {
  FRAME_SUBMIT_BUTTON_CLASS,
  useInMobileFrame,
} from "@/apps/web-seller/common/components/layouts/mobile-frame.context";
import { FrameSubmitBar } from "@/apps/web-seller/common/components/layouts/FrameSubmitBar";

interface Props {
  onSubmit: (data: BusinessRegistrationFormValues) => void;
  initialValue?: BusinessRegistrationFormValues;
  onChange?: (data: BusinessRegistrationFormValues) => void;
}

export const defaultForm: BusinessRegistrationFormValues = {
  b_no: "", // 사업자등록번호
  p_nm: "", // 대표자명
  start_dt: "", // 개업일
  b_nm: "", // 상호
  b_sector: "", // 업태
  b_type: "", // 종목
};

const numericStringToValue = (s: string): number | undefined => {
  if (s === "") return undefined;
  const n = parseInt(s, 10);
  return Number.isNaN(n) ? undefined : n;
};

const BUSINESS_NO_MAX_LENGTH = 10;

export const BusinessRegistrationForm: React.FC<Props> = ({ onSubmit, initialValue, onChange }) => {
  const inFrame = useInMobileFrame();
  const [form, setForm] = useState<BusinessRegistrationFormValues>(initialValue || defaultForm);
  const [errors, setErrors] = useState<
    Partial<Record<keyof BusinessRegistrationFormValues, string>>
  >({});

  useEffect(() => {
    if (initialValue) {
      setForm(initialValue);
      setErrors({});
    }
  }, [initialValue]);

  const validate = () => {
    const newErrors: Partial<Record<keyof BusinessRegistrationFormValues, string>> = {};

    const businessNoError = validateBusinessNo(form.b_no);
    if (businessNoError) {
      newErrors.b_no = businessNoError;
    }
    const representativeNameError = validateRepresentativeName(form.p_nm);
    if (representativeNameError) {
      newErrors.p_nm = representativeNameError;
    }
    const startDateError = validateStartDate(form.start_dt);
    if (startDateError) {
      newErrors.start_dt = startDateError;
    }
    const businessNameError = validateBusinessName(form.b_nm);
    if (businessNameError) {
      newErrors.b_nm = businessNameError;
    }
    const businessSectorError = validateBusinessSector(form.b_sector);
    if (businessSectorError) {
      newErrors.b_sector = businessSectorError;
    }
    const businessTypeError = validateBusinessType(form.b_type);
    if (businessTypeError) {
      newErrors.b_type = businessTypeError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange =
    (key: keyof BusinessRegistrationFormValues) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      const next = { ...form, [key]: value };
      setForm(next);
      onChange?.(next);
    };

  const handleBNoChange = (v: number | undefined) => {
    const value = v === undefined ? "" : String(v).slice(0, BUSINESS_NO_MAX_LENGTH);
    const next = { ...form, b_no: value };
    setForm(next);
    onChange?.(next);
  };

  const handleStartDtChange = (v: number | undefined) => {
    const value = v === undefined ? "" : String(v);
    const next = { ...form, start_dt: value };
    setForm(next);
    onChange?.(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        <div>
          <Label className="after:content-['*'] after:ml-0.5 after:text-destructive">
            사업자등록번호
          </Label>
          <NumberInput
            value={numericStringToValue(form.b_no)}
            onChange={handleBNoChange}
            placeholder="하이픈(-) 없이 10자리 숫자로 입력해 주세요."
            min={0}
            max={9999999999}
            className={errors.b_no ? "border-destructive" : ""}
          />
          {errors.b_no && <p className="text-sm text-destructive mt-1">{errors.b_no}</p>}
        </div>
        <div>
          <Label className="after:content-['*'] after:ml-0.5 after:text-destructive">
            대표자명
          </Label>
          <Input
            placeholder="예: 홍길동"
            value={form.p_nm}
            onChange={handleChange("p_nm")}
            maxLength={30}
            className={errors.p_nm ? "border-destructive" : ""}
          />
          {errors.p_nm && <p className="text-sm text-destructive mt-1">{errors.p_nm}</p>}
        </div>
        <div>
          <Label className="after:content-['*'] after:ml-0.5 after:text-destructive">개업일</Label>
          <NumberInput
            value={numericStringToValue(form.start_dt)}
            onChange={handleStartDtChange}
            placeholder="예: 20251030 (숫자 8자리)"
            min={0}
            className={errors.start_dt ? "border-destructive" : ""}
          />
          {errors.start_dt && <p className="text-sm text-destructive mt-1">{errors.start_dt}</p>}
        </div>
        <div>
          <Label className="after:content-['*'] after:ml-0.5 after:text-destructive">상호</Label>
          <Input
            placeholder="예: 달콤케이크"
            value={form.b_nm}
            onChange={handleChange("b_nm")}
            maxLength={50}
            className={errors.b_nm ? "border-destructive" : ""}
          />
          {errors.b_nm && <p className="text-sm text-destructive mt-1">{errors.b_nm}</p>}
        </div>
        <div>
          <Label className="after:content-['*'] after:ml-0.5 after:text-destructive">업태</Label>
          <Input
            placeholder="예: 제조업"
            value={form.b_sector}
            onChange={handleChange("b_sector")}
            maxLength={50}
            className={errors.b_sector ? "border-destructive" : ""}
          />
          {errors.b_sector && <p className="text-sm text-destructive mt-1">{errors.b_sector}</p>}
        </div>
        <div>
          <Label className="after:content-['*'] after:ml-0.5 after:text-destructive">종목</Label>
          <Input
            placeholder="예: 제과점업"
            value={form.b_type}
            onChange={handleChange("b_type")}
            maxLength={50}
            className={errors.b_type ? "border-destructive" : ""}
          />
          {errors.b_type && <p className="text-sm text-destructive mt-1">{errors.b_type}</p>}
        </div>
      </div>

      {inFrame ? (
        <FrameSubmitBar>
          <Button type="submit" className={FRAME_SUBMIT_BUTTON_CLASS}>
            다음
          </Button>
        </FrameSubmitBar>
      ) : (
        <div className="flex justify-center pt-6">
          <Button type="submit">다음 단계</Button>
        </div>
      )}
    </form>
  );
};
