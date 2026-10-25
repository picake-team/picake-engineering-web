"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Product } from "@/apps/web-user/features/product/types/product.type";
import { Icon } from "@/apps/web-user/common/components/icons";
import { useAddProductLike } from "@/apps/web-user/features/like/hooks/mutations/useAddProductLike";
import { useRemoveProductLike } from "@/apps/web-user/features/like/hooks/mutations/useRemoveProductLike";
import { formatAddress } from "@/apps/web-user/common/utils/address.util";
import { useAuthStore } from "@/apps/web-user/common/store/auth.store";
import { useLoginSheetStore } from "@/apps/web-user/common/store/login-sheet.store";
import { PATHS } from "@/apps/web-user/common/constants/paths.constant";
import { usePrefetchOnVisible } from "@/apps/web-user/common/hooks/usePrefetchOnVisible";

interface CakeListItemProps {
  product: Product;
  /** 카드를 눌렀을 때 이동할 상품 상세 주소 (진입 경로 쿼리 포함). 카드가 보이면 미리 받아둔다. */
  href: string;
}

export function CakeListItem({ product, href }: CakeListItemProps) {
  const [isLiked, setIsLiked] = useState(product.isLiked ?? false);

  const router = useRouter();
  const cardRef = usePrefetchOnVisible<HTMLDivElement>(href);
  const { mutate: addLike, isPending: isAddingLike } = useAddProductLike();
  const { mutate: removeLike, isPending: isRemovingLike } = useRemoveProductLike();
  const isLikeLoading = isAddingLike || isRemovingLike;
  const { isAuthenticated } = useAuthStore();
  const openLoginSheet = useLoginSheetStore((s) => s.openLoginSheet);

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      openLoginSheet("like_button");
      return;
    }
    if (isLikeLoading) return;
    setIsLiked(!isLiked);
    if (isLiked) {
      removeLike(product.id, { onError: () => setIsLiked(true) });
    } else {
      addLike(product.id, { onError: () => setIsLiked(false) });
    }
  };

  const handleStoreClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(PATHS.STORE.DETAIL(product.storeId));
  };

  return (
    <div
      ref={cardRef}
      onClick={() => router.push(href)}
      className="min-w-[164px] bg-white cursor-pointer"
    >
      <div className="w-full aspect-square relative overflow-hidden rounded-xl">
        {product.images && product.images.length > 0 ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="164px"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm font-semibold">
            No Image
          </div>
        )}
        <button
          type="button"
          onClick={handleLikeClick}
          disabled={isLikeLoading}
          className={`absolute bottom-3 right-3 h-[28px] w-[28px] ${isLikeLoading ? "opacity-50" : ""}`}
        >
          <Icon
            name={isLiked ? "favoriteShadowFilled" : "favoriteShadow"}
            width={28}
            height={28}
            className={isLiked ? "text-primary" : "text-white"}
          />
        </button>
      </div>
      <div className="mb-[10px] pt-2">
        <div className="mb-[2px] text-sm text-gray-900">
          <p>{product.name}</p>
          <p className="font-bold">{product.salePrice.toLocaleString()}원~</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-[2px] text-gray-900 font-bold">
            <Icon name="star" width={16} height={16} className="text-yellow-400" />
            {product.averageRating}
          </span>
          <span className="relative text-gray-500 after:content-[''] after:absolute after:top-1/2 after:left-[-8px] after:w-[1px] after:h-[8px] after:bg-gray-300 after:transform after:translate-y-[-50%]">
            {product.totalReviewCount}개 후기
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={handleStoreClick}
        className="inline-flex items-center gap-1 py-1 px-2 text-2xs font-bold text-gray-700 bg-gray-50 rounded-full max-w-full"
      >
        <span>
          {formatAddress(product.pickupAddress)} ·{" "}
          {product.productNoticeProducer.length > 10
            ? `${product.productNoticeProducer.slice(0, 10)}...`
            : product.productNoticeProducer}
        </span>
        <Icon name="arrow" width={16} height={16} className="text-gray-700 rotate-90" />
      </button>
    </div>
  );
}
