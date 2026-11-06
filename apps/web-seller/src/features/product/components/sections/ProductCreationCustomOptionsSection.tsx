import React, { useState } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import {
  CustomOptionType,
  EnableStatus,
  type CustomOptionChoiceDto,
  type CustomOptionDto,
} from "@/apps/web-seller/features/product/types/product.dto";
import type { ProductForm } from "@/apps/web-seller/features/product/types/product.ui";
import {
  CUSTOM_OPTION_LIMITS,
  CUSTOM_OPTION_TYPE_META,
  CUSTOM_OPTION_TYPE_ORDER,
  VISIBILITY_STATUS_OPTIONS,
  createEmptyCustomOption,
} from "@/apps/web-seller/features/product/constants/product.constant";
import { getCustomOptionErrors } from "@/apps/web-seller/features/product/utils/validateCustomOptions";
import { BaseButton as Button } from "@/apps/web-seller/common/components/buttons/BaseButton";
import { BaseInput as Input } from "@/apps/web-seller/common/components/inputs/BaseInput";
import { NumberInput } from "@/apps/web-seller/common/components/inputs/NumberInput";
import { Checkbox } from "@/apps/web-seller/common/components/inputs/Checkbox";
import { Label } from "@/apps/web-seller/common/components/labels/Label";
import { Badge } from "@/apps/web-seller/common/components/badges/Badge";
import { FormSection } from "@/apps/web-seller/common/components/sections/FormSection";
import { useInMobileFrame } from "@/apps/web-seller/common/components/layouts/mobile-frame.context";
import { Icon } from "@/apps/web-seller/common/ui/icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/apps/web-seller/common/components/selects/Select";

export interface ProductCreationCustomOptionsSectionProps {
  form: ProductForm;
  errors: Partial<Record<keyof ProductForm, string>>;
  onCustomOptionsChange: (options: CustomOptionDto[]) => void;
  disabled?: boolean;
}

const isSelectType = (type: CustomOptionType) =>
  type === CustomOptionType.SINGLE_SELECT || type === CustomOptionType.MULTI_SELECT;

const formatPrice = (price: number) => (price > 0 ? ` +${price.toLocaleString()}원` : "");

/** 접힌 상태에서 보여줄 한 줄 요약 */
function summarize(option: CustomOptionDto): string {
  const typeLabel = CUSTOM_OPTION_TYPE_META[option.type].label;
  const requiredLabel = option.required ? "필수" : "선택";
  let detail = "";
  if (isSelectType(option.type)) {
    detail = (option.choices ?? [])
      .map((choice) => `${choice.label || "(이름 없음)"}${formatPrice(choice.price)}`)
      .join(" / ");
    if (option.type === CustomOptionType.MULTI_SELECT && option.maxSelect) {
      detail += ` · 최대 ${option.maxSelect}개`;
    }
  } else if (option.type === CustomOptionType.TEXT) {
    detail = `최대 ${option.maxLength ?? "-"}자`;
  } else {
    detail = `최대 ${option.maxCount ?? "-"}장`;
  }
  return [typeLabel, detail, requiredLabel].filter(Boolean).join(" · ");
}

// 상품 등록 폼 - 추가 옵션 섹션 (기존 레터링·이미지 등록 설정을 대체)
export const ProductCreationCustomOptionsSection: React.FC<
  ProductCreationCustomOptionsSectionProps
