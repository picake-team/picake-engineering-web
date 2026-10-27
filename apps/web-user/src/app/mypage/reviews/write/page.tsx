"use client";

import { useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Header from "@/apps/web-user/common/components/headers/Header";
import { PATHS } from "@/apps/web-user/common/constants/paths.constant";
import { Icon } from "@/apps/web-user/common/components/icons";
import { formatOrderItemSummary } from "@/apps/web-user/features/product/utils/custom-option.util";
import { useUploadFile } from "@/apps/web-user/features/upload/hooks/mutations/useUploadFile";
import { useWritableReviews } from "@/apps/web-user/features/review/hooks/queries/useWritableReviews";
import { useCreateReview } from "@/apps/web-user/features/review/hooks/mutations/useCreateReview";
import { Toast } from "@/apps/web-user/common/components/toast/Toast";
import { useKeyboardOpen } from "@/apps/web-user/common/hooks/useKeyboardOpen";
import type { WritableReviewOrderItem } from "@/apps/web-user/features/review/types/review.type";
import { IosCustomSchemeRedirect } from "@/apps/web-user/common/components/deep-link/IosCustomSchemeRedirect";

const MAX_IMAGES = 5;

/**
 * 반별(0.5) 평점 컴포넌트
 * 별의 왼쪽 클릭 → 0.5, 오른쪽 클릭 → 1.0
 */
function HalfStarRating({
  rating,
  onChange,
}: {
  rating: number;
  onChange: (value: number) => void;
}) {
  const handleClick = (starIndex: number, isLeft: boolean) => {
    const value = starIndex + (isLeft ? 0.5 : 1);
    onChange(value);
  };

  return (
    <div className="flex items-center gap-2 justify-center">
      {[0, 1, 2, 3, 4].map((i) => {
        const filled = rating - i;
        let src = "/images/contents/star_none.png";
        if (filled >= 1) src = "/images/contents/star_full.png";
        else if (filled >= 0.5) src = "/images/contents/star_half.png";

        return (
          <div key={i} className="relative w-10 h-10 cursor-pointer">
            <Image src={src} alt={`별 ${i + 1}`} fill className="object-contain" />
            {/* 왼쪽 영역 → 0.5점 */}
            <button
              type="button"
              className="absolute left-0 top-0 w-1/2 h-full bg-transparent border-none cursor-pointer"
              onClick={() => handleClick(i, true)}
              aria-label={`${i + 0.5}점`}
            />
            {/* 오른쪽 영역 → 1점 */}
            <button
              type="button"
              className="absolute right-0 top-0 w-1/2 h-full bg-transparent border-none cursor-pointer"
              onClick={() => handleClick(i, false)}
              aria-label={`${i + 1}점`}
            />
          </div>
        );
      })}
    </div>
  );
}

function OrderItemCard({
  item,
  storeName,
  productName,
  productImage,
}: {
  item: WritableReviewOrderItem;
  storeName: string;
  productName: string;
  productImage?: string;
}) {
  return (
    <div className="flex items-center gap-3 border border-gray-200 rounded-2lg p-3">
      <div className="relative w-[72px] h-[72px] flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
        {productImage ? (
          <Image src={productImage} alt={productName} fill className="object-cover" />
        ) : (
          <div className="w-full h-full bg-gray-200" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500">{storeName}</p>
        <p className="text-sm font-bold text-gray-900 truncate">{productName}</p>
        <p className="text-xs text-gray-500 truncate mt-0.5">{formatOrderItemSummary(item)}</p>
      </div>
    </div>
  );
}

export default function ReviewWritePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data } = useWritableReviews();
  const order = data?.data?.find((o) => o.id === orderId);

  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const { mutate: uploadFile, isPending: isUploading } = useUploadFile();
  const { mutate: createReview, isPending: isSubmitting } = useCreateReview();
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  // 모바일 키보드가 올라오면 하단 고정 버튼 숨김
  const isKeyboardOpen = useKeyboardOpen();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remaining = MAX_IMAGES - imageUrls.length;
    const filesToUpload = Array.from(files).slice(0, remaining);

    filesToUpload.forEach((file) => {
      uploadFile(file, {
        onSuccess: (data) => {
          setImageUrls((prev) => [...prev, data.fileUrl]);
        },
      });
    });

    // input 초기화
    e.target.value = "";
  };

  const handleRemoveImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const isValid = rating > 0 && content.trim().length > 0;

  const handleSubmit = () => {
    if (!isValid || !orderId || isSubmitting) return;
    createReview(
      { orderId, rating, content, imageUrls },
      {
        onSuccess: () => {
          setShowSuccessToast(true);
          setTimeout(() => router.back(), 1500);
        },
      },
    );
  };

  return (
    <div className="flex flex-col min-h-dvh">
      <IosCustomSchemeRedirect />
      <Header variant="back-title" title="후기 작성" backFallbackPath={PATHS.MY_ORDERS} />

      {/* 하단 등록 버튼이 fixed라 문서 흐름에서 빠지므로, 그 높이만큼 여백을 둬 가려지지 않게 한다 */}
      <div className="flex-1 px-5 pt-8 pb-[calc(6rem+env(safe-area-inset-bottom,0px))]">
        {/* 주문 상품 카드 (가로 스크롤) */}
        {order && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {order.orderItems.map((item) => (
              <div key={item.id} className="flex-shrink-0 w-[80%]">
                <OrderItemCard
                  item={item}
                  storeName={order.storeName}
                  productName={order.productName}
                  productImage={order.productImages?.[0]}
                />
              </div>
            ))}
          </div>
        )}

        {/* 별점 */}
        <div className="mt-8">
          <p className="text-center text-base font-bold text-gray-900 mb-4">별점을 입력해주세요.</p>
          <HalfStarRating rating={rating} onChange={setRating} />
        </div>

        {/* 후기 작성 */}
        <div className="mt-8">
          <p className="text-sm font-bold text-gray-900 mb-2">후기 작성</p>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="케이크 맛, 디자인에 대한 후기를 작성해주세요."
            className="w-full h-36 p-4 border border-gray-200 rounded-md text-sm text-gray-900 placeholder:text-gray-400 resize-none focus:outline-none focus:border-primary"
          />
        </div>

        {/* 사진 업로드 */}
        <div className="mt-8">
          <p className="text-sm font-bold text-gray-900 mb-2">
            사진 업로드 <span className="font-normal text-gray-400">(선택)</span>
          </p>
          <div className="flex gap-1.5 overflow-x-auto w-full">
            {imageUrls.length < MAX_IMAGES && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className={`flex flex-col items-center justify-center border border-dashed border-gray-200 rounded-lg h-[100px] ${
                  imageUrls.length === 0 ? "w-full" : "w-[100px] shrink-0"
                }`}
              >
                <Icon name="addPhoto" width={24} height={24} className="mb-1 text-gray-300" />
                <span className="text-sm text-gray-300">
                  {imageUrls.length === 0 ? "케이크 사진을 업로드해주세요" : "추가"}
                </span>
                <span className="text-sm text-gray-300">
                  ({imageUrls.length}/{MAX_IMAGES})
                </span>
              </button>
            )}
            {imageUrls.map((url, index) => (
              <div
                key={`${url}-${index}`}
                className="relative h-[100px] w-[100px] rounded-lg shrink-0 border border-gray-100"
              >
                <button
                  type="button"
                  aria-label="첨부 이미지 삭제"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute right-[5px] top-[5px] z-10 border-none bg-transparent cursor-pointer p-0"
                >
                  <Icon name="removePhoto" width={20} height={20} />
                </button>
                <img
                  src={url}
                  alt={`후기 이미지 ${index + 1}`}
                  className="h-full w-full rounded-lg object-cover"
                />
              </div>
            ))}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* 하단 등록 버튼 (키보드가 올라오면 숨김) */}
      <div
        className={`fixed bottom-0 left-0 right-0 px-5 pt-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] bg-white ${isKeyboardOpen ? "hidden" : ""}`}
      >
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isValid || isSubmitting}
          className={`w-full py-4 rounded-xl text-base font-bold border-none cursor-pointer ${
            isValid ? "bg-primary text-white" : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          {isSubmitting ? "등록 중..." : "후기 등록"}
        </button>
      </div>

      {showSuccessToast && (
        <Toast
          message="후기가 등록되었습니다!"
          iconName="checkCircle"
          iconClassName="text-green-400"
          onClose={() => setShowSuccessToast(false)}
        />
      )}
    </div>
  );
}
