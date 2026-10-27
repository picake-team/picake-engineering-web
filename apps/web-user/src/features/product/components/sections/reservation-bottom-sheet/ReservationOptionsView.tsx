"use client";

import { RefObject, useEffect, useRef, useState } from "react";
import { DatePickerInput } from "@/apps/web-user/common/components/datepickers/DatePicker";
import { Select } from "@/apps/web-user/common/components/selectboxs/Select";
import { TextArea } from "@/apps/web-user/common/components/textareas/TextArea";
import {
  CakeFlavorOption,
  CakeSizeOption,
  CustomOption,
  CustomOptionType,
} from "@/apps/web-user/features/product/types/product.type";
import {
  hasSelectionValue,
  type OptionSelection,
  type OptionSelections,
} from "@/apps/web-user/features/product/utils/custom-option.util";
import { CustomOptionField } from "./CustomOptionField";
import type { OptionsFieldKey } from "./types";

interface ReservationOptionsViewProps {
  selectedDate: Date | null;
  /** 노출 중인 사이즈·맛·추가 옵션 */
  sizeOptions: CakeSizeOption[];
  flavorOptions: CakeFlavorOption[];
  customOptions: CustomOption[];
  selectedSizeId: string;
  setSelectedSizeId: (value: string) => void;
  selectedFlavorId: string;
  setSelectedFlavorId: (value: string) => void;
  selections: OptionSelections;
  onOptionChange: (optionId: string, selection: OptionSelection) => void;
  requestMessage: string;
  setRequestMessage: (value: string) => void;
  handleOpenCalendar: () => void;
  dateSelectionSignal: number;
  isAddingFromConfirm?: boolean;
  isEditingFromConfirm?: boolean;
  /** '선택완료'를 눌렀는데 비어 있는 필수 항목이 있을 때 오류 표시 */
  showValidationErrors?: boolean;
  firstInvalidField?: OptionsFieldKey | null;
  /** 값이 바뀔 때마다 firstInvalidField 위치로 스크롤 */
  invalidFieldSignal?: number;
  /** 픽업날짜 입력 영역을 숨김 (옵션 변경 시트 등 날짜 편집이 불필요한 경우) */
  hideDatePicker?: boolean;
}

const REQUIRED_OPTION_ERROR = "필수 옵션이에요.";

