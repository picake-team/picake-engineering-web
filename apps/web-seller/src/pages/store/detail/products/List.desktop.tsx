/**
 * PC 상품 목록(기획 I-54, 시안 D): 탭(전체·판매중·판매중지·숨김) + 찾기 + 정렬·거르기 + 표.
 * 판매 상태는 표 안 스위치로 바로 바꾸고(아래 "되돌리기"), 줄을 누르면 상품 수정. 칸이 좁으면 휴대폰처럼 두 줄.
 * 조회·거르기·바로 바꾸기는 휴대폰 상품 목록과 같은 것(useProductList·ProductFilterSheet·useProductSalesToggle)이다.
 */
import React, { useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PcPage } from "@/apps/web-seller/common/ui/PcPage";
import { Button } from "@/apps/web-seller/common/ui/Button";
import { ChipGroup } from "@/apps/web-seller/common/ui/Choice";
import { SearchInput } from "@/apps/web-seller/common/ui/Field";
import { EmptyState, LoadErrorState } from "@/apps/web-seller/common/ui/Surface";
import { Switch } from "@/apps/web-seller/common/ui/Toggle";
import { Icon } from "@/apps/web-seller/common/ui/icons";
import { cx } from "@/apps/web-seller/common/ui/cx";
import { useDebouncedValue } from "@/apps/web-seller/common/hooks/useDebouncedValue";
import { useElementWidth } from "@/apps/web-seller/common/hooks/useElementWidth";
import { ROUTES } from "@/apps/web-seller/common/constants/route-paths.constant";
import { flattenAndDeduplicateInfiniteData } from "@/apps/web-seller/common/utils/pagination.util";
import { useProductList } from "@/apps/web-seller/features/product/hooks/queries/useProductQuery";
import { useProductSalesToggle } from "@/apps/web-seller/features/product/hooks/mutations/useProductSalesToggle";
import {
  EnableStatus,
  type ProductResponseDto,
} from "@/apps/web-seller/features/product/types/product.dto";
import {
  DEFAULT_PRODUCT_FILTER,
  ProductFilterSheet,
  productFilterSummary,
  type ProductFilter,
} from "@/apps/web-seller/features/product/components/mobile/ProductFilterSheet";
import { LoadMoreSentinel } from "@/apps/web-seller/features/order/components/mobile/OrderCards";
import { formatWon } from "@/apps/web-seller/features/order/utils/order-mobile.util";

type Bucket = "all" | "on" | "off" | "hidden";

const BUCKET_PARAMS: Record<
  Bucket,
  { salesStatus?: EnableStatus; visibilityStatus?: EnableStatus }
> = {
  all: {},
  on: { salesStatus: EnableStatus.ENABLE },
  off: { salesStatus: EnableStatus.DISABLE },
  hidden: { visibilityStatus: EnableStatus.DISABLE },
};

const TABLE_MIN_WIDTH = 640;
const COLS = "grid-cols-[minmax(0,1fr)_140px_140px_120px]";

function Thumb({ product }: { product: ProductResponseDto }) {
  return (
    <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-control bg-ink-50 text-ink-400">
      {product.images?.[0] ? (
        <img src={product.images[0]} alt="" loading="lazy" className="size-full object-cover" />
      ) : (
        <Icon name="cake" size={22} strokeWidth={1.6} />
      )}
    </span>
  );
}

function Price({ product }: { product: ProductResponseDto }) {
  const discounted = product.originalPrice > product.salePrice;
  return (
    <span className="flex flex-col text-sub tabular-nums text-ink-900">
      {discounted ? (
        <s className="text-caption text-ink-600">{formatWon(product.originalPrice)}</s>
      ) : null}
      <b>{formatWon(product.salePrice)}</b>
    </span>
  );
}

function Badges({ product }: { product: ProductResponseDto }) {
  const parts = [
    product.visibilityStatus === EnableStatus.DISABLE ? "손님에게 숨김" : null,
    // 운영자가 가게 대신 만든 상품(기획 I-41)
    product.enteredByOperator ? "운영자 입력" : null,
  ].filter(Boolean);
  return parts.length ? (
    <span className="text-badge font-bold text-ink-600">{parts.join(" · ")}</span>
  ) : null;
}

