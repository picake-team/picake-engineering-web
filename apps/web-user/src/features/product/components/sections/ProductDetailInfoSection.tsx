"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Product } from "@/apps/web-user/features/product/types/product.type";
import { PATHS } from "@/apps/web-user/common/constants/paths.constant";
import {
  getProductDiscountRate,
  isProductOnSale,
} from "@/apps/web-user/features/product/utils/product-price.util";

interface ProductDetailInfoSectionProps {
  product: Product;
}

export function ProductDetailInfoSection({ product }: ProductDetailInfoSectionProps) {
  const router = useRouter();
  const onSale = isProductOnSale(product.originalPrice, product.salePrice);
  const discountRate = getProductDiscountRate(product.originalPrice, product.salePrice);

  const handleStoreClick = () => {
    router.push(PATHS.STORE.DETAIL(product.storeId));
  };

  return (
    <div className="flex flex-col gap-6 px-[20px] pt-[16px] pb-[34px]">
      <div>
        {/* 판매자명, 상품명, 가격 */}
        <button
          onClick={handleStoreClick}
          className="inline-flex items-center gap-[4px] mb-[8px] px-[6px] py-[6px] rounded-full bg-[#F6F5F5] text-xs text-gray-900 font-bold hover:bg-[#E8E6E6] transition-colors cursor-pointer"
        >
          {product.storeLogoImageUrl ? (
            <Image
              src={product.storeLogoImageUrl}
              alt={product.storeName}
              width={14}
              height={14}
              className="w-[14px] h-[14px] rounded-full object-cover"
            />
          ) : (
            <span className="w-[14px] h-[14px] rounded-full bg-primary" />
          )}
          {product.storeName}
        </button>
        <h1 className="text-xl font-bold text-gray-900">{product.name}</h1>
        <div className="flex flex-col">
          {onSale && (
            <span className="text-xs text-gray-500 line-through">
              {product.originalPrice.toLocaleString()}원
            </span>
          )}
          <p className="flex items-center gap-[4px] text-xl font-bold text-gray-900">
            {discountRate != null && <span className="text-[#FF653E]">{discountRate}%</span>}
            {product.salePrice.toLocaleString()}원~
          </p>
        </div>
      </div>
    </div>
  );
}
