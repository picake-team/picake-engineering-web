/**
 * 휴대폰 상품 목록 (SC-82, 디자인 6-A · 6-C · 6-D): 상품 등록, 검색·거르기(SC-83), 전체·판매중·판매중지·숨김,
 * 판매 상태 바로 바꾸기(되돌리기 안내), 계속 불러오기, 당겨서 새로고침.
 */
import React, { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { AppScreen, TabHeader } from "@/apps/web-seller/common/ui/Screen";
import { Button, FieldIconButton, HeaderIconButton } from "@/apps/web-seller/common/ui/Button";
import { ChipGroup } from "@/apps/web-seller/common/ui/Choice";
import { SearchInput } from "@/apps/web-seller/common/ui/Field";
import { EmptyState, LoadErrorState } from "@/apps/web-seller/common/ui/Surface";
import { Switch } from "@/apps/web-seller/common/ui/Toggle";
import { PullToRefresh } from "@/apps/web-seller/common/ui/PullToRefresh";
import { Icon } from "@/apps/web-seller/common/ui/icons";
import { useDebouncedValue } from "@/apps/web-seller/common/hooks/useDebouncedValue";
import { ROUTES } from "@/apps/web-seller/common/constants/route-paths.constant";
import { flattenAndDeduplicateInfiniteData } from "@/apps/web-seller/common/utils/pagination.util";
import { useProductList } from "@/apps/web-seller/features/product/hooks/queries/useProductQuery";
import { useProductSalesToggle } from "@/apps/web-seller/features/product/hooks/mutations/useProductSalesToggle";
import { productQueryKeys } from "@/apps/web-seller/features/product/constants/productQueryKeys.constant";
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

function ProductRow({
  product,
  onToggle,
  pending,
}: {
  product: ProductResponseDto;
  onToggle: (p: ProductResponseDto) => void;
  pending: boolean;
}) {
  const storeId = product.storeId;
  const onSale = product.salesStatus === EnableStatus.ENABLE;
  const discounted = product.originalPrice > product.salePrice;
  return (
    <div className="flex items-center gap-3 border-b border-ink-100 py-3">
      <Link
        to={ROUTES.STORE_DETAIL_PRODUCTS_DETAIL(storeId, product.id)}
        className="flex min-w-0 flex-1 items-center gap-3 active:bg-ink-50"
      >
        <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-control bg-ink-50 text-ink-400">
          {product.images?.[0] ? (
            <img src={product.images[0]} alt="" loading="lazy" className="size-full object-cover" />
          ) : (
            <Icon name="cake" size={22} strokeWidth={1.6} />
          )}
        </span>
        <span className="flex min-w-0 flex-col gap-1">
          <span className="truncate text-body font-semibold text-ink-900">{product.name}</span>
          <span className="text-sub text-ink-900">
            {discounted ? (
              <s className="mr-1 text-caption text-ink-600">{formatWon(product.originalPrice)}</s>
            ) : null}
            <b>{formatWon(product.salePrice)}</b>
          </span>
          {product.visibilityStatus === EnableStatus.DISABLE ? (
            <span className="text-badge font-bold text-ink-600">손님에게 숨김</span>
          ) : null}
        </span>
      </Link>
      <span className="flex w-14 shrink-0 flex-col items-center gap-1">
        <Switch
          label={`${product.name} 판매`}
          checked={onSale}
          disabled={pending}
          className="h-7"
          onChange={() => onToggle(product)}
        />
        <span className="text-caption text-ink-600">{onSale ? "판매중" : "판매중지"}</span>
      </span>
    </div>
  );
}

export const StoreDetailProductListMobilePage: React.FC = () => {
  const { storeId = "" } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const debounced = useDebouncedValue(search.trim(), 300);
  const [bucket, setBucket] = useState<Bucket>("all");
  const [filter, setFilter] = useState<ProductFilter>(DEFAULT_PRODUCT_FILTER);
  const [filterOpen, setFilterOpen] = useState(false);
  const toggle = useProductSalesToggle();

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
  // 칩 숫자: 같은 조건으로 1개씩만 받아 전체 수를 본다
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

  return (
    <AppScreen
      tab="products"
      storeId={storeId}
      header={
        <TabHeader
          title="상품"
          actions={
            <HeaderIconButton
              icon="plus"
              label="상품 등록"
              onClick={() => navigate(ROUTES.STORE_DETAIL_PRODUCTS_CREATE(storeId))}
            />
          }
        />
      }
    >
      <PullToRefresh
        onRefresh={() => queryClient.invalidateQueries({ queryKey: productQueryKeys.all })}
      >
        {noProductsAtAll ? (
          <EmptyState
            big
            title="등록된 상품이 없어요"
            description="첫 상품을 등록하면 손님 앱에 보여요"
            action={
              <Button
                className="px-8"
                onClick={() => navigate(ROUTES.STORE_DETAIL_PRODUCTS_CREATE(storeId))}
              >
                상품 등록
              </Button>
            }
          />
        ) : (
          <>
            <div className="flex gap-2">
              <SearchInput
                label="상품명 검색"
                placeholder="상품명 검색"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <FieldIconButton
                icon="filter"
                label="정렬과 거르기"
                active={Boolean(summary)}
                onClick={() => setFilterOpen(true)}
              />
            </div>
            <ChipGroup
              scroll
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
            {summary ? (
              <div className="flex items-center gap-2 rounded-control bg-ink-50 py-2 pl-4 pr-3">
                <span className="min-w-0 flex-1 text-sub font-bold text-ink-700">{summary}</span>
                <button
                  type="button"
                  aria-label="거르기 지우기"
                  onClick={() => setFilter(DEFAULT_PRODUCT_FILTER)}
                  className="-my-2 -mr-2 inline-flex size-11 items-center justify-center rounded-full text-ink-700"
                >
                  <Icon name="close" size={18} strokeWidth={2} />
                </button>
              </div>
            ) : null}
            {list.isError && !list.data ? (
              <LoadErrorState big onRetry={() => void list.refetch()} />
            ) : list.isLoading ? (
              <span className="block h-40 animate-pulse rounded-card bg-ink-50" aria-busy="true" />
            ) : products.length === 0 ? (
              <EmptyState
                big
                icon="search"
                title="맞는 상품이 없어요"
                description="다른 말로 찾거나 거르기를 지워 보세요"
              />
            ) : (
              <div className="-mt-1">
                {products.map((p) => (
                  <ProductRow
                    key={p.id}
                    product={p}
                    pending={toggle.isPending && toggle.variables?.productId === p.id}
                    onToggle={(prod) =>
                      toggle.mutate({
                        productId: prod.id,
                        name: prod.name,
                        next:
                          prod.salesStatus === EnableStatus.ENABLE
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
              </div>
            )}
          </>
        )}
      </PullToRefresh>
      <ProductFilterSheet
        open={filterOpen}
        value={filter}
        onClose={() => setFilterOpen(false)}
        onApply={(f) => {
          setFilter(f);
          setFilterOpen(false);
        }}
      />
    </AppScreen>
  );
};
