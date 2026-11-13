"use client";

import { Button } from "@/apps/web-user/common/components/buttons/Button";
import { Icon } from "@/apps/web-user/common/components/icons";
import { OrderItem } from "./types";
import { type RefundCancellationPolicy } from "@/apps/web-user/features/store/types/store.type";
import { ReservationContactAgreements } from "./ReservationContactAgreements";
import { EmptyState } from "@/apps/web-user/common/components/fallbacks/EmptyState";
import type { CustomOption } from "@/apps/web-user/features/product/types/product.type";
import {
  formatPreviewOptionValue,
  toSelectedOptionPreviews,
} from "@/apps/web-user/features/product/utils/custom-option.util";
import { NO_REPLAY } from "@/apps/web-user/common/constants/replay.constant";

interface ReservationConfirmViewProps {
  orderItems: OrderItem[];
  cakeTitle: string;
  cakeImageUrl: string;
  /** 노출 중인 추가 옵션 (선택값 표시용) */
  customOptions: CustomOption[];
  /** 담은 상품 1개 가격 (판매가 + 사이즈 + 추가 옵션) */
  getItemPrice: (item: OrderItem) => number;
  selectedDate: Date | null;
  formatDateTime: (date: Date | null) => string;
  handleEditItem: (index: number) => void;
  handleDeleteClick: (index: number) => void;
  handleQuantityChange: (index: number, delta: number) => void;
  handleAddNewItem: () => void;
  reserverName: string;
  setReserverName: (value: string) => void;
  reserverPhone: string;
  setReserverPhone: (value: string) => void;
  agreePayment: boolean;
  setAgreePayment: (value: boolean) => void;
  agreeRefund: boolean;
  setAgreeRefund: (value: boolean) => void;
  agreeOptionChange: boolean;
  setAgreeOptionChange: (value: boolean) => void;
  allAgreed: boolean;
  handleToggleAllAgreements: (value: boolean) => void;
  /** 판매자 환불·취소 규정. 미정의면 안내 박스에서만 빈 메시지 노출 */
  refundCancellationPolicy?: RefundCancellationPolicy;
  /** 로그인 전이면 예약자 칸은 비워 둬도 된다고 알린다 */
  isAuthenticated?: boolean;
}

export function ReservationConfirmView({
  orderItems,
  cakeTitle,
  cakeImageUrl,
  customOptions,
  getItemPrice,
  selectedDate,
  formatDateTime,
  handleEditItem,
  handleDeleteClick,
  handleQuantityChange,
  handleAddNewItem,
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
  refundCancellationPolicy,
  isAuthenticated = true,
}: ReservationConfirmViewProps) {
  return (
    <>
      <div className="px-5 pt-5 pb-10 flex flex-col border-b-[14px] border-gray-50">
        <h2 className="mb-1 py-2.5 text-lg font-bold text-gray-900">예약상품</h2>
        {orderItems.length === 0 ? (
          <EmptyState message="담은 상품이 없어요" className="py-[22px]" />
        ) : (
          <div className="mb-[24px] rounded-lg border border-gray-100 overflow-hidden">
            <div className="flex items-center gap-[12px] py-[12px] px-[10px] text-sm bg-blue-50 border-b border-gray-100">
              <div className="flex items-center gap-[2px] font-bold text-blue-400">
                <Icon name="takeout" width={16} height={16} className="text-blue-400" />
                픽업
              </div>
              <div className="text-sm text-gray-900">{formatDateTime(selectedDate)}</div>
            </div>
            <div className="flex flex-col gap-[24px] bg-gray-50">
              {orderItems.map((item, index) => (
                <div
                  key={index}
                  className="relative flex flex-col after:content-[''] after:absolute after:bottom-[-12px] after:left-0 after:w-full after:h-px after:bg-gray-100 last:after:hidden"
                >
                  <div className="py-[10px] px-[18px]">
                    <div className="flex pb-[16px]">
                      <div className="flex-1 flex flex-col">
                        <div className="text-sm font-bold text-gray-900">{cakeTitle}</div>
                        <div className="text-sm font-bold text-gray-900 mb-[4px]">
                          {getItemPrice(item).toLocaleString()}원
                        </div>
                        {/* 손님이 쓴 레터링·요청 사항이 들어 있어 화면 녹화에서 가린다 */}
                        <ul className={`${NO_REPLAY} text-xs text-gray-700 pl-[18px] list-disc`}>
                          <li>사이즈 : {item.sizeName}</li>
                          {toSelectedOptionPreviews(customOptions, item.selections).map(
                            (option) => (
                              <li key={option.optionId}>
                                {option.name} :{" "}
                                {formatPreviewOptionValue(option, item.selections[option.optionId])}
                                {option.price > 0 && ` (+${option.price.toLocaleString()}원)`}
                              </li>
                            ),
                          )}
                          {item.requestMessage && <li>요청사항 : {item.requestMessage}</li>}
                        </ul>
                      </div>

                      <div className="w-[64px] h-[64px] overflow-hidden shrink-0 rounded-md">
                        <img
                          src={cakeImageUrl}
                          alt={cakeTitle}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="font-normal !rounded-md"
                          onClick={() => handleEditItem(index)}
                        >
                          옵션변경
                        </Button>
                      </span>

                      <div className="flex items-center h-[38px] rounded overflow-hidden">
                        {item.quantity === 1 ? (
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(index)}
                            className="w-[30px] h-full flex items-center justify-center bg-gray-100"
                            aria-label="삭제"
                          >
                            <Icon name="trash" width={14} height={14} className="text-gray-900" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(index, -1)}
                            className="w-[30px] h-full flex items-center justify-center bg-gray-100"
                            aria-label="수량 감소"
                          >
                            <Icon name="minus" width={14} height={14} className="text-gray-900" />
                          </button>
                        )}
                        <span className="w-[40px] h-full flex items-center justify-center text-sm text-gray-900 border border-gray-100 bg-white">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(index, 1)}
                          className="w-[30px] h-full flex items-center justify-center bg-gray-100"
                          aria-label="수량 증가"
                        >
                          <Icon name="plus" width={14} height={14} className="text-gray-900" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleAddNewItem}
          className="flex items-center justify-center gap-[6px] w-full h-[52px] text-base font-bold text-gray-900 border border-gray-100 rounded-lg"
        >
          <Icon name="plus" width={20} height={20} className="text-gray-900" />
          <span className="text-base font-bold text-gray-900">상품추가</span>
        </button>
      </div>
      <ReservationContactAgreements
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
        isAuthenticated={isAuthenticated}
      />
    </>
  );
}
