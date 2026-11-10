import React, { useState } from "react";
import { Textarea } from "@/apps/web-seller/common/components/textareas/Textarea";
import type { ProductForm } from "@/apps/web-seller/features/product/types/product.ui";
import { BaseButton as Button } from "@/apps/web-seller/common/components/buttons/BaseButton";
import { Checkbox } from "@/apps/web-seller/common/components/inputs/Checkbox";
import { ProductNoticeCopyPicker } from "@/apps/web-seller/features/product/components/sections/ProductNoticeCopyPicker";
import {
  hasAnyProductNotice,
  type ProductNoticeValues,
} from "@/apps/web-seller/features/product/utils/product-notice.util";
import { BaseInput as Input } from "@/apps/web-seller/common/components/inputs/BaseInput";
import { Label } from "@/apps/web-seller/common/components/labels/Label";

export interface ProductCreationProductNoticeSectionProps {
  form: ProductForm;
  errors: Partial<Record<keyof ProductForm, string>>;
  /** 바깥에서 제목을 그리면 숨긴다 */
  hideHeader?: boolean;
  onChange: (
    key: keyof ProductForm,
  ) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  /** 같은 스토어의 다른 상품에서 고시 복사 (없으면 복사 버튼을 숨긴다) */
  copy?: {
    storeId: string;
    excludeProductId?: string;
    /** 복사한 원본 상품 이름 (복사 전이면 null) */
    copiedFrom: string | null;
    /** 복사한 값을 이 상품에 맞게 확인했는지 */
    confirmed: boolean;
    showConfirmError: boolean;
    onCopy: (values: ProductNoticeValues, productName: string) => void;
    onConfirmedChange: (confirmed: boolean) => void;
  };
}

// 상품 등록 폼 - 상품정보제공고시 섹션
export const ProductCreationProductNoticeSection: React.FC<
  ProductCreationProductNoticeSectionProps
