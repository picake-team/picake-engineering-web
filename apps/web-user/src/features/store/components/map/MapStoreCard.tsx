"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/apps/web-user/common/components/icons";
import type {
  StoreBusinessCalendar,
  StoreInfo,
} from "@/apps/web-user/features/store/types/store.type";
import { isStoreOpenForPickupNow } from "@/apps/web-user/features/store/utils/store-business-calendar.util";
import { PATHS } from "@/apps/web-user/common/constants/paths.constant";
import { useUserLocation } from "@/apps/web-user/common/hooks/useUserLocation";
import { calculateDistance, formatDistance } from "@/apps/web-user/common/utils/distance.util";
import { useAddStoreLike } from "@/apps/web-user/features/like/hooks/mutations/useAddStoreLike";
import { useRemoveStoreLike } from "@/apps/web-user/features/like/hooks/mutations/useRemoveStoreLike";
import { useAuthStore } from "@/apps/web-user/common/store/auth.store";
import { useLoginSheetStore } from "@/apps/web-user/common/store/login-sheet.store";

const DEFAULT_IMAGE_WIDTH = 134;
const DEFAULT_IMAGE_HEIGHT = 100;
const DEFAULT_IMAGE_GAP = 6;

const MAP_STORE_BADGE_TEXT = {
  fontWeight: 700,
  fontSize: 11,
  lineHeight: "140%" as const,
  padding: "2px 4px",
  borderRadius: 4,
};

function MapStoreBusinessBadge({ calendar }: { calendar: StoreBusinessCalendar }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 60_000);
    return () => window.clearInterval(id);
  }, []);
  const open = isStoreOpenForPickupNow(calendar);
  if (open) {
    return (
      <span
        className="shrink-0 whitespace-nowrap"
        style={{
          ...MAP_STORE_BADGE_TEXT,
          background: "#EBF8FF",
          color: "#009BF5",
        }}
      >
        픽업/예약 가능
      </span>
    );
  }
  return (
    <span
      className="shrink-0 whitespace-nowrap"
      style={{
        ...MAP_STORE_BADGE_TEXT,
        background: "#F5F5F5",
        color: "#82817D",
      }}
    >
      마감
    </span>
  );
}

/** 목록용: useUserLocation 호출 없이 userLocation을 props로만 받음 */
export interface MapStoreCardContentProps {
  store: StoreInfo;
  userLocation: { latitude: number; longitude: number } | null;
  imageWidth?: number;
  imageHeight?: number;
  imageGap?: number;
  variant?: "card" | "list";
}

