"use client";

import { CheckboxMark } from "@/apps/web-user/common/components/inputs/Checkbox";
import { useState, useEffect } from "react";
import { BottomSheet } from "@/apps/web-user/common/components/bottom-sheets/BottomSheet";
import { Icon } from "@/apps/web-user/common/components/icons";
import { DualThumbRangeSlider } from "@/apps/web-user/common/components/sliders";
import {
  MAP_LIST_SIZE_OPTIONS,
  MAP_LIST_CATEGORY_OPTIONS,
} from "@/apps/web-user/features/store/constants/map.constant";
import type { StoreListFilter } from "@/apps/web-user/features/store/types/store.type";
import type { ProductCategoryType } from "@/apps/web-user/features/product/types/product.type";
import type { MapListSortBy } from "@/apps/web-user/features/store/utils/map.util";

// ---------------------------------------------------------------------------
// 가격 스케일 (슬라이더용 만원 단위 1~10)
// ---------------------------------------------------------------------------

const PRICE_SCALE_MIN = 1;
const PRICE_SCALE_MAX = 10;

function priceToScale(price: number): number {
  const scale = Math.round(price / 10000);
  return Math.max(PRICE_SCALE_MIN, Math.min(PRICE_SCALE_MAX, scale));
}

function scaleToPrice(scale: number): number {
  return scale * 10000;
}

function formatPriceLabel(scale: number): string {
  if (scale >= PRICE_SCALE_MAX) return "10만원+";
  return `${scale}만원`;
}

// ---------------------------------------------------------------------------
// 스타일 상수
// ---------------------------------------------------------------------------

const styles = {
  sectionTitle:
    "flex h-[45px] items-center text-sm font-bold leading-[140%] text-[var(--grayscale-gr-900,#1A1A1A)]",
  labelText: "text-sm font-normal leading-[140%] text-[var(--grayscale-gr-900,#1A1A1A)]",
  categoryChip:
    "rounded-[26px] border px-3 py-1.5 text-sm font-normal leading-[140%] transition-colors",
  categoryChipDefault: "border-gray-100 bg-white text-[var(--grayscale-gr-900,#1A1A1A)]",
  categoryChipSelected: "border-primary bg-primary text-white",
} as const;

// ---------------------------------------------------------------------------
// 정렬 옵션
// ---------------------------------------------------------------------------

export type SearchSortBy = MapListSortBy;

const SORT_OPTIONS: { key: SearchSortBy; label: string }[] = [
  { key: "distance", label: "거리순" },
  { key: "review", label: "별점순" },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SearchFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  filter?: StoreListFilter;
  onFilterChange: (filter: StoreListFilter) => void;
  sortBy?: SearchSortBy;
  onSortByChange?: (sortBy: SearchSortBy) => void;
}

// ---------------------------------------------------------------------------
// 메인 컴포넌트
// ---------------------------------------------------------------------------

