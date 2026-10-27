"use client";

import { useRef, useState } from "react";
import { getFirstOptionImageUrl } from "@/apps/web-user/features/product/utils/custom-option.util";
import { useInfiniteScroll } from "@/apps/web-user/common/hooks/useInfiniteScroll";
import Image from "next/image";
import Link from "next/link";
import { useMyOrders } from "@/apps/web-user/features/order/hooks/queries/useMyOrders";
import {
  OrderResponse,
  OrderItemResponse,
  OrderStatus,
} from "@/apps/web-user/features/order/types/order.type";
import { formatAddressToDistrict } from "@/apps/web-user/common/utils/address.util";
import { OrderDateHeader } from "./OrderDateHeader";
import { OrderActionButtons } from "./OrderActionButtons";
import { OrderStatusBadge } from "@/apps/web-user/features/order/components/OrderStatusBadge";
import { Icon } from "@/apps/web-user/common/components/icons";
import { OrderStatusNotice } from "./OrderStatusNotice";
import { NavigationBottomSheet } from "@/apps/web-user/common/components/bottom-sheets/NavigationBottomSheet";
import { StoreInquiryBottomSheet } from "@/apps/web-user/common/components/bottom-sheets/StoreInquiryBottomSheet";
import { EmptyState } from "@/apps/web-user/common/components/fallbacks/EmptyState";

function formatItemName(order: OrderResponse, item: OrderItemResponse) {
  const parts: string[] = [order.productName];
  if (item.sizeDisplayName) parts.push(item.sizeDisplayName);
  if (item.flavorDisplayName) parts.push(item.flavorDisplayName);
  return parts.join(" ");
}

