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
  CUSTOM_OPTION_PRESETS,
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
import { Card, CardContent } from "@/apps/web-seller/common/components/cards/Card";
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

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-1">추가 옵션</h2>
        <p className="text-sm text-muted-foreground mb-2">
          레터링 문구, 참고 사진, 초·포장처럼 구매자에게 받을 내용을 설정해요. 정한 순서대로 주문
          화면에 보여요.
        </p>
        <div className="border-t mb-6" />

        <div className="space-y-4">
          {/* 추가 버튼 */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium w-24">자주 쓰는 옵션</span>
              {CUSTOM_OPTION_PRESETS.map((preset) => {
                const option = preset.build();
                return (
                  <Button
                    key={preset.key}
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={cannotAdd(option.type)}
                    onClick={() => addOption(preset.build())}
                  >
                    <Plus className="h-4 w-4" />
                    {preset.label}
                  </Button>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium w-24">직접 만들기</span>
              {CUSTOM_OPTION_TYPE_ORDER.map((type) => (
                <Button
                  key={type}
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={cannotAdd(type)}
                  title={CUSTOM_OPTION_TYPE_META[type].description}
                  onClick={() => addOption(createEmptyCustomOption(type))}
                >
                  <Plus className="h-4 w-4" />
                  {CUSTOM_OPTION_TYPE_META[type].label}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              최대 {CUSTOM_OPTION_LIMITS.MAX_OPTIONS}개 · 사진첨부형은{" "}
              {CUSTOM_OPTION_LIMITS.MAX_IMAGE_OPTIONS}개까지 · 이미 접수된 주문에는 영향이 없어요
              (주문 시점 옵션으로 저장됩니다)
            </p>
          </div>

          {/* 옵션 목록 */}
          {options.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              추가 옵션이 없습니다. 사이즈·맛만 고르는 상품이면 그대로 두셔도 돼요.
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
                        <p className="text-sm text-muted-foreground truncate">
                          {summarize(option)}
                        </p>
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
      </CardContent>
    </Card>
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
      <p className="text-xs text-muted-foreground">
        형식: {CUSTOM_OPTION_TYPE_META[option.type].label} —{" "}
        {CUSTOM_OPTION_TYPE_META[option.type].description}
      </p>

      {isSelectType(option.type) && (
        <div className="space-y-3">
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
          <p className="text-xs text-muted-foreground">
            잠시 팔지 않는 옵션값은 삭제하지 말고 &apos;숨김&apos;으로 바꿔 주세요.
          </p>
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
