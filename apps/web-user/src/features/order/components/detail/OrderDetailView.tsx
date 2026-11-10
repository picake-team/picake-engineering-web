"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  OrderItemResponse,
  OrderResponse,
  OrderStatus,
  OrderMyReviewUiStatus,
} from "@/apps/web-user/features/order/types/order.type";
import { NavigationBottomSheet } from "@/apps/web-user/common/components/bottom-sheets/NavigationBottomSheet";
import { StoreInquiryBottomSheet } from "@/apps/web-user/common/components/bottom-sheets/StoreInquiryBottomSheet";
import { Toast } from "@/apps/web-user/common/components/toast/Toast";
import { ReservationInfoSection } from "./ReservationInfoSection";
import { PaymentInfoSection } from "./PaymentInfoSection";
import { ReservationItemsSection } from "./ReservationItemsSection";
import { NoticeSection } from "./NoticeSection";
import { PaymentPendingCountdownHeader } from "./PaymentPendingCountdownHeader";
import { PickupDateChangeBottomSheet } from "./PickupDateChangeBottomSheet";
import { OptionChangeBottomSheet } from "./OptionChangeBottomSheet";
import {
  InfoNotice,
  SellerMessageNotice,
} from "@/apps/web-user/common/components/notice/InfoNotice";
import { Button } from "@/apps/web-user/common/components/buttons/Button";
import { PATHS } from "@/apps/web-user/common/constants/paths.constant";
import { useStoreDetail } from "@/apps/web-user/features/store/hooks/queries/useStoreDetail";

function getStatusNotice(order: OrderResponse): {
  message: string;
  description?: string;
  isRed: boolean;
} | null {
  switch (order.orderStatus) {
    case OrderStatus.PAYMENT_COMPLETED:
      return { message: "판매자가 입금을 확인하면 예약이 확정돼요.", isRed: false };
    case OrderStatus.CANCEL_REFUND_PENDING:
      return { message: "환불까지 영업일 기준 1~2일 걸릴 수 있어요.", isRed: false };
    case OrderStatus.CANCEL_REFUND_COMPLETED:
      return { message: "환불까지 끝난 취소 건이에요.", isRed: false };
    // 취소완료: 판매자 취소(사유 표시) / 구매자 취소(표시 안 함) / 미입금 자동취소 구분
    case OrderStatus.CANCEL_COMPLETED:
      if (order.sellerCancelReason) {
        return {
          message: "판매자 요청으로 예약이 취소됐어요.",
          description: order.sellerCancelReason,
          isRed: false,
        };
      }
      // 구매자 취소는 안내 없음
      if (order.userCancelReason) return null;
      // 사유 없음 = 미입금으로 인한 자동취소
      return { message: "입금하지 않아 예약이 취소됐어요.", isRed: false };
    case OrderStatus.NO_SHOW:
      return {
        message: "노쇼로 처리된 예약이에요.",
        description: order.sellerNoShowReason ?? undefined,
        isRed: true,
      };
    default:
      return null;
  }
}

interface OrderDetailViewProps {
  order: OrderResponse;
}

