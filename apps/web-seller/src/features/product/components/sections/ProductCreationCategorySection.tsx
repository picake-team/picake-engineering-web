import React from "react";
import { ProductCategoryType } from "@/apps/web-seller/features/product/types/product.dto";
import { PRODUCT_CATEGORY_GROUPS } from "@/apps/web-seller/features/product/constants/product.constant";

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

  const handleToggle = (type: ProductCategoryType) => {
    if (disabled) return;
    if (selectedSet.has(type)) {
      onChange(value.filter((t) => t !== type));
    } else {
      onChange([...value, type]);
    }
  };

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