export function MapStoreCardContent({
  store,
  userLocation,
  imageWidth = DEFAULT_IMAGE_WIDTH,
  imageHeight = DEFAULT_IMAGE_HEIGHT,
  imageGap = DEFAULT_IMAGE_GAP,
  variant = "card",
}: MapStoreCardContentProps) {
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(store.isLiked ?? false);
  const [likeCount, setLikeCount] = useState(store.likeCount);
  const { mutate: addLike, isPending: isAddingLike } = useAddStoreLike();
  const { mutate: removeLike, isPending: isRemovingLike } = useRemoveStoreLike();
  const isLikeLoading = isAddingLike || isRemovingLike;
  const { isAuthenticated } = useAuthStore();
  const openLoginSheet = useLoginSheetStore((s) => s.openLoginSheet);

  useEffect(() => {
    setIsLiked(store.isLiked ?? false);
    setLikeCount(store.likeCount);
  }, [store.id, store.isLiked, store.likeCount]);

  const distance =
    userLocation !== null && store.latitude != null && store.longitude != null
      ? calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          store.latitude,
          store.longitude,
        )
      : null;

  const handleLikeToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      openLoginSheet("like_button");
      return;
    }
    if (isLikeLoading) return;
    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikeCount((prev) => (nextLiked ? prev + 1 : prev - 1));
    const onError = () => {
      setIsLiked(!nextLiked);
      setLikeCount(store.likeCount);
    };
    if (isLiked) {
      removeLike(store.id, { onError });
    } else {
      addLike(store.id, { onError });
    }
  };

  const productImages = store.productRepresentativeImages ?? [];
  const isList = variant === "list";

  return (
    <div
      className="block overflow-hidden"
      style={{
        ...(isList
          ? { background: "#FFFFFF" }
          : {
              boxShadow: "0px 4px 16px 0px #00000029",
              background: "#FFFFFF",
              borderRadius: 16,
              padding: "12px 12px 16px 12px",
            }),
      }}
    >
      {productImages.length > 0 && (
        <div
          className="flex overflow-x-auto scrollbar-hide"
          style={{
            scrollSnapType: "x mandatory",
            gap: imageGap,
            marginBottom: 14,
          }}
        >
          {productImages.map((item) => (
            <button
              key={item.productId}
              type="button"
              onClick={() => router.push(`${PATHS.PRODUCT.DETAIL(item.productId)}?entry_point=map`)}
              className="flex-shrink-0 overflow-hidden bg-gray-100"
              style={{
                scrollSnapAlign: "start",
                width: imageWidth,
                height: imageHeight,
                borderRadius: 10,
              }}
            >
              <Image
                src={item.imageUrl}
                alt={`${store.name} 상품`}
                width={imageWidth}
                height={imageHeight}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      <Link href={PATHS.STORE.DETAIL(store.id)} className="block">
        {productImages.length === 0 && <div className="pt-2" />}
        <div className="flex items-center justify-between gap-2" style={{ marginBottom: 6 }}>
          <div className="flex min-w-0 flex-1 items-center" style={{ gap: 4 }}>
            <h3
              className="min-w-0 shrink grow-0 truncate font-bold text-gray-900"
              style={{ fontSize: 16, lineHeight: "140%" }}
            >
              {store.name}
            </h3>
            {store.businessCalendar ? (
              <MapStoreBusinessBadge calendar={store.businessCalendar} />
            ) : null}
          </div>
          <button
            type="button"
            onClick={handleLikeToggle}
            disabled={isLikeLoading}
            className={`flex items-center justify-center shrink-0 bg-white border border-gray-100 ${isLikeLoading ? "opacity-50" : ""}`}
            style={{ minWidth: 63, height: 32, borderRadius: 8, gap: 4 }}
          >
            <Icon
              name={isLiked ? "favoriteFilled" : "favorite"}
              width={18}
              height={18}
              className={`shrink-0 ${isLiked ? "text-primary" : "text-gray-900"}`}
            />
            <span className="font-bold text-gray-900" style={{ fontSize: 14, lineHeight: "140%" }}>
              {likeCount}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-1">
          <Icon name="star" width={16} height={16} className="text-yellow-400 shrink-0" />
          <span className="font-normal text-gray-700" style={{ fontSize: 13, lineHeight: "140%" }}>
            {store.averageRating}
          </span>
          <span
            className="relative ml-4 font-normal text-gray-700 after:content-[''] after:absolute after:top-1/2 after:left-[-8px] after:w-[1px] after:h-[8px] after:bg-gray-500 after:transform after:translate-y-[-50%]"
            style={{ fontSize: 13, lineHeight: "140%" }}
          >
            후기 {store.totalReviewCount}개
          </span>
        </div>

        {(distance !== null || store.minProductPrice != null) && (
          <div className="flex items-center gap-1">
            {distance !== null && (
              <span
                className="font-normal text-gray-700"
                style={{ fontSize: 13, lineHeight: "140%" }}
              >
                {formatDistance(distance)}
              </span>
            )}
            {distance !== null && store.minProductPrice != null && (
              <span
                className="font-normal text-gray-700"
                style={{ fontSize: 13, lineHeight: "140%" }}
              >
                ·
              </span>
            )}
            {store.minProductPrice != null && (
              <span
                className="font-bold text-gray-900"
                style={{ fontSize: 13, lineHeight: "140%" }}
              >
                {store.minProductPrice.toLocaleString()}원~
              </span>
            )}
          </div>
        )}
      </Link>
    </div>
  );
}

/** 마커 클릭 시 단일 카드용: useUserLocation 호출 후 MapStoreCardContent 렌더 */
interface MapStoreCardProps {
  store: StoreInfo;
  imageWidth?: number;
  imageHeight?: number;
  imageGap?: number;
  variant?: "card" | "list";
}

export function MapStoreCard({
  store,
  imageWidth = DEFAULT_IMAGE_WIDTH,
  imageHeight = DEFAULT_IMAGE_HEIGHT,
  imageGap = DEFAULT_IMAGE_GAP,
  variant = "card",
}: MapStoreCardProps) {
  const { location: userLocation } = useUserLocation();
  return (
    <MapStoreCardContent
      store={store}
      userLocation={userLocation ?? null}
      imageWidth={imageWidth}
      imageHeight={imageHeight}
      imageGap={imageGap}
      variant={variant}
    />
  );
}
