"use client";

import { CheckboxMark } from "@/apps/web-user/common/components/inputs/Checkbox";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import type { StoreListFilter } from "@/apps/web-user/features/store/types/store.type";
import { Icon } from "@/apps/web-user/common/components/icons";
import { DualThumbRangeSlider } from "@/apps/web-user/common/components/sliders";
import {
  MAP_LIST_SIZE_OPTIONS,
  MAP_LIST_CATEGORY_OPTIONS,
  MAP_STORE_LIST_FILTER_MODAL_ID,
} from "@/apps/web-user/features/store/constants/map.constant";
import type { ProductCategoryType } from "@/apps/web-user/features/product/types/product.type";
import { trackEvent } from "@/apps/web-user/common/utils/analytics.util";

// ---------------------------------------------------------------------------
// 필터 활성 여부
// ---------------------------------------------------------------------------

export function hasActiveFilter(filter: StoreListFilter | undefined): boolean {
  if (!filter) return false;
  return (
    (filter.sizes?.length ?? 0) > 0 ||
    filter.minPrice != null ||
    filter.maxPrice != null ||
    (filter.productCategoryTypes?.length ?? 0) > 0
  );
}

// ---------------------------------------------------------------------------
// 가격 스케일 (만원 단위 1~10)
// ---------------------------------------------------------------------------

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

/** 적용된 필터 태그 라벨: 사이즈 (1개 → 항목명, 2+ → "항목명 외 n개") */
function getSizesTagLabel(sizes: string[]): string {
  if (sizes.length === 0) return "";
  if (sizes.length === 1) return sizes[0]!;
  return `${sizes[0]} 외 ${sizes.length - 1}개`;
}

/** 적용된 필터 태그 라벨: 가격 (n만원 ~ n만원) */
function getPriceTagLabel(minPrice: number, maxPrice: number): string {
  const minScale = priceToScale(minPrice);
  const maxScale = priceToScale(maxPrice);
  const minStr = minScale >= PRICE_SCALE_MAX ? "10만원+" : `${minScale}만원`;
  const maxStr = maxScale >= PRICE_SCALE_MAX ? "10만원+" : `${maxScale}만원`;
  return `${minStr} ~ ${maxStr}`;
}

/** 적용된 필터 태그 라벨: 유형 (1개 → 라벨, 2+ → "라벨 외 n개") */
function getCategoriesTagLabel(types: ProductCategoryType[]): string {
  if (types.length === 0) return "";
  const labels = types.map(
    (v) => MAP_LIST_CATEGORY_OPTIONS.find((o) => o.value === v)?.label ?? String(v),
  );
  if (labels.length === 1) return labels[0]!;
  return `${labels[0]} 외 ${labels.length - 1}개`;
}

// ---------------------------------------------------------------------------
// 스타일 상수
// ---------------------------------------------------------------------------

const filterTagStyle =
  "inline-flex h-9 items-center rounded-[26px] border border-primary-100 bg-primary-50 font-bold text-[14px] leading-[140%] text-primary";

const styles = {
  filterButton:
    "flex shrink-0 items-center justify-center rounded-[26px] border border-gray-100 bg-white",
  panelHeader:
    "relative flex h-16 shrink-0 items-center justify-center border-b border-gray-100 bg-white rounded-t-[20px]",
  panelTitle: "text-base font-bold leading-[140%] text-[var(--grayscale-gr-900,#1A1A1A)]",
  sectionTitle:
    "flex h-[45px] items-center text-sm font-bold leading-[140%] text-[var(--grayscale-gr-900,#1A1A1A)]",
  sectionContent: "px-5",
  sectionBlock: "mb-10",
  labelText: "text-sm font-normal leading-[140%] text-[var(--grayscale-gr-900,#1A1A1A)]",
  categoryChip:
    "rounded-[26px] border px-3 py-1.5 text-sm font-normal leading-[140%] transition-colors",
  categoryChipDefault: "border-gray-100 bg-white text-[var(--grayscale-gr-900,#1A1A1A)]",
  categoryChipSelected: "border-primary bg-primary text-white",
  panelFooter: "flex h-[74px] shrink-0 items-center border-t border-gray-100 px-5",
  resetButton:
    "flex items-center justify-center rounded-xl border border-gray-100 bg-white font-bold text-gray-900",
  applyButton: "flex flex-1 items-center justify-center rounded-xl font-bold text-white",
} as const;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface MapStoreListFilterProps {
  listFilter?: StoreListFilter;
  onListFilterChange: (filter: StoreListFilter) => void;
  /** 필터 모달 열림 상태 (지도 목록 시트 제스처 잠금 등) */
  onPanelOpenChange?: (open: boolean) => void;
}

