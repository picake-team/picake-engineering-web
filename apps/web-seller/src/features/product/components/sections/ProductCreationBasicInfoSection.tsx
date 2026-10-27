import React from "react";
import {
  EnableStatus,
  ProductCategoryType,
  ProductType,
} from "@/apps/web-seller/features/product/types/product.dto";
import type { ProductForm } from "@/apps/web-seller/features/product/types/product.ui";
import {
  PRODUCT_TYPE_OPTIONS,
  SALES_STATUS_OPTIONS,
  VISIBILITY_STATUS_OPTIONS,
} from "@/apps/web-seller/features/product/constants/product.constant";
import { ImageMultiUpload } from "@/apps/web-seller/features/upload/components/ImageMultiUpload";
import { SelectBox } from "@/apps/web-seller/common/components/selects/SelectBox";
import { BaseInput as Input } from "@/apps/web-seller/common/components/inputs/BaseInput";
import { NumberInput } from "@/apps/web-seller/common/components/inputs/NumberInput";
import { Label } from "@/apps/web-seller/common/components/labels/Label";
import { Card, CardContent } from "@/apps/web-seller/common/components/cards/Card";
import { ProductCreationCategorySection } from "@/apps/web-seller/features/product/components/sections/ProductCreationCategorySection";
import { ProductCreationSearchTagSection } from "@/apps/web-seller/features/product/components/sections/ProductCreationSearchTagSection";

export interface ProductCreationBasicInfoSectionProps {
  form: ProductForm;
  errors: Partial<Record<keyof ProductForm, string>>;
  onSalesStatusChange: (value: EnableStatus) => void;
  onVisibilityStatusChange: (value: EnableStatus) => void;
  onProductTypeChange: (value: ProductType) => void;
  onProductCategoryTypesChange: (value: ProductCategoryType[]) => void;
  onSearchTagsChange: (value: string[]) => void;
  onMainImageChange: (url: string) => void;
  onAdditionalImagesChange: (urls: string[]) => void;
  onChange: (
    key: keyof ProductForm,
  ) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onOriginalPriceChange: (value: number | undefined) => void;
  onSalePriceChange: (value: number | undefined) => void;
  disabled?: boolean;
}

// 상품 등록 폼 - 기본 정보 섹션
export const ProductCreationBasicInfoSection: React.FC<ProductCreationBasicInfoSectionProps> = ({
  form,
  errors,
  onSalesStatusChange,
  onVisibilityStatusChange,
  onProductTypeChange,
  onProductCategoryTypesChange,
  onSearchTagsChange,
  onMainImageChange,
  onAdditionalImagesChange,
  onChange,
  onOriginalPriceChange,
  onSalePriceChange,
  disabled = false,
}) => {
  // images 배열에서 첫 번째 요소를 대표 이미지로, 나머지를 추가 이미지로 분리
  const mainImage = form.images?.[0] || "";
  const additionalImages = form.images?.slice(1) || [];

  return (
    <div className="grid grid-cols-1 gap-6">
      {/* 상품 기본 정보 (노출 상품명 ~ 판매가) */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-2">상품 기본 정보</h2>
          <div className="border-t mb-6" />

          <div className="grid grid-cols-1 gap-6">
            <div>
              <SelectBox
                label="상품 유형"
                value={form.productType ?? ""}
                onChange={(value) => onProductTypeChange(value as ProductType)}
                options={PRODUCT_TYPE_OPTIONS}
                error={errors.productType}
                required
                disabled={disabled}
              />
              <p className="text-sm text-muted-foreground mt-1">
                스토어 상세의 &apos;기본/커스텀&apos; 탭에 표시돼요. 추가 옵션 구성과는 관계없어요.
              </p>
            </div>
            <div>
              <Label className="after:content-['*'] after:ml-0.5 after:text-destructive">
                노출 상품명
              </Label>
              <Input
                placeholder=""
                value={form.name}
                onChange={onChange("name")}
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
            </div>
            <div>
              <SelectBox
                label="판매 여부"
                value={form.salesStatus}
                onChange={(value) => onSalesStatusChange(value as EnableStatus)}
                options={SALES_STATUS_OPTIONS}
                error={errors.salesStatus}
                required
              />
            </div>
            <div>
              <SelectBox
                label="노출 여부"
                value={form.visibilityStatus}
                onChange={(value) => onVisibilityStatusChange(value as EnableStatus)}
                options={VISIBILITY_STATUS_OPTIONS}
                error={errors.visibilityStatus}
                required
              />
            </div>
            <div>
              <Label className="after:content-['*'] after:ml-0.5 after:text-destructive">
                정가
              </Label>
              <NumberInput
                value={form.originalPrice}
                onChange={onOriginalPriceChange}
                placeholder="예: 50000"
                min={0}
                className={errors.originalPrice ? "border-destructive" : ""}
                disabled={disabled}
              />
              {errors.originalPrice && (
                <p className="text-sm text-destructive mt-1">{errors.originalPrice}</p>
              )}
            </div>
            <div>
              <Label className="after:content-['*'] after:ml-0.5 after:text-destructive">
                판매가
              </Label>
              <NumberInput
                value={form.salePrice}
                onChange={onSalePriceChange}
                placeholder="예: 45000"
                min={0}
                className={errors.salePrice ? "border-destructive" : ""}
                disabled={disabled}
              />
              {errors.salePrice && (
                <p className="text-sm text-destructive mt-1">{errors.salePrice}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 카테고리 설정 (중복 선택 가능) */}
      <ProductCreationCategorySection
        value={form.productCategoryTypes ?? []}
        onChange={onProductCategoryTypesChange}
        disabled={disabled}
      />

      {/* 검색 태그 설정 */}
      <ProductCreationSearchTagSection
        value={form.searchTags ?? []}
        onChange={onSearchTagsChange}
        disabled={disabled}
      />

      {/* 이미지 등록 */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-2">이미지 등록</h2>
          <div className="border-t mb-6" />

          <div className="grid grid-cols-1 gap-6">
            <div>
              <Label className="after:content-['*'] after:ml-0.5 after:text-destructive">
                상품 대표 이미지
              </Label>
              <ImageMultiUpload
                width={300}
                height={300}
                value={mainImage ? [mainImage] : []}
                onChange={(urls) => onMainImageChange(urls[0] || "")}
                maxImages={1}
                enableDragDrop={true}
              />
            </div>
            <div>
              <Label>추가 이미지</Label>
              <ImageMultiUpload
                width={300}
                height={300}
                value={additionalImages}
                onChange={onAdditionalImagesChange}
                maxImages={7}
                enableDragDrop={true}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
