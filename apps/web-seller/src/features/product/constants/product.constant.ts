import {
  EnableStatus,
  CakeSizeDisplayName,
  CustomOptionType,
  ProductCategoryType,
  ProductType,
  type CustomOptionDto,
} from "@/apps/web-seller/features/product/types/product.dto";

export const SALES_STATUS_OPTIONS = [
  { value: EnableStatus.ENABLE, label: "판매중" },
  { value: EnableStatus.DISABLE, label: "판매중지" },
] as const;

export const VISIBILITY_STATUS_OPTIONS = [
  { value: EnableStatus.ENABLE, label: "노출" },
  { value: EnableStatus.DISABLE, label: "숨김" },
] as const;

export const ENABLE_DISABLE_OPTIONS = [
  { value: EnableStatus.ENABLE, label: "사용" },
  { value: EnableStatus.DISABLE, label: "미사용" },
] as const;

/** 상품 유형 (스토어 상세 기본/커스텀 탭 분류) */
export const PRODUCT_TYPE_OPTIONS = [
  { value: ProductType.BASIC_CAKE, label: "기본 케이크" },
  { value: ProductType.CUSTOM_CAKE, label: "커스텀 케이크" },
] as const;

/**
 * 카테고리 타입 그룹별 옵션 (UI: [대상별], [서비스], [디자인])
 * '커스텀'(LETTERING)은 상품 유형을 따라 서버가 자동으로 넣고 빼므로 선택지에서 제외
 */
export const PRODUCT_CATEGORY_GROUPS = [
  {
    label: "대상별",
    options: [
      { value: ProductCategoryType.BIRTHDAY, label: "생일" },
      { value: ProductCategoryType.LOVER, label: "연인" },
      { value: ProductCategoryType.FRIEND, label: "친구" },
      { value: ProductCategoryType.FAMILY, label: "가족" },
      { value: ProductCategoryType.ANNIVERSARY, label: "기념일" },
    ],
  },
  {
    label: "서비스",
    options: [{ value: ProductCategoryType.SAME_DAY_PICKUP, label: "당일픽업" }],
  },
  {
    label: "디자인",
    options: [
      { value: ProductCategoryType.CHARACTER, label: "캐릭터" },
      { value: ProductCategoryType.SIMPLE, label: "심플" },
      { value: ProductCategoryType.FLOWER, label: "꽃" },
      { value: ProductCategoryType.PHOTO, label: "사진" },
    ],
  },
] as const;

// 케이크 사이즈 표시명 드롭다운 옵션
export const CAKE_SIZE_DISPLAY_NAME_OPTIONS = [
  { value: CakeSizeDisplayName.DOSIRAK, label: "도시락" },
  { value: CakeSizeDisplayName.MINI, label: "미니" },
  { value: CakeSizeDisplayName.SIZE_1, label: "1호" },
  { value: CakeSizeDisplayName.SIZE_2, label: "2호" },
  { value: CakeSizeDisplayName.SIZE_3, label: "3호" },
] as const;

/** 추가 옵션 설정 상한 (백엔드 CUSTOM_OPTION_LIMITS와 동일하게 유지) */
export const CUSTOM_OPTION_LIMITS = {
  MAX_OPTIONS: 10,
  MAX_CHOICES: 20,
  MAX_NAME_LENGTH: 20,
  MAX_CHOICE_LABEL_LENGTH: 30,
  MAX_CHOICE_PRICE: 1_000_000,
  MAX_TEXT_LENGTH: 100,
  MAX_PLACEHOLDER_LENGTH: 50,
  MAX_IMAGE_COUNT: 3,
  MAX_IMAGE_OPTIONS: 1,
} as const;

/** 사이즈·맛과 겹쳐 구매자가 헷갈리는 추가 옵션명 */
export const RESERVED_CUSTOM_OPTION_NAMES = ["사이즈", "맛"] as const;

/** 추가 옵션 형식별 판매자 화면 이름·설명 */
export const CUSTOM_OPTION_TYPE_META: Record<
  CustomOptionType,
  { label: string; description: string }
> = {
  [CustomOptionType.SINGLE_SELECT]: {
    label: "하나 고르기",
    description: "손님이 목록에서 하나를 골라요 (예: 초 종류)",
  },
  [CustomOptionType.MULTI_SELECT]: {
    label: "여러 개 고르기",
    description: "손님이 여러 개를 골라요 (예: 토핑, 추가 구성)",
  },
  [CustomOptionType.TEXT]: {
    label: "글자 받기",
    description: "손님이 글자를 적어요 (예: 레터링 문구)",
  },
  [CustomOptionType.IMAGE]: {
    label: "사진 받기",
    description: "손님이 참고 사진을 올려요 (예: 원하는 디자인)",
  },
};

export const CUSTOM_OPTION_TYPE_ORDER = [
  CustomOptionType.SINGLE_SELECT,
  CustomOptionType.MULTI_SELECT,
  CustomOptionType.TEXT,
  CustomOptionType.IMAGE,
] as const;

/** 형식별 빈 옵션 (직접 만들기) */
export function createEmptyCustomOption(type: CustomOptionType): CustomOptionDto {
  const base = { type, name: "", required: false, visible: EnableStatus.ENABLE };
  switch (type) {
    case CustomOptionType.SINGLE_SELECT:
    case CustomOptionType.MULTI_SELECT:
      return {
        ...base,
        choices: [{ label: "", price: 0, visible: EnableStatus.ENABLE }],
      };
    case CustomOptionType.TEXT:
      return { ...base, maxLength: 20 };
    case CustomOptionType.IMAGE:
      return { ...base, maxCount: CUSTOM_OPTION_LIMITS.MAX_IMAGE_COUNT };
  }
}
