import { EnableStatus } from "@/apps/web-seller/features/product/types/product.dto";
import {
  REQUIRED_PRODUCT_NOTICE_KEYS,
  type ProductNoticeKey,
} from "@/apps/web-seller/features/product/utils/product-notice.util";
import type { ProductForm } from "@/apps/web-seller/features/product/types/product.ui";
import { getCustomOptionsError } from "@/apps/web-seller/features/product/utils/validateCustomOptions";

/** 고시 항목이 비었을 때 문구 */
const PRODUCT_NOTICE_REQUIRED_MESSAGES: Record<ProductNoticeKey, string> = {
  productNoticeFoodType: "식품의 유형을 입력해주세요.",
  productNoticeProducer: "제조사를 입력해주세요.",
  productNoticeOrigin: "원산지를 입력해주세요.",
  productNoticeAddress: "소재지를 입력해주세요.",
  productNoticeManufactureDate: "제조연월일을 입력해주세요.",
  productNoticeExpirationDate: "소비기한 또는 품질유지기한을 입력해주세요.",
  productNoticePackageCapacity: "포장단위별 용량/수량을 입력해주세요.",
  productNoticePackageQuantity: "포장 단위별 수량을 입력해주세요.",
  productNoticeIngredients: "원재료명 및 함량을 입력해주세요.",
  productNoticeCalories: "영양성분을 입력해주세요.",
  productNoticeSafetyNotice: "소비자안전을 위한 주의사항을 입력해주세요.",
  productNoticeGmoNotice: "유전자변형식품에 해당하는 경우의 표시를 입력해주세요.",
  productNoticeImportNotice: "수입식품의 경우를 입력해주세요.",
  productNoticeCustomerService: "고객센터를 입력해주세요.",
};

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
    newErrors.salePrice = "판매가는 정가보다 클 수 없어요.";
  }

  if (!form.productType) {
    newErrors.productType = "상품 유형을 선택해주세요.";
  }

  if (!form.cakeSizeOptions?.some((option) => option.visible === EnableStatus.ENABLE)) {
    newErrors.cakeSizeOptions = "노출 중인 사이즈를 1개 이상 등록해주세요.";
  }

  // 같은 사이즈를 두 번 넣으면 손님 화면에 같은 이름이 두 개 보인다
  const sizeNames = (form.cakeSizeOptions ?? []).map((option) => option.displayName);
  const duplicateSize = sizeNames.find((name, i) => sizeNames.indexOf(name) !== i);
  if (!newErrors.cakeSizeOptions && duplicateSize) {
    newErrors.cakeSizeOptions = `같은 사이즈(${duplicateSize})가 두 번 있어요. 하나만 남겨 주세요.`;
  }

  const customOptionsError = getCustomOptionsError(form.customOptions ?? []);
  if (customOptionsError) {
    newErrors.customOptions = customOptionsError;
  }

  // 고시: 지금 받는 항목만 검사 (REQUIRED_PRODUCT_NOTICE_KEYS, 법 검토로 원산지만)
  for (const key of REQUIRED_PRODUCT_NOTICE_KEYS) {
    if (!form[key]?.trim()) newErrors[key] = PRODUCT_NOTICE_REQUIRED_MESSAGES[key];
  }

  return newErrors;
};
