import { useEffect, useMemo, useRef, useState } from "react";
import { OptionsFieldKey, OrderItem, ViewType } from "./types";
import {
  CakeFlavorOption,
  CakeSizeOption,
  CustomOption,
  VisibleStatus,
} from "@/apps/web-user/features/product/types/product.type";
import {
  calculateItemPrice,
  calculateOptionsPrice,
  findMissingRequiredOption,
  getVisibleCustomOptions,
  type OptionSelection,
  type OptionSelections,
} from "@/apps/web-user/features/product/utils/custom-option.util";
import { useMypageProfile } from "@/apps/web-user/features/mypage/hooks/queries/useMypageProfile";
import { trackEvent } from "@/apps/web-user/common/utils/analytics.util";

interface UseReservationBottomSheetProps {
  isOpen: boolean;
  productId: string;
  price: number;
  cakeSizeOptions?: CakeSizeOption[];
  cakeFlavorOptions?: CakeFlavorOption[];
  customOptions?: CustomOption[];
  onClose: () => void;
}

/**
 * 예약 바텀시트 로직을 관리하는 커스텀 훅
 *
 * 플로우: options(옵션선택) -> calendar(날짜선택) -> confirm(주문확인)
 * - options: 픽업날짜, 사이즈, 맛, 추가 옵션(판매자 설정 순서), 요청사항 선택
 * - calendar: 날짜와 시간 선택 (TimePicker 포함)
 * - confirm: 선택한 상품 목록 확인, 수량 조절, 상품 추가/삭제
 */
