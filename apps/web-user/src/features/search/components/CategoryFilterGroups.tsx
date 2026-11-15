import type { ProductCategoryType } from "@/apps/web-user/features/product/types/product.type";
import { PRODUCT_CATEGORY_GROUPS } from "@/apps/web-user/features/product/constants/product-category.constant";

/**
 * 필터의 카테고리: 상황·디자인·모양·서비스 네 칸(11-15). 칸 안은 "또는", 칸끼리는 "그리고"로 거른다
 * (검색 필터·지도 목록 필터가 같이 쓴다. 칩 모양은 각 화면의 것을 받는다)
 */
export function CategoryFilterGroups({
  selected,
  onChange,
  titleClassName,
  chipClassName,
}: {
  selected: ProductCategoryType[];
  onChange: (next: ProductCategoryType[]) => void;
  titleClassName: string;
  chipClassName: (isSelected: boolean) => string;
}) {
  return (
    <div className="flex flex-col gap-6">
      {PRODUCT_CATEGORY_GROUPS.map((group) => (
        <div key={group.key}>
          <h3 id={`category-filter-${group.key}`} className={titleClassName}>
            {group.title}
          </h3>
          <div
            role="group"
            aria-labelledby={`category-filter-${group.key}`}
            className="flex flex-wrap gap-2 py-1.5"
          >
            {group.options.map((opt) => {
              const isSelected = selected.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() =>
                    onChange(
                      isSelected
                        ? selected.filter((c) => c !== opt.value)
                        : [...selected, opt.value],
                    )
                  }
                  className={chipClassName(isSelected)}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
