import React, { useState, useEffect } from "react";
import {
  EnableStatus,
  CakeSizeOptionDto,
  CakeFlavorOptionDto,
  CakeSizeDisplayName,
} from "@/apps/web-seller/features/product/types/product.dto";
import type { ProductForm } from "@/apps/web-seller/features/product/types/product.ui";
import {
  CAKE_SIZE_DISPLAY_NAME_OPTIONS,
  VISIBILITY_STATUS_OPTIONS,
} from "@/apps/web-seller/features/product/constants/product.constant";
import { BaseButton as Button } from "@/apps/web-seller/common/components/buttons/BaseButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/apps/web-seller/common/components/selects/Select";
import { BaseInput as Input } from "@/apps/web-seller/common/components/inputs/BaseInput";
import { NumberInput } from "@/apps/web-seller/common/components/inputs/NumberInput";
import { Label } from "@/apps/web-seller/common/components/labels/Label";
import { Card, CardContent } from "@/apps/web-seller/common/components/cards/Card";
import { Trash2, Plus } from "lucide-react";

export interface ProductCreationCakeOptionsSectionProps {
  form: ProductForm;
  errors: Partial<Record<keyof ProductForm, string>>;
  onCakeSizeOptionsChange: (options: CakeSizeOptionDto[]) => void;
  onCakeFlavorOptionsChange: (options: CakeFlavorOptionDto[]) => void;
}

// 상품 등록 폼 - 케이크 옵션 섹션
export const ProductCreationCakeOptionsSection: React.FC<
  ProductCreationCakeOptionsSectionProps
