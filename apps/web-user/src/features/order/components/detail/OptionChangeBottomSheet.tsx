"use client";

import { useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { useQueryClient } from "@tanstack/react-query";
import { BottomSheet } from "@/apps/web-user/common/components/bottom-sheets/BottomSheet";
import { Button } from "@/apps/web-user/common/components/buttons/Button";
import { ReservationOptionsView } from "@/apps/web-user/features/product/components/sections/reservation-bottom-sheet/ReservationOptionsView";
import type { OptionsFieldKey } from "@/apps/web-user/features/product/components/sections/reservation-bottom-sheet/types";
import { useProductDetail } from "@/apps/web-user/features/product/hooks/queries/useProductDetail";
import { productQueryKeys } from "@/apps/web-user/features/product/constants/productQueryKeys.constant";
import {
  CustomOptionType,
  VisibleStatus,
} from "@/apps/web-user/features/product/types/product.type";
import {
  calculateItemPrice,
  calculateOptionsPrice,
  findMissingRequiredOption,
  getVisibleCustomOptions,
  selectedOptionsToSelections,
  toOrderItemOptionInputs,
  type OptionSelections,
} from "@/apps/web-user/features/product/utils/custom-option.util";
import { useUploadFile } from "@/apps/web-user/features/upload/hooks/mutations/useUploadFile";
import { OrderItemResponse, OrderResponse } from "@/apps/web-user/features/order/types/order.type";
import { useUpdateReservationOrderItem } from "@/apps/web-user/features/order/hooks/mutations/useUpdateReservationOrderItem";
import { trackEvent } from "@/apps/web-user/common/utils/analytics.util";

interface OptionChangeBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderResponse;
  /** 편집 대상 주문 항목 */
  item: OrderItemResponse | null;
  onSuccess: () => void;
}

/**
 * 예약신청 단계 주문 항목 1개의 옵션 변경.
 * 상품의 현재 옵션으로 다시 고르고, 다른 항목은 주문 시점 옵션·금액을 그대로 둡니다(항목 단건 API).
 */
