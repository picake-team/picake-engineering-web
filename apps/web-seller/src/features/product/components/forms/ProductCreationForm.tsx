import React, { useState, useEffect } from "react";
import { BaseButton as Button } from "@/apps/web-seller/common/components/buttons/BaseButton";
import { Card, CardContent } from "@/apps/web-seller/common/components/cards/Card";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/apps/web-seller/common/components/tabs/Tabs";
import {
  EnableStatus,
  CakeSizeOptionDto,
  CakeFlavorOptionDto,
  CustomOptionDto,
  ProductCategoryType,
  ProductType,
  CakeSizeDisplayName,
} from "@/apps/web-seller/features/product/types/product.dto";
import { CUSTOM_OPTION_PRESETS } from "@/apps/web-seller/features/product/constants/product.constant";
import type { ProductForm } from "@/apps/web-seller/features/product/types/product.ui";
import { ProductCreationBasicInfoSection } from "@/apps/web-seller/features/product/components/sections/ProductCreationBasicInfoSection";
import { ProductCreationCakeOptionsSection } from "@/apps/web-seller/features/product/components/sections/ProductCreationCakeOptionsSection";
import { ProductCreationCustomOptionsSection } from "@/apps/web-seller/features/product/components/sections/ProductCreationCustomOptionsSection";
import { ProductCreationDetailDescriptionSection } from "@/apps/web-seller/features/product/components/sections/ProductCreationDetailDescriptionSection";
import { ProductCreationProductNoticeSection } from "@/apps/web-seller/features/product/components/sections/ProductCreationProductNoticeSection";
import type { ProductNoticeValues } from "@/apps/web-seller/features/product/utils/product-notice.util";
import { validateProductForm } from "@/apps/web-seller/features/product/utils/validateProductForm";
import { Checkbox } from "@/apps/web-seller/common/components/inputs/Checkbox";
import {
  SELLER_CHECK_MARK,
  hasSellerCheckMark,
} from "@/apps/web-seller/features/product/utils/ai-draft.util";
import {
  ProductNaverImportCard,
  type NaverSourceText,
} from "@/apps/web-seller/features/product/components/naver/ProductNaverImportCard";
import {
  ProductAiDescriptionDraft,
  initialAiDraftPanelState,
  type AiDraftPanelState,
} from "@/apps/web-seller/features/product/components/naver/ProductAiDescriptionDraft";

interface Props {
  onSubmit: (data: ProductForm) => void;
  initialValue?: ProductForm;
  onChange?: (data: ProductForm) => void;
  disabled?: boolean;
  onDelete?: () => void;
  isDeleting?: boolean;
  /** 같은 스토어 상품에서 고시를 복사할 때 쓴다 */
  storeId?: string;
  /** 수정 중인 상품 (고시 복사 목록에서 뺀다) */
  productId?: string;
  /** 수정 중인 상품의 네이버 연결 정보 (다시 불러오기용) */
  naverLink?: { naverBizItemId?: string | null; naverLinkedAt?: string | Date | null };
}

/** 새 상품에는 '레터링 문구'를 미리 넣어 둔다 (판매자가 지울 수 있음) */
const buildDefaultCustomOptions = (): CustomOptionDto[] =>
  CUSTOM_OPTION_PRESETS.filter((preset) => preset.key === "lettering").map((preset) =>
    preset.build(),
  );

export const defaultForm: ProductForm = {
  images: [],
  name: "",
  originalPrice: undefined,
  salePrice: undefined,
  salesStatus: EnableStatus.ENABLE,
  visibilityStatus: EnableStatus.ENABLE,
  cakeSizeOptions: [
    {
      visible: EnableStatus.ENABLE,
      displayName: CakeSizeDisplayName.DOSIRAK,
      lengthCm: 0,
      price: 0,
      description: "1~2인용",
    },
  ],
  cakeFlavorOptions: [
    {
      visible: EnableStatus.ENABLE,
      displayName: "초콜릿",
      price: 0,
    },
  ],
  // 상품 유형은 판매자가 반드시 고르도록 비워 둔다
  productType: undefined,
  customOptions: buildDefaultCustomOptions(),
  productCategoryTypes: [],
  searchTags: [],
  detailDescription: "",
  productNoticeFoodType: "",
  productNoticeProducer: "",
  productNoticeOrigin: "",
  productNoticeAddress: "",
  productNoticeManufactureDate: "",
  productNoticeExpirationDate: "",
  productNoticePackageCapacity: "",
  productNoticePackageQuantity: "",
  productNoticeIngredients: "",
  productNoticeCalories: "",
  productNoticeSafetyNotice: "",
  productNoticeGmoNotice: "",
  productNoticeImportNotice: "",
  productNoticeCustomerService: "",
};