export function ReservationOptionsView({
  selectedDate,
  sizeOptions,
  flavorOptions,
  customOptions,
  selectedSizeId,
  setSelectedSizeId,
  selectedFlavorId,
  setSelectedFlavorId,
  selections,
  onOptionChange,
  requestMessage,
  setRequestMessage,
  handleOpenCalendar,
  dateSelectionSignal,
  isAddingFromConfirm,
  isEditingFromConfirm,
  showValidationErrors = false,
  firstInvalidField = null,
  invalidFieldSignal = 0,
  hideDatePicker = false,
}: ReservationOptionsViewProps) {
  const dateRef = useRef<HTMLDivElement>(null);
  const sizeRef = useRef<HTMLDivElement>(null);
  const flavorRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [sizeOpenSignal, setSizeOpenSignal] = useState(0);
  const [flavorOpenSignal, setFlavorOpenSignal] = useState(0);
  const prevSelectedSizeRef = useRef(selectedSizeId);
  const prevSelectedFlavorRef = useRef(selectedFlavorId);

  const scrollToRef = (ref: RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToOption = (option: CustomOption | undefined) => {
    if (!option) return;
    const element = optionRefs.current[option.id];
    element?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (option.type === CustomOptionType.TEXT) {
      element?.querySelector("textarea")?.focus();
    }
  };

  // 날짜 선택 → 사이즈 → 맛 → 첫 추가 옵션 순서로 다음 입력으로 안내
  useEffect(() => {
    if (dateSelectionSignal > 0 && !selectedSizeId) {
      scrollToRef(sizeRef);
      setSizeOpenSignal((prev) => prev + 1);
    }
  }, [dateSelectionSignal, selectedSizeId]);

  useEffect(() => {
    if (selectedSizeId && !prevSelectedSizeRef.current && !selectedFlavorId) {
      scrollToRef(flavorRef);
      setFlavorOpenSignal((prev) => prev + 1);
    }
    prevSelectedSizeRef.current = selectedSizeId;
  }, [selectedSizeId, selectedFlavorId]);

  useEffect(() => {
    if (selectedFlavorId && !prevSelectedFlavorRef.current) {
      scrollToOption(customOptions.find((option) => !selections[option.id]));
    }
    prevSelectedFlavorRef.current = selectedFlavorId;
    // 맛을 처음 고른 순간에만 동작 (selections 변경에는 반응하지 않음)
  }, [selectedFlavorId]);

  // '선택완료'에서 막혔을 때 처음 비어 있는 항목으로 이동
  useEffect(() => {
    if (!invalidFieldSignal || !firstInvalidField) return;
    if (firstInvalidField === "date") scrollToRef(dateRef);
    else if (firstInvalidField === "size") scrollToRef(sizeRef);
    else if (firstInvalidField === "flavor") scrollToRef(flavorRef);
    else {
      const optionId = firstInvalidField.slice("option:".length);
      scrollToOption(customOptions.find((option) => option.id === optionId));
    }
    // 신호가 바뀔 때만 이동
  }, [invalidFieldSignal]);

  // '선택완료'를 누른 뒤에는 비어 있는 필수 항목을 모두 표시하고, 채우면 바로 사라진다
  const errorIf = (isEmpty: boolean, message: string) =>
    showValidationErrors && isEmpty ? message : undefined;
  const dateError = errorIf(!selectedDate, "픽업 날짜를 선택해주세요.");
  const optionError = (option: CustomOption) =>
    showValidationErrors && option.required && !hasSelectionValue(option, selections[option.id])
      ? REQUIRED_OPTION_ERROR
      : undefined;

  return (
    <div className="px-[20px] py-[24px] flex flex-col gap-[24px]">
      {!hideDatePicker && (
        <div ref={dateRef}>
          <DatePickerInput
            value={selectedDate}
            label="픽업날짜 선택"
            placeholder="픽업할 날짜와 시간을 선택해주세요"
            onOpen={handleOpenCalendar}
            hint={
              isAddingFromConfirm || isEditingFromConfirm
                ? "*변경 시 주문하는 모든 상품의 픽업날짜도 함께 변경됩니다."
                : undefined
            }
          />
          {dateError && <p className="mt-[6px] text-xs text-red-400">{dateError}</p>}
        </div>
      )}
      <div ref={sizeRef}>
        <Select
          label="사이즈 선택"
          value={selectedSizeId}
          onChange={setSelectedSizeId}
          openSignal={sizeOpenSignal}
          error={errorIf(
            sizeOptions.length > 0 && !sizeOptions.some((size) => size.id === selectedSizeId),
            "사이즈를 선택해주세요.",
          )}
          options={[
            { value: "", label: "사이즈를 선택해주세요" },
            ...sizeOptions.map((size) => ({
              value: size.id,
              label: [size.displayName, size.description].filter(Boolean).join(" "),
              subLabel: size.price > 0 ? `+${size.price.toLocaleString()}원` : undefined,
            })),
          ]}
        />
      </div>
      <div ref={flavorRef}>
        <Select
          label="맛 선택"
          value={selectedFlavorId}
          onChange={setSelectedFlavorId}
          openSignal={flavorOpenSignal}
          error={errorIf(
            flavorOptions.length > 0 &&
              !flavorOptions.some((flavor) => flavor.id === selectedFlavorId),
            "맛을 선택해주세요.",
          )}
          options={[
            { value: "", label: "시트를 선택해주세요" },
            ...flavorOptions.map((flavor) => ({
              value: flavor.id,
              label: flavor.displayName,
              subLabel: flavor.price > 0 ? `+${flavor.price.toLocaleString()}원` : undefined,
            })),
          ]}
        />
      </div>
      {customOptions.map((option) => (
        <div
          key={option.id}
          ref={(element) => {
            optionRefs.current[option.id] = element;
          }}
        >
          <CustomOptionField
            option={option}
            selection={selections[option.id]}
            onChange={(selection) => onOptionChange(option.id, selection)}
            error={optionError(option)}
          />
        </div>
      ))}
      <TextArea
        label={
          <>
            요청사항 <span className="font-normal text-gray-300">(선택)</span>
          </>
        }
        value={requestMessage}
        onChange={setRequestMessage}
        placeholder="요청사항을 입력해주세요."
        maxLength={200}
        showCount
      />
    </div>
  );
}
