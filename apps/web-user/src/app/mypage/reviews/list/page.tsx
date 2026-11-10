"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Header from "@/apps/web-user/common/components/headers/Header";
import { useWritableReviews } from "@/apps/web-user/features/review/hooks/queries/useWritableReviews";
import type { WritableReviewOrder } from "@/apps/web-user/features/review/types/review.type";
import { EmptyState } from "@/apps/web-user/common/components/fallbacks/EmptyState";
import { trackEvent } from "@/apps/web-user/common/utils/analytics.util";

const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

function formatPickupDate(dateString: string) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const dayOfWeek = DAY_NAMES[date.getDay()];
  return `${year}.${month}.${day}(${dayOfWeek})`;
}

function getProductSummary(order: WritableReviewOrder) {
  const itemCount = order.orderItems.length;
  if (itemCount <= 1) return order.productName;
  return `${order.productName} 외 ${itemCount - 1}`;
}

export default function ReviewListPage() {
  // 내 후기 > 작성후기선택 페이지
  useEffect(() => {
    trackEvent("view_review_option_list");
  }, []);

  const { data } = useWritableReviews();
  const orders = data?.data ?? [];

  return (
    <div>
      <Header variant="back-title" title="작성 후기 선택" />

      <div className="px-5 pt-4 flex flex-col">
        {orders.map((order) => (
          <div key={order.id} className="flex items-center gap-3 py-2.5">
            {/* 상품 이미지 */}
            <div className="relative w-[64px] h-[64px] flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
              {order.productImages?.[0] ? (
                <Image
                  src={order.productImages[0]}
                  alt={order.productName}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200" />
              )}
            </div>

            {/* 주문 정보 */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{order.storeName}</p>
              <p className="text-2sm text-gray-500">{formatPickupDate(order.pickupDate)}</p>
              <p className="text-2sm text-gray-500 mt-1.5 truncate">{getProductSummary(order)}</p>
            </div>

            {/* 후기 작성 버튼 */}
            <Link
              href={`/mypage/reviews/write?orderId=${order.id}`}
              onClick={() => trackEvent("engage_review_write", { reservation_id: order.id })}
              className="flex-shrink-0 flex items-center justify-center bg-primary text-white text-sm font-bold w-24 h-10 rounded-lg"
            >
              후기 작성
            </Link>
          </div>
        ))}

        {data && orders.length === 0 && <EmptyState message="쓸 수 있는 후기가 없어요." fill />}
      </div>
    </div>
  );
}
