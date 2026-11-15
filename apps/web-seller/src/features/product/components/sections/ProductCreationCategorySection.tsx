import React from "react";
import { ProductCategoryType } from "@/apps/web-seller/features/product/types/product.dto";
import { PRODUCT_CATEGORY_GROUPS } from "@/apps/web-seller/features/product/constants/product.constant";
import { useInMobileFrame } from "@/apps/web-seller/common/components/layouts/mobile-frame.context";
import { Chip } from "@/apps/web-seller/common/ui/Choice";

export interface ProductCreationCategorySectionProps {
  value: ProductCategoryType[];
  onChange: (value: ProductCategoryType[]) => void;
  disabled?: boolean;
}

/** 카테고리 설정(묶음마다 여러 개 가능): 상황·디자인·모양·서비스, 묶음마다 한 줄 질문 */
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
    // 휴대폰 틀 안: 앱 칩(Chip)과 같다. 고른 칩은 주황 채움 + 흰 글씨, 안 고른 칩은 흰 바탕 + 회색 테두리.
    return (
      <div className="flex flex-col gap-4 font-app">
        {PRODUCT_CATEGORY_GROUPS.map((group) => (
          <div key={group.label} className="flex flex-col gap-2">
            <span className="flex flex-col">
              <span className="text-sub font-bold text-ink-700">{group.label}</span>
              {group.help && <span className="text-caption text-ink-500">{group.help}</span>}
            </span>
            <div role="group" aria-label={group.label} className="flex flex-wrap gap-2">
              {group.options.map((opt) => {
                const isSelected = selectedSet.has(opt.value);
                return (
                  <Chip
                    key={opt.value}
                    selected={isSelected}
                    disabled={disabled}
                    onClick={() => handleToggle(opt.value)}
                  >
                    {opt.label}
                    {opt.hint && (
                      <span
                        className={`ml-1 text-caption font-normal ${isSelected ? "text-white/80" : "text-ink-500"}`}
                      >
                        {opt.hint}
                      </span>
                    )}
                  </Chip>
                );
              })}
            </div>
          </div>
        ))}
        <p className="text-caption text-ink-500">도시락·미니·1~3호는 사이즈에서 정해요.</p>
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
              {group.help && <span className="ml-2 font-normal normal-case">{group.help}</span>}
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
                    {opt.hint && <span className="text-xs opacity-70">{opt.hint}</span>}
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