export function OptionChangeBottomSheet({
  isOpen,
  onClose,
  order,
  item,
  onSuccess,
}: OptionChangeBottomSheetProps) {
  const queryClient = useQueryClient();
  const { data: product } = useProductDetail(order.productId);
  const { mutateAsync: uploadFile } = useUploadFile();
  const { mutate: updateItem } = useUpdateReservationOrderItem();
  // 사진 업로드 → 변경 요청 전 구간을 잠그는 제출 락
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedSizeId, setSelectedSizeId] = useState("");
  const [selectedFlavorId, setSelectedFlavorId] = useState("");
  const [selections, setSelections] = useState<OptionSelections>({});
  const [requestMessage, setRequestMessage] = useState("");
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [invalidFieldSignal, setInvalidFieldSignal] = useState(0);

  const sizeOptions = useMemo(
    () => (product?.cakeSizeOptions ?? []).filter((o) => o.visible === VisibleStatus.ENABLE),
    [product?.cakeSizeOptions],
  );
  const flavorOptions = useMemo(
    () => (product?.cakeFlavorOptions ?? []).filter((o) => o.visible === VisibleStatus.ENABLE),
    [product?.cakeFlavorOptions],
  );
  const customOptions = useMemo(
    () => getVisibleCustomOptions(product?.customOptions),
    [product?.customOptions],
  );

  // 시트 오픈(또는 상품 옵션 갱신) 시 현재 주문 항목 값으로 초기화
  // 판매자가 숨기거나 삭제한 사이즈·맛·옵션값은 비워 두고 다시 고르게 한다
  useEffect(() => {
    if (!isOpen || !item) return;
    setSelectedSizeId(sizeOptions.some((o) => o.id === item.sizeId) ? (item.sizeId ?? "") : "");
    setSelectedFlavorId(
      flavorOptions.some((o) => o.id === item.flavorId) ? (item.flavorId ?? "") : "",
    );
    setSelections(selectedOptionsToSelections(item.selectedOptions));
    setRequestMessage(item.requestMessage ?? "");
    setShowValidationErrors(false);
  }, [isOpen, item, sizeOptions, flavorOptions]);

  if (!item) return null;

  const selectedSize = sizeOptions.find((o) => o.id === selectedSizeId);
  const selectedFlavor = flavorOptions.find((o) => o.id === selectedFlavorId);
  const missingRequiredOption = findMissingRequiredOption(customOptions, selections);
  const firstInvalidField: OptionsFieldKey | null =
    sizeOptions.length > 0 && !selectedSize
      ? "size"
      : flavorOptions.length > 0 && !selectedFlavor
        ? "flavor"
        : missingRequiredOption
          ? `option:${missingRequiredOption.id}`
          : null;

  const handleConfirm = async () => {
    if (!product || isSubmitting) return;
    if (firstInvalidField) {
      setShowValidationErrors(true);
      setInvalidFieldSignal((prev) => prev + 1);
      return;
    }
    setIsSubmitting(true);

    try {
      // 새로 고른 사진만 업로드 (기존 사진 URL은 그대로 유지)
      const uploadedImageUrls: Record<string, string[]> = {};
      for (const option of customOptions) {
        const files = selections[option.id]?.imageFiles ?? [];
        if (option.type !== CustomOptionType.IMAGE || files.length === 0) continue;
        uploadedImageUrls[option.id] = await Promise.all(
          files.map(async (file) => (await uploadFile(file)).fileUrl),
        );
      }

      const itemPrice = calculateItemPrice({
        basePrice: product.salePrice,
        sizePrice: selectedSize?.price,
        flavorPrice: selectedFlavor?.price,
        optionsPrice: calculateOptionsPrice(customOptions, selections),
      });
      // 다른 항목은 저장된 금액 그대로 + 이 항목의 새 금액
      const totalPrice =
        order.orderItems
          .filter((orig) => orig.id !== item.id)
          .reduce((sum, orig) => sum + orig.itemPrice * orig.quantity, 0) +
        itemPrice * item.quantity;

      trackEvent("request_change_reservation", {
        reservation_id: order.id,
        change_type: "product_option",
      });
      updateItem(
        {
          orderId: order.id,
          itemId: item.id,
          body: {
            ...(selectedSize && {
              sizeId: selectedSize.id,
              sizeDisplayName: selectedSize.displayName,
              sizeLengthCm: selectedSize.lengthCm,
              sizeDescription: selectedSize.description,
              sizePrice: selectedSize.price,
            }),
            ...(selectedFlavor && {
              flavorId: selectedFlavor.id,
              flavorDisplayName: selectedFlavor.displayName,
              flavorPrice: selectedFlavor.price,
            }),
            options: toOrderItemOptionInputs(customOptions, selections, uploadedImageUrls),
            ...(requestMessage && { requestMessage }),
            quantity: item.quantity,
            totalPrice,
            productOptionsVersion: product.optionsVersion,
          },
        },
        {
          onSuccess: () => {
            trackEvent("success_change_reservation", {
              reservation_id: order.id,
              change_type: "product_option",
            });
            setIsSubmitting(false);
            onClose();
            onSuccess();
          },
          onError: (error) => {
            setIsSubmitting(false);
            // 판매자가 옵션을 바꿈(409): 최신 옵션을 불러와 다시 고르게 한다
            if (isAxiosError(error) && error.response?.status === 409) {
              queryClient.invalidateQueries({
                queryKey: productQueryKeys.detail(order.productId),
              });
            }
          },
        },
      );
    } catch {
      // 사진 업로드 실패 (업로드 훅이 안내를 띄움)
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={isSubmitting ? () => {} : onClose}
      title="옵션 변경"
      footer={
        <div className="flex gap-2 px-5 py-3">
          <span className="flex-1">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              취소
            </Button>
          </span>
          <span className="flex-[2]">
            <Button onClick={handleConfirm} disabled={!product || isSubmitting}>
              {isSubmitting ? "변경 중..." : "변경완료"}
            </Button>
          </span>
        </div>
      }
    >
      {product ? (
        <ReservationOptionsView
          hideDatePicker
          selectedDate={null}
          sizeOptions={sizeOptions}
          flavorOptions={flavorOptions}
          customOptions={customOptions}
          selectedSizeId={selectedSizeId}
          setSelectedSizeId={setSelectedSizeId}
          selectedFlavorId={selectedFlavorId}
          setSelectedFlavorId={setSelectedFlavorId}
          selections={selections}
          onOptionChange={(optionId, selection) =>
            setSelections((prev) => ({ ...prev, [optionId]: selection }))
          }
          requestMessage={requestMessage}
          setRequestMessage={setRequestMessage}
          handleOpenCalendar={() => {}}
          dateSelectionSignal={0}
          showValidationErrors={showValidationErrors}
          firstInvalidField={firstInvalidField}
          invalidFieldSignal={invalidFieldSignal}
        />
      ) : (
        <div className="px-5 py-8 space-y-4 animate-pulse">
          <div className="h-5 w-40 bg-gray-100 rounded" />
          <div className="h-12 w-full bg-gray-50 rounded" />
          <div className="h-12 w-full bg-gray-50 rounded" />
        </div>
      )}
    </BottomSheet>
  );
}
