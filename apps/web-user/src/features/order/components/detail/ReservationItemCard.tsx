"use client";

import Image from "next/image";
import {
  formatSelectedOptionValue,
  getFirstOptionImageUrl,
} from "@/apps/web-user/features/product/utils/custom-option.util";
import { CustomOptionType } from "@/apps/web-user/features/product/types/product.type";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/apps/web-user/common/components/icons";
import { PATHS } from "@/apps/web-user/common/constants/paths.constant";
import {
  OrderResponse,
  OrderItemResponse,
  OrderStatus,
} from "@/apps/web-user/features/order/types/order.type";
import { OrderStatusBadge } from "@/apps/web-user/features/order/components/OrderStatusBadge";

interface ReservationItemCardProps {
  order: OrderResponse;
  item: OrderItemResponse;
  onChangeOptions?: (item: OrderItemResponse) => void;
  /** 취소 상태에서 "취소 상세" 버튼 숨김 (이미 취소 상세 페이지에서 렌더링할 때 사용) */
  hideCancelDetailButton?: boolean;
}

export function ReservationItemCard({
  order,
  item,
  onChangeOptions,
  hideCancelDetailButton = false,
}: ReservationItemCardProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const thumbnailUrl = order.productImages?.[0] || getFirstOptionImageUrl(item.selectedOptions);
  // 취소/환불 대기 상태에서 흐리게 처리 — 취소 상세 페이지 안에서는 강조해야 하므로 제외
  const isCancelled =
    !hideCancelDetailButton &&
    (order.orderStatus === OrderStatus.CANCEL_REFUND_PENDING ||
      order.orderStatus === OrderStatus.CANCEL_REFUND_COMPLETED ||
      order.orderStatus === OrderStatus.CANCEL_COMPLETED);

  return (
    <div className="rounded-xl bg-gray-25 border border-gray-100 overflow-hidden">
      <div className="p-3">
        <div className="flex gap-3">
          <div
            className={`w-[72px] h-[72px] rounded-lg overflow-hidden bg-gray-100 shrink-0 ${isCancelled ? "opacity-30" : ""}`}
          >
            {thumbnailUrl ? (
              <Image
                src={thumbnailUrl}
                alt={order.productName}
                width={72}
                height={72}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-100" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <p className={`text-xs text-gray-500 pt-1 ${isCancelled ? "opacity-30" : ""}`}>
                예약상품
              </p>
              <OrderStatusBadge status={order.orderStatus} />
            </div>
            <p
              className={`text-sm text-gray-900 mt-0.5 truncate ${isCancelled ? "opacity-30" : ""}`}
            >
              {order.productName} ×{item.quantity}
            </p>
            <p
              className={`text-base font-bold text-gray-900 mt-1 ${isCancelled ? "opacity-30" : ""}`}
            >
              {item.itemPrice.toLocaleString()}원
            </p>
          </div>
        </div>
        {(() => {
          const buttonClass =
            "flex-1 h-[32px] rounded-lg border border-gray-100 text-xs font-bold text-gray-900 bg-white";
          const status = order.orderStatus;

          if (status === OrderStatus.RESERVATION_REQUESTED) {
            return (
              <div className="flex mt-3">
                <button
                  type="button"
                  onClick={() => onChangeOptions?.(item)}
                  className={buttonClass}
                >
                  옵션변경
                </button>
              </div>
            );
          }

          if (
            (status === OrderStatus.CANCEL_REFUND_PENDING ||
              status === OrderStatus.CANCEL_REFUND_COMPLETED ||
              status === OrderStatus.CANCEL_COMPLETED) &&
            !hideCancelDetailButton
          ) {
            return (
              <div className="flex mt-3">
                <button
                  type="button"
                  onClick={() => router.push(PATHS.ORDER.CANCEL_DETAIL(order.id))}
                  className={buttonClass}
                >
                  취소 상세
                </button>
              </div>
            );
          }

          return null;
        })()}
      </div>
      {expanded && (
        <div className="px-4 py-3 border-t border-gray-100 space-y-2 text-xs text-gray-700 bg-gray-50">
          <div>
            <p className="text-xs text-gray-500">상품명</p>
            <div className="flex items-center justify-between text-2sm text-gray-900">
              <span>{order.productName}</span>
              <span>{item.itemPrice.toLocaleString()}원</span>
            </div>
          </div>
          {item.sizeDisplayName && (
            <div>
              <p className="text-xs text-gray-500">사이즈</p>
              <div className="flex items-center justify-between text-2sm text-gray-900">
                <span>{item.sizeDisplayName}</span>
                <span>+{item.sizePrice?.toLocaleString()}원</span>
              </div>
            </div>
          )}
          {item.flavorDisplayName && (
            <div>
              <p className="text-xs text-gray-500">맛</p>
              <div className="flex items-center justify-between text-2sm text-gray-900">
                <span>{item.flavorDisplayName}</span>
                <span>+{item.flavorPrice?.toLocaleString()}원</span>
              </div>
            </div>
          )}
          {item.selectedOptions.map((option) => (
            <div key={option.optionId}>
              <p className="text-xs text-gray-500">{option.name}</p>
              {option.type === CustomOptionType.IMAGE ? (
                <div className="flex gap-1.5 mt-1">
                  {(option.imageUrls ?? []).map((url, index) => (
                    <img
                      key={`${url}-${index}`}
                      src={url}
                      alt={`${option.name} ${index + 1}`}
                      className="w-[44px] h-[44px] rounded object-cover border border-gray-100"
                    />
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-between text-2sm text-gray-900">
                  <span className="whitespace-pre-wrap">{formatSelectedOptionValue(option)}</span>
                  {option.price > 0 && <span>+{option.price.toLocaleString()}원</span>}
                </div>
              )}
            </div>
          ))}
          {item.requestMessage && (
            <div>
              <p className="text-xs text-gray-500">요청사항</p>
              <p className="text-2sm text-gray-900">{item.requestMessage}</p>
            </div>
          )}
        </div>
      )}
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex items-center justify-center gap-1 w-full py-2.5 text-2sm text-gray-900 border-t border-gray-100 bg-gray-50"
      >
        상세 보기
        <Icon
          name="arrow"
          width={16}
          height={16}
          className={`text-gray-300 transition-transform ${expanded ? "rotate-0" : "rotate-180"}`}
        />
      </button>
    </div>
  );
}