export function OrderDetailView({ order }: OrderDetailViewProps) {
  const router = useRouter();
  // 픽업 날짜 변경 바텀시트의 캘린더 휴무일/영업시간 적용용
  const { data: storeDetail } = useStoreDetail(order.storeId);
  const [isMapSheetOpen, setIsMapSheetOpen] = useState(false);
  const [isInquirySheetOpen, setIsInquirySheetOpen] = useState(false);
  const [isPickupDateSheetOpen, setIsPickupDateSheetOpen] = useState(false);
  const [showPickupDateUpdatedToast, setShowPickupDateUpdatedToast] = useState(false);
  const [optionEditTargetItem, setOptionEditTargetItem] = useState<OrderItemResponse | null>(null);
  const [showOptionUpdatedToast, setShowOptionUpdatedToast] = useState(false);

  const isPaymentPending = order.orderStatus === OrderStatus.PAYMENT_PENDING;
  const canWriteReview = order.myReviewUiStatus === OrderMyReviewUiStatus.WRITABLE;

  return (
    <div className={`pt-5 ${canWriteReview ? "pb-[92px]" : ""}`}>
      {/* 입금대기: 상단 카운트다운 + 결제정보 → 예약정보 순서 */}
      {isPaymentPending && (
        <div className="-mt-5 mb-3">
          <PaymentPendingCountdownHeader order={order} />
        </div>
      )}
      {/*
        환불 처리 중인데 환불 계좌가 비어 있는 경우 입력을 유도합니다.
        관리자가 취소완료 주문을 되돌리면 계좌가 비어 있어, 손님이 직접 알려줘야 환불이 진행됩니다.
      */}
      {order.orderStatus === OrderStatus.CANCEL_REFUND_PENDING &&
        !order.refundBankAccountNumber && (
          <div className="px-5 pb-1">
            <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3.5">
              <p className="text-sm font-bold text-gray-900">환불받으실 계좌를 알려주세요</p>
              <p className="mt-1 text-xs text-gray-500">
                입금이 확인되어 환불을 진행하고 있어요. 계좌를 입력해야 환불이 시작돼요.
              </p>
              <button
                type="button"
                onClick={() => router.push(PATHS.ORDER.REFUND_ACCOUNT(order.id))}
                className="mt-3 h-[38px] w-full rounded-lg bg-primary text-sm font-bold text-white"
              >
                환불 계좌 입력하기
              </button>
            </div>
          </div>
        )}
      {(() => {
        const notice = getStatusNotice(order);
        if (!notice) return null;
        return (
          <div className="px-5 py-4">
            {notice.description ? (
              // 판매자 메세지가 있으면 말풍선 꼬리로 안내문과 이어 보이게 한다
              <SellerMessageNotice
                tone={notice.isRed ? "red" : "gray"}
                message={notice.message}
                description={notice.description}
              />
            ) : (
              <InfoNotice tone={notice.isRed ? "red" : "gray"} message={notice.message} />
            )}
          </div>
        );
      })()}
      <div className="flex flex-col gap-10">
        {isPaymentPending ? (
          <div className="flex flex-col gap-10">
            <PaymentInfoSection order={order} />
            <ReservationInfoSection
              order={order}
              onInquiryClick={() => setIsInquirySheetOpen(true)}
              onMapClick={() => setIsMapSheetOpen(true)}
              onChangePickupDate={() => setIsPickupDateSheetOpen(true)}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            <ReservationInfoSection
              order={order}
              onInquiryClick={() => setIsInquirySheetOpen(true)}
              onMapClick={() => setIsMapSheetOpen(true)}
              onChangePickupDate={() => setIsPickupDateSheetOpen(true)}
            />
            <PaymentInfoSection order={order} />
          </div>
        )}

        <ReservationItemsSection
          order={order}
          onChangeOptions={(item) => setOptionEditTargetItem(item)}
        />
        <NoticeSection refundCancellationPolicy={order.storeRefundCancellationPolicy} />

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
          phoneNumber={storeDetail?.phoneNumber}
        />
        <PickupDateChangeBottomSheet
          isOpen={isPickupDateSheetOpen}
          onClose={() => setIsPickupDateSheetOpen(false)}
          orderId={order.id}
          initialPickupDate={order.pickupDate}
          onSuccess={() => setShowPickupDateUpdatedToast(true)}
          businessCalendar={storeDetail?.businessCalendar}
        />
        <OptionChangeBottomSheet
          isOpen={optionEditTargetItem !== null}
          onClose={() => setOptionEditTargetItem(null)}
          order={order}
          item={optionEditTargetItem}
          onSuccess={() => setShowOptionUpdatedToast(true)}
        />
      </div>

      {canWriteReview && (
        <div className="fixed bottom-0 left-0 right-0 mx-auto max-w-[638px] bg-white px-5 py-2.5 shadow-[0_12px_48px_-12px_rgba(0,0,0,0.16)]">
          <Link href={PATHS.REVIEW_WRITE(order.id)}>
            <Button variant="outline">후기 작성</Button>
          </Link>
        </div>
      )}

      {showPickupDateUpdatedToast && (
        <Toast
          message="날짜 변경 완료"
          iconName="checkCircle"
          iconClassName="text-green-400"
          variant="column"
          position="center"
          duration={2000}
          onClose={() => setShowPickupDateUpdatedToast(false)}
        />
      )}

      {showOptionUpdatedToast && (
        <Toast
          message="옵션 변경 완료"
          iconName="checkCircle"
          iconClassName="text-green-400"
          variant="column"
          position="center"
          duration={2000}
          onClose={() => setShowOptionUpdatedToast(false)}
        />
      )}
    </div>
  );
}
