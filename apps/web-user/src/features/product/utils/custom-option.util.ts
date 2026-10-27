import {
  CustomOptionType,
  VisibleStatus,
  type CustomOption,
} from "@/apps/web-user/features/product/types/product.type";
import type {
  OrderItemOptionInput,
  SelectedOption,
} from "@/apps/web-user/features/order/types/order.type";

/**
 * 추가 옵션 1개에 대한 구매자 선택값
 * - 선택형·다중선택형: choiceIds
 * - 직접입력형: text
 * - 사진첨부형: 새로 고른 파일(imageFiles) + 이미 업로드된 URL(imageUrls, 옵션 변경 시 기존 사진)
 */
export interface OptionSelection {
  choiceIds?: string[];
  text?: string;
  imageFiles?: File[];
  imageUrls?: string[];
}

/** 옵션 ID → 선택값 */
export type OptionSelections = Record<string, OptionSelection>;

const isSelectType = (type: CustomOptionType) =>
  type === CustomOptionType.SINGLE_SELECT || type === CustomOptionType.MULTI_SELECT;

/** 구매자에게 보여줄 옵션 (서버가 걸러 주지만 한 번 더 숨김 제외) */
export function getVisibleCustomOptions(options: CustomOption[] | undefined): CustomOption[] {
  return (options ?? [])
    .filter((option) => option.visible === VisibleStatus.ENABLE)
    .map((option) =>
      option.choices
        ? {
            ...option,
            choices: option.choices.filter((choice) => choice.visible === VisibleStatus.ENABLE),
          }
        : option,
    );
}

/** 사진첨부형 선택값의 사진 수 (기존 URL + 새 파일) */
export function getImageCount(selection: OptionSelection | undefined): number {
  return (selection?.imageUrls?.length ?? 0) + (selection?.imageFiles?.length ?? 0);
}

/** 선택값이 비어 있지 않은지 (서버와 같은 기준: 공백 문구는 비어 있음) */
export function hasSelectionValue(option: CustomOption, selection: OptionSelection | undefined) {
  if (!selection) return false;
  if (isSelectType(option.type)) return (selection.choiceIds?.length ?? 0) > 0;
  if (option.type === CustomOptionType.TEXT) return (selection.text?.trim() ?? "") !== "";
  return getImageCount(selection) > 0;
}

/** 아직 채우지 않은 첫 필수 옵션 (없으면 undefined) */
export function findMissingRequiredOption(
  options: CustomOption[],
  selections: OptionSelections,
): CustomOption | undefined {
  return options.find(
    (option) => option.required && !hasSelectionValue(option, selections[option.id]),
  );
}

/** 추가 옵션 금액 합계 (1개 기준). 서버 normalizeSelectedOptions와 같은 계산입니다. */
export function calculateOptionsPrice(
  options: CustomOption[],
  selections: OptionSelections,
): number {
  return options.reduce((sum, option) => {
    if (!isSelectType(option.type)) return sum;
    const selected = new Set(selections[option.id]?.choiceIds ?? []);
    return (
      sum +
      (option.choices ?? [])
        .filter((choice) => selected.has(choice.id))
        .reduce((choiceSum, choice) => choiceSum + choice.price, 0)
    );
  }, 0);
}

/** 항목 1개 가격 = 판매가 + 사이즈 + 맛 + 추가 옵션 (서버 itemPrice와 같은 계산) */
export function calculateItemPrice(params: {
  basePrice: number;
  sizePrice?: number;
  flavorPrice?: number;
  optionsPrice?: number;
}): number {
  return (
    params.basePrice +
    (params.sizePrice ?? 0) +
    (params.flavorPrice ?? 0) +
    (params.optionsPrice ?? 0)
  );
}

/**
 * 주문 API 요청용 옵션 입력으로 변환합니다. 비어 있는 선택값은 보내지 않습니다.
 * @param uploadedImageUrls 옵션 ID → 새로 업로드한 사진 URL (기존 imageUrls 뒤에 붙음)
 */