export const ProductCreationForm: React.FC<Props> = ({
  onSubmit,
  initialValue,
  onChange,
  disabled = false,
  onDelete,
  isDeleting = false,
  storeId,
  productId,
  naverLink,
}) => {
  const [form, setForm] = useState<ProductForm>(initialValue || defaultForm);
  const [errors, setErrors] = useState<Partial<Record<keyof ProductForm, string>>>({});
  const [activeTab, setActiveTab] = useState("basic");
  // 다른 상품에서 복사한 고시: 판매자가 이 상품에 맞게 확인해야 저장된다
  const [noticeCopy, setNoticeCopy] = useState<{ fromName: string; confirmed: boolean } | null>(
    null,
  );
  const [noticeCopyError, setNoticeCopyError] = useState(false);
  // AI 초안 패널 (네이버에서 가져온 설명을 참고 자료로 넣는다). 탭을 옮겨도 남게 여기서 들고 있는다
  const [aiPanel, setAiPanel] = useState<AiDraftPanelState>(initialAiDraftPanelState);
  // AI 초안을 상세정보에 넣었으면 판매자가 읽고 고쳐 확인해야 저장된다
  const [aiDraft, setAiDraft] = useState<{ confirmed: boolean } | null>(null);
  const [aiDraftError, setAiDraftError] = useState<string | null>(null);

  useEffect(() => {
    if (initialValue) {
      setForm(initialValue);
      setErrors({});
      setNoticeCopy(null);
      setNoticeCopyError(false);
      setAiDraft(null);
      setAiDraftError(null);
    }
  }, [initialValue]);

  const handleNaverApply = (
    next: ProductForm,
    extra: { naverBizItemId?: string; source: NaverSourceText },
  ) => {
    if (disabled) return;
    const merged = extra.naverBizItemId ? { ...next, naverBizItemId: extra.naverBizItemId } : next;
    setForm(merged);
    onChange?.(merged);
    setErrors({});
    const sourceText = [extra.source.description, extra.source.precautions]
      .filter(Boolean)
      .join("\n\n");
    if (sourceText) setAiPanel((prev) => ({ ...prev, open: true, sourceText }));
  };

  const handleAiInsert = (html: string, how: "replace" | "append") => {
    if (disabled) return;
    const detailDescription = how === "replace" ? html : `${form.detailDescription ?? ""}${html}`;
    const next = { ...form, detailDescription };
    setForm(next);
    onChange?.(next);
    setAiDraft({ confirmed: false });
    setAiDraftError(null);
  };

  const handleCopyNotice = (values: ProductNoticeValues, productName: string) => {
    if (disabled) return;
    const next = { ...form, ...values };
    setForm(next);
    onChange?.(next);
    setNoticeCopy({ fromName: productName, confirmed: false });
    setNoticeCopyError(false);
    setErrors((prev) =>
      Object.fromEntries(Object.entries(prev).filter(([key]) => !key.startsWith("productNotice"))),
    );
  };

  const validate = (): {
    isValid: boolean;
    errors: Partial<Record<keyof ProductForm, string>>;
  } => {
    const newErrors = validateProductForm(form);
    setErrors(newErrors);
    return { isValid: Object.keys(newErrors).length === 0, errors: newErrors };
  };

  const handleChange =
    (key: keyof ProductForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (disabled) return;
      const value = e.target.value;
      const next = { ...form, [key]: value };
      setForm(next);
      onChange?.(next);
    };

  const handleOriginalPriceChange = (value: number | undefined) => {
    if (disabled) return;
    const next = { ...form, originalPrice: value };
    setForm(next);
    onChange?.(next);
  };

  const handleSalePriceChange = (value: number | undefined) => {
    if (disabled) return;
    const next = { ...form, salePrice: value };
    setForm(next);
    onChange?.(next);
  };

  const handleSalesStatusChange = (value: EnableStatus) => {
    if (disabled) return;
    const next = { ...form, salesStatus: value };
    setForm(next);
    onChange?.(next);
  };

  const handleVisibilityStatusChange = (value: EnableStatus) => {
    if (disabled) return;
    const next = { ...form, visibilityStatus: value };
    setForm(next);
    onChange?.(next);
  };

  const handleMainImageChange = (url: string) => {
    // 대표 이미지 변경 시: 새로운 대표 이미지 + 기존 추가 이미지들을 합쳐서 images 배열 생성
    const additionalImages = form.images?.slice(1) || [];
    const newImages = url ? [url, ...additionalImages] : additionalImages;
    const next = { ...form, images: newImages };
    setForm(next);
    onChange?.(next);
  };

  const handleAdditionalImagesChange = (urls: string[]) => {
    // 추가 이미지 변경 시: 기존 대표 이미지 + 새로운 추가 이미지들을 합쳐서 images 배열 생성
    const mainImage = form.images?.[0] || "";
    const newImages = mainImage ? [mainImage, ...urls] : urls;
    const next = { ...form, images: newImages };
    setForm(next);
    onChange?.(next);
  };

  const handleCakeSizeOptionsChange = (options: CakeSizeOptionDto[]) => {
    const next = { ...form, cakeSizeOptions: options };
    setForm(next);
    onChange?.(next);
  };

  const handleCakeFlavorOptionsChange = (options: CakeFlavorOptionDto[]) => {
    const next = { ...form, cakeFlavorOptions: options };
    setForm(next);
    onChange?.(next);
  };

  const handleCustomOptionsChange = (options: CustomOptionDto[]) => {
    if (disabled) return;
    const next = { ...form, customOptions: options };
    setForm(next);
    onChange?.(next);
  };

  const handleProductTypeChange = (value: ProductType) => {
    if (disabled) return;
    const next = { ...form, productType: value };
    setForm(next);
    onChange?.(next);
  };

  const handleProductCategoryTypesChange = (value: ProductCategoryType[]) => {
    if (disabled) return;
    const next = { ...form, productCategoryTypes: value };
    setForm(next);
    onChange?.(next);
  };

  const handleSearchTagsChange = (value: string[]) => {
    if (disabled) return;
    const next = { ...form, searchTags: value };
    setForm(next);
    onChange?.(next);
  };

  const handleDetailDescriptionChange = (value: string) => {
    const next = { ...form, detailDescription: value };
    setForm(next);
    onChange?.(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { isValid, errors: validationErrors } = validate();
    if (!isValid) {
      // 탭 순서(기본 정보 → 상세정보 → 상품정보제공고시)대로 첫 번째 에러가 있는 탭으로 이동
      const errorKeys = Object.keys(validationErrors);
      const isNoticeKey = (key: string) => key.startsWith("productNotice");
      if (errorKeys.some((key) => key !== "detailDescription" && !isNoticeKey(key))) {
        setActiveTab("basic"); // 기본 정보 탭
      } else if (validationErrors.detailDescription) {
        setActiveTab("detail"); // 상세정보 탭
      } else if (errorKeys.some(isNoticeKey)) {
        setActiveTab("notice"); // 상품정보제공고시 탭
      }
      return;
    }

    if (hasSellerCheckMark(form.detailDescription)) {
      setAiDraftError(`상세정보에 ${SELLER_CHECK_MARK}가 남아 있어요. 내용을 확인해 고쳐 주세요.`);
      setActiveTab("detail");
      return;
    }
    if (aiDraft && !aiDraft.confirmed) {
      setAiDraftError("AI 초안을 읽고 사실과 맞게 고쳤는지 확인해 주세요.");
      setActiveTab("detail");
      return;
    }

    if (noticeCopy && !noticeCopy.confirmed) {
      setNoticeCopyError(true);
      setActiveTab("notice");
      return;
    }

    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {storeId && !disabled && (
        <ProductNaverImportCard
          storeId={storeId}
          product={
            productId
              ? {
                  id: productId,
                  naverBizItemId: naverLink?.naverBizItemId,
                  naverLinkedAt: naverLink?.naverLinkedAt,
                }
              : undefined
          }
          form={form}
          onApply={handleNaverApply}
        />
      )}
      <Card>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">기본 정보</TabsTrigger>
              <TabsTrigger value="detail">상세정보</TabsTrigger>
              <TabsTrigger value="notice">상품정보제공고시</TabsTrigger>
            </TabsList>

            {/* 기본 정보 탭 */}
            <TabsContent value="basic" className="space-y-6 mt-6">
              <ProductCreationBasicInfoSection
                form={form}
                errors={errors}
                onSalesStatusChange={handleSalesStatusChange}
                onVisibilityStatusChange={handleVisibilityStatusChange}
                onProductTypeChange={handleProductTypeChange}
                onProductCategoryTypesChange={handleProductCategoryTypesChange}
                onSearchTagsChange={handleSearchTagsChange}
                onMainImageChange={handleMainImageChange}
                onAdditionalImagesChange={handleAdditionalImagesChange}
                onChange={handleChange}
                onOriginalPriceChange={handleOriginalPriceChange}
                onSalePriceChange={handleSalePriceChange}
                disabled={disabled}
              />

              {/* 케이크 옵션 섹션 */}
              <ProductCreationCakeOptionsSection
                form={form}
                errors={errors}
                onCakeSizeOptionsChange={handleCakeSizeOptionsChange}
                onCakeFlavorOptionsChange={handleCakeFlavorOptionsChange}
              />

              {/* 추가 옵션 섹션 */}
              <ProductCreationCustomOptionsSection
                form={form}
                errors={errors}
                onCustomOptionsChange={handleCustomOptionsChange}
                disabled={disabled}
              />
            </TabsContent>

            {/* 상세정보 탭 */}
            <TabsContent value="detail" className="mt-6">
              {storeId && !disabled && (
                <ProductAiDescriptionDraft
                  storeId={storeId}
                  form={form}
                  state={aiPanel}
                  onStateChange={setAiPanel}
                  onInsert={handleAiInsert}
                />
              )}
              <ProductCreationDetailDescriptionSection
                form={form}
                errors={errors}
                onChange={handleDetailDescriptionChange}
              />
              {aiDraft && (
                <div className="mt-3 space-y-1">
                  <Checkbox
                    checked={aiDraft.confirmed}
                    onChange={(confirmed) => {
                      setAiDraft({ confirmed });
                      if (confirmed) setAiDraftError(null);
                    }}
                    label={
                      <span className="text-sm">
                        AI 초안을 읽고 사실과 맞게 고쳤어요 (재료·알레르기·보관 방법 등)
                      </span>
                    }
                  />
                </div>
              )}
              {aiDraftError && <p className="mt-2 text-sm text-destructive">{aiDraftError}</p>}
            </TabsContent>

            {/* 상품정보제공고시 탭 */}
            <TabsContent value="notice" className="mt-6">
              <ProductCreationProductNoticeSection
                form={form}
                errors={errors}
                onChange={handleChange}
                copy={
                  storeId && !disabled
                    ? {
                        storeId,
                        excludeProductId: productId,
                        copiedFrom: noticeCopy?.fromName ?? null,
                        confirmed: noticeCopy?.confirmed ?? false,
                        showConfirmError: noticeCopyError,
                        onCopy: handleCopyNotice,
                        onConfirmedChange: (confirmed) =>
                          setNoticeCopy((prev) => (prev ? { ...prev, confirmed } : prev)),
                      }
                    : undefined
                }
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {!disabled && (
        <div className="flex justify-center gap-4 pt-6">
          {initialValue && onDelete && (
            <Button
              type="button"
              size="lg"
              variant="destructive"
              onClick={onDelete}
              disabled={isDeleting}
            >
              삭제하기
            </Button>
          )}
          <Button type="submit" size="lg" disabled={isDeleting}>
            {initialValue ? "수정하기" : "등록하기"}
          </Button>
        </div>
      )}
    </form>
  );
};
