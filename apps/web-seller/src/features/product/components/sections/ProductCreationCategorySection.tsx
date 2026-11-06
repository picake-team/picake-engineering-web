import React from "react";
import { ProductCategoryType } from "@/apps/web-seller/features/product/types/product.dto";
import { PRODUCT_CATEGORY_GROUPS } from "@/apps/web-seller/features/product/constants/product.constant";
import { useInMobileFrame } from "@/apps/web-seller/common/components/layouts/mobile-frame.context";
import { Icon } from "@/apps/web-seller/common/ui/icons";
import { cn } from "@/apps/web-seller/common/utils/classname.util";

export interface ProductCreationCategorySectionProps {
  value: ProductCategoryType[];
  onChange: (value: ProductCategoryType[]) => void;
  disabled?: boolean;
}

/** 카테고리 설정 (중복 선택 가능) - 판매 대표이미지 바로 위 배치 */
export const ProductCreationCategorySection: React.FC<ProductCreationCategorySectionProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const selectedSet = new Set(value);
  const inFrame = useInMobileFrame();

  const handleToggle = (type: ProductCategoryType) => {
    if (disabled) return;
    if (selectedSet.has(type)) {
      onChange(value.filter((t) => t !== type));
    } else {
      onChange([...value, type]);
    }
  };

  if (inFrame) {
    // 휴대폰 틀 안: 고른 칩은 연한 주황 바탕 + 짙은 글씨 + 주황 체크만(테두리·바탕을 겹치지 않음, 운영자 의견 2026-11-07)
    return (
      <div className="flex flex-col gap-4 font-app">
        {PRODUCT_CATEGORY_GROUPS.map((group) => (
          <fieldset key={group.label} className="flex flex-col gap-2">
            <legend className="mb-2 text-sub font-bold text-ink-700">{group.label}</legend>
            <div className="flex flex-wrap gap-2">
              {group.options.map((opt) => {
                const isChecked = selectedSet.has(opt.value);
                return (
                  <label
                    key={opt.value}
                    className={cn(
                      "inline-flex h-9 cursor-pointer select-none items-center gap-1 rounded-full border px-3.5 text-sub",
                      "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ink-900 has-[:focus-visible]:ring-offset-2",
                      isChecked
                        ? "border-transparent bg-brand-tint font-bold text-ink-900"
                        : "border-ink-200 bg-white text-ink-700 active:bg-ink-50",
                      disabled && "pointer-events-none opacity-40",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggle(opt.value)}
                      disabled={disabled}
                      className="sr-only"
                    />
                    {isChecked ? (
                      <Icon
                        name="check"
                        size={14}
                        strokeWidth={2.5}
                        className="-ml-0.5 text-brand"
                      />
                    ) : null}
                    {opt.label}
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-4">
        {PRODUCT_CATEGORY_GROUPS.map((group) => (
          <div key={group.label} className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {group.label}
            </span>
            <div className="flex flex-wrap gap-2">
              {group.options.map((opt) => {
                const isChecked = selectedSet.has(opt.value);
                return (
                  <label
                    key={opt.value}
                    className={`
                        inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm cursor-pointer select-none transition-all duration-150
                        border
                        ${isChecked ? "border-primary bg-primary/10 text-primary font-medium" : "border-transparent bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"}
                        ${disabled ? "pointer-events-none opacity-60" : ""}
                      `}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggle(opt.value)}
                      disabled={disabled}
                      className="sr-only"
                    />
                    <span
                      className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border ${isChecked ? "border-primary bg-primary" : "border-muted-foreground/40"}`}
                      aria-hidden
                    >
                      {isChecked && (
                        <svg
                          className="h-2 w-2 text-primary-foreground"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </span>
                    {opt.label}
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