function UpcomingOrderItem({ order, isLast }: { order: OrderResponse; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [isMapSheetOpen, setIsMapSheetOpen] = useState(false);
  const [isInquirySheetOpen, setIsInquirySheetOpen] = useState(false);
  const visibleItems = expanded ? order.orderItems : order.orderItems.slice(0, 2);
  const hasMore = order.orderItems.length > 2;

  return (
    <div className="relative pl-[30px]">
      <div
        className="absolute top-0 left-0 w-5"
        style={{ height: !isLast ? "calc(100% + 48px)" : "100%" }}
      >
        <span className="absolute top-0 left-0 w-5 h-5 bg-primary-50 rounded-full z-5" />
        <span className="absolute top-[5px] left-[5px] w-2.5 h-2.5 bg-primary-300 rounded-full z-10" />
        {!isLast && (
          <span
            className="absolute top-5 left-[9px] w-0.5 h-[calc(100%-20px)] z-1"
            style={{
              backgroundImage: "url(/images/contents/order_side_line.png)",
              backgroundSize: "2px auto",
              backgroundRepeat: "repeat-y",
              backgroundPosition: "center",
            }}
          />
        )}
      </div>
      <OrderDateHeader pickupDate={order.pickupDate} variant="upcoming" />

      <div className="rounded-xl border border-gray-100 px-4 py-3">
        {/* 스토어 정보 + 예약상세 */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-sm font-bold text-gray-900">{order.storeName}</p>
            <p className="text-2sm text-gray-500">{formatAddressToDistrict(order.pickupAddress)}</p>
          </div>
          <Link
            href={`/order/${order.id}?entry_point=reservation_list`}
            className="flex items-center justify-center w-[46px] h-[21px] text-xs font-bold text-gray-400 underline"
          >
            예약상세
          </Link>
        </div>

        {/* 주문 아이템 목록 */}
        <div className="space-y-2 py-2.5 mb-2.5">
          {visibleItems.map((item) => {
            const thumbnailUrl =
              order.productImages?.[0] || getFirstOptionImageUrl(item.selectedOptions);
            return (
              <div key={item.id} className="flex items-center gap-2.5">
                <div className="w-[44px] h-[44px] rounded overflow-hidden bg-gray-100 shrink-0">
                  {thumbnailUrl ? (
                    <Image
                      src={thumbnailUrl}
                      alt={order.productName}
                      width={44}
                      height={44}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center">
                    <OrderStatusBadge status={order.orderStatus} />
                    <span className="text-sm text-gray-900 truncate ml-1">
                      {formatItemName(order, item)}
                    </span>
                    <span className="flex items-center gap-0.5 ml-0.5 text-sm text-gray-900 shrink-0">
                      <Icon name="multiply" width={8} height={8} /> {item.quantity}
                    </span>
                  </div>
                  <p className="text-sm text-gray-900">{item.itemPrice.toLocaleString()}원</p>
                </div>
              </div>
            );
          })}
          {hasMore && (
            <button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              className="flex items-center justify-end gap-0.5 !mt-2 text-xs text-gray-500 w-full text-center"
            >
              {expanded ? "간략히 보기" : `전체보기 ${order.orderItems.length}`}
              <Icon
                name="arrow"
                width={16}
                height={16}
                className={`text-gray-300 transition-transform ${expanded ? "rotate-0" : "rotate-180"}`}
              />
            </button>
          )}
        </div>

        {/* 상태별 안내 */}
        <OrderStatusNotice order={order} />

        {/* 스토어 문의 / 길찾기 */}
        {/* 입금대기: 버튼 없음 (PaymentPendingInfo에서 별도 처리) */}
        {/* 예약신청, 입금완료, 예약확정, 픽업대기: 스토어 문의 + 길찾기 */}
        {/* 노쇼, 판매자 취소, 환불대기 등: 스토어 문의만 */}
        {order.orderStatus !== OrderStatus.PAYMENT_PENDING && (
          <OrderActionButtons
            buttons={[
              {
                label: "스토어 문의",
                icon: "reviewQna",
                onClick: () => setIsInquirySheetOpen(true),
              },
              ...([
                OrderStatus.RESERVATION_REQUESTED,
                OrderStatus.PAYMENT_COMPLETED,
                OrderStatus.CONFIRMED,
                OrderStatus.PICKUP_PENDING,
              ].includes(order.orderStatus)
                ? [
                    {
                      label: "길찾기" as const,
                      icon: "map" as const,
                      onClick: () => setIsMapSheetOpen(true),
                    },
                  ]
                : []),
            ]}
          />
        )}
      </div>

      <NavigationBottomSheet
        isOpen={isMapSheetOpen}
        onClose={() => setIsMapSheetOpen(false)}
        latitude={order.pickupLatitude}
        longitude={order.pickupLongitude}
        storeName={order.storeName}
      />
      <StoreInquiryBottomSheet
        isOpen={isInquirySheetOpen}
        onClose={() => setIsInquirySheetOpen(false)}
        kakaoChannelUrl={null}
        instagramUrl={null}
        phoneNumber={order.storePhoneNumber}
      />
    </div>
  );
}

export function UpcomingOrderList() {
  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } = useMyOrders({
    type: "UPCOMING",
  });
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    loadMoreRef,
  });

  const orders = [...(data?.pages.flatMap((p) => p.data) ?? [])].sort(
    (a, b) => new Date(a.pickupDate).getTime() - new Date(b.pickupDate).getTime(),
  );

  if (isLoading) {
    return (
      <div className="space-y-4 py-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="flex gap-2 mb-3">
              <div className="h-5 w-10 bg-gray-100 rounded" />
              <div className="h-5 w-40 bg-gray-100 rounded" />
            </div>
            <div className="rounded-xl bg-gray-25 border border-gray-100 p-4">
              <div className="h-4 w-24 bg-gray-100 rounded mb-1" />
              <div className="h-3 w-32 bg-gray-100 rounded mb-3" />
              <div className="flex gap-3 mb-3">
                <div className="w-[48px] h-[48px] rounded-lg bg-gray-100 shrink-0" />
                <div className="flex-1 space-y-1.5 py-1">
                  <div className="h-3 w-36 bg-gray-100 rounded" />
                  <div className="h-4 w-20 bg-gray-100 rounded" />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex-1 h-[40px] bg-gray-100 rounded-lg" />
                <div className="flex-1 h-[40px] bg-gray-100 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return <EmptyState message="예약 내역이 없어요" fill />;
  }

  return (
    <div className="flex flex-col gap-12 pt-2">
      {orders.map((order, index) => (
        <UpcomingOrderItem key={order.id} order={order} isLast={index === orders.length - 1} />
      ))}
      {hasNextPage && <div ref={loadMoreRef} className="h-4" />}
    </div>
  );
}

export function useUpcomingOrderCount() {
  const { data } = useMyOrders({ type: "UPCOMING" });
  return data?.pages[0]?.meta?.totalItems ?? 0;
}
