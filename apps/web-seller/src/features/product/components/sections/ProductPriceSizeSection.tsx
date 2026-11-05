import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { BaseButton as Button } from "@/apps/web-seller/common/components/buttons/BaseButton";
import { BaseInput as Input } from "@/apps/web-seller/common/components/inputs/BaseInput";
import { NumberInput } from "@/apps/web-seller/common/components/inputs/NumberInput";
import { Checkbox } from "@/apps/web-seller/common/components/inputs/Checkbox";
import {
  CakeSizeDisplayName,
  EnableStatus,
  type CakeSizeOptionDto,
} from "@/apps/web-seller/features/product/types/product.dto";
import type { ProductForm } from "@/apps/web-seller/features/product/types/product.ui";
import { FormSection } from "@/apps/web-seller/features/product/components/sections/FormSection";

type Errors = Partial<Record<keyof ProductForm, string>>;

interface Props {
  form: ProductForm;
  errors: Errors;
  onChange: (patch: Partial<ProductForm>) => void;
  disabled?: boolean;
}

const SIZE_NAMES = Object.values(CakeSizeDisplayName);
const won = (n: number) => `${n.toLocaleString()}원`;
const selectClass =
  "h-9 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring";

/**
 * 가격과 사이즈. Picake는 "판매가 + 사이즈 추가금"이라, 사이즈마다 손님이 실제로 내는 금액을 옆에 보여 준다.
 * 정가는 할인할 때만 보인다(할인하지 않으면 정가 = 판매가).
 */
export function ProductPriceSizeSection({ form, errors, onChange, disabled }: Props) {
  // 정가가 판매가보다 크면(수정 화면·네이버 가져오기) 할인 중으로 본다
  const [discountOn, setDiscountOn] = useState(false);
  const discount =
    discountOn ||
    (form.originalPrice != null && form.salePrice != null && form.originalPrice > form.salePrice);
  const setDiscount = (on: boolean) => setDiscountOn(on);
  const base = form.salePrice ?? 0;
  const sizes = form.cakeSizeOptions ?? [];

  const setSalePrice = (salePrice: number | undefined) =>
    onChange(discount ? { salePrice } : { salePrice, originalPrice: salePrice });

  const toggleDiscount = (on: boolean) => {
    setDiscount(on);
    if (!on) onChange({ originalPrice: form.salePrice });
  };

  const updateSize = (index: number, patch: Partial<CakeSizeOptionDto>) =>
    onChange({ cakeSizeOptions: sizes.map((s, i) => (i === index ? { ...s, ...patch } : s)) });

  const addSize = () => {
    const used = new Set(sizes.map((s) => s.displayName));
    const next = SIZE_NAMES.find((name) => !used.has(name)) ?? CakeSizeDisplayName.SIZE_1;
    onChange({
      cakeSizeOptions: [
        ...sizes,
        { visible: EnableStatus.ENABLE, displayName: next, lengthCm: 0, price: 0, description: "" },
      ],
    });
  };

  const priceError = errors.salePrice || errors.originalPrice;

  return (
    <FormSection
      id="section-price"
      title="가격과 사이즈"
      description="가장 작은 사이즈 가격을 판매가로 적고, 큰 사이즈는 추가금으로 정해요."
      error={!!(priceError || errors.cakeSizeOptions)}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">
            판매가 <span className="text-destructive">*</span>
          </label>
          <div className="flex items-center gap-2">
            <NumberInput
              value={form.salePrice}
              onChange={setSalePrice}
              placeholder="예: 38000"
              min={0}
              disabled={disabled}
              className={errors.salePrice ? "border-destructive" : ""}
            />
            <span className="text-sm text-muted-foreground">원</span>
          </div>
        </div>
        {discount && (
          <div>
            <label className="mb-1 block text-sm font-medium">할인 전 가격(정가)</label>
            <div className="flex items-center gap-2">
              <NumberInput
                value={form.originalPrice}
                onChange={(originalPrice) => onChange({ originalPrice })}
                placeholder="예: 42000"
                min={0}
                disabled={disabled}
                className={errors.originalPrice ? "border-destructive" : ""}
              />
              <span className="text-sm text-muted-foreground">원</span>
            </div>
          </div>
        )}
      </div>
      <div className="mt-2">
        <Checkbox
          checked={discount}
          onChange={toggleDiscount}
          disabled={disabled}
          label={
            <span className="text-sm">할인해서 팔기 (손님 화면에 할인 전 가격이 함께 보여요)</span>
          }
        />
      </div>
      {priceError && <p className="mt-1 text-sm text-destructive">{priceError}</p>}

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium">
            사이즈 <span className="text-destructive">*</span>
          </p>
          <Button type="button" size="sm" variant="outline" onClick={addSize} disabled={disabled}>
            <Plus className="h-4 w-4" />
            사이즈 추가
          </Button>
        </div>
        <ul className="divide-y rounded-lg border">
          {sizes.map((size, index) => {
            const hidden = size.visible !== EnableStatus.ENABLE;
            return (
              <li key={size.id ?? `new-${index}`} className={`p-3 ${hidden ? "bg-muted/40" : ""}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    aria-label="사이즈"
                    className={selectClass}
                    value={size.displayName}
                    disabled={disabled}
                    onChange={(e) =>
                      updateSize(index, { displayName: e.target.value as CakeSizeDisplayName })
                    }
                  >
                    {SIZE_NAMES.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                  <div className="flex w-24 items-center gap-1">
                    <NumberInput
                      aria-label="지름"
                      value={size.lengthCm || undefined}
                      onChange={(v) => updateSize(index, { lengthCm: v ?? 0 })}
                      placeholder="지름"
                      disabled={disabled}
                      integer={false}
                    />
                    <span className="text-xs text-muted-foreground">cm</span>
                  </div>
                  <div className="flex w-32 items-center gap-1">
                    <span className="text-xs text-muted-foreground">+</span>
                    <NumberInput
                      aria-label="추가금"
                      value={size.price}
                      onChange={(v) => updateSize(index, { price: v ?? 0 })}
                      placeholder="0"
                      min={0}
                      disabled={disabled}
                    />
                    <span className="text-xs text-muted-foreground">원</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    = 손님 결제 <b className="text-foreground">{won(base + (size.price || 0))}</b>
                  </span>
                  <div className="ml-auto flex items-center gap-2">
                    <Checkbox
                      checked={!hidden}
                      onChange={(checked) =>
                        updateSize(index, {
                          visible: checked ? EnableStatus.ENABLE : EnableStatus.DISABLE,
                        })
                      }
                      disabled={disabled}
                      label={<span className="text-xs">판매</span>}
                    />
                    <button
                      type="button"
                      aria-label={`${size.displayName} 사이즈 삭제`}
                      className="rounded p-1 text-muted-foreground hover:text-destructive disabled:opacity-40"
                      disabled={disabled || sizes.length <= 1}
                      onClick={() =>
                        onChange({ cakeSizeOptions: sizes.filter((_, i) => i !== index) })
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <Input
                  aria-label="사이즈 설명"
                  className="mt-2 h-8 text-sm"
                  value={size.description ?? ""}
                  onChange={(e) => updateSize(index, { description: e.target.value })}
                  placeholder="설명 (선택, 예: 1~2인용)"
                  disabled={disabled}
                />
              </li>
            );
          })}
        </ul>
        {errors.cakeSizeOptions && (
          <p className="mt-1 text-sm text-destructive">{errors.cakeSizeOptions}</p>
        )}
      </div>
    </FormSection>
  );
}