export function toOrderItemOptionInputs(
  options: CustomOption[],
  selections: OptionSelections,
  uploadedImageUrls: Record<string, string[]> = {},
): OrderItemOptionInput[] {
  const inputs: OrderItemOptionInput[] = [];
  for (const option of options) {
    const selection = selections[option.id];
    if (isSelectType(option.type)) {
      const validIds = new Set((option.choices ?? []).map((choice) => choice.id));
      const choiceIds = (selection?.choiceIds ?? []).filter((id) => validIds.has(id));
      if (choiceIds.length > 0) inputs.push({ optionId: option.id, choiceIds });
    } else if (option.type === CustomOptionType.TEXT) {
      const text = selection?.text?.trim();
      if (text) inputs.push({ optionId: option.id, text });
    } else {
      const imageUrls = [...(selection?.imageUrls ?? []), ...(uploadedImageUrls[option.id] ?? [])];
      if (imageUrls.length > 0) inputs.push({ optionId: option.id, imageUrls });
    }
  }
  return inputs;
}

/**
 * 주문 전(확인 화면) 표시용: 현재 선택값을 주문 스냅샷과 같은 모양으로 만듭니다.
 * 사진은 미리보기 URL을 넘겨받아 imageUrls에 넣습니다.
 */
export function toSelectedOptionPreviews(
  options: CustomOption[],
  selections: OptionSelections,
  previewUrls: Record<string, string[]> = {},
): SelectedOption[] {
  const previews: SelectedOption[] = [];
  for (const option of options) {
    const selection = selections[option.id];
    if (!hasSelectionValue(option, selection)) continue;
    const base = { optionId: option.id, type: option.type, name: option.name };
    if (isSelectType(option.type)) {
      const selected = new Set(selection?.choiceIds ?? []);
      const choices = (option.choices ?? [])
        .filter((choice) => selected.has(choice.id))
        .map(({ id, label, price }) => ({ id, label, price }));
      previews.push({
        ...base,
        choices,
        price: choices.reduce((sum, choice) => sum + choice.price, 0),
      });
    } else if (option.type === CustomOptionType.TEXT) {
      previews.push({ ...base, text: selection?.text?.trim(), price: 0 });
    } else {
      previews.push({
        ...base,
        imageUrls: [...(selection?.imageUrls ?? []), ...(previewUrls[option.id] ?? [])],
        price: 0,
      });
    }
  }
  return previews;
}

/** 주문 스냅샷 → 화면에 그대로 쓸 한 줄 값 (사진은 "사진 N장") */
export function formatSelectedOptionValue(option: SelectedOption): string {
  if (option.type === CustomOptionType.TEXT) return option.text ?? "";
  if (option.type === CustomOptionType.IMAGE) return `사진 ${option.imageUrls?.length ?? 0}장`;
  return (option.choices ?? []).map((choice) => choice.label).join(", ");
}

/** 주문 스냅샷 → 옵션 변경 화면의 초기 선택값 */
export function selectedOptionsToSelections(selectedOptions: SelectedOption[]): OptionSelections {
  const selections: OptionSelections = {};
  for (const option of selectedOptions) {
    if (isSelectType(option.type)) {
      selections[option.optionId] = { choiceIds: (option.choices ?? []).map((c) => c.id) };
    } else if (option.type === CustomOptionType.TEXT) {
      selections[option.optionId] = { text: option.text ?? "" };
    } else {
      selections[option.optionId] = { imageUrls: option.imageUrls ?? [] };
    }
  }
  return selections;
}

/** 주문 항목 대표 이미지가 없을 때 쓰는 첫 첨부 사진 */
export function getFirstOptionImageUrl(selectedOptions: SelectedOption[] | undefined) {
  return selectedOptions?.find((option) => (option.imageUrls?.length ?? 0) > 0)?.imageUrls?.[0];
}

/**
 * 주문 항목 한 줄 요약: "1호(+5,000원) / 초코(+0원) / 큰초(+1,000원)"
 * 사이즈·맛과 선택형 옵션값만 넣는다 (문구·사진은 길어서 상세에서만 표시)
 */
export function formatOrderItemSummary(item: {
  sizeDisplayName?: string;
  sizePrice?: number;
  flavorDisplayName?: string;
  flavorPrice?: number;
  selectedOptions?: SelectedOption[];
}): string {
  const withPrice = (label: string, price?: number) =>
    `${label}(+${(price ?? 0).toLocaleString()}원)`;
  const choiceLabels = (item.selectedOptions ?? []).flatMap((option) =>
    (option.choices ?? []).map((choice) => withPrice(choice.label, choice.price)),
  );
  return [
    item.sizeDisplayName && withPrice(item.sizeDisplayName, item.sizePrice),
    item.flavorDisplayName && withPrice(item.flavorDisplayName, item.flavorPrice),
    ...choiceLabels,
  ]
    .filter(Boolean)
    .join(" / ");
}
