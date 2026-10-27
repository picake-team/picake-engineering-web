import { EnableStatus } from "@/apps/web-seller/features/product/types/product.dto";
import type { ProductForm } from "@/apps/web-seller/features/product/types/product.ui";
import { getCustomOptionsError } from "@/apps/web-seller/features/product/utils/validateCustomOptions";

export const validateProductForm = (
  form: ProductForm,
): Partial<Record<keyof ProductForm, string>> => {
  const newErrors: Partial<Record<keyof ProductForm, string>> = {};

  // 기본 정보 검증 - 대표 이미지 (images 배열의 첫 번째 요소) 필수
  if (!form.images || form.images.length === 0 || !form.images[0]?.trim()) {
    newErrors.images = "상품 대표 이미지를 등록해주세요.";
  }

  if (!form.name.trim()) {
    newErrors.name = "상품명을 입력해주세요.";
  }

  if (!form.salesStatus) {
    newErrors.salesStatus = "판매 여부를 선택해주세요.";
  }

  if (!form.visibilityStatus) {
    newErrors.visibilityStatus = "노출 여부를 선택해주세요.";
  }

  if (form.originalPrice === null || form.originalPrice === undefined) {
    newErrors.originalPrice = "정가를 입력해주세요.";
  } else if (form.originalPrice <= 0) {
    newErrors.originalPrice = "정가는 0보다 큰 숫자여야 합니다.";
  }

  if (form.salePrice === null || form.salePrice === undefined) {
    newErrors.salePrice = "판매가를 입력해주세요.";
  } else if (form.salePrice <= 0) {
    newErrors.salePrice = "판매가는 0보다 큰 숫자여야 합니다.";
  } else if (
    form.originalPrice !== null &&
    form.originalPrice !== undefined &&
    form.salePrice > form.originalPrice
  ) {
    newErrors.salePrice = "판매가는 정가보다 클 수 없습니다.";
  }

  if (!form.productType) {
    newErrors.productType = "상품 유형을 선택해주세요.";
  }

  if (!form.cakeSizeOptions?.some((option) => option.visible === EnableStatus.ENABLE)) {
    newErrors.cakeSizeOptions = "노출 중인 사이즈를 1개 이상 등록해주세요.";
  }

  if (!form.cakeFlavorOptions?.some((option) => option.visible === EnableStatus.ENABLE)) {
    newErrors.cakeFlavorOptions = "노출 중인 맛을 1개 이상 등록해주세요.";
  }

  const customOptionsError = getCustomOptionsError(form.customOptions ?? []);
  if (customOptionsError) {
    newErrors.customOptions = customOptionsError;
  }

  if (
    form.cakeFlavorOptions &&
    form.cakeFlavorOptions.length > 0 &&
    form.cakeFlavorOptions.some((option) => !option.displayName?.trim())
  ) {
    newErrors.cakeFlavorOptions =
      "입력되지 않은 케이크 옵션명이 있습니다. 확인 후 다시 시도해 주세요.";
  }

  // 상품정보제공고시 검증
  if (!form.productNoticeFoodType?.trim()) {
    newErrors.productNoticeFoodType = "식품의 유형을 입력해주세요.";
  }

  if (!form.productNoticeProducer?.trim()) {
    newErrors.productNoticeProducer = "제조사를 입력해주세요.";
  }

  if (!form.productNoticeOrigin?.trim()) {
    newErrors.productNoticeOrigin = "원산지를 입력해주세요.";
  }

  if (!form.productNoticeAddress?.trim()) {
    newErrors.productNoticeAddress = "소재지를 입력해주세요.";
  }

  if (!form.productNoticeManufactureDate?.trim()) {
    newErrors.productNoticeManufactureDate = "제조연월일을 입력해주세요.";
  }

  if (!form.productNoticeExpirationDate?.trim()) {
    newErrors.productNoticeExpirationDate = "소비기한 또는 품질유지기한을 입력해주세요.";
  }

  if (!form.productNoticePackageCapacity?.trim()) {
    newErrors.productNoticePackageCapacity = "포장단위별 용량/수량을 입력해주세요.";
  }

  if (!form.productNoticePackageQuantity?.trim()) {
    newErrors.productNoticePackageQuantity = "포장 단위별 수량을 입력해주세요.";
  }

  if (!form.productNoticeIngredients?.trim()) {
    newErrors.productNoticeIngredients = "원재료명 및 함량을 입력해주세요.";
  }

  if (!form.productNoticeCalories?.trim()) {
    newErrors.productNoticeCalories = "영양성분을 입력해주세요.";
  }

  if (!form.productNoticeSafetyNotice?.trim()) {
    newErrors.productNoticeSafetyNotice = "소비자안전을 위한 주의사항을 입력해주세요.";
  }

  if (!form.productNoticeGmoNotice?.trim()) {
    newErrors.productNoticeGmoNotice = "유전자변형식품에 해당하는 경우의 표시를 입력해주세요.";
  }

  if (!form.productNoticeImportNotice?.trim()) {
    newErrors.productNoticeImportNotice = "수입식품의 경우를 입력해주세요.";
  }

  if (!form.productNoticeCustomerService?.trim()) {
    newErrors.productNoticeCustomerService = "고객센터를 입력해주세요.";
  }

  return newErrors;
};