export function useReservationBottomSheet({
  isOpen,
  productId,
  price,
  cakeSizeOptions,
  cakeFlavorOptions,
  customOptions,
  onClose,
}: UseReservationBottomSheetProps) {
  // 구매자에게는 노출 중인 옵션만 보여준다 (서버도 걸러 주지만 한 번 더)
  const sizeOptions = useMemo(
    () => (cakeSizeOptions ?? []).filter((option) => option.visible === VisibleStatus.ENABLE),
    [cakeSizeOptions],
  );
  const flavorOptions = useMemo(
    () => (cakeFlavorOptions ?? []).filter((option) => option.visible === VisibleStatus.ENABLE),
    [cakeFlavorOptions],
  );
  const visibleCustomOptions = useMemo(
    () => getVisibleCustomOptions(customOptions),
    [customOptions],
  );

  // ========================================
  // 뷰 상태 관리
  // ========================================
  const [view, setView] = useState<ViewType>("options");

  // 옵션 선택 화면에 머무른 시간 측정용 (request_option_complete의 duration_ms)
  const optionsViewEnteredAtRef = useRef<number | null>(null);
  useEffect(() => {
    if (view === "options") {
      optionsViewEnteredAtRef.current = Date.now();
    }
  }, [view]);

  // 주문 확인 화면 view 이벤트 (재진입 포함, 화면에 노출될 때마다 전송)
  useEffect(() => {
    if (isOpen && view === "confirm") {
      trackEvent("view_order_confirm");
    }
  }, [isOpen, view]);

  // ========================================
  // 날짜/시간 선택 상태
  // - selectedDate: 최종 선택된 날짜+시간
  // - tempSelectedDate/Time: 캘린더에서 임시 선택 중인 값
  // ========================================
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [tempSelectedDate, setTempSelectedDate] = useState<Date | null>(null);
  const [tempSelectedTime, setTempSelectedTime] = useState<Date | null>(null);

  // ========================================
  // 주문 상품 목록 관리
  // - orderItems: 확정된 주문 상품 배열
  // - editingIndex: 수정 중인 상품의 인덱스 (null이면 새 상품 추가 모드)
  // - isAddingFromConfirm: confirm 화면에서 추가/수정으로 진입했는지
  // ========================================
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isAddingFromConfirm, setIsAddingFromConfirm] = useState(false);
  const [isEditingFromConfirm, setIsEditingFromConfirm] = useState(false);
  const [dateSelectionSignal, setDateSelectionSignal] = useState(0);

  // ========================================
  // 현재 편집 중인 상품 옵션
  // (options 뷰에서 사용자가 선택하는 값들)
  // ========================================
  const [selectedSizeId, setSelectedSizeId] = useState("");
  const [selectedFlavorId, setSelectedFlavorId] = useState("");
  const [selections, setSelections] = useState<OptionSelections>({});
  const [requestMessage, setRequestMessage] = useState("");
  // '선택완료'를 눌렀는데 비어 있는 항목이 있으면 오류 표시 + 해당 위치로 스크롤
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [invalidFieldSignal, setInvalidFieldSignal] = useState(0);

  // ========================================
  // 모달 상태 관리
  // - isCancelModalOpen: 작성 취소 확인 모달
  // - isDeleteModalOpen: 상품 삭제 확인 모달
  // ========================================
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDateChangeModalOpen, setIsDateChangeModalOpen] = useState(false);
  const [deleteTargetIndex, setDeleteTargetIndex] = useState<number | null>(null);

  // ========================================
  // 예약자 정보 (confirm 단계에서 입력 — 시트 열릴 때 사용자 정보로 1회 prefill)
  // ========================================
  const { data: profile } = useMypageProfile();
  const [reserverName, setReserverName] = useState("");
  const [reserverPhone, setReserverPhone] = useState("");
  const hasPrefilledReserverRef = useRef(false);

  // ========================================
  // 필수 동의 상태 (confirm 단계)
  // ========================================
  const [agreePayment, setAgreePayment] = useState(false);
  const [agreeRefund, setAgreeRefund] = useState(false);
  const [agreeOptionChange, setAgreeOptionChange] = useState(false);
  const allAgreed = agreePayment && agreeRefund && agreeOptionChange;
  const handleToggleAllAgreements = (next: boolean) => {
    setAgreePayment(next);
    setAgreeRefund(next);
    setAgreeOptionChange(next);
  };

  // 바텀시트가 닫힐 때 모든 상태 초기화
  useEffect(() => {
    if (!isOpen) {
      setView("options");
      setSelectedDate(null);
      setTempSelectedDate(null);
      setTempSelectedTime(null);
      setOrderItems([]);
      setEditingIndex(null);
      setSelectedSizeId("");
      setSelectedFlavorId("");
      setSelections({});
      setRequestMessage("");
      setShowValidationErrors(false);
      setIsAddingFromConfirm(false);
      setIsEditingFromConfirm(false);
      setDateSelectionSignal(0);
      setReserverName("");
      setReserverPhone("");
      hasPrefilledReserverRef.current = false;
      setAgreePayment(false);
      setAgreeRefund(false);
      setAgreeOptionChange(false);
    }
  }, [isOpen]);

  // 시트 열릴 때 사용자 정보로 예약자명/번호 1회 prefill
  useEffect(() => {
    if (isOpen && profile && !hasPrefilledReserverRef.current) {
      setReserverName(profile.name ?? "");
      setReserverPhone(profile.phone ?? "");
      hasPrefilledReserverRef.current = true;
    }
  }, [isOpen, profile]);

  // 현재 편집 중인 옵션 상태 초기화
  const resetCurrentOptions = () => {
    setSelectedSizeId("");
    setSelectedFlavorId("");
    setSelections({});
    setRequestMessage("");
    setShowValidationErrors(false);
    setEditingIndex(null);
  };

  const setOptionSelection = (optionId: string, selection: OptionSelection) => {
    setSelections((prev) => ({ ...prev, [optionId]: selection }));
  };

  const selectedSizeOption = sizeOptions.find((option) => option.id === selectedSizeId);
  const selectedFlavorOption = flavorOptions.find((option) => option.id === selectedFlavorId);
  const missingRequiredOption = findMissingRequiredOption(visibleCustomOptions, selections);

  // 화면 순서대로 처음 비어 있는 필수 항목
  const firstInvalidField: OptionsFieldKey | null = !selectedDate
    ? "date"
    : sizeOptions.length > 0 && !selectedSizeOption
      ? "size"
      : flavorOptions.length > 0 && !selectedFlavorOption
        ? "flavor"
        : missingRequiredOption
          ? `option:${missingRequiredOption.id}`
          : null;

  // 캘린더 뷰로 전환하고 임시 날짜/시간 세팅
  const openCalendar = () => {
    setTempSelectedDate(selectedDate);
    if (selectedDate) {
      const time = new Date();
      time.setHours(selectedDate.getHours(), selectedDate.getMinutes(), 0, 0);
      setTempSelectedTime(time);
    } else {
      setTempSelectedTime(null);
    }
    setView("calendar");
  };

  const handleOpenCalendar = () => {
    const shouldShowDateChangeModal =
      (isAddingFromConfirm && orderItems.length > 0) ||
      (isEditingFromConfirm && orderItems.length > 1);
    if (shouldShowDateChangeModal) {
      setIsDateChangeModalOpen(true);
      return;
    }
    openCalendar();
  };

  // 날짜 변경 확인 모달 → 확인
  const handleDateChangeConfirm = () => {
    setIsDateChangeModalOpen(false);
    openCalendar();
  };

  // 날짜 변경 확인 모달 → 변경취소
  const handleDateChangeCancel = () => {
    setIsDateChangeModalOpen(false);
  };

  // 캘린더에서 선택한 날짜/시간 확정
  const handleCalendarConfirm = () => {
    let nextSelectedDate: Date | null = tempSelectedDate;

    if (tempSelectedDate && tempSelectedTime) {
      const combined = new Date(tempSelectedDate);
      combined.setHours(tempSelectedTime.getHours(), tempSelectedTime.getMinutes(), 0, 0);
      nextSelectedDate = combined;
    }
    const prevTime = selectedDate?.getTime();
    const nextTime = nextSelectedDate?.getTime();
    const hasChanged = prevTime !== nextTime;

    if (hasChanged) {
      setSelectedDate(nextSelectedDate);
      setDateSelectionSignal((prev) => prev + 1);
    } else {
      setSelectedDate(nextSelectedDate);
    }

    setView("options");
  };

  // 작성 취소 확인 모달 오픈
  const handleCancelClick = () => {
    setIsCancelModalOpen(true);
  };

  // 작성 취소 확정 처리
  const handleConfirmCancel = () => {
    setIsCancelModalOpen(false);
    if (isAddingFromConfirm || isEditingFromConfirm) {
      setView("confirm");
      setIsAddingFromConfirm(false);
      setIsEditingFromConfirm(false);
      return;
    }
    setView("options");
    onClose();
  };

  // 바텀시트 닫기 (X버튼, 배경 클릭, ESC) → 취소 모달 표시
  const handleClose = () => {
    setIsCancelModalOpen(true);
  };

  // 현재 옵션을 주문 목록에 추가하고 확인 뷰로 이동
  const handleGoToConfirm = () => {
    const durationMs = optionsViewEnteredAtRef.current
      ? Date.now() - optionsViewEnteredAtRef.current
      : 0;
    if (firstInvalidField) {
      setShowValidationErrors(true);
      setInvalidFieldSignal((prev) => prev + 1);
      return;
    }
    trackEvent("request_option_complete", { duration_ms: durationMs, product_id: productId });

    const newItem: OrderItem = {
      sizeId: selectedSizeOption?.id ?? "",
      sizeName: selectedSizeOption?.displayName ?? "",
      sizePrice: selectedSizeOption?.price ?? 0,
      flavorId: selectedFlavorOption?.id ?? "",
      flavorName: selectedFlavorOption?.displayName ?? "",
      flavorPrice: selectedFlavorOption?.price ?? 0,
      selections,
      optionsPrice: calculateOptionsPrice(visibleCustomOptions, selections),
      requestMessage,
      quantity: 1,
    };

    if (editingIndex !== null) {
      setOrderItems((prev) =>
        prev.map((item, i) =>
          i === editingIndex ? { ...newItem, quantity: item.quantity } : item,
        ),
      );
    } else {
      setOrderItems((prev) => [...prev, newItem]);
    }

    resetCurrentOptions();
    setIsAddingFromConfirm(false);
    setIsEditingFromConfirm(false);
    setView("confirm");
  };

  // 주문 수량 증감 처리
  const handleQuantityChange = (index: number, delta: number) => {
    setOrderItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item,
      ),
    );
  };

  // 삭제 확인 모달 오픈
  const handleDeleteClick = (index: number) => {
    trackEvent("engage_delete_product", { product_id: productId });
    setDeleteTargetIndex(index);
    setIsDeleteModalOpen(true);
  };

  // 삭제 확정 처리
  const handleConfirmDelete = () => {
    if (deleteTargetIndex !== null) {
      setOrderItems((prev) => prev.filter((_, i) => i !== deleteTargetIndex));
    }
    setIsDeleteModalOpen(false);
    setDeleteTargetIndex(null);
  };

  // 특정 상품 편집 모드로 전환
  const handleEditItem = (index: number) => {
    trackEvent("engage_edit_option");
    const item = orderItems[index];
    setSelectedSizeId(item.sizeId);
    setSelectedFlavorId(item.flavorId);
    // 편집 시 기존 선택값(사진 File 포함) 복원
    setSelections(item.selections);
    setRequestMessage(item.requestMessage);
    setShowValidationErrors(false);
    setEditingIndex(index);
    setIsAddingFromConfirm(false);
    setIsEditingFromConfirm(true);
    setView("options");
  };

  // 새 상품 추가 모드로 전환
  const handleAddNewItem = () => {
    trackEvent("engage_add_product");
    resetCurrentOptions();
    setIsAddingFromConfirm(true);
    setIsEditingFromConfirm(false);
    setView("options");
    setDateSelectionSignal(0);
  };

  // 날짜/시간 표시용 포맷팅
  const formatDateTime = (date: Date | null) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
    const dayOfWeek = dayNames[date.getDay()];
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? "오후" : "오전";
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${year}.${month}.${day}(${dayOfWeek}) · ${period} ${displayHours}:${minutes
      .toString()
      .padStart(2, "0")}`;
  };

  /** 담은 상품 1개 가격 (서버 itemPrice와 같은 계산) */
  const getItemPrice = (item: OrderItem) =>
    calculateItemPrice({
      basePrice: price,
      sizePrice: item.sizePrice,
      flavorPrice: item.flavorPrice,
      optionsPrice: item.optionsPrice,
    });

  const totalQuantity = orderItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = orderItems.reduce((sum, item) => sum + getItemPrice(item) * item.quantity, 0);

  // 현재 선택 중인 옵션의 가격 계산 (options 뷰에서 사용)
  const currentOptionPrice = calculateItemPrice({
    basePrice: price,
    sizePrice: selectedSizeOption?.price,
    flavorPrice: selectedFlavorOption?.price,
    optionsPrice: calculateOptionsPrice(visibleCustomOptions, selections),
  });

  const isCalendarValid = tempSelectedDate && tempSelectedTime;

  return {
    // View
    view,
    setView,

    // Date & Time
    selectedDate,
    tempSelectedDate,
    setTempSelectedDate,
    tempSelectedTime,
    setTempSelectedTime,

    // Options
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

    // Reserver Info
    reserverName,
    setReserverName,
    reserverPhone,
    setReserverPhone,

    // Agreements
    agreePayment,
    setAgreePayment,
    agreeRefund,
    setAgreeRefund,
    agreeOptionChange,
    setAgreeOptionChange,
    allAgreed,
    handleToggleAllAgreements,

    // Order Items
    orderItems,
    editingIndex,

    // Modals
    isCancelModalOpen,
    setIsCancelModalOpen,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    isDateChangeModalOpen,
    setIsDateChangeModalOpen,

    // Computed
    currentOptionPrice,
    getItemPrice,
    totalQuantity,
    totalPrice,
    isCalendarValid,
    isAddingFromConfirm,
    isEditingFromConfirm,
    dateSelectionSignal,
    formatDateTime,

    // Handlers
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
  };
}