function SaleSwitch({ product, onToggle }: { product: ProductResponseDto; onToggle: () => void }) {
  const onSale = product.salesStatus === EnableStatus.ENABLE;
  return (
    <span className="pointer-events-auto relative z-[2] flex items-center gap-2">
      <Switch
        label={`${product.name} 판매`}
        checked={onSale}
        className="-my-2 h-11"
        onChange={onToggle}
      />
      <span className="text-caption text-ink-600">{onSale ? "판매중" : "판매중지"}</span>
    </span>
  );
}

function ProductTableRow({
  product,
  wide,
  onToggle,
}: {
  product: ProductResponseDto;
  wide: boolean;
  onToggle: () => void;
}) {
  const to = ROUTES.STORE_DETAIL_PRODUCTS_DETAIL(product.storeId, product.id);
  const visible = product.visibilityStatus !== EnableStatus.DISABLE;
  return (
    <div
      role="row"
      className="relative border-b border-ink-100 transition-colors duration-fast hover:bg-ink-50/60"
    >
      <Link
        to={to}
        aria-label={`${product.name} 수정`}
        className="absolute inset-0 z-[1] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand"
      />
      {wide ? (
        <div className={cx("pointer-events-none grid items-center gap-4 px-4 py-3", COLS)}>
          <span className="flex min-w-0 items-center gap-3">
            <Thumb product={product} />
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate text-body font-semibold text-ink-900">{product.name}</span>
              <Badges product={product} />
            </span>
          </span>
          <Price product={product} />
          <span className={cx("text-sub", visible ? "text-ink-700" : "text-ink-600")}>
            {visible ? "손님에게 보임" : "손님에게 숨김"}
          </span>
          <SaleSwitch product={product} onToggle={onToggle} />
        </div>
      ) : (
        <div className="pointer-events-none flex items-center gap-3 px-4 py-3">
          <Thumb product={product} />
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="truncate text-body font-semibold text-ink-900">{product.name}</span>
            <Price product={product} />
            <Badges product={product} />
          </span>
          <SaleSwitch product={product} onToggle={onToggle} />
        </div>
      )}
    </div>
  );
}