> = ({ form, errors, onCakeSizeOptionsChange, onCakeFlavorOptionsChange }) => {
  const [sizeOptions, setSizeOptions] = useState<CakeSizeOptionDto[]>(form.cakeSizeOptions || []);
  const [flavorOptions, setFlavorOptions] = useState<CakeFlavorOptionDto[]>(
    form.cakeFlavorOptions || [],
  );

  // form 변경 시 state 동기화
  useEffect(() => {
    setSizeOptions(form.cakeSizeOptions || []);
    setFlavorOptions(form.cakeFlavorOptions || []);
  }, [form.cakeSizeOptions, form.cakeFlavorOptions]);

  // 사이즈 옵션 추가
  const handleAddSizeOption = () => {
    const newOption: CakeSizeOptionDto = {
      visible: EnableStatus.ENABLE,
      displayName: CakeSizeDisplayName.DOSIRAK,
      lengthCm: 0,
      price: 0,
      description: "",
    };
    const updated = [...sizeOptions, newOption];
    setSizeOptions(updated);
    onCakeSizeOptionsChange(updated);
  };

  // 사이즈 옵션 삭제
  const handleRemoveSizeOption = (index: number) => {
    const updated = sizeOptions.filter((_, i) => i !== index);
    setSizeOptions(updated);
    onCakeSizeOptionsChange(updated);
  };

  // 사이즈 옵션 변경
  const handleSizeOptionChange = (
    index: number,
    field: keyof CakeSizeOptionDto,
    value: string | EnableStatus | number | CakeSizeDisplayName,
  ) => {
    const updated = sizeOptions.map((option, i) =>
      i === index ? { ...option, [field]: value } : option,
    );
    setSizeOptions(updated);
    onCakeSizeOptionsChange(updated);
  };

  // 맛 옵션 추가
  const handleAddFlavorOption = () => {
    const newOption: CakeFlavorOptionDto = {
      visible: EnableStatus.ENABLE,
      displayName: "",
      price: 0,
    };
    const updated = [...flavorOptions, newOption];
    setFlavorOptions(updated);
    onCakeFlavorOptionsChange(updated);
  };

  // 맛 옵션 삭제
  const handleRemoveFlavorOption = (index: number) => {
    const updated = flavorOptions.filter((_, i) => i !== index);
    setFlavorOptions(updated);
    onCakeFlavorOptionsChange(updated);
  };

  // 맛 옵션 변경
  const handleFlavorOptionChange = (
    index: number,
    field: keyof CakeFlavorOptionDto,
    value: string | EnableStatus | number,
  ) => {
    const updated = flavorOptions.map((option, i) =>
      i === index ? { ...option, [field]: value } : option,
    );
    setFlavorOptions(updated);
    onCakeFlavorOptionsChange(updated);
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-2">케이크 옵션</h2>
        <div className="border-t mb-6" />

        <div className="space-y-8">
          {/* 사이즈 목록 */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <Label className="text-base font-medium">사이즈 목록</Label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddSizeOption}>
                <Plus className="h-4 w-4 mr-1" />
                추가
              </Button>
            </div>

            {errors.cakeSizeOptions && (
              <p className="text-sm text-destructive mb-2">{errors.cakeSizeOptions}</p>
            )}
            {sizeOptions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                사이즈 옵션이 없습니다. 추가 버튼을 클릭하여 추가하세요.
              </p>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">사용 여부</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        표시명 <span className="text-destructive">*</span>
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        길이 (cm) <span className="text-destructive">*</span>
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        가격 <span className="text-destructive">*</span>
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium">설명</th>
                      <th className="px-4 py-3 text-center text-sm font-medium w-20">삭제</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sizeOptions.map((option, index) => (
                      <tr key={index} className="border-t hover:bg-muted/50">
                        <td className="px-4 py-3">
                          <Select
                            value={option.visible}
                            onValueChange={(value) =>
                              handleSizeOptionChange(index, "visible", value as EnableStatus)
                            }
                          >
                            <SelectTrigger className="w-full">
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
                        <td className="px-4 py-3">
                          <Select
                            value={option.displayName}
                            onValueChange={(value) =>
                              handleSizeOptionChange(index, "displayName", value)
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="사이즈를 선택하세요" />
                            </SelectTrigger>
                            <SelectContent>
                              {CAKE_SIZE_DISPLAY_NAME_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <NumberInput
                              value={option.lengthCm}
                              onChange={(v) => handleSizeOptionChange(index, "lengthCm", v ?? 0)}
                              placeholder="예: 10"
                              min={0}
                              className="w-full"
                            />
                            <span className="text-sm text-muted-foreground">cm</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <NumberInput
                            value={option.price}
                            onChange={(v) => handleSizeOptionChange(index, "price", v ?? 0)}
                            placeholder="예: 30000"
                            min={0}
                            className="w-full"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            placeholder="예: 1~2인용"
                            value={option.description}
                            onChange={(e) =>
                              handleSizeOptionChange(index, "description", e.target.value)
                            }
                            className="w-full"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveSizeOption(index)}
                            className="h-8 w-8"
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
          </div>

          {/* 맛 목록 */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <Label className="text-base font-medium">맛 목록</Label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddFlavorOption}>
                <Plus className="h-4 w-4 mr-1" />
                추가
              </Button>
            </div>

            {/* 이름 누락 오류는 해당 행에, 그 외(노출 맛 없음)는 목록 위에 표시 */}
            {errors.cakeFlavorOptions &&
              !flavorOptions.some((option) => !option.displayName?.trim()) && (
                <p className="text-sm text-destructive mb-2">{errors.cakeFlavorOptions}</p>
              )}
            {flavorOptions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                맛 옵션이 없습니다. 추가 버튼을 클릭하여 추가하세요.
              </p>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">사용 여부</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        표시명 <span className="text-destructive">*</span>
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        가격 <span className="text-destructive">*</span>
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium w-20">삭제</th>
                    </tr>
                  </thead>
                  <tbody>
                    {flavorOptions.map((option, index) => (
                      <tr key={index} className="border-t hover:bg-muted/50">
                        <td className="px-4 py-3">
                          <Select
                            value={option.visible}
                            onValueChange={(value) =>
                              handleFlavorOptionChange(index, "visible", value as EnableStatus)
                            }
                          >
                            <SelectTrigger className="w-full">
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
                        <td className="px-4 py-3">
                          <Input
                            placeholder="예: 초콜릿"
                            value={option.displayName}
                            onChange={(e) =>
                              handleFlavorOptionChange(index, "displayName", e.target.value)
                            }
                            className={`w-full ${errors.cakeFlavorOptions && !option.displayName?.trim() ? "border-destructive" : ""}`}
                          />
                          {errors.cakeFlavorOptions && !option.displayName?.trim() && (
                            <p className="text-sm text-destructive mt-1">
                              {errors.cakeFlavorOptions}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <NumberInput
                            value={option.price}
                            onChange={(v) => handleFlavorOptionChange(index, "price", v ?? 0)}
                            placeholder="예: 0"
                            min={0}
                            className="w-full"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveFlavorOption(index)}
                            className="h-8 w-8"
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
