import { useNavigate, useParams } from "react-router-dom";
import type { ProductResponseDto } from "@/apps/web-seller/features/product/types/product.dto";
import { ROUTES } from "@/apps/web-seller/common/constants/paths.constant";
import { isProductOnSale } from "@/apps/web-seller/features/product/utils/product-price.util";
import { EmptyState } from "@/apps/web-seller/common/components/fallbacks/EmptyState";
import { StatusBadge } from "@/apps/web-seller/common/components/badges/StatusBadge";

interface ProductListProps {
  products: ProductResponseDto[];
}

export function ProductList({ products }: ProductListProps) {
  const navigate = useNavigate();
  const { storeId } = useParams<{ storeId: string }>();

  const handleProductClick = (productId: string) => {
    if (storeId) {
      navigate(ROUTES.STORE_DETAIL_PRODUCTS_DETAIL(storeId, productId));
    }
  };

  if (products.length === 0) {
    return <EmptyState message="등록된 상품이 없습니다." />;
  }

  return (
    <div className="space-y-2">
      {products.map((product) => {
        const images = product.images || [];

        return (
          <div
            key={product.id}
            onClick={() => handleProductClick(product.id)}
            className="group flex cursor-pointer items-center gap-4 rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md"
          >
            {/* 상품 이미지 - 작게 */}
            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded bg-muted">
              {images.length > 0 ? (
                <img
                  src={images[0]}
                  alt={product.name}
                  width={64}
                  height={64}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs font-medium text-muted-foreground">
                  No Image
                </div>
              )}
            </div>

            {/* 상품 정보: 이름 | [배지 → 가격] */}
            <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <div className="min-w-0 flex-1 truncate text-sm font-semibold leading-tight">
                {product.name}
              </div>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
                <div className="flex flex-wrap justify-end gap-1.5">
                  <StatusBadge variant={product.salesStatus === "ENABLE" ? "success" : "default"}>
                    {product.salesStatus === "ENABLE" ? "판매중" : "판매중지"}
                  </StatusBadge>
                  <StatusBadge variant={product.visibilityStatus === "ENABLE" ? "info" : "default"}>
                    {product.visibilityStatus === "ENABLE" ? "노출" : "숨김"}
                  </StatusBadge>
                  {/* 운영자가 가게 대신 만든 상품(기획 I-41) */}
                  {product.enteredByOperator ? (
                    <StatusBadge variant="default">운영자 입력</StatusBadge>
                  ) : null}
                  {/* 견적 받기 상품(기획 I-01): 손님 화면에 예약신청 대신 "이 디자인으로 견적 받기" */}
                  {product.orderMethod === "QUOTE" ? (
                    <StatusBadge variant="default">견적 받기</StatusBadge>
                  ) : null}
                </div>
                <div className="text-base font-bold tabular-nums sm:text-lg">
                  {isProductOnSale(product.originalPrice, product.salePrice) ? (
                    <div className="flex flex-col items-end gap-0.5 sm:flex-row sm:items-center sm:gap-2">
                      <span className="text-sm font-normal text-muted-foreground line-through">
                        {product.originalPrice.toLocaleString()}원
                      </span>
                      <span>{product.salePrice.toLocaleString()}원</span>
                    </div>
                  ) : (
                    <span>{product.salePrice.toLocaleString()}원</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
