"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ImageSlider } from "@/apps/web-user/common/components/sliders/ImageSlider";
import { useLikedStores } from "@/apps/web-user/features/like/hooks/queries/useLikedStores";
import { StoreInfo } from "@/apps/web-user/features/store/types/store.type";
import { useInfiniteScroll } from "@/apps/web-user/common/hooks/useInfiniteScroll";
import { flattenAndDeduplicateInfiniteData } from "@/apps/web-user/common/utils/pagination.util";
import { PATHS } from "@/apps/web-user/common/constants/paths.constant";
import { Icon } from "@/apps/web-user/common/components/icons";
import { useAddStoreLike } from "@/apps/web-user/features/like/hooks/mutations/useAddStoreLike";
import { useRemoveStoreLike } from "@/apps/web-user/features/like/hooks/mutations/useRemoveStoreLike";
import { shortenAddress } from "@/apps/web-user/common/utils/address.util";
import { useUserLocation } from "@/apps/web-user/common/hooks/useUserLocation";
import { calculateDistance, formatDistance } from "@/apps/web-user/common/utils/distance.util";
import { useAuthStore } from "@/apps/web-user/common/store/auth.store";
import { useLoginSheetStore } from "@/apps/web-user/common/store/login-sheet.store";
import { EmptyState } from "@/apps/web-user/common/components/fallbacks/EmptyState";

export function LikedStoreListSection() {
  const router = useRouter();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const { mutate: addLike } = useAddStoreLike();
  const { mutate: removeLike } = useRemoveStoreLike();
  const { location: userLocation } = useUserLocation();
  const { isAuthenticated } = useAuthStore();
  const openLoginSheet = useLoginSheetStore((s) => s.openLoginSheet);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useLikedStores();

  const handleLike = (e: React.MouseEvent, store: StoreInfo) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      openLoginSheet("like_button");
      return;
    }
    if (store.isLiked) {
      removeLike(store.id);
    } else {
      addLike(store.id);
    }
  };

  useInfiniteScroll({ hasNextPage, isFetchingNextPage, fetchNextPage, loadMoreRef });

  const stores = flattenAndDeduplicateInfiniteData<StoreInfo>(data);

  if (isLoading) return <></>;

  if (stores.length === 0) {
    return <EmptyState message="저장한 스토어가 없습니다." fill fillOffset={60} />;
  }

  return (
    <>
      <ul className="flex flex-col gap-6">
        {stores.map((store) => (
          <li key={store.id}>
            <Link href={PATHS.STORE.DETAIL(store.id)} className="py-[10px] block bg-white">
              <div className="flex items-center gap-[11px]">
                <div className="w-[36px] h-[36px] rounded-full overflow-hidden bg-gray-100 shrink-0">
                  {store.logoImageUrl ? (
                    <Image
                      src={store.logoImageUrl}
                      alt={store.name}
                      width={36}
                      height={36}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 truncate">{store.name}</p>
                  <div className="flex items-center gap-[16px] mt-0.5 text-xs text-gray-500 font-bold">
                    <span className="flex items-center gap-1">
                      <Icon name="star" width={16} height={16} className="text-yellow-400" />
                      {store.averageRating}
                    </span>
                    <span className="relative after:content-[''] after:absolute after:top-1/2 after:left-[-8px] after:w-[1px] after:h-[8px] after:bg-gray-300 after:transform after:translate-y-[-50%]">
                      후기 {store.totalReviewCount}개
                    </span>
                  </div>
                </div>
                <button
                  onClick={(e) => handleLike(e, store)}
                  className="flex items-center gap-1 px-2 py-[6px] border border-gray-100 rounded-xl shrink-0"
                >
                  <Icon
                    name={store.isLiked ? "favoriteFilled" : "favorite"}
                    width={18}
                    height={18}
                    className={store.isLiked ? "text-primary" : "text-gray-900"}
                  />
                  <span className="text-sm text-gray-900 font-bold">{store.likeCount}</span>
                </button>
              </div>
              <div className="flex items-center gap-1 mt-3 mb-[10px]">
                <Icon
                  name="location"
                  width={16}
                  height={16}
                  className="text-primary-300 shrink-0"
                />
                {userLocation !== null && (
                  <>
                    <span className="text-sm text-gray-900">
                      {formatDistance(
                        calculateDistance(
                          userLocation.latitude,
                          userLocation.longitude,
                          store.latitude,
                          store.longitude,
                        ),
                      )}
                    </span>
                    <span className="text-sm text-gray-900">·</span>
                  </>
                )}
                <span className="text-sm text-gray-900 truncate">
                  {shortenAddress(store.roadAddress)}
                </span>
              </div>
              {store.productRepresentativeImages.length > 0 && (
                <ImageSlider
                  images={store.productRepresentativeImages.map((item) => ({
                    id: item.productId,
                    url: item.imageUrl,
                  }))}
                  imageWidth={160}
                  imageHeight={120}
                  edgeToEdge={20}
                  onImageClick={(image) => router.push(PATHS.PRODUCT.DETAIL(image.id))}
                />
              )}
            </Link>
          </li>
        ))}
      </ul>
      {hasNextPage && (
        <div ref={loadMoreRef} className="flex justify-center items-center py-8 min-h-[100px]">
          {isFetchingNextPage && (
            <div className="flex flex-col items-center gap-3 text-sm text-gray-400">
              <div className="loading-spinner-small" />
              <span>더 많은 스토어를 불러오는 중...</span>
            </div>
          )}
        </div>
      )}
    </>
  );
}
