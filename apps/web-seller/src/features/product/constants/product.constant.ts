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
    label: "선택형",
    description: "구매자가 목록에서 1개를 고릅니다",
  },
  [CustomOptionType.MULTI_SELECT]: {
    label: "다중선택형",
    description: "구매자가 여러 개를 체크해서 고릅니다",
  },
  [CustomOptionType.TEXT]: {
    label: "직접입력형",
    description: "구매자가 글자를 직접 입력합니다",
  },
  [CustomOptionType.IMAGE]: {
    label: "사진첨부형",
    description: "구매자가 참고 사진을 첨부합니다",
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

/** 자주 쓰는 옵션 (한 번 클릭으로 추가) */
export const CUSTOM_OPTION_PRESETS: { key: string; label: string; build: () => CustomOptionDto }[] =
  [
    {
      key: "lettering",
      label: "레터링 문구",
      build: () => ({
        type: CustomOptionType.TEXT,
        name: "레터링 문구",
        required: true,
        visible: EnableStatus.ENABLE,
        maxLength: 10,
        placeholder: "케이크에 들어갈 문구를 적어주세요.",
      }),
    },
    {
      key: "reference-photo",
      label: "참고 사진",
      build: () => ({
        type: CustomOptionType.IMAGE,
        name: "참고사진",
        required: false,
        visible: EnableStatus.ENABLE,
        maxCount: CUSTOM_OPTION_LIMITS.MAX_IMAGE_COUNT,
      }),
    },
    {
      key: "candle",
      label: "초 추가",
      build: () => ({
        type: CustomOptionType.SINGLE_SELECT,
        name: "초 추가",
        required: false,
        visible: EnableStatus.ENABLE,
        // 선택 옵션은 구매자 화면에 '선택 안 함'이 기본으로 있어 '없음' 옵션값은 넣지 않는다
        choices: [
          { label: "숫자초", price: 1000, visible: EnableStatus.ENABLE },
          { label: "긴초", price: 1000, visible: EnableStatus.ENABLE },
        ],
      }),
    },
    {
      key: "packaging",
      label: "포장",
      build: () => ({
        type: CustomOptionType.SINGLE_SELECT,
        name: "포장",
        required: false,
        visible: EnableStatus.ENABLE,
        choices: [
          { label: "기본 포장", price: 0, visible: EnableStatus.ENABLE },
          { label: "선물 포장", price: 3000, visible: EnableStatus.ENABLE },
        ],
      }),
    },
  ];
