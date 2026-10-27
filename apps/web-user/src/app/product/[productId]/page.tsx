"use client";

import { use, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useProductDetail } from "@/apps/web-user/features/product/hooks/queries/useProductDetail";
import { useProductReviews } from "@/apps/web-user/features/review/hooks/queries/useProductReviews";
import { useAddProductLike } from "@/apps/web-user/features/like/hooks/mutations/useAddProductLike";
import { useRemoveProductLike } from "@/apps/web-user/features/like/hooks/mutations/useRemoveProductLike";
import { ProductDetailImageGallerySection } from "@/apps/web-user/features/product/components/sections/ProductDetailImageGallerySection";
import { ProductDetailInfoSection } from "@/apps/web-user/features/product/components/sections/ProductDetailInfoSection";
import { ProductDetailDescriptionSection } from "@/apps/web-user/features/product/components/sections/ProductDetailDescriptionSection";
import { ProductDetailInformationNoticeSection } from "@/apps/web-user/features/product/components/sections/ProductDetailInformationNoticeSection";
import { ProductDetailReviewSection } from "@/apps/web-user/features/product/components/sections/ProductDetailReviewSection";
import { Tabs } from "@/apps/web-user/common/components/tabs/Tabs";
import { ProductDetailSizeFlavorSection } from "@/apps/web-user/features/product/components/sections/ProductDetailSizeFlavorSection";
import { Icon } from "@/apps/web-user/common/components/icons";
import { Button } from "@/apps/web-user/common/components/buttons/Button";
import {
  ReservationBottomSheet,
  preloadReservationBottomSheet,
} from "@/apps/web-user/features/product/components/sections/reservation-bottom-sheet";
import { ProductDetailSkeleton } from "@/apps/web-user/common/components/skeleton/ProductDetailSkeleton";
import { useStoreDetail } from "@/apps/web-user/features/store/hooks/queries/useStoreDetail";
import { useAuthStore } from "@/apps/web-user/common/store/auth.store";
import { useLoginSheetStore } from "@/apps/web-user/common/store/login-sheet.store";
import { trackEvent } from "@/apps/web-user/common/utils/analytics.util";
import type {
  ProductEntryPoint,
  ProductTabName,
} from "@/apps/web-user/common/types/analytics.type";

const PRODUCT_ENTRY_POINTS: ProductEntryPoint[] = ["home", "search", "category", "map"];

/** 탭 id → 텍소노미 tab_name 매핑 */
const TAB_NAME_MAP: Record<string, ProductTabName> = {
  detail: "detail",
  "size-flavor": "size_taste",
  review: "review",
  notice: "info",
};

interface ProductDetailPageProps {
  params: Promise<{ productId: string }>;
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { productId } = use(params);
  const searchParams = useSearchParams();
  // 상품 상세 진입 경로. 목록에서 진입 시 쿼리로 전달되며, 그 외(최근본/찜 등)는 home으로 집계
  const entryPointParam = searchParams.get("entry_point");
  const entryPoint: ProductEntryPoint = PRODUCT_ENTRY_POINTS.includes(
    entryPointParam as ProductEntryPoint,
  )
    ? (entryPointParam as ProductEntryPoint)
    : "home";
  const { data, isLoading } = useProductDetail(productId);
  const { data: reviewData } = useProductReviews({ productId });
  const { mutate: addLike, isPending: isAddingLike } = useAddProductLike();
  const { mutate: removeLike, isPending: isRemovingLike } = useRemoveProductLike();
  // 예약 바텀시트 캘린더에서 휴무일 disable + 영업시간 노출용 영업 캘린더
  const { data: storeDetail } = useStoreDetail(data?.storeId ?? "");

  const [isLiked, setIsLiked] = useState(false);
  const isLikeLoading = isAddingLike || isRemovingLike;

  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const openLoginSheet = useLoginSheetStore((s) => s.openLoginSheet);

  const handleReservationClick = () => {
    trackEvent("engage_reservation");

    if (!isAuthenticated) {
      openLoginSheet("reservation_button");
      return;
    }
    setIsBottomSheetOpen(true);
  };

  /**
   * 예약 시트 청크는 초기 렌더 경로에서 빼되(아래 조건부 렌더),
   * 브라우저가 한가할 때 미리 받아둬 "예약하기"를 눌렀을 때 지연이 없도록 한다.
   */
  useEffect(() => {
    const idle = window.requestIdleCallback;
    if (typeof idle === "function") {
      const id = idle(() => preloadReservationBottomSheet());
      return () => window.cancelIdleCallback?.(id);
    }
    // requestIdleCallback 미지원(iOS Safari 16.3 이하) 대비
    const timer = window.setTimeout(preloadReservationBottomSheet, 2000);
    return () => window.clearTimeout(timer);
  }, []);

  // 상품 상세 페이지 노출
  const isDataLoaded = !!data;
  useEffect(() => {
    if (!isDataLoaded) return;
    trackEvent("view_product_detail", { product_id: productId, entry_point: entryPoint });
  }, [isDataLoaded, productId, entryPoint]);