// ---------------------------------------------------------------------------
// 메인 컴포넌트
// ---------------------------------------------------------------------------

export function MapStoreListFilter({
  listFilter,
  onListFilterChange,
  onPanelOpenChange,
}: MapStoreListFilterProps) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [draftSizes, setDraftSizes] = useState<string[]>(listFilter?.sizes ?? []);
  const [draftPriceMinScale, setDraftPriceMinScale] = useState(() =>
    listFilter?.minPrice != null ? priceToScale(listFilter.minPrice) : PRICE_SCALE_MIN,
  );
  const [draftPriceMaxScale, setDraftPriceMaxScale] = useState(() =>
    listFilter?.maxPrice != null ? priceToScale(listFilter.maxPrice) : PRICE_SCALE_MAX,
  );
  const [draftCategories, setDraftCategories] = useState<ProductCategoryType[]>(
    listFilter?.productCategoryTypes ?? [],
  );

  useEffect(() => {
    onPanelOpenChange?.(panelOpen);
  }, [panelOpen, onPanelOpenChange]);

  useEffect(() => {
    if (!panelOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPanelOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [panelOpen]);

  // 패널 열릴 때 현재 필터로 드래프트 동기화
  useEffect(() => {
    if (!panelOpen) return;
    setDraftSizes(listFilter?.sizes ?? []);
    setDraftPriceMinScale(
      listFilter?.minPrice != null ? priceToScale(listFilter.minPrice) : PRICE_SCALE_MIN,
    );
    setDraftPriceMaxScale(
      listFilter?.maxPrice != null ? priceToScale(listFilter.maxPrice) : PRICE_SCALE_MAX,
    );
    setDraftCategories(listFilter?.productCategoryTypes ?? []);
  }, [panelOpen, listFilter]);

  const handleApply = () => {
    const minPrice =
      draftPriceMinScale > PRICE_SCALE_MIN ? scaleToPrice(draftPriceMinScale) : undefined;
    const maxPrice =
      draftPriceMaxScale < PRICE_SCALE_MAX ? scaleToPrice(draftPriceMaxScale) : undefined;
    onListFilterChange({
      sizes: draftSizes.length > 0 ? draftSizes : undefined,
      minPrice,
      maxPrice,
      productCategoryTypes: draftCategories.length > 0 ? draftCategories : undefined,
    });
    setPanelOpen(false);
  };

  const handleReset = () => {
    setDraftSizes([]);
    setDraftPriceMinScale(PRICE_SCALE_MIN);
    setDraftPriceMaxScale(PRICE_SCALE_MAX);
    setDraftCategories([]);
  };

  const active = hasActiveFilter(listFilter);
  const hasSizes = (listFilter?.sizes?.length ?? 0) > 0;
  const hasPrice = listFilter?.minPrice != null || listFilter?.maxPrice != null;
  const hasCategories = (listFilter?.productCategoryTypes?.length ?? 0) > 0;

  const handleRemoveSizes = () => {
    onListFilterChange({ ...listFilter, sizes: undefined });
  };
  const handleRemovePrice = () => {
    onListFilterChange({
      ...listFilter,
      minPrice: undefined,
      maxPrice: undefined,
    });
  };
  const handleRemoveCategories = () => {
    onListFilterChange({ ...listFilter, productCategoryTypes: undefined });
  };

  return (
    <>
      <div className="flex items-center shrink-0" style={{ gap: 12 }}>
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => {
              trackEvent("engage_map_filter_open");
              setPanelOpen(true);
            }}
            className={styles.filterButton}
            style={{
              width: 36,
              height: 36,
              ...(active && {
                background: "var(--primary-or-50, #FFEFEB)",
                border: "1px solid var(--primary-or-100, #FFD2C7)",
              }),
            }}
            aria-expanded={panelOpen}
            aria-label="필터"
          >
            <Icon
              name={active ? "filterActive" : "filter"}
              width={20}
              height={20}
              className="block"
            />
          </button>
          {active && (
            <span
              className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary-500"
              aria-hidden
            />
          )}
        </div>

        {active && (
          <div className="flex min-w-0 flex-wrap items-center" style={{ gap: 12 }}>
            {hasSizes && listFilter?.sizes && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveSizes();
                }}
                className={`cursor-pointer ${filterTagStyle} hover:opacity-90`}
                style={{ gap: 4, padding: "0 14px" }}
                aria-label="사이즈 필터 제거"
              >
                <span className="flex items-center truncate">
                  {getSizesTagLabel(listFilter.sizes)}
                </span>
                <Icon name="close3" width={16} height={16} className="shrink-0" />
              </button>
            )}
            {hasPrice && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemovePrice();
                }}
                className={`cursor-pointer ${filterTagStyle} hover:opacity-90`}
                style={{ gap: 4, padding: "0 14px" }}
                aria-label="가격 필터 제거"
              >
                <span className="flex items-center truncate">
                  {getPriceTagLabel(
                    listFilter?.minPrice ?? scaleToPrice(PRICE_SCALE_MIN),
                    listFilter?.maxPrice ?? scaleToPrice(PRICE_SCALE_MAX),
                  )}
                </span>
                <Icon name="close3" width={16} height={16} className="shrink-0" />
              </button>
            )}
            {hasCategories && listFilter?.productCategoryTypes && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveCategories();
                }}
                className={`cursor-pointer ${filterTagStyle} hover:opacity-90`}
                style={{ gap: 4, padding: "0 14px" }}
                aria-label="유형 필터 제거"
              >
                <span className="flex items-center truncate">
                  {getCategoriesTagLabel(listFilter.productCategoryTypes)}
                </span>
                <Icon name="close3" width={16} height={16} className="shrink-0" />
              </button>
            )}
          </div>
        )}
      </div>

      {panelOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            id={MAP_STORE_LIST_FILTER_MODAL_ID}
            className="fixed inset-0 z-modal"
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            onTouchCancel={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="absolute inset-0 bg-black/20"
              aria-label="필터 닫기"
              onClick={() => setPanelOpen(false)}
            />
            <div
              className="absolute bottom-0 left-0 right-0 mx-auto flex h-[80vh] max-w-[638px] flex-col rounded-t-[20px] bg-white shadow-lg"
              role="dialog"
              aria-modal
              aria-labelledby="filter-panel-title"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
              onTouchCancel={(e) => e.stopPropagation()}
            >
              <header className={styles.panelHeader}>
                <h2 id="filter-panel-title" className={styles.panelTitle}>
                  필터
                </h2>
                <button
                  type="button"
                  onClick={() => setPanelOpen(false)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-600"
                  aria-label="필터 닫기"
                >
                  <Icon name="close2" width={24} height={24} />
                </button>
              </header>

              <div className="flex-1 overflow-y-auto overscroll-y-contain pt-6">
                <section className={`${styles.sectionContent} ${styles.sectionBlock}`}>
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

                <section
                  className={`${styles.sectionContent} ${styles.sectionBlock}`}
                  style={{ touchAction: "none" }}
                  onTouchStart={(e) => e.stopPropagation()}
                  onTouchMove={(e) => e.stopPropagation()}
                  onTouchEnd={(e) => e.stopPropagation()}
                  onTouchCancel={(e) => e.stopPropagation()}
                >
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

                <section className={`${styles.sectionContent} pb-6`}>
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

              <div className={styles.panelFooter} style={{ gap: 8 }}>
                <button
                  type="button"
                  onClick={handleReset}
                  className={styles.resetButton}
                  style={{ width: 116, height: 52, gap: 6, fontSize: 16, lineHeight: "22px" }}
                >
                  <Icon name="reset" width={20} height={20} className="shrink-0" />
                  초기화
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  className={styles.applyButton}
                  style={{
                    height: 52,
                    fontSize: 16,
                    lineHeight: "140%",
                    background: "var(--primary-or-400, #FF653E)",
                  }}
                >
                  결과보기
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
