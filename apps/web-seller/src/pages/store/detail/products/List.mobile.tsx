/**
 * 휴대폰 상품 목록 (SC-82, 디자인 6-A · 6-C · 6-D): 상품 등록, 검색·거르기(SC-83), 전체·판매중·판매중지·숨김,
 * 판매 상태 바로 바꾸기(되돌리기 안내), 계속 불러오기, 당겨서 새로고침.
 */
import React from "react";
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
import { ROUTES } from "@/apps/web-seller/common/constants/route-paths.constant";
import { productQueryKeys } from "@/apps/web-seller/features/product/constants/productQueryKeys.constant";
import {
  EnableStatus,
  type ProductResponseDto,
} from "@/apps/web-seller/features/product/types/product.dto";
import { ProductFilterSheet } from "@/apps/web-seller/features/product/components/mobile/ProductFilterSheet";
import { LoadMoreSentinel } from "@/apps/web-seller/common/ui/LoadMoreSentinel";
import { formatWon } from "@/apps/web-seller/common/utils/won.util";
import { FilterSummaryBar } from "@/apps/web-seller/common/ui/FilterSummaryBar";
import { useProductListState } from "@/apps/web-seller/features/product/hooks/useProductListState";

function ProductRow({
  product,
  onToggle,
}: {
  product: ProductResponseDto;
  onToggle: (p: ProductResponseDto) => void;
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
          {product.visibilityStatus === EnableStatus.DISABLE ||
          product.enteredByOperator ||
          product.orderMethod === "QUOTE" ? (
            <span className="text-badge font-bold text-ink-600">
              {[
                // 견적 받기 상품(기획 I-01): 손님 화면에 예약신청 대신 "이 디자인으로 견적 받기"
                product.orderMethod === "QUOTE" ? "견적 받기" : null,
                product.visibilityStatus === EnableStatus.DISABLE ? "손님에게 숨김" : null,
                // 운영자가 가게 대신 만든 상품(기획 I-41)
                product.enteredByOperator ? "운영자 입력" : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </span>
          ) : null}
        </span>
      </Link>
      <span className="flex w-14 shrink-0 flex-col items-center gap-1">
        <Switch
          label={`${product.name} 판매`}
          checked={onSale}
          // 보이는 스위치(28)는 그대로, 누르는 칸은 44(위아래로 넓힘)
          className="-my-2 h-11"
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
  const {
    search,
    setSearch,
    bucket,
    setBucket,
    bucketOptions,
    list,
    products,
    summary,
    clearFilter,
    openFilter,
    noProductsAtAll,
    toggleSales,
    filterSheet,
  } = useProductListState(storeId);

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
                onClick={openFilter}
              />
            </div>
            <ChipGroup
              scroll
              label="판매 상태"
              value={bucket}
              onChange={setBucket}
              options={bucketOptions}
            />
            {summary ? (
              <FilterSummaryBar text={summary} onClear={clearFilter} clearLabel="거르기 지우기" />
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
                  <ProductRow key={p.id} product={p} onToggle={toggleSales} />
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
      <ProductFilterSheet {...filterSheet} />
    </AppScreen>
  );
};
