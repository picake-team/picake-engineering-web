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
 * 카테고리 묶음(2026-11-15, 질문 하나에 묶음 하나 — 손님 필터·서버와 같은 순서). 상황 / 디자인(하트·2단 포함) / 서비스.
 * 손님이 필터에서 묶음 안은 "또는", 묶음끼리는 "그리고"로 거른다(생일 + 캐릭터 = 생일 캐릭터 케이크).
 * 레터링도 사장님이 고른다(10-27~11-15에는 상품 유형을 따라 서버가 "커스텀"으로 넣던 값). 크기는 사이즈에서 정한다
 */
export const PRODUCT_CATEGORY_GROUPS: readonly {
  label: string;
  /** 묶음 이름 아래 한 줄 질문 */
  help?: string;
  options: readonly { value: ProductCategoryType; label: string; hint?: string }[];
}[] = [
  {
    label: "상황",
    help: "어떤 날, 누구에게 주기 좋나요?",
    options: [
      { value: ProductCategoryType.BIRTHDAY, label: "생일" },
      { value: ProductCategoryType.COUPLE, label: "연인·기념일" },
      { value: ProductCategoryType.THANKS, label: "부모님·감사" },
      { value: ProductCategoryType.BABY, label: "백일·돌" },
      { value: ProductCategoryType.CONGRATS, label: "축하", hint: "합격·승진·전역" },
      { value: ProductCategoryType.WEDDING, label: "결혼·프로포즈" },
      { value: ProductCategoryType.SEASON, label: "시즌", hint: "크리스마스 등" },
    ],
  },
  {
    label: "디자인",
    help: "케이크를 어떻게 꾸몄나요?",
    options: [
      { value: ProductCategoryType.LETTERING, label: "레터링" },
      { value: ProductCategoryType.DRAWING, label: "드로잉" },
      { value: ProductCategoryType.PHOTO, label: "사진" },
      { value: ProductCategoryType.CHARACTER, label: "캐릭터" },
      { value: ProductCategoryType.FLOWER, label: "꽃" },
      { value: ProductCategoryType.RIBBON, label: "리본" },
      { value: ProductCategoryType.FRUIT, label: "과일" },
      { value: ProductCategoryType.HEART, label: "하트" },
      { value: ProductCategoryType.TWO_TIER, label: "2단" },
      { value: ProductCategoryType.SIMPLE, label: "심플" },
    ],
  },
  {
    label: "서비스",
    help: "주문한 날 바로 가져갈 수 있나요?",
    options: [{ value: ProductCategoryType.SAME_DAY_PICKUP, label: "당일픽업" }],
  },
];

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

/** 사이즈와 겹쳐 구매자가 헷갈리는 추가 옵션명. 맛은 추가 옵션 "맛"(하나 고르기)으로 받는다 */
export const RESERVED_CUSTOM_OPTION_NAMES = ["사이즈"] as const;

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
