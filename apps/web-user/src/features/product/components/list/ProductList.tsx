"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { FadeInImage } from "@/apps/web-user/common/components/motion/FadeInImage";
import { useRouter } from "next/navigation";
import { Product } from "@/apps/web-user/features/product/types/product.type";
import { PATHS } from "@/apps/web-user/common/constants/paths.constant";
import { Icon } from "@/apps/web-user/common/components/icons";
import { LikePop } from "@/apps/web-user/common/components/motion/LikePop";
import { useAddProductLike } from "@/apps/web-user/features/like/hooks/mutations/useAddProductLike";
import { useRemoveProductLike } from "@/apps/web-user/features/like/hooks/mutations/useRemoveProductLike";
import { useAuthStore } from "@/apps/web-user/common/store/auth.store";
import { useLoginSheetStore } from "@/apps/web-user/common/store/login-sheet.store";
import { usePrefetchOnVisible } from "@/apps/web-user/common/hooks/usePrefetchOnVisible";

interface ProductListProps {
  products: Product[];
  /** 서버가 로그인 없이 미리 받은 목록을 보이는 동안: 하트는 누르지 않게(새로 받은 뒤 내 상태로 맞춘다) */
  likeDisabled?: boolean;
}

export function ProductList({ products, likeDisabled = false }: ProductListProps) {
  return (
    <div className="grid grid-cols-2 gap-x-[8px] gap-y-[32px]">
      {products.map((product, index) => (
        <ProductItem
          key={`${product.id}-${index}`}
          product={product}
          likeDisabled={likeDisabled}
          // 첫 줄 두 장은 첫 화면에 보이므로 먼저 받는다
          priority={index < 2}
        />
      ))}
    </div>
  );
}

interface ProductItemProps {
  product: Product;
  likeDisabled: boolean;
  priority: boolean;
}

function ProductItem({ product, likeDisabled, priority }: ProductItemProps) {
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(product.isLiked ?? false);
  // 목록을 새로 받으면(로그인 상태로) 하트도 그 값으로 맞춘다
  useEffect(() => {
    setIsLiked(product.isLiked ?? false);
  }, [product.isLiked]);

  const { mutate: addLike, isPending: isAddingLike } = useAddProductLike();
  const { mutate: removeLike, isPending: isRemovingLike } = useRemoveProductLike();
  const isLikeLoading = isAddingLike || isRemovingLike;
  const { isAuthenticated } = useAuthStore();
  const openLoginSheet = useLoginSheetStore((s) => s.openLoginSheet);

  const ImageTag = priority ? Image : FadeInImage;
  const detailHref = PATHS.PRODUCT.DETAIL(product.id);
  const cardRef = usePrefetchOnVisible<HTMLDivElement>(detailHref);

  const handleProductClick = () => {
    router.push(detailHref);
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      openLoginSheet("like_button");
      return;
    }
    if (isLikeLoading || likeDisabled) return;
    setIsLiked(!isLiked);
    if (isLiked) {
      removeLike(product.id, { onError: () => setIsLiked(true) });
    } else {
      addLike(product.id, { onError: () => setIsLiked(false) });
    }
  };

  return (
    <div ref={cardRef} onClick={handleProductClick} className="press bg-white cursor-pointer">
      {/* 상품 이미지 */}
      <div className="mb-[10px] w-full relative bg-gray-50">
        {product.images && product.images.length > 0 ? (
          <span className="relative w-full h-full aspect-square block overflow-hidden rounded-xl bg-gray-50">
            {/* 첫 줄 두 장은 첫 화면에서 가장 큰 그림이라 서서히 나타나게 하지 않는다(홈 첫 배너와 같음) */}
            <ImageTag
              src={product.images[0]}
              alt={product.name}
              fill
              sizes="(min-width: 640px) 320px, 50vw"
              className="object-cover"
              priority={priority}
            />
          </span>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm font-semibold">
            No Image
          </div>
        )}

        {/* 좋아요 버튼 */}
        <button
          type="button"
          onClick={handleLikeClick}
          disabled={isLikeLoading}
          aria-label={isLiked ? "저장 취소" : "저장"}
          aria-pressed={isLiked}
          className={`absolute bottom-3 right-3 h-[28px] w-[28px] ${isLikeLoading ? "opacity-50" : ""}`}
        >
          <LikePop liked={isLiked}>
            <Icon
              name={isLiked ? "favoriteShadowFilled" : "favoriteShadow"}
              width={28}
              height={28}
              className={isLiked ? "text-primary" : "text-white"}
            />
          </LikePop>
        </button>
      </div>

      {/* 상품 정보 */}
      <div>
        {/* 상품명 */}
        <div className="text-sm text-gray-900 leading-tight">{product.name}</div>

        {/* 가격 */}
        <div className="mb-[2px] text-sm font-bold text-gray-900">
          {product.salePrice.toLocaleString()}원~
        </div>

        {/* 별점 & 후기 */}
        <div className="flex items-center">
          <Icon name="star" width={16} height={16} className="text-yellow-400" />
          <span className="ml-[2px] text-xs text-gray-900 font-bold">{product.averageRating}</span>
          <span className="relative ml-4 text-xs text-gray-500 after:content-[''] after:absolute after:top-1/2 after:left-[-8px] after:w-[1px] after:h-[8px] after:bg-gray-300 after:transform after:translate-y-[-50%]">
            후기 {product.totalReviewCount}
          </span>
        </div>
      </div>
    </div>
  );
}
