"use client";

import { useState } from "react";
import Image from "next/image";
import { Icon } from "@/apps/web-user/common/components/icons";
import { LikePop } from "@/apps/web-user/common/components/motion/LikePop";
import { StoreInfo } from "@/apps/web-user/features/store/types/store.type";
import { useAddStoreLike } from "@/apps/web-user/features/like/hooks/mutations/useAddStoreLike";
import { useRemoveStoreLike } from "@/apps/web-user/features/like/hooks/mutations/useRemoveStoreLike";
import { Toast } from "@/apps/web-user/common/components/toast/Toast";
import { shortenAddress } from "@/apps/web-user/common/utils/address.util";
import { useUserLocation } from "@/apps/web-user/common/hooks/useUserLocation";
import { calculateDistance, formatDistance } from "@/apps/web-user/common/utils/distance.util";
import { useAuthStore } from "@/apps/web-user/common/store/auth.store";
import { useLoginSheetStore } from "@/apps/web-user/common/store/login-sheet.store";
import { StoreInquiryBottomSheet } from "@/apps/web-user/common/components/bottom-sheets/StoreInquiryBottomSheet";
import {
  storeInstagramUrl,
  storeKakaoChatUrl,
} from "@/apps/web-user/common/utils/external-link.util";

interface StoreDetailIntroSectionProps {
  store: StoreInfo;
}

