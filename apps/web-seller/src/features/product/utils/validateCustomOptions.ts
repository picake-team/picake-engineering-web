import {
  CustomOptionType,
  EnableStatus,
  type CustomOptionDto,
} from "@/apps/web-seller/features/product/types/product.dto";
import {
  CUSTOM_OPTION_LIMITS,
  RESERVED_CUSTOM_OPTION_NAMES,
} from "@/apps/web-seller/features/product/constants/product.constant";

const isSelectType = (type: CustomOptionType) =>
  type === CustomOptionType.SINGLE_SELECT || type === CustomOptionType.MULTI_SELECT;

/**
 * 추가 옵션 1개의 오류 문구 (없으면 undefined)
 * 백엔드 normalizeCustomOptionsForSave와 같은 규칙입니다.
 */
function getOptionError(option: CustomOptionDto, sameNameCount: number): string | undefined {
  const name = option.name.trim();
  if (!name) return "옵션명을 입력해주세요.";
  if ((RESERVED_CUSTOM_OPTION_NAMES as readonly string[]).includes(name)) {
    return `'${name}'은(는) 위 케이크 옵션에서 설정해주세요.`;
  }
  if (sameNameCount > 1) return "같은 이름의 옵션이 있습니다.";

  if (isSelectType(option.type)) {
    const choices = option.choices ?? [];
    if (choices.length === 0) return "옵션값을 1개 이상 추가해주세요.";
    if (choices.some((choice) => !choice.label.trim())) return "비어 있는 옵션값이 있습니다.";
    const labels = choices.map((choice) => choice.label.trim());
    if (new Set(labels).size !== labels.length) return "같은 이름의 옵션값이 있습니다.";
    if (
      choices.some(
        (choice) =>
          !Number.isInteger(choice.price) ||
          choice.price < 0 ||
          choice.price > CUSTOM_OPTION_LIMITS.MAX_CHOICE_PRICE,
      )
    ) {
      return `옵션가는 0원 ~ ${CUSTOM_OPTION_LIMITS.MAX_CHOICE_PRICE.toLocaleString()}원 사이로 입력해주세요.`;
    }
    const hasVisibleChoice = choices.some((choice) => choice.visible === EnableStatus.ENABLE);
    if (option.required && option.visible === EnableStatus.ENABLE && !hasVisibleChoice) {
      return "필수 옵션인데 노출된 옵션값이 없어요. 이대로면 아무도 주문할 수 없어요.";
    }
    if (option.type === CustomOptionType.MULTI_SELECT && option.maxSelect !== undefined) {
      if (option.maxSelect < 1) return "최대 선택 개수는 1개 이상이어야 합니다.";
      if (option.maxSelect > choices.length) {
        return "최대 선택 개수가 옵션값 개수보다 많습니다.";
      }
    }
  }

  if (option.type === CustomOptionType.TEXT) {
    if (
      option.maxLength === undefined ||
      option.maxLength < 1 ||
      option.maxLength > CUSTOM_OPTION_LIMITS.MAX_TEXT_LENGTH
    ) {
      return `최대 글자 수는 1 ~ ${CUSTOM_OPTION_LIMITS.MAX_TEXT_LENGTH}자 사이로 입력해주세요.`;
    }
  }

  if (option.type === CustomOptionType.IMAGE) {
    if (
      option.maxCount === undefined ||
      option.maxCount < 1 ||
      option.maxCount > CUSTOM_OPTION_LIMITS.MAX_IMAGE_COUNT
    ) {
      return `최대 사진 수는 1 ~ ${CUSTOM_OPTION_LIMITS.MAX_IMAGE_COUNT}장 사이로 선택해주세요.`;
    }
  }

  return undefined;
}

/** 옵션별 오류 문구 (인덱스 순서, 오류 없으면 undefined) */
export function getCustomOptionErrors(options: CustomOptionDto[]): (string | undefined)[] {
  const nameCounts = new Map<string, number>();
  for (const option of options) {
    const name = option.name.trim();
    if (name) nameCounts.set(name, (nameCounts.get(name) ?? 0) + 1);
  }
  return options.map((option) => getOptionError(option, nameCounts.get(option.name.trim()) ?? 0));
}

/** 추가 옵션 전체에 대한 오류 문구 (폼 errors.customOptions에 넣는 값) */
export function getCustomOptionsError(options: CustomOptionDto[]): string | undefined {
  if (options.length > CUSTOM_OPTION_LIMITS.MAX_OPTIONS) {
    return `추가 옵션은 최대 ${CUSTOM_OPTION_LIMITS.MAX_OPTIONS}개까지 등록할 수 있습니다.`;
  }
  const imageCount = options.filter((option) => option.type === CustomOptionType.IMAGE).length;
  if (imageCount > CUSTOM_OPTION_LIMITS.MAX_IMAGE_OPTIONS) {
    return `사진첨부형 옵션은 ${CUSTOM_OPTION_LIMITS.MAX_IMAGE_OPTIONS}개만 등록할 수 있습니다.`;
  }
  if (getCustomOptionErrors(options).some(Boolean)) {
    return "추가 옵션에 확인이 필요한 항목이 있습니다.";
  }
  return undefined;
}