> = ({ form, errors, onCustomOptionsChange, disabled = false }) => {
  const options = form.customOptions;
  // 펼쳐진 옵션 인덱스 (순서 변경·삭제 시 함께 갱신)
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [menuOpen, setMenuOpen] = useState(false);
  const optionErrors = errors.customOptions ? getCustomOptionErrors(options) : [];

  const isFull = options.length >= CUSTOM_OPTION_LIMITS.MAX_OPTIONS;
  const hasImageOption = options.some((option) => option.type === CustomOptionType.IMAGE);
  const cannotAdd = (type: CustomOptionType) =>
    disabled || isFull || (type === CustomOptionType.IMAGE && hasImageOption);

  const addOption = (option: CustomOptionDto) => {
    if (cannotAdd(option.type)) return;
    onCustomOptionsChange([...options, option]);
    setExpanded((prev) => new Set(prev).add(options.length));
  };

  const updateOption = (index: number, patch: Partial<CustomOptionDto>) => {
    onCustomOptionsChange(
      options.map((option, i) => (i === index ? { ...option, ...patch } : option)),
    );
  };

  const removeOption = (index: number) => {
    onCustomOptionsChange(options.filter((_, i) => i !== index));
    setExpanded(
      (prev) => new Set([...prev].filter((i) => i !== index).map((i) => (i > index ? i - 1 : i))),
    );
  };

  const moveOption = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= options.length) return;
    const next = [...options];
    [next[index], next[target]] = [next[target], next[index]];
    onCustomOptionsChange(next);
    setExpanded((prev) => {
      const swapped = new Set<number>();
      prev.forEach((i) => swapped.add(i === index ? target : i === target ? index : i));
      return swapped;
    });
  };

  const toggleExpanded = (index: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const updateChoices = (index: number, choices: CustomOptionChoiceDto[]) => {
    const option = options[index];
    const patch: Partial<CustomOptionDto> = { choices };
    // 옵션값을 지워 최대 선택 개수가 옵션값 수를 넘으면 함께 줄인다
    if (option.maxSelect !== undefined && option.maxSelect > choices.length) {
      patch.maxSelect = choices.length > 0 ? choices.length : undefined;
    }
    updateOption(index, patch);
  };

  const addMenu = (
    <div className="relative">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={disabled || isFull}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((v) => !v)}
      >
        <Plus className="h-4 w-4" />
        옵션 추가
      </Button>
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-10" aria-hidden onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-72 rounded-lg border bg-popover p-1 shadow-lg">
            {CUSTOM_OPTION_TYPE_ORDER.map((type) => (
              <button
                key={type}
                type="button"
                disabled={cannotAdd(type)}
                className="w-full rounded-md px-2 py-1.5 text-left hover:bg-muted disabled:opacity-40"
                onClick={() => {
                  addOption(createEmptyCustomOption(type));
                  setMenuOpen(false);
                }}
              >
                <span className="block text-sm">{CUSTOM_OPTION_TYPE_META[type].label}</span>
                <span className="block text-xs text-muted-foreground">
                  {CUSTOM_OPTION_TYPE_META[type].description}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );

  return (
    <FormSection
      id="section-custom"
      title="추가 옵션"
      hint="(선택)"
      action={addMenu}
      error={!!errors.customOptions}
    >
      <div className="space-y-4">
        {/* 옵션 목록 */}
        {options.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            추가 옵션이 없어요. 사이즈만 고르는 상품이면 그대로 두세요.
          </p>
        ) : (
          <ul className="space-y-3">
            {options.map((option, index) => {
              const isOpen = expanded.has(index);
              const error = optionErrors[index];
              return (
                <li
                  key={option.id ?? `new-${index}`}
                  className={`border rounded-md ${error ? "border-destructive" : ""}`}
                >
                  {/* 한 줄 요약 */}
                  <div className="flex items-center gap-2 px-3 py-2">
                    <div className="flex flex-col">
                      <button
                        type="button"
                        aria-label="위로 이동"
                        className="text-muted-foreground disabled:opacity-30"
                        disabled={disabled || index === 0}
                        onClick={() => moveOption(index, -1)}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="아래로 이동"
                        className="text-muted-foreground disabled:opacity-30"
                        disabled={disabled || index === options.length - 1}
                        onClick={() => moveOption(index, 1)}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">
                          {option.name.trim() || "(옵션명 없음)"}
                        </span>
                        {option.visible === EnableStatus.DISABLE && (
                          <Badge variant="secondary">숨김</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{summarize(option)}</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => toggleExpanded(index)}
                    >
                      {isOpen ? "접기" : "수정"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="옵션 삭제"
                      className="h-8 w-8"
                      disabled={disabled}
                      onClick={() => removeOption(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  {error && <p className="px-3 pb-2 text-sm text-destructive">{error}</p>}

                  {/* 세부 설정 */}
                  {isOpen && (
                    <CustomOptionEditor
                      option={option}
                      disabled={disabled}
                      onChange={(patch) => updateOption(index, patch)}
                      onChoicesChange={(choices) => updateChoices(index, choices)}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {errors.customOptions && !optionErrors.some(Boolean) && (
          <p className="text-sm text-destructive">{errors.customOptions}</p>
        )}
      </div>
    </FormSection>
  );
};

interface CustomOptionEditorProps {
  option: CustomOptionDto;
  disabled: boolean;
  onChange: (patch: Partial<CustomOptionDto>) => void;
  onChoicesChange: (choices: CustomOptionChoiceDto[]) => void;
}

/** 옵션 1개의 세부 설정 (펼쳤을 때) */
function CustomOptionEditor({
  option,
  disabled,
  onChange,
  onChoicesChange,
}: CustomOptionEditorProps) {
  const choices = option.choices ?? [];

  const inFrame = useInMobileFrame();
  const updateChoice = (index: number, patch: Partial<CustomOptionChoiceDto>) => {
    onChoicesChange(choices.map((choice, i) => (i === index ? { ...choice, ...patch } : choice)));
  };

  return (
    <div className="border-t px-4 py-4 space-y-4 bg-muted/30">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-4 items-end">
        <div>
          <Label className="after:content-['*'] after:ml-0.5 after:text-destructive">옵션명</Label>
          <Input
            value={option.name}
            maxLength={CUSTOM_OPTION_LIMITS.MAX_NAME_LENGTH}
            placeholder="예: 초 추가"
            disabled={disabled}
            onChange={(e) => onChange({ name: e.target.value })}
          />
        </div>
        <div className="w-32">
          <Label>노출 여부</Label>
          <Select
            value={option.visible}
            onValueChange={(value) => onChange({ visible: value as EnableStatus })}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VISIBILITY_STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Checkbox
          checked={option.required}
          onChange={(checked) => onChange({ required: checked })}
          disabled={disabled}
          label="필수 옵션"
          className="h-9"
        />
      </div>
      {isSelectType(option.type) && (
        <div className="space-y-3">
          {inFrame ? (
            // 휴대폰 폭: 표 대신 옵션값마다 [이름 | 추가금 | ×] + 노출 여부 두 줄(디자인 6-G)
            <div className="flex flex-col gap-2">
              {choices.map((choice, index) => (
                <div
                  key={choice.id ?? `new-${index}`}
                  className="flex flex-col gap-2 rounded-control border border-ink-100 p-3"
                >
                  <div className="flex items-end gap-2">
                    <label className="flex min-w-0 flex-[2] flex-col gap-1">
                      <span className="text-caption text-ink-600">옵션값 {index + 1}</span>
                      <Input
                        value={choice.label}
                        maxLength={CUSTOM_OPTION_LIMITS.MAX_CHOICE_LABEL_LENGTH}
                        placeholder="예: 큰초"
                        disabled={disabled}
                        onChange={(e) => updateChoice(index, { label: e.target.value })}
                      />
                    </label>
                    <label className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="text-caption text-ink-600">추가금(원)</span>
                      <NumberInput
                        value={choice.price}
                        min={0}
                        max={CUSTOM_OPTION_LIMITS.MAX_CHOICE_PRICE}
                        placeholder="0"
                        disabled={disabled}
                        onChange={(value) => updateChoice(index, { price: value ?? 0 })}
                      />
                    </label>
                    <button
                      type="button"
                      aria-label={`옵션값 ${index + 1} 삭제`}
                      disabled={disabled}
                      onClick={() => onChoicesChange(choices.filter((_, i) => i !== index))}
                      className="relative mb-1.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-700 before:absolute before:-inset-1 before:content-[''] disabled:opacity-40"
                    >
                      <Icon name="close" size={16} strokeWidth={2} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sub text-ink-700">노출 여부</span>
                    <Select
                      value={choice.visible}
                      onValueChange={(value) =>
                        updateChoice(index, { visible: value as EnableStatus })
                      }
                      disabled={disabled}
                    >
                      <SelectTrigger className="h-10 w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {VISIBILITY_STATUS_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border rounded-md overflow-hidden bg-background">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-3 py-2 text-left text-sm font-medium">
                      옵션값 <span className="text-destructive">*</span>
                    </th>
                    <th className="px-3 py-2 text-left text-sm font-medium w-40">옵션가 (원)</th>
                    <th className="px-3 py-2 text-left text-sm font-medium w-32">노출 여부</th>
                    <th className="px-3 py-2 text-center text-sm font-medium w-16">삭제</th>
                  </tr>
                </thead>
                <tbody>
                  {choices.map((choice, index) => (
                    <tr key={choice.id ?? `new-${index}`} className="border-t">
                      <td className="px-3 py-2">
                        <Input
                          value={choice.label}
                          maxLength={CUSTOM_OPTION_LIMITS.MAX_CHOICE_LABEL_LENGTH}
                          placeholder="예: 큰초"
                          disabled={disabled}
                          onChange={(e) => updateChoice(index, { label: e.target.value })}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <NumberInput
                          value={choice.price}
                          min={0}
                          max={CUSTOM_OPTION_LIMITS.MAX_CHOICE_PRICE}
                          placeholder="0"
                          disabled={disabled}
                          onChange={(value) => updateChoice(index, { price: value ?? 0 })}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Select
                          value={choice.visible}
                          onValueChange={(value) =>
                            updateChoice(index, { visible: value as EnableStatus })
                          }
                          disabled={disabled}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {VISIBILITY_STATUS_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label="옵션값 삭제"
                          className="h-8 w-8"
                          disabled={disabled}
                          onClick={() => onChoicesChange(choices.filter((_, i) => i !== index))}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || choices.length >= CUSTOM_OPTION_LIMITS.MAX_CHOICES}
              onClick={() =>
                onChoicesChange([...choices, { label: "", price: 0, visible: EnableStatus.ENABLE }])
              }
            >
              <Plus className="h-4 w-4" />
              옵션값 추가
            </Button>
            {option.type === CustomOptionType.MULTI_SELECT && (
              <div className="flex items-center gap-2">
                <Label className="whitespace-nowrap">최대 선택 개수</Label>
                <NumberInput
                  value={option.maxSelect}
                  min={1}
                  max={choices.length || undefined}
                  placeholder="제한 없음"
                  className="w-28"
                  disabled={disabled}
                  onChange={(value) => onChange({ maxSelect: value })}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {option.type === CustomOptionType.TEXT && (
        <div className="grid grid-cols-1 md:grid-cols-[10rem_1fr] gap-4">
          <div>
            <Label className="after:content-['*'] after:ml-0.5 after:text-destructive">
              최대 글자 수
            </Label>
            <NumberInput
              value={option.maxLength}
              min={1}
              max={CUSTOM_OPTION_LIMITS.MAX_TEXT_LENGTH}
              placeholder="예: 10"
              disabled={disabled}
              onChange={(value) => onChange({ maxLength: value })}
            />
          </div>
          <div>
            <Label>입력 안내 문구</Label>
            <Input
              value={option.placeholder ?? ""}
              maxLength={CUSTOM_OPTION_LIMITS.MAX_PLACEHOLDER_LENGTH}
              placeholder="예: 케이크에 들어갈 문구를 적어주세요."
              disabled={disabled}
              onChange={(e) => onChange({ placeholder: e.target.value || undefined })}
            />
          </div>
        </div>
      )}

      {option.type === CustomOptionType.IMAGE && (
        <div className="w-40">
          <Label className="after:content-['*'] after:ml-0.5 after:text-destructive">
            최대 사진 수
          </Label>
          <Select
            value={String(option.maxCount ?? CUSTOM_OPTION_LIMITS.MAX_IMAGE_COUNT)}
            onValueChange={(value) => onChange({ maxCount: Number(value) })}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: CUSTOM_OPTION_LIMITS.MAX_IMAGE_COUNT }, (_, i) => i + 1).map(
                (count) => (
                  <SelectItem key={count} value={String(count)}>
                    {count}장
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