export function StoreDetailIntroSection({ store }: StoreDetailIntroSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAddressExpanded, setIsAddressExpanded] = useState(false);
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [isLiked, setIsLiked] = useState(store.isLiked ?? false);
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  // 사장님이 적은 카카오톡 채널·인스타·전화 중 하나라도 있으면 "문의"를 보인다(I-61 첫 조각, 2026-11-11)
  const kakaoUrl = storeKakaoChatUrl(store.kakaoChannelId);
  const instaUrl = storeInstagramUrl(store.instagramId);
  const canInquire = !!(kakaoUrl || instaUrl || store.phoneNumber);

  const { mutate: addLike, isPending: isAddingLike } = useAddStoreLike();
  const { mutate: removeLike, isPending: isRemovingLike } = useRemoveStoreLike();
  const isLikeLoading = isAddingLike || isRemovingLike;
  const { isAuthenticated } = useAuthStore();
  const openLoginSheet = useLoginSheetStore((s) => s.openLoginSheet);

  const { location: userLocation } = useUserLocation();
  const distance =
    userLocation !== null
      ? calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          store.latitude,
          store.longitude,
        )
      : null;

  const handleAddressCopy = () => {
    navigator.clipboard.writeText(store.roadAddress);
    setShowCopyToast(true);
  };

  const handleLikeToggle = () => {
    if (!isAuthenticated) {
      openLoginSheet("like_button");
      return;
    }
    if (isLikeLoading) return;
    setIsLiked(!isLiked);
    if (isLiked) {
      removeLike(store.id, { onError: () => setIsLiked(true) });
    } else {
      addLike(store.id, { onError: () => setIsLiked(false) });
    }
  };

  // 설명 텍스트 줄임 처리
  const maxLength = 60;
  const shouldTruncate = store.description && store.description.length > maxLength;
  const displayDescription =
    isExpanded || !shouldTruncate
      ? store.description
      : `${store.description?.slice(0, maxLength)}...`;

  return (
    <div className="py-6">
      {/* 상단 영역: 로고 + 정보 + 좋아요 */}
      <div className="flex items-center gap-[11px] mb-[16px]">
        {/* 로고 이미지 */}

        <div className="w-12 h-12 relative rounded-full overflow-hidden flex-shrink-0">
          {store.logoImageUrl ? (
            <Image
              src={store.logoImageUrl}
              alt={`${store.name} 로고`}
              fill
              sizes="48px"
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <Icon name="noneStore" width={48} height={48} />
            </div>
          )}
        </div>

        {/* 스토어 정보 */}
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900">{store.name}</h1>
          <div className="flex items-center">
            <Icon name="star" width={16} height={16} className="text-yellow-400" />
            <span className="ml-[2px] text-xs text-gray-500 font-bold">{store.averageRating}</span>
            <span className="relative ml-[16px] text-xs text-gray-500 font-bold after:content-[''] after:absolute after:top-1/2 after:left-[-8px] after:w-[1px] after:h-[8px] after:bg-gray-500 after:transform after:translate-y-[-50%]">
              후기 {store.totalReviewCount}개
            </span>
          </div>
        </div>

        {/* 문의 버튼: 주문 화면의 "스토어 문의"와 같은 창 */}
        {canInquire && (
          <button
            type="button"
            onClick={() => setIsInquiryOpen(true)}
            className="flex items-center gap-1 px-[8px] py-[6px] border border-gray-100 rounded-md"
          >
            <Icon name="reviewQna" width={18} height={18} className="text-gray-900" />
            <span className="text-sm font-bold text-gray-900">문의</span>
          </button>
        )}

        {/* 좋아요 버튼 */}
        <button
          type="button"
          onClick={handleLikeToggle}
          disabled={isLikeLoading}
          className={`flex items-center gap-1 px-[8px] py-[6px] border border-gray-100 rounded-md ${isLikeLoading ? "opacity-50" : ""}`}
        >
          <LikePop liked={isLiked}>
            <Icon
              name={isLiked ? "favoriteFilled" : "favorite"}
              width={18}
              height={18}
              className={isLiked ? "text-primary" : "text-gray-900"}
            />
          </LikePop>
          <span className="text-sm font-bold text-gray-900">{store.likeCount}</span>
        </button>
      </div>

      {/* 위치 정보 */}
      <div className="mb-[10px]">
        {/* 윗줄: 짧은 주소 + 펼치기/접기 토글 */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsAddressExpanded((prev) => !prev)}
            className="flex items-center gap-1"
          >
            <Icon name="location" width={16} height={16} className="text-primary-300" />
            {distance !== null && (
              <>
                <span className="text-sm text-gray-900">{formatDistance(distance)}</span>
                <span className="text-sm text-gray-900">·</span>
              </>
            )}
            <span className="text-sm text-gray-900">{shortenAddress(store.roadAddress)}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsAddressExpanded((prev) => !prev)}
            className="flex items-center justify-center ml-[2px]"
          >
            <Icon
              name="arrow"
              width={16}
              height={16}
              className={`text-gray-400 transition-transform ${isAddressExpanded ? "" : "rotate-180"}`}
            />
          </button>
        </div>

        {/* 아랫줄: 전체 주소 + 복사 아이콘 (펼쳤을 때만 표시, 클릭 시 복사) */}
        {isAddressExpanded && (
          <button
            type="button"
            onClick={handleAddressCopy}
            className="flex items-center gap-1 mt-[2px] ml-[20px]"
          >
            <span className="text-sm text-gray-500">{store.roadAddress}</span>
            <Icon name="copy" width={16} height={16} className="text-gray-500" />
          </button>
        )}
      </div>

      <StoreInquiryBottomSheet
        isOpen={isInquiryOpen}
        onClose={() => setIsInquiryOpen(false)}
        kakaoChannelUrl={kakaoUrl}
        instagramUrl={instaUrl}
        phoneNumber={store.phoneNumber}
      />

      {showCopyToast && (
        <Toast
          message="주소가 복사됐어요!"
          iconName="checkCircle"
          iconClassName="text-green-400"
          variant="row"
          onClose={() => setShowCopyToast(false)}
        />
      )}

      {/* 설명 */}
      {store.description && (
        <div className="px-[16px] py-[12px] bg-gray-50 rounded-lg">
          <p className="text-2sm text-gray-900 leading-relaxed whitespace-pre-line">
            {displayDescription}
            {shouldTruncate && !isExpanded && (
              <button
                onClick={() => setIsExpanded(true)}
                className="text-gray-400 ml-1 hover:text-gray-600"
              >
                더보기
              </button>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