> = ({ form, errors, onChange, copy, hideHeader }) => {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div>
      {!hideHeader && (
        <>
          <h2 className="text-xl font-semibold mb-2">상품정보제공고시</h2>
          <p className="text-sm text-muted-foreground mb-2">
            식품 판매 시 법적으로 입력해야 하는 항목들입니다. 모든 항목은 필수 입력입니다.
          </p>
        </>
      )}

      {copy && (
        <div className="mb-6 space-y-3">
          {pickerOpen ? (
            <ProductNoticeCopyPicker
              storeId={copy.storeId}
              excludeProductId={copy.excludeProductId}
              hasCurrentValues={hasAnyProductNotice(form)}
              onCopy={(values, productName) => {
                copy.onCopy(values, productName);
                setPickerOpen(false);
              }}
              onClose={() => setPickerOpen(false)}
            />
          ) : (
            <Button type="button" size="sm" variant="outline" onClick={() => setPickerOpen(true)}>
              기존 상품에서 복사
            </Button>
          )}
          {copy.copiedFrom && (
            <div
              className={`rounded-md border px-3 py-2 space-y-2 ${
                copy.showConfirmError && !copy.confirmed
                  ? "border-destructive"
                  : "border-amber-200 bg-amber-50"
              }`}
            >
              <p className="text-sm">
                &apos;{copy.copiedFrom}&apos;의 고시를 복사했어요. 원재료·영양성분·소비기한처럼
                상품마다 다른 항목이 이 상품에 맞는지 확인하고 고쳐 주세요.
              </p>
              <Checkbox
                checked={copy.confirmed}
                onChange={copy.onConfirmedChange}
                label={<span className="text-sm">이 상품에 맞게 확인했어요</span>}
              />
              {copy.showConfirmError && !copy.confirmed && (
                <p className="text-sm text-destructive">
                  복사한 고시를 확인했다고 체크해야 저장할 수 있어요.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label className="after:content-['*'] after:ml-0.5 after:text-destructive">
              식품의 유형
            </Label>
            <Input
              placeholder="예: 케이크류"
              value={form.productNoticeFoodType || ""}
              onChange={onChange("productNoticeFoodType")}
              className={errors.productNoticeFoodType ? "border-destructive" : ""}
            />
            {errors.productNoticeFoodType && (
              <p className="text-sm text-destructive mt-1">{errors.productNoticeFoodType}</p>
            )}
          </div>

          <div>
            <Label className="after:content-['*'] after:ml-0.5 after:text-destructive">
              제조사
            </Label>
            <Input
              placeholder="예: Picake"
              value={form.productNoticeProducer || ""}
              onChange={onChange("productNoticeProducer")}
              className={errors.productNoticeProducer ? "border-destructive" : ""}
            />
            {errors.productNoticeProducer && (
              <p className="text-sm text-destructive mt-1">{errors.productNoticeProducer}</p>
            )}
          </div>

          <div>
            <Label className="after:content-['*'] after:ml-0.5 after:text-destructive">
              원산지
            </Label>
            <Input
              placeholder="예: 국내산"
              value={form.productNoticeOrigin || ""}
              onChange={onChange("productNoticeOrigin")}
              className={errors.productNoticeOrigin ? "border-destructive" : ""}
            />
            {errors.productNoticeOrigin && (
              <p className="text-sm text-destructive mt-1">{errors.productNoticeOrigin}</p>
            )}
          </div>

          <div>
            <Label className="after:content-['*'] after:ml-0.5 after:text-destructive">
              소재지
            </Label>
            <Input
              placeholder="예: 서울시 강남구 테헤란로 123"
              value={form.productNoticeAddress || ""}
              onChange={onChange("productNoticeAddress")}
              className={errors.productNoticeAddress ? "border-destructive" : ""}
            />
            {errors.productNoticeAddress && (
              <p className="text-sm text-destructive mt-1">{errors.productNoticeAddress}</p>
            )}
          </div>

          <div>
            <Label className="after:content-['*'] after:ml-0.5 after:text-destructive">
              제조연월일
            </Label>
            <Input
              placeholder="예: 2024-01-01"
              value={form.productNoticeManufactureDate || ""}
              onChange={onChange("productNoticeManufactureDate")}
              className={errors.productNoticeManufactureDate ? "border-destructive" : ""}
            />
            {errors.productNoticeManufactureDate && (
              <p className="text-sm text-destructive mt-1">{errors.productNoticeManufactureDate}</p>
            )}
          </div>

          <div>
            <Label className="after:content-['*'] after:ml-0.5 after:text-destructive">
              소비기한 또는 품질유지기한
            </Label>
            <Input
              placeholder="예: 제조일로부터 3일"
              value={form.productNoticeExpirationDate || ""}
              onChange={onChange("productNoticeExpirationDate")}
              className={errors.productNoticeExpirationDate ? "border-destructive" : ""}
            />
            {errors.productNoticeExpirationDate && (
              <p className="text-sm text-destructive mt-1">{errors.productNoticeExpirationDate}</p>
            )}
          </div>

          <div>
            <Label className="after:content-['*'] after:ml-0.5 after:text-destructive">
              포장단위별 용량/수량
            </Label>
            <Input
              placeholder="예: 500g"
              value={form.productNoticePackageCapacity || ""}
              onChange={onChange("productNoticePackageCapacity")}
              className={errors.productNoticePackageCapacity ? "border-destructive" : ""}
            />
            {errors.productNoticePackageCapacity && (
              <p className="text-sm text-destructive mt-1">{errors.productNoticePackageCapacity}</p>
            )}
          </div>

          <div>
            <Label className="after:content-['*'] after:ml-0.5 after:text-destructive">
              포장 단위별 수량
            </Label>
            <Input
              placeholder="예: 1개"
              value={form.productNoticePackageQuantity || ""}
              onChange={onChange("productNoticePackageQuantity")}
              className={errors.productNoticePackageQuantity ? "border-destructive" : ""}
            />
            {errors.productNoticePackageQuantity && (
              <p className="text-sm text-destructive mt-1">{errors.productNoticePackageQuantity}</p>
            )}
          </div>
        </div>

        <div>
          <Label className="after:content-['*'] after:ml-0.5 after:text-destructive">
            원재료명 및 함량
          </Label>
          <Textarea
            placeholder="예: 초콜릿, 밀가루, 설탕, 우유, 계란"
            rows={3}
            value={form.productNoticeIngredients || ""}
            onChange={onChange("productNoticeIngredients")}
            className={errors.productNoticeIngredients ? "border-destructive" : undefined}
          />
          {errors.productNoticeIngredients && (
            <p className="text-sm text-destructive mt-1">{errors.productNoticeIngredients}</p>
          )}
        </div>

        <div>
          <Label className="after:content-['*'] after:ml-0.5 after:text-destructive">
            영양성분
          </Label>
          <Textarea
            placeholder="예: 칼로리: 350kcal, 탄수화물: 45g, 단백질: 5g, 지방: 15g"
            rows={3}
            value={form.productNoticeCalories || ""}
            onChange={onChange("productNoticeCalories")}
            className={errors.productNoticeCalories ? "border-destructive" : undefined}
          />
          {errors.productNoticeCalories && (
            <p className="text-sm text-destructive mt-1">{errors.productNoticeCalories}</p>
          )}
        </div>

        <div>
          <Label className="after:content-['*'] after:ml-0.5 after:text-destructive">
            소비자안전을 위한 주의사항
          </Label>
          <Textarea
            placeholder="예: 알레르기 주의: 우유, 계란, 밀 함유"
            rows={3}
            value={form.productNoticeSafetyNotice || ""}
            onChange={onChange("productNoticeSafetyNotice")}
            className={errors.productNoticeSafetyNotice ? "border-destructive" : undefined}
          />
          {errors.productNoticeSafetyNotice && (
            <p className="text-sm text-destructive mt-1">{errors.productNoticeSafetyNotice}</p>
          )}
        </div>

        <div>
          <Label className="after:content-['*'] after:ml-0.5 after:text-destructive">
            유전자변형식품에 해당하는 경우의 표시
          </Label>
          <Input
            placeholder="예: 해당사항 없음"
            value={form.productNoticeGmoNotice || ""}
            onChange={onChange("productNoticeGmoNotice")}
            className={errors.productNoticeGmoNotice ? "border-destructive" : ""}
          />
          {errors.productNoticeGmoNotice && (
            <p className="text-sm text-destructive mt-1">{errors.productNoticeGmoNotice}</p>
          )}
        </div>

        <div>
          <Label className="after:content-['*'] after:ml-0.5 after:text-destructive">
            수입식품의 경우
          </Label>
          <Input
            placeholder="예: 해당사항 없음"
            value={form.productNoticeImportNotice || ""}
            onChange={onChange("productNoticeImportNotice")}
            className={errors.productNoticeImportNotice ? "border-destructive" : ""}
          />
          {errors.productNoticeImportNotice && (
            <p className="text-sm text-destructive mt-1">{errors.productNoticeImportNotice}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label className="after:content-['*'] after:ml-0.5 after:text-destructive">
              고객센터
            </Label>
            <Input
              placeholder="예: 1588-1234"
              value={form.productNoticeCustomerService || ""}
              onChange={onChange("productNoticeCustomerService")}
              className={errors.productNoticeCustomerService ? "border-destructive" : ""}
            />
            {errors.productNoticeCustomerService && (
              <p className="text-sm text-destructive mt-1">{errors.productNoticeCustomerService}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