export function SearchFilterSheet({
  isOpen,
  onClose,
  filter,
  onFilterChange,
  sortBy = "distance",
  onSortByChange,
}: SearchFilterSheetProps) {
  const [draftSortBy, setDraftSortBy] = useState<SearchSortBy>(sortBy);
  const [draftSizes, setDraftSizes] = useState<string[]>(filter?.sizes ?? []);
  const [draftPriceMinScale, setDraftPriceMinScale] = useState(() =>
    filter?.minPrice != null ? priceToScale(filter.minPrice) : PRICE_SCALE_MIN,
  );
  const [draftPriceMaxScale, setDraftPriceMaxScale] = useState(() =>
    filter?.maxPrice != null ? priceToScale(filter.maxPrice) : PRICE_SCALE_MAX,
  );
  const [draftCategories, setDraftCategories] = useState<ProductCategoryType[]>(
    filter?.productCategoryTypes ?? [],
  );

  // 시트 열릴 때 현재 필터로 드래프트 동기화
  useEffect(() => {
    if (!isOpen) return;
    setDraftSortBy(sortBy);
    setDraftSizes(filter?.sizes ?? []);
    setDraftPriceMinScale(
      filter?.minPrice != null ? priceToScale(filter.minPrice) : PRICE_SCALE_MIN,
    );
    setDraftPriceMaxScale(
      filter?.maxPrice != null ? priceToScale(filter.maxPrice) : PRICE_SCALE_MAX,
    );
    setDraftCategories(filter?.productCategoryTypes ?? []);
  }, [isOpen, filter, sortBy]);

  const handleApply = () => {
    const minPrice =
      draftPriceMinScale > PRICE_SCALE_MIN ? scaleToPrice(draftPriceMinScale) : undefined;
    const maxPrice =
      draftPriceMaxScale < PRICE_SCALE_MAX ? scaleToPrice(draftPriceMaxScale) : undefined;
    onFilterChange({
      sizes: draftSizes.length > 0 ? draftSizes : undefined,
      minPrice,
      maxPrice,
      productCategoryTypes: draftCategories.length > 0 ? draftCategories : undefined,
    });
    onSortByChange?.(draftSortBy);
    onClose();
  };

  const handleReset = () => {
    setDraftSortBy("distance");
    setDraftSizes([]);
    setDraftPriceMinScale(PRICE_SCALE_MIN);
    setDraftPriceMaxScale(PRICE_SCALE_MAX);
    setDraftCategories([]);
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="정렬 및 필터"
      maxHeight="90%"
      footer={
        <div className="flex gap-3 px-5 py-4">
          <button
            type="button"
            onClick={handleReset}
            className="flex-1 h-[48px] flex items-center justify-center gap-1.5 text-sm font-bold text-gray-900 border border-gray-100 rounded-xl"
          >
            <Icon name="reset" width={20} height={20} className="shrink-0" />
            초기화
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-[2] h-[48px] text-sm font-bold text-white bg-primary rounded-xl"
          >
            결과보기
          </button>
        </div>
      }
    >
      <div className="px-5 py-6">
        {/* 정렬순서 */}
        <section className="mb-10">
          <h3 className={styles.sectionTitle}>정렬순서</h3>
          <div className="flex items-center gap-[12px] py-1.5">
            {SORT_OPTIONS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setDraftSortBy(key)}
                className={`flex-1 h-[36px] text-sm border rounded-full ${
                  draftSortBy === key
                    ? "text-primary bg-primary-50 border-primary-100 font-bold"
                    : "text-gray-900 bg-white border-gray-100"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* 사이즈 */}
        <section className="mb-10">
          <h3 className={styles.sectionTitle}>사이즈</h3>
          <div className="grid grid-cols-2 gap-4">
            {MAP_LIST_SIZE_OPTIONS.map((size) => {
              const checked = draftSizes.includes(size);
              return (
                <label key={size} className="flex cursor-pointer items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setDraftSizes((prev) => [...prev, size]);
                      } else {
                        setDraftSizes((prev) => prev.filter((s) => s !== size));
                      }
                    }}
                    className="sr-only"
                  />
                  <CheckboxMark checked={checked} size={20} />
                  <span className={styles.labelText}>{size}</span>
                </label>
              );
            })}
          </div>
        </section>

        {/* 가격 */}
        <section className="mb-10">
          <h3 className={styles.sectionTitle}>가격</h3>
          <DualThumbRangeSlider
            min={PRICE_SCALE_MIN}
            max={PRICE_SCALE_MAX}
            valueMin={draftPriceMinScale}
            valueMax={draftPriceMaxScale}
            onMinChange={setDraftPriceMinScale}
            onMaxChange={setDraftPriceMaxScale}
            formatLabel={formatPriceLabel}
            ariaLabel="가격 범위"
            ariaLabelMin="최소 가격"
            ariaLabelMax="최대 가격"
          />
        </section>

        {/* 유형 */}
        <section className="pb-6">
          <h3 className={styles.sectionTitle}>유형</h3>
          <div className="flex flex-wrap gap-2 py-1.5">
            {MAP_LIST_CATEGORY_OPTIONS.map((opt) => {
              const selected = draftCategories.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    if (selected) {
                      setDraftCategories((prev) => prev.filter((c) => c !== opt.value));
                    } else {
                      setDraftCategories((prev) => [...prev, opt.value]);
                    }
                  }}
                  className={`${styles.categoryChip} ${
                    selected ? styles.categoryChipSelected : styles.categoryChipDefault
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </BottomSheet>
  );
}
