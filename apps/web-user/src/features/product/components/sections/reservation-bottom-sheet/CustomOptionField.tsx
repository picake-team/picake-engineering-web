"use client";

import { useEffect, useMemo, useRef } from "react";
import { Icon } from "@/apps/web-user/common/components/icons";
import { Select } from "@/apps/web-user/common/components/selectboxs/Select";
import { TextArea } from "@/apps/web-user/common/components/textareas/TextArea";
import { Checkbox } from "@/apps/web-user/common/components/inputs/Checkbox";
import {
  CustomOptionType,
  type CustomOption,
} from "@/apps/web-user/features/product/types/product.type";
import {
  getImageCount,
  type OptionSelection,
} from "@/apps/web-user/features/product/utils/custom-option.util";

interface CustomOptionFieldProps {
  option: CustomOption;
  selection: OptionSelection | undefined;
  onChange: (selection: OptionSelection) => void;
  /** 필수 옵션을 비워 둔 채 '선택완료'를 눌렀을 때 표시 */
  error?: string;
}

const formatPrice = (price: number) => (price > 0 ? `+${price.toLocaleString()}원` : undefined);

const OptionalMark = () => <span className="font-normal text-gray-300">(선택)</span>;

/**
 * 판매자가 등록한 추가 옵션 1개를 형식에 맞게 그립니다.
 * (선택형: 드롭다운, 다중선택형: 체크박스, 직접입력형: 글자 입력, 사진첨부형: 사진 업로드)
 */
export function CustomOptionField({ option, selection, onChange, error }: CustomOptionFieldProps) {
  const label = (
    <>
      {option.name} {!option.required && <OptionalMark />}
    </>
  );
  const errorText = error && <p className="mt-[6px] text-xs text-red-400">{error}</p>;

  if (option.type === CustomOptionType.SINGLE_SELECT) {
    const choices = option.choices ?? [];
    return (
      <Select
        label={option.name}
        optional={!option.required}
        value={selection?.choiceIds?.[0] ?? ""}
        onChange={(value) => onChange({ choiceIds: value ? [value] : [] })}
        error={error}
        options={[
          {
            value: "",
            label: option.required ? `${option.name}을(를) 선택해주세요` : "선택 안 함",
          },
          ...choices.map((choice) => ({
            value: choice.id,
            label: choice.label,
            subLabel: formatPrice(choice.price),
          })),
        ]}
      />
    );
  }

  if (option.type === CustomOptionType.MULTI_SELECT) {
    const choices = option.choices ?? [];
    const selected = selection?.choiceIds ?? [];
    const maxSelect = option.maxSelect ?? choices.length;
    const isFull = selected.length >= maxSelect;
    const toggle = (choiceId: string, checked: boolean) => {
      const next = checked
        ? [...selected, choiceId]
        : selected.filter((selectedId) => selectedId !== choiceId);
      onChange({ choiceIds: next });
    };

    return (
      <div role="group" aria-label={option.name}>
        <div className="block mb-[10px] text-sm font-bold text-gray-900">
          {label}
          {option.maxSelect && (
            <span className="ml-[4px] font-normal text-gray-400">최대 {option.maxSelect}개</span>
          )}
        </div>
        <div className="flex flex-col gap-[10px]">
          {choices.map((choice) => {
            const checked = selected.includes(choice.id);
            return (
              <Checkbox
                key={choice.id}
                checked={checked}
                disabled={!checked && isFull}
                onChange={(next) => toggle(choice.id, next)}
                label={
                  <span className="flex w-full justify-between text-sm text-gray-900">
                    <span>{choice.label}</span>
                    {formatPrice(choice.price) && (
                      <span className="text-gray-500">{formatPrice(choice.price)}</span>
                    )}
                  </span>
                }
                className="w-full"
              />
            );
          })}
        </div>
        {errorText}
      </div>
    );
  }

  if (option.type === CustomOptionType.TEXT) {
    return (
      <div>
        <TextArea
          label={label}
          aria-label={option.name}
          value={selection?.text ?? ""}
          onChange={(text) => onChange({ text })}
          placeholder={option.placeholder || "내용을 입력해주세요."}
          maxLength={option.maxLength}
          showCount
        />
        {errorText}
      </div>
    );
  }

  return (
    <ImageOptionField option={option} selection={selection} onChange={onChange} error={error} />
  );
}

/** 사진첨부형: 이미 올린 사진(URL)과 새로 고른 사진(File)을 함께 관리 */
function ImageOptionField({ option, selection, onChange, error }: CustomOptionFieldProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const maxCount = option.maxCount ?? 3;
  const existingUrls = selection?.imageUrls ?? [];
  const files = useMemo(() => selection?.imageFiles ?? [], [selection?.imageFiles]);
  const count = getImageCount(selection);

  const filePreviewUrls = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);
  useEffect(() => {
    return () => filePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
  }, [filePreviewUrls]);

  const previews = [
    ...existingUrls.map((url, index) => ({ url, remove: () => removeExisting(index) })),
    ...filePreviewUrls.map((url, index) => ({ url, remove: () => removeFile(index) })),
  ];

  const removeExisting = (index: number) =>
    onChange({ imageUrls: existingUrls.filter((_, i) => i !== index), imageFiles: files });
  const removeFile = (index: number) =>
    onChange({ imageUrls: existingUrls, imageFiles: files.filter((_, i) => i !== index) });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(event.target.files ?? []);
    event.target.value = "";
    const remaining = maxCount - count;
    if (!picked.length || remaining <= 0) return;
    onChange({ imageUrls: existingUrls, imageFiles: [...files, ...picked.slice(0, remaining)] });
  };

  return (
    <div className="flex flex-col gap-[6px]">
      <div className="block mb-[10px] text-sm font-bold text-gray-900">
        {option.name} {!option.required && <OptionalMark />}
      </div>
      <div className="flex gap-[6px] overflow-auto w-full">
        {count < maxCount && (
          <button
            type="button"
            aria-label={`${option.name} 업로드`}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center border border-dashed border-gray-200 rounded-lg h-[100px] ${
              count === 0 ? "w-full" : "w-[100px] shrink-0"
            }`}
          >
            <Icon name="addPhoto" width={24} height={24} className="mb-[4px] text-gray-300" />
            <div className="text-sm text-gray-300">
              {count === 0 ? "참고할 사진을 업로드해주세요" : "사진 업로드"}
              <br />({count}/{maxCount})
            </div>
          </button>
        )}
        {previews.map((preview, index) => (
          <div
            key={`${preview.url}-${index}`}
            className="relative h-[100px] w-[100px] rounded-lg shrink-0 border border-gray-100"
          >
            <button
              type="button"
              aria-label="첨부 이미지 삭제"
              onClick={preview.remove}
              className="absolute right-[5px] top-[5px]"
            >
              <Icon name="removePhoto" width={20} height={20} />
            </button>
            <img
              src={preview.url}
              alt="업로드된 이미지 미리보기"
              className="h-full w-full rounded-lg object-cover"
            />
          </div>
        ))}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
