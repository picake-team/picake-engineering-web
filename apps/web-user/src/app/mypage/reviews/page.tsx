"use client";

import { useEffect, useState } from "react";
import Header from "@/apps/web-user/common/components/headers/Header";
import { ReviewSortBy } from "@/apps/web-user/features/review/types/review.type";
import { useMyReviews } from "@/apps/web-user/features/review/hooks/queries/useMyReviews";
import { useDeleteMyReview } from "@/apps/web-user/features/review/hooks/mutations/useDeleteMyReview";
import { MyReviewItem } from "@/apps/web-user/features/review/components/MyReviewItem";
import { ReviewDetailModal } from "@/apps/web-user/features/product/components/modals/ReviewDetailModal.dynamic";
import { Toast } from "@/apps/web-user/common/components/toast/Toast";
import { Modal } from "@/apps/web-user/common/components/modals/Modal";
import { MyReviewsSkeleton } from "@/apps/web-user/common/components/skeleton/MyReviewsSkeleton";
import type { Review, MyReview } from "@/apps/web-user/features/review/types/review.type";
import Link from "next/link";
import { Icon } from "@/apps/web-user/common/components/icons";
import { PATHS } from "@/apps/web-user/common/constants/paths.constant";
import { useWritableReviews } from "@/apps/web-user/features/review/hooks/queries/useWritableReviews";
import { EmptyState } from "@/apps/web-user/common/components/fallbacks/EmptyState";
import { trackEvent } from "@/apps/web-user/common/utils/analytics.util";

export default function MyReviewsPage() {
  // 내 후기 페이지
  useEffect(() => {
    trackEvent("view_review_list");
  }, []);

  const [sortBy] = useState<ReviewSortBy>(ReviewSortBy.LATEST);
  const { data } = useMyReviews({ sortBy });
  const { mutate: deleteReview } = useDeleteMyReview();
  const { data: writableData } = useWritableReviews();

  const reviews = data?.data ?? [];

  // URL 해시(#review-{id})로 특정 후기에 스크롤
  useEffect(() => {
    if (!data || reviews.length === 0) return;
    const hash = window.location.hash;
    if (!hash) return;
    const el = document.getElementById(hash.slice(1));
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [data, reviews.length]);
  const totalCount = data?.meta?.totalItems ?? 0;
  const writableCount = writableData?.meta?.totalItems ?? 0;

  const [isReviewDetailModalOpen, setIsReviewDetailModalOpen] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState<string | undefined>(undefined);
  const [modalReviews, setModalReviews] = useState<Review[]>([]);
  const [showDeleteToast, setShowDeleteToast] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const handleImageClick = (review: MyReview) => {
    setSelectedReviewId(review.id);
    setModalReviews([review]);
    setIsReviewDetailModalOpen(true);
  };

  const handleDelete = (reviewId: string) => {
    setDeleteTargetId(reviewId);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!deleteTargetId) return;
    setIsDeleteModalOpen(false);
    deleteReview(deleteTargetId, {
      onSuccess: () => setShowDeleteToast(true),
    });
  };

  return (
    <div>
      <Header variant="back-title" title={`내 후기${data ? ` ${totalCount}` : ""}`} />
      {writableCount > 0 && (
        <div className="px-5 py-3">
          <Link
            href={PATHS.REVIEW_LIST}
            className="flex items-center gap-1.5 border border-primary-100 bg-primary-50 rounded-2xl text-primary py-3.5 px-4"
          >
            <Icon name="reviewFill" width={20} height={20} className="text-primary" />
            <span className="text-sm font-bold">작성 가능 후기 {writableCount}개</span>
            <Icon name="arrow" width={20} height={20} className="text-primary rotate-90 ml-auto" />
          </Link>
        </div>
      )}

      {/* 후기 목록 */}
      <div className="px-5">
        {!data ? (
          <MyReviewsSkeleton />
        ) : reviews.length > 0 ? (
          reviews.map((review) => (
            <MyReviewItem
              key={review.id}
              review={review}
              onDelete={handleDelete}
              onImageClick={handleImageClick}
            />
          ))
        ) : (
          <EmptyState message="후기가 없어요." fill />
        )}
      </div>

      {/* 후기 이미지 상세 모달 */}
      <ReviewDetailModal
        isOpen={isReviewDetailModalOpen}
        onClose={() => setIsReviewDetailModalOpen(false)}
        reviews={modalReviews}
        initialReviewId={selectedReviewId}
      />
      {/* 삭제 확인 모달 */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="삭제하면 다시 쓸 수 없어요."
        description="후기를 삭제할까요?"
        confirmText="취소"
        cancelText="삭제"
        onCancel={handleConfirmDelete}
      />

      {showDeleteToast && (
        <Toast
          message="후기를 삭제했어요"
          iconName="checkCircle"
          iconClassName="text-green-400"
          onClose={() => setShowDeleteToast(false)}
        />
      )}
    </div>
  );
}