export const StoreDetailProductListDesktopPage: React.FC = () => {
  const { storeId = "" } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const debounced = useDebouncedValue(search.trim(), 300);
  const [bucket, setBucket] = useState<Bucket>("all");
  const [filter, setFilter] = useState<ProductFilter>(DEFAULT_PRODUCT_FILTER);
  const [filterOpen, setFilterOpen] = useState(false);
  const toggle = useProductSalesToggle();
  const tableRef = useRef<HTMLDivElement>(null);
  const wide = useElementWidth(tableRef) >= TABLE_MIN_WIDTH;

  const common = {
    storeId,
    sortBy: filter.sortBy,
    search: debounced || undefined,
    productType: filter.productType,
    minPrice: filter.minPrice,
    maxPrice: filter.maxPrice,
    sizes: filter.sizes.length ? filter.sizes : undefined,
    productCategoryTypes: filter.categories.length ? filter.categories : undefined,
  };
  const list = useProductList({ ...common, limit: 20, ...BUCKET_PARAMS[bucket] });
  // 칩 숫자: 같은 조건으로 1개씩만 받아 전체 수를 본다(휴대폰과 같다)
  const all = useProductList({ ...common, limit: 1 });
  const on = useProductList({ ...common, limit: 1, ...BUCKET_PARAMS.on });
  const off = useProductList({ ...common, limit: 1, ...BUCKET_PARAMS.off });
  const hidden = useProductList({ ...common, limit: 1, ...BUCKET_PARAMS.hidden });
  const count = (q: typeof all) => q.data?.pages[0]?.meta.totalItems;

  const products = useMemo(
    () => flattenAndDeduplicateInfiniteData<ProductResponseDto>(list.data),
    [list.data],
  );
  const summary = productFilterSummary(filter);
  const noProductsAtAll = count(all) === 0 && !debounced && !summary;
  const create = () => navigate(ROUTES.STORE_DETAIL_PRODUCTS_CREATE(storeId));

  return (
    <PcPage
      title="상품"
      actions={
        <Button size="md" onClick={create}>
          <Icon name="plus" size={16} strokeWidth={2} />
          상품 등록
        </Button>
      }
    >
      {noProductsAtAll ? (
        <div className="flex flex-1 flex-col rounded-card border border-ink-100">
          <EmptyState
            big
            title="등록된 상품이 없어요"
            description="첫 상품을 등록하면 손님 앱에 보여요"
            action={
              <Button className="px-8" onClick={create}>
                상품 등록
              </Button>
            }
          />
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <ChipGroup
              label="판매 상태"
              value={bucket}
              onChange={setBucket}
              options={[
                { value: "all", label: "전체", count: count(all) },
                { value: "on", label: "판매중", count: count(on) },
                { value: "off", label: "판매중지", count: count(off) },
                { value: "hidden", label: "숨김", count: count(hidden) },
              ]}
            />
            <SearchInput
              label="상품명 검색"
              placeholder="상품명 검색"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="min-w-[220px] flex-1"
            />
            <Button variant="secondary" size="md" onClick={() => setFilterOpen(true)}>
              <Icon name="filter" size={16} strokeWidth={2} />
              정렬·거르기
            </Button>
          </div>
          {summary ? (
            <div className="flex items-center gap-2 rounded-control bg-ink-50 py-1.5 pl-4 pr-2">
              <span className="min-w-0 flex-1 truncate text-sub font-bold text-ink-700">
                {summary}
              </span>
              <button
                type="button"
                aria-label="거르기 지우기"
                onClick={() => setFilter(DEFAULT_PRODUCT_FILTER)}
                className="inline-flex size-9 items-center justify-center rounded-full text-ink-700 hover:bg-ink-100"
              >
                <Icon name="close" size={18} strokeWidth={2} />
              </button>
            </div>
          ) : null}
          <div
            ref={tableRef}
            role="table"
            aria-label="상품 목록"
            className="flex flex-col rounded-card border border-ink-100"
          >
            {wide ? (
              <div
                role="row"
                className={cx(
                  "grid items-center gap-4 border-b border-ink-100 px-4 py-2.5 text-caption font-semibold text-ink-600",
                  COLS,
                )}
              >
                <span role="columnheader">상품</span>
                <span role="columnheader">가격</span>
                <span role="columnheader">손님에게</span>
                <span role="columnheader">판매</span>
              </div>
            ) : null}
            {list.isError && !list.data ? (
              <div className="flex min-h-[240px] flex-col px-4">
                <LoadErrorState big onRetry={() => void list.refetch()} />
              </div>
            ) : list.isLoading ? (
              <div className="flex flex-col gap-2 p-4" aria-busy="true" aria-label="불러오는 중">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="block h-14 animate-pulse rounded-control bg-ink-50" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="flex min-h-[240px] flex-col px-4">
                <EmptyState
                  big
                  icon="search"
                  title="맞는 상품이 없어요"
                  description="다른 말로 찾거나 거르기를 지워 보세요"
                />
              </div>
            ) : (
              <>
                {products.map((p) => (
                  <ProductTableRow
                    key={p.id}
                    product={p}
                    wide={wide}
                    onToggle={() =>
                      toggle.mutate({
                        productId: p.id,
                        name: p.name,
                        next:
                          p.salesStatus === EnableStatus.ENABLE
                            ? EnableStatus.DISABLE
                            : EnableStatus.ENABLE,
                      })
                    }
                  />
                ))}
                <LoadMoreSentinel
                  hasNext={Boolean(list.hasNextPage)}
                  loading={list.isFetchingNextPage}
                  onLoad={() => void list.fetchNextPage()}
                />
              </>
            )}
          </div>
        </>
      )}
      <ProductFilterSheet
        open={filterOpen}
        value={filter}
        onClose={() => setFilterOpen(false)}
        onApply={(f) => {
          setFilter(f);
          setFilterOpen(false);
        }}
      />
    </PcPage>
  );
};
