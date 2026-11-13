"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import { Icon } from "@/apps/web-user/common/components/icons";
import { usePageScrollLock } from "@/apps/web-user/common/hooks/usePageScrollLock";

interface PhotoReviewImage {
  id: string;
  url: string;
  reviewId: string;
}

interface PhotoReviewListModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: PhotoReviewImage[];
  onImageClick: (reviewId: string) => void;
}

export const PhotoReviewListModal: React.FC<PhotoReviewListModalProps> = ({
  isOpen,
  onClose,
  images,
  onImageClick,
}) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
    }

    return () => {
      document.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, onClose]);

  usePageScrollLock(isOpen);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-modal bg-white max-w-[640px] mx-auto flex flex-col">
      {/* 헤더 */}
      <div className="flex-shrink-0 flex items-center px-[20px] py-[14px] bg-white border-b border-gray-100">
        <button
          type="button"
          onClick={onClose}
          aria-label="뒤로가기"
          className="text-gray-900 h-[24px] w-[24px]"
        >
          <Icon name="chevronLeft" width={24} height={24} />
        </button>
        <span className="flex-1 text-center text-base font-bold text-gray-900 -ml-[24px] pointer-events-none">
          사진후기({images.length})
        </span>
      </div>

      {/* 이미지 그리드 */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-[16px] grid grid-cols-2 gap-[8px]">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => onImageClick(image.reviewId)}
              className="relative w-full aspect-square rounded-lg overflow-hidden"
            >
              <Image src={image.url} alt={`사진 후기 ${index + 1}`} fill className="object-cover" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