  // 서버에서 isLiked 값이 변경되면 로컬 상태 동기화
  useEffect(() => {
    if (data?.isLiked !== undefined && data?.isLiked !== null) {
      setIsLiked(data.isLiked);
    }
  }, [data?.isLiked]);

  const handleLikeToggle = () => {
    if (!isAuthenticated) {
      openLoginSheet("like_button");
      return;
    }
    if (isLikeLoading) return;

    // 낙관적 업데이트
    setIsLiked(!isLiked);

    if (isLiked) {
      removeLike(productId, {
        onError: () => setIsLiked(true),
      });
    } else {
      addLike(productId, {
        onError: () => setIsLiked(false),
      });
    }
  };

  if (isLoading) {
    return <ProductDetailSkeleton />;
  }

  if (!data) {
    return (
      <div className="w-full mx-auto px-5 py-6 text-center text-gray-500">
        상품 정보를 불러오지 못했습니다.
      </div>
    );
  }

  return (
    <div className="pb-[100px]">
      {/* 이미지 갤러리 */}
      <ProductDetailImageGallerySection images={data.images} productName={data.name} />
      {/* 상품 정보 */}
      <ProductDetailInfoSection product={data} />

      {/* 탭 영역 */}
      <Tabs
        defaultTab="detail"
        scrollOnSelect
        swipeable
        onTabChange={(tabId) => {
          const tabName = TAB_NAME_MAP[tabId];
          if (tabName) trackEvent("engage_product_tab_menu", { tab_name: tabName });
        }}
        tabs={[
          {
            id: "detail",
            label: "상세정보",
            content: <ProductDetailDescriptionSection detailDescription={data.detailDescription} />,
          },
          {
            id: "size-flavor",
            label: "사이즈·맛",
            content: (
              <ProductDetailSizeFlavorSection
                cakeSizeOptions={data.cakeSizeOptions}
                cakeFlavorOptions={data.cakeFlavorOptions}
              />
            ),
          },
          {
            id: "review",
            label: `후기 ${reviewData?.meta.totalItems ?? 0}`,
            content: <ProductDetailReviewSection productId={productId} />,
          },
          {
            id: "notice",
            label: "이용안내",
            content: (
              <ProductDetailInformationNoticeSection
                product={data}
                cancellationRefundDetailDescription="취소 및 환불규정의 내용이 들어갑니다."
              />
            ),
          },
        ]}
      />

      {/* 예약하기, 좋아요 - 하단 고정 */}
      <div className="fixed bottom-0 left-0 right-0 z-40 mx-auto max-w-[638px] bg-white border-gray-200 flex flex-col shadow-[0_-4px_12px_-4px_rgba(0,0,0,0.16)]">
        <div className="flex items-center gap-[16px] px-[20px] py-[10px]">
          <button
            type="button"
            onClick={handleLikeToggle}
            disabled={isLikeLoading}
            className={`flex flex-col items-center justify-center w-[40px] h-[40px] ${isLikeLoading ? "opacity-50" : ""}`}
          >
            <Icon
              name={isLiked ? "favoriteFilled" : "favorite"}
              width={24}
              height={24}
              className={isLiked ? "text-primary" : "text-gray-500"}
            />
            <span className="text-xs text-gray-900 font-bold">{data.likeCount}</span>
          </button>
          <span className="flex-1">
            <Button
              onClick={handleReservationClick}
              onMouseEnter={preloadReservationBottomSheet}
              onTouchStart={preloadReservationBottomSheet}
            >
              {/* 모든 상품이 예약신청 → 판매자 확인 순서로 진행되므로 문구를 통일 */}
              예약신청
            </Button>
          </span>
        </div>
      </div>

      {/* 예약 바텀시트 — 열릴 때만 마운트해 상세 진입 시 청크 선다운로드를 막는다 */}
      {isBottomSheetOpen && (
        <ReservationBottomSheet
          isOpen={isBottomSheetOpen}
          productId={productId}
          price={data.salePrice}
          cakeTitle={data.name}
          cakeImageUrl={data.images[0] ?? ""}
          cakeImages={data.images}
          cakeSizeOptions={data.cakeSizeOptions}
          cakeFlavorOptions={data.cakeFlavorOptions}
          customOptions={data.customOptions}
          optionsVersion={data.optionsVersion}
          productNoticeProducer={data.productNoticeProducer}
          productNoticeAddress={data.productNoticeAddress}
          storeName={data.storeName}
          pickupAddress={data.pickupAddress}
          pickupRoadAddress={data.pickupRoadAddress}
          pickupDetailAddress={data.pickupDetailAddress}
          pickupZonecode={data.pickupZonecode}
          pickupLatitude={data.pickupLatitude}
          pickupLongitude={data.pickupLongitude}
          businessCalendar={storeDetail?.businessCalendar}
          refundCancellationPolicy={data.storeRefundCancellationPolicy}
          onClose={() => setIsBottomSheetOpen(false)}
        />
      )}
    </div>
  );
}
