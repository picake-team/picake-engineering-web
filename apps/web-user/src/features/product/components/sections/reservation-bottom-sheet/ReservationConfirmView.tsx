"use client";

import { Button } from "@/apps/web-user/common/components/buttons/Button";
import { Icon } from "@/apps/web-user/common/components/icons";
import { OrderItem } from "./types";
import { InfoNotice } from "@/apps/web-user/common/components/notice/InfoNotice";
import { LabeledInput } from "@/apps/web-user/common/components/inputs/LabeledInput";
import { Checkbox } from "@/apps/web-user/common/components/inputs/Checkbox";
import {
  formatRefundRulePeriodLabel,
  type RefundCancellationPolicy,
} from "@/apps/web-user/features/store/types/store.type";
import { EmptyState } from "@/apps/web-user/common/components/fallbacks/EmptyState";
import type { CustomOption } from "@/apps/web-user/features/product/types/product.type";
import {
  formatSelectedOptionValue,
  toSelectedOptionPreviews,
} from "@/apps/web-user/features/product/utils/custom-option.util";

interface ReservationConfirmViewProps {
  orderItems: OrderItem[];
  cakeTitle: string;
  cakeImageUrl: string;
  /** 노출 중인 추가 옵션 (선택값 표시용) */
  customOptions: CustomOption[];
  /** 담은 상품 1개 가격 (판매가 + 사이즈 + 맛 + 추가 옵션) */
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
}: ReservationConfirmViewProps) {
  const refundRules = refundCancellationPolicy?.rules ?? [];
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
                        <ul className="text-xs text-gray-700 pl-[18px] list-disc">
                          <li>사이즈 : {item.sizeName}</li>
                          <li>맛 : {item.flavorName}</li>
                          {toSelectedOptionPreviews(customOptions, item.selections).map(
                            (option) => (
                              <li key={option.optionId}>
                                {option.name} : {formatSelectedOptionValue(option)}
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
      <div className="px-5 py-10 flex flex-col border-b-[14px] border-gray-50">
        <h2 className="mb-1 py-2.5 text-lg font-bold text-gray-900">예약정보 확인</h2>
        <InfoNotice
          message="예약 관련 연락을 위해 판매자에게 전달되는 정보입니다."
          tone="gray"
          className="mb-1"
        />
        <div className="flex flex-col gap-4">
          <div className="py-3">
            <LabeledInput
              id="reserver-name"
              label="예약자명"
              type="text"
              value={reserverName}
              onChange={(e) => setReserverName(e.target.value)}
              placeholder="예약자명을 입력해주세요."
              clearable
              onClear={() => setReserverName("")}
            />
          </div>
          <div className="py-3">
            <LabeledInput
              id="reserver-phone"
              label="핸드폰번호"
              type="tel"
              inputMode="numeric"
              value={reserverPhone}
              onChange={(e) => setReserverPhone(e.target.value)}
              placeholder="휴대폰 번호를 입력해주세요."
              clearable
              onClear={() => setReserverPhone("")}
            />
          </div>
        </div>
      </div>
      <div className="px-5 py-10 flex flex-col">
        <h2 className="mb-[18px] text-sm font-bold text-gray-900">필수 동의 항목</h2>
        <Checkbox
          checked={allAgreed}
          onChange={handleToggleAllAgreements}
          label="모두 동의합니다"
        />
        <div className="border-t border-gray-50 my-3" />
        <div className="flex flex-col gap-2">
          <Checkbox checked={agreePayment} onChange={setAgreePayment} label="결제 방법 확인" />
          <Checkbox checked={agreeRefund} onChange={setAgreeRefund} label="환불/취소 규정 동의" />
          <Checkbox
            checked={agreeOptionChange}
            onChange={setAgreeOptionChange}
            label="날짜 및 옵션 변경 규정 동의"
          />
        </div>

        <div className="flex flex-col gap-5 mt-6 p-4 bg-gray-50 rounded-lg">
          <div>
            <h3 className="text-2sm font-bold text-gray-900 mb-1">결제 안내</h3>
            <p className="text-2sm text-gray-900">
              결제는 <span className="font-bold">계좌이체로 진행</span>되며, 판매자 예약 확인 후
              입금정보가 공유됩니다.
            </p>
          </div>
          <div>
            <h3 className="text-2sm font-bold text-gray-900 mb-2.5">환불/취소 규정</h3>
            {refundRules.length === 0 ? (
              <p className="text-2sm text-gray-500">등록된 환불/취소 규정이 없습니다.</p>
            ) : (
              <div className="rounded-lg border border-gray-100 bg-white overflow-hidden">
                {refundRules.map(({ daysBeforePickup, refundDescription }, index) => (
                  <div
                    key={`${daysBeforePickup}-${index}`}
                    className="flex items-center text-2sm text-gray-900 border-b border-gray-100 last:border-b-0"
                  >
                    <span className="w-[110px] px-4 py-3 text-gray-500 border-r border-gray-100 shrink-0">
                      {formatRefundRulePeriodLabel(daysBeforePickup)}
                    </span>
                    <span className="px-4 py-3 text-gray-900">{refundDescription}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <h3 className="text-2sm font-bold text-gray-900 mb-1">노쇼 정책</h3>
            <p className="text-2sm text-gray-900">노쇼 시 서비스 이용에 제한이 있을 수 있습니다.</p>
          </div>
          <div>
            <h3 className="text-2sm font-bold text-gray-900 mb-1">날짜 및 옵션 변경 규정</h3>
            <p className="text-2sm text-gray-900">옵션 변경은 예약신청 상태에서만 가능합니다.</p>
            <p className="text-2sm text-gray-900">
              예약 상태: 예약신청 → 입금대기 → 입금완료 → 예약확정
            </p>
          </div>
          <div>
            <h3 className="text-2sm font-bold text-gray-900 mb-1">기타 안내</h3>
            <p className="text-2sm text-gray-900">주문 제작 소요시간: 2 ~ 3일</p>
          </div>
        </div>
      </div>
    </>
  );
}
