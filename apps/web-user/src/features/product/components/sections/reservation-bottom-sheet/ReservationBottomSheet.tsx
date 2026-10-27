"use client";

import { useCallback, useState } from "react";
import { isAxiosError } from "axios";
import { useQueryClient } from "@tanstack/react-query";
import { BottomSheet } from "@/apps/web-user/common/components/bottom-sheets/BottomSheet";
import { Spinner } from "@/apps/web-user/common/components/spinners/Spinner";
import { Modal } from "@/apps/web-user/common/components/modals/Modal";
import { Button } from "@/apps/web-user/common/components/buttons/Button";
import { ReservationBottomSheetProps } from "./types";
import { useReservationBottomSheet } from "./useReservationBottomSheet";
import { useKeyboardOpen } from "@/apps/web-user/common/hooks/useKeyboardOpen";
import { ReservationOptionsView } from "./ReservationOptionsView";
import { ReservationCalendarView } from "./ReservationCalendarView";
import { ReservationConfirmView } from "./ReservationConfirmView";
import { useCreateOrder } from "@/apps/web-user/features/order/hooks/mutations/useCreateOrder";
import { CreateOrderRequest } from "@/apps/web-user/features/order/types/order.type";
import { useUploadFile } from "@/apps/web-user/features/upload/hooks/mutations/useUploadFile";
import { trackEvent } from "@/apps/web-user/common/utils/analytics.util";
import { productQueryKeys } from "@/apps/web-user/features/product/constants/productQueryKeys.constant";
import { CustomOptionType } from "@/apps/web-user/features/product/types/product.type";
import { toOrderItemOptionInputs } from "@/apps/web-user/features/product/utils/custom-option.util";

