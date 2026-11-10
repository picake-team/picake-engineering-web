/**
 * 상품 정렬과 거르기 창 (SC-83, 디자인 A83). 정렬 6가지(지금 PC 그대로), 종류, 가격, 사이즈·분류(하나라도 맞으면). 이름은 상품 등록 화면과 같게.
 * 판매 상태·노출 상태는 목록 위 칩으로 옮겨 여기 두지 않는다. "결과 보기"를 눌러야 목록에 반영된다.
 */
import { useEffect, useState } from "react";
import { BottomSheet } from "@/apps/web-seller/common/ui/Sheet";
import { Button, ButtonPair } from "@/apps/web-seller/common/ui/Button";
import { Chip } from "@/apps/web-seller/common/ui/Choice";
import { TextInput } from "@/apps/web-seller/common/ui/Field";
import {
  CAKE_SIZE_DISPLAY_NAME_OPTIONS,
  PRODUCT_CATEGORY_GROUPS,
  PRODUCT_TYPE_OPTIONS,
} from "@/apps/web-seller/features/product/constants/product.constant";
import {
  SortBy,
  type CakeSizeDisplayName,
  type ProductCategoryType,
  type ProductType,
} from "@/apps/web-seller/features/product/types/product.dto";

export interface ProductFilter {
  sortBy: SortBy;
  productType?: ProductType;
  minPrice?: number;
  maxPrice?: number;
  sizes: CakeSizeDisplayName[];
  categories: ProductCategoryType[];
}

export const DEFAULT_PRODUCT_FILTER: ProductFilter = {
  sortBy: SortBy.LATEST,
  sizes: [],
  categories: [],
};

export const PRODUCT_SORT_LABEL: Partial<Record<SortBy, string>> = {
  [SortBy.LATEST]: "최신순",
  [SortBy.POPULAR]: "인기순",
  [SortBy.PRICE_ASC]: "가격 낮은순",
  [SortBy.PRICE_DESC]: "가격 높은순",
  [SortBy.REVIEW_COUNT]: "후기 많은순",
  [SortBy.RATING_AVG]: "별점 높은순",
};

const SORTS = [
  SortBy.LATEST,
  SortBy.POPULAR,
  SortBy.PRICE_ASC,
  SortBy.PRICE_DESC,
  SortBy.REVIEW_COUNT,
  SortBy.RATING_AVG,
];

/** 걸러 둔 것 한 줄(기본이면 null) */
export function productFilterSummary(f: ProductFilter): string | null {
  const parts: string[] = [];
  if (f.sortBy !== SortBy.LATEST) parts.push(PRODUCT_SORT_LABEL[f.sortBy] ?? "");
  if (f.productType)
    parts.push(PRODUCT_TYPE_OPTIONS.find((o) => o.value === f.productType)?.label ?? "");
  if (f.minPrice !== undefined || f.maxPrice !== undefined)
    parts.push(
      `${f.minPrice !== undefined ? f.minPrice.toLocaleString("ko-KR") : ""}~${
        f.maxPrice !== undefined ? f.maxPrice.toLocaleString("ko-KR") : ""
      }원`,
    );
  if (f.sizes.length)
    parts.push(
      f.sizes
        .map((s) => CAKE_SIZE_DISPLAY_NAME_OPTIONS.find((o) => o.value === s)?.label ?? s)
        .join("·"),
    );
  if (f.categories.length) parts.push(`분류 ${f.categories.length}개`);
  return parts.length ? parts.join(" · ") : null;
}

function toggle<T>(list: T[], v: T): T[] {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

function Title({ children, hint }: { children: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-body font-bold text-ink-900">{children}</p>
      {hint ? <p className="text-caption text-ink-600">{hint}</p> : null}
    </div>
  );
}

export function ProductFilterSheet({
  open,
  value,
  onApply,
  onClose,
}: {
  open: boolean;
  value: ProductFilter;
  onApply: (f: ProductFilter) => void;
  onClose: () => void;
}) {
  const [d, setD] = useState<ProductFilter>(value);
  useEffect(() => {
    if (open) setD(value);
  }, [open, value]);

  const price = (v: string) => {
    const n = Number(v.replace(/[^0-9]/g, ""));
    return v.trim() === "" || Number.isNaN(n) ? undefined : n;
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      showClose
      title="정렬과 거르기"
      footer={
        <ButtonPair>
          <Button variant="secondary" onClick={() => setD(DEFAULT_PRODUCT_FILTER)}>
            초기화
          </Button>
          <Button onClick={() => onApply(d)}>결과 보기</Button>
        </ButtonPair>
      }
    >
      <Title>정렬</Title>
      <div role="group" aria-label="정렬" className="-mt-2 flex flex-wrap gap-2">
        {SORTS.map((s) => (
          <Chip key={s} selected={d.sortBy === s} onClick={() => setD({ ...d, sortBy: s })}>
            {PRODUCT_SORT_LABEL[s]}
          </Chip>
        ))}
      </div>
      <Title>종류</Title>
      <div role="group" aria-label="종류" className="-mt-2 flex flex-wrap gap-2">
        <Chip selected={!d.productType} onClick={() => setD({ ...d, productType: undefined })}>
          전체
        </Chip>
        {PRODUCT_TYPE_OPTIONS.map((o) => (
          <Chip
            key={o.value}
            selected={d.productType === o.value}
            onClick={() => setD({ ...d, productType: o.value })}
          >
            {o.label}
          </Chip>
        ))}
      </div>
      <Title>가격</Title>
      <div className="-mt-2 flex items-center gap-2">
        <TextInput
          aria-label="최소 가격"
          inputMode="numeric"
          placeholder="최소 가격"
          value={d.minPrice ?? ""}
          onChange={(e) => setD({ ...d, minPrice: price(e.target.value) })}
        />
        <span className="text-ink-900">~</span>
        <TextInput
          aria-label="최대 가격"
          inputMode="numeric"
          placeholder="최대 가격"
          value={d.maxPrice ?? ""}
          onChange={(e) => setD({ ...d, maxPrice: price(e.target.value) })}
        />
      </div>
      <Title hint="하나라도 맞으면">사이즈</Title>
      <div role="group" aria-label="사이즈" className="-mt-2 flex flex-wrap gap-2">
        {CAKE_SIZE_DISPLAY_NAME_OPTIONS.map((o) => (
          <Chip
            key={o.value}
            selected={d.sizes.includes(o.value)}
            onClick={() => setD({ ...d, sizes: toggle(d.sizes, o.value) })}
          >
            {o.label}
          </Chip>
        ))}
      </div>
      <Title hint="하나라도 맞으면">분류</Title>
      {PRODUCT_CATEGORY_GROUPS.map((g) => (
        <div key={g.label} className="-mt-2 flex flex-col gap-2">
          <p className="text-caption text-ink-600">{g.label}</p>
          <div role="group" aria-label={`분류 ${g.label}`} className="flex flex-wrap gap-2">
            {g.options.map((o) => (
              <Chip
                key={o.value}
                selected={d.categories.includes(o.value)}
                onClick={() => setD({ ...d, categories: toggle(d.categories, o.value) })}
              >
                {o.label}
              </Chip>
            ))}
          </div>
        </div>
      ))}
    </BottomSheet>
  );
}