export function ReservationBottomSheet({
  isOpen,
  productId,
  price,
  cakeTitle,
  cakeImageUrl,
  cakeImages = [],
  cakeSizeOptions,
  cakeFlavorOptions,
  customOptions,
  optionsVersion,
  storeName,
  pickupAddress,
  pickupRoadAddress,
  pickupDetailAddress,
  pickupZonecode,
  pickupLatitude,
  pickupLongitude,
  businessCalendar,
  refundCancellationPolicy,
  onClose,
}: ReservationBottomSheetProps) {
  const queryClient = useQueryClient();
  // 시트를 연 시점의 옵션 버전을 고정한다. 시트가 열린 채 상품이 다시 조회돼도(창 복귀 등)
  // 그 사이 판매자가 옵션을 바꿨다면 서버가 409로 알려 처음부터 다시 고르게 하기 위함
  const [optionsVersionAtOpen] = useState(optionsVersion);
  const { mutate: createOrder } = useCreateOrder();
  const { mutateAsync: uploadFile } = useUploadFile();

  // 클릭 즉시 잠그기 위한 제출 락 (이미지 업로드 → 주문 생성 전 구간 포함)
  // useCreateOrder의 isPending은 업로드가 끝난 뒤에야 true가 되므로 단독으로는 더블클릭을 막지 못함
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * 주문 제출 중에는 시트를 닫지 않는다.
   * 시트는 열릴 때만 마운트되므로, 제출 중에 닫히면 컴포넌트가 언마운트되어
   * useCreateOrder의 onSuccess(완료 페이지 이동)가 실행되지 않는다.
   * 그 경우 서버에는 주문이 생성된 채 화면만 상품 상세에 남는다.
   */
  const handleGuardedClose = useCallback(() => {
    if (isSubmitting) return;
    onClose();
  }, [isSubmitting, onClose]);

  const {
    view,
    setView,
    selectedDate,
    tempSelectedDate,
    setTempSelectedDate,
    tempSelectedTime,
    setTempSelectedTime,
    sizeOptions,
    flavorOptions,
    visibleCustomOptions,
    selectedSizeId,
    setSelectedSizeId,
    selectedFlavorId,
    setSelectedFlavorId,
    selections,
    setOptionSelection,
    requestMessage,
    setRequestMessage,
    showValidationErrors,
    firstInvalidField,
    invalidFieldSignal,
    reserverName,
    setReserverName,
    reserverPhone,
    setReserverPhone,
    agreePayment,
    setAgreePayment,
    agreeRefund,
    setAgreeRefund,
    agreeOptionChange,
    setAgreeOptionChange,
    allAgreed,
    handleToggleAllAgreements,
    orderItems,
    isCancelModalOpen,
    setIsCancelModalOpen,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    totalQuantity,
    totalPrice,
    currentOptionPrice,
    getItemPrice,
    isCalendarValid,
    isAddingFromConfirm,
    isEditingFromConfirm,
    dateSelectionSignal,
    formatDateTime,
    isDateChangeModalOpen,
    setIsDateChangeModalOpen,
    handleOpenCalendar,
    handleCalendarConfirm,
    handleDateChangeConfirm,
    handleDateChangeCancel,
    handleCancelClick,
    handleConfirmCancel,
    handleClose,
    handleGoToConfirm,
    handleQuantityChange,
    handleDeleteClick,
    handleConfirmDelete,
    handleEditItem,
    handleAddNewItem,
  } = useReservationBottomSheet({
    isOpen,
    productId,
    price,
    cakeSizeOptions,
    cakeFlavorOptions,
    customOptions,
    onClose: handleGuardedClose,
  });

  // 모바일 키보드가 올라오면 옵션 선택 뷰의 하단 버튼(취소/선택완료) 숨김
  const isKeyboardOpen = useKeyboardOpen();

  const handleCreateOrder = async () => {
    // 이미 제출 중이면 중복 호출 차단 (더블클릭 방지)
    if (isSubmitting) return;
    setIsSubmitting(true);

    trackEvent("request_reservation", { product_count: totalQuantity, product_id: productId });

    try {
      // 각 항목의 사진첨부형 옵션 사진을 업로드하고 옵션 ID별 URL 받기
      const itemsWithOptions = await Promise.all(
        orderItems.map(async (item) => {
          const uploadedImageUrls: Record<string, string[]> = {};
          for (const option of visibleCustomOptions) {
            const files = item.selections[option.id]?.imageFiles ?? [];
            if (option.type !== CustomOptionType.IMAGE || files.length === 0) continue;
            uploadedImageUrls[option.id] = await Promise.all(
              files.map(async (file) => (await uploadFile(file)).fileUrl),
            );
          }

          const sizeOption = sizeOptions.find((option) => option.id === item.sizeId);
          const flavorOption = flavorOptions.find((option) => option.id === item.flavorId);

          return {
            // 사이즈·맛 (이름·가격은 서버가 ID 기준으로 다시 계산)
            ...(sizeOption && {
              sizeId: sizeOption.id,
              sizeDisplayName: sizeOption.displayName,
              sizeLengthCm: sizeOption.lengthCm,
              sizeDescription: sizeOption.description,
              sizePrice: sizeOption.price,
            }),
            ...(flavorOption && {
              flavorId: flavorOption.id,
              flavorDisplayName: flavorOption.displayName,
              flavorPrice: flavorOption.price,
            }),
            options: toOrderItemOptionInputs(
              visibleCustomOptions,
              item.selections,
              uploadedImageUrls,
            ),
            ...(item.requestMessage && {
              requestMessage: item.requestMessage,
            }),
            quantity: item.quantity,
          };
        }),
      );

      // API 요청 데이터 구성 (주문 시점의 정보 전달)
      const orderRequest: CreateOrderRequest = {
        pickupDate: selectedDate ? selectedDate.toISOString() : "",
        productId,
        productName: cakeTitle,
        productImages: cakeImages.length > 0 ? cakeImages : cakeImageUrl ? [cakeImageUrl] : [],
        totalQuantity,
        totalPrice,
        productOptionsVersion: optionsVersionAtOpen,
        storeName,
        // 예약자 연락처 (입력된 경우만 전달)
        ...(reserverName.trim() && { reservationContactName: reserverName.trim() }),
        ...(reserverPhone.trim() && { reservationPhone: reserverPhone.trim() }),
        // 픽업 정보
        pickupAddress,
        pickupRoadAddress,
        pickupDetailAddress,
        pickupZonecode,
        pickupLatitude,
        pickupLongitude,
        items: itemsWithOptions,
      };

      // API 호출 (성공 시 완료 페이지로 이동하며 언마운트, 실패 시 락 해제)
      createOrder(orderRequest, {
        onError: (error) => {
          setIsSubmitting(false);
          // 판매자가 옵션을 바꿈(409): 안내는 useCreateOrder가 띄우고, 최신 옵션으로 처음부터 다시 고르게 한다
          if (isAxiosError(error) && error.response?.status === 409) {
            queryClient.invalidateQueries({ queryKey: productQueryKeys.detail(productId) });
            onClose();
          }
        },
      });
    } catch {
      // 이미지 업로드 실패 등 주문 생성 이전 단계에서 실패한 경우 락 해제
      setIsSubmitting(false);
    }
  };

  const getTitle = () => {
    if (view === "options") return "상품 옵션 선택";
    if (view === "calendar") return "날짜 선택";
    return "주문확인";
  };

  const renderFooter = () => {
    if (view === "options") {
      // 키보드가 올라온 동안에는 하단 버튼을 숨겨 입력 영역을 가리지 않도록 함
      if (isKeyboardOpen) return null;
      const confirmButtonText = isAddingFromConfirm ? "추가완료" : "선택완료";
      return (
        <div className="px-[20px]">
          <div className="flex items-center justify-between pt-[14px]">
            <span className="text-sm text-gray-700">총 금액</span>
            <span className="text-xl font-bold text-gray-900">
              {currentOptionPrice.toLocaleString()}원
            </span>
          </div>
          <div className="py-[12px] flex gap-[8px]">
            <span className="w-[100px]">
              <Button variant="outline" onClick={handleCancelClick}>
                취소
              </Button>
            </span>
            <span className="flex-1">
              {/* 비어 있는 필수 항목이 있으면 누를 때 해당 위치로 이동하고 오류를 보여준다 */}
              <Button onClick={handleGoToConfirm}>{confirmButtonText}</Button>
            </span>
          </div>
        </div>
      );
    }

    if (view === "calendar") {
      return (
        <div className="px-[20px] py-[12px] flex gap-[8px]">
          <span className="w-[100px]">
            <Button variant="outline" onClick={() => setView("options")}>
              닫기
            </Button>
          </span>
          <span className="flex-1">
            <Button onClick={handleCalendarConfirm} disabled={!isCalendarValid}>
              선택완료
            </Button>
          </span>
        </div>
      );
    }

    return (
      <div className="px-[20px]">
        <div className="flex items-center justify-between pt-[14px]">
          <span className="text-sm text-gray-700">총 금액 ({totalQuantity}개)</span>
          <span className="text-xl font-bold text-gray-900">{totalPrice.toLocaleString()}원</span>
        </div>
        <div className="py-[12px]">
          <Button
            onClick={handleCreateOrder}
            disabled={
              orderItems.length === 0 ||
              !reserverName.trim() ||
              !reserverPhone.trim() ||
              !allAgreed ||
              isSubmitting
            }
          >
            {isSubmitting ? (
              <span className="inline-flex items-center justify-center">
                <Spinner size={20} className="text-white" />
              </span>
            ) : (
              "예약신청"
            )}
          </Button>
        </div>
      </div>
    );
  };

  const renderOptionsView = () => (
    <ReservationOptionsView
      selectedDate={selectedDate}
      sizeOptions={sizeOptions}
      flavorOptions={flavorOptions}
      customOptions={visibleCustomOptions}
      selectedSizeId={selectedSizeId}
      setSelectedSizeId={setSelectedSizeId}
      selectedFlavorId={selectedFlavorId}
      setSelectedFlavorId={setSelectedFlavorId}
      selections={selections}
      onOptionChange={setOptionSelection}
      requestMessage={requestMessage}
      setRequestMessage={setRequestMessage}
      handleOpenCalendar={handleOpenCalendar}
      dateSelectionSignal={dateSelectionSignal}
      isAddingFromConfirm={isAddingFromConfirm && orderItems.length > 0}
      isEditingFromConfirm={isEditingFromConfirm && orderItems.length > 1}
      showValidationErrors={showValidationErrors}
      firstInvalidField={firstInvalidField}
      invalidFieldSignal={invalidFieldSignal}
    />
  );

  const renderCalendarView = () => (
    <ReservationCalendarView
      tempSelectedDate={tempSelectedDate}
      setTempSelectedDate={setTempSelectedDate}
      tempSelectedTime={tempSelectedTime}
      setTempSelectedTime={setTempSelectedTime}
      businessCalendar={businessCalendar}
    />
  );

  const renderConfirmView = () => (
    <ReservationConfirmView
      orderItems={orderItems}
      cakeTitle={cakeTitle}
      cakeImageUrl={cakeImageUrl}
      customOptions={visibleCustomOptions}
      getItemPrice={getItemPrice}
      selectedDate={selectedDate}
      formatDateTime={formatDateTime}
      handleEditItem={handleEditItem}
      handleDeleteClick={handleDeleteClick}
      handleQuantityChange={handleQuantityChange}
      handleAddNewItem={handleAddNewItem}
      reserverName={reserverName}
      setReserverName={setReserverName}
      reserverPhone={reserverPhone}
      setReserverPhone={setReserverPhone}
      agreePayment={agreePayment}
      setAgreePayment={setAgreePayment}
      agreeRefund={agreeRefund}
      setAgreeRefund={setAgreeRefund}
      agreeOptionChange={agreeOptionChange}
      setAgreeOptionChange={setAgreeOptionChange}
      allAgreed={allAgreed}
      handleToggleAllAgreements={handleToggleAllAgreements}
      refundCancellationPolicy={refundCancellationPolicy}
    />
  );

  return (
    <>
      <BottomSheet
        isOpen={isOpen}
        onClose={handleClose}
        title={getTitle()}
        footer={renderFooter()}
        fullScreen={view === "confirm"}
        scrollResetKey={view}
      >
        {view === "options" && renderOptionsView()}
        {view === "calendar" && renderCalendarView()}
        {view === "confirm" && renderConfirmView()}
      </BottomSheet>

      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="예약 진행 취소"
        description="예약 진행을 취소하시겠습니까?"
        confirmText="계속 진행하기"
        cancelText="취소"
        onCancel={handleConfirmCancel}
      />

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="상품 삭제"
        description="해당 상품을 삭제하시겠습니까?"
        confirmText="취소"
        cancelText="삭제"
        onCancel={handleConfirmDelete}
      />

      <Modal
        isOpen={isDateChangeModalOpen}
        onClose={() => setIsDateChangeModalOpen(false)}
        title="픽업 날짜 변경"
        description="픽업 날짜 변경 시 주문하는 다른 상품들의 픽업 날짜도 함께 변경됩니다."
        confirmText="변경취소"
        cancelText="확인"
        confirmVariant="outline"
        cancelVariant="primary"
        onConfirm={handleDateChangeCancel}
        onCancel={handleDateChangeConfirm}
      />
    </>
  );
}
