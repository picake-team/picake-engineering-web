"use client";

import { InfoNotice } from "@/apps/web-user/common/components/notice/InfoNotice";
import { LabeledInput } from "@/apps/web-user/common/components/inputs/LabeledInput";
import { Checkbox } from "@/apps/web-user/common/components/inputs/Checkbox";
import {
  formatRefundRulePeriodLabel,
  visibleRefundRules,
  type RefundCancellationPolicy,
} from "@/apps/web-user/features/store/types/store.type";

interface ReservationContactAgreementsProps {
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
  /** 견적으로 예약(기획 I-01)이면 옵션이 없어 "날짜 변경 규정"으로, 주문 제작 소요시간 안내는 빼고 */
  variant?: "product" | "quote";
}

/**
 * 예약 창 아래쪽(예약정보 확인·필수 동의 항목·결제·환불 안내). 상품 예약과 견적 예약이 같이 쓴다.
 */
export function ReservationContactAgreements({
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
  variant = "product",
}: ReservationContactAgreementsProps) {
  const refundRules = visibleRefundRules(refundCancellationPolicy);
  const isQuote = variant === "quote";
  return (
    <>
      <div className="px-5 py-10 flex flex-col border-b-[14px] border-gray-50">
        <h2 className="mb-1 py-2.5 text-lg font-bold text-gray-900">예약정보 확인</h2>
        <InfoNotice
          message={
            isAuthenticated
              ? "예약 연락을 위해 판매자에게 전달돼요."
              : "비워 두면 로그인한 뒤 가입한 이름·번호로 채워요. 예약 연락을 위해 판매자에게 전달돼요."
          }
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
        <Checkbox checked={allAgreed} onChange={handleToggleAllAgreements} label="모두 동의해요" />
        <div className="border-t border-gray-50 my-3" />
        <div className="flex flex-col gap-2">
          <Checkbox checked={agreePayment} onChange={setAgreePayment} label="결제 방법 확인" />
          <Checkbox checked={agreeRefund} onChange={setAgreeRefund} label="환불/취소 규정 동의" />
          <Checkbox
            checked={agreeOptionChange}
            onChange={setAgreeOptionChange}
            label={isQuote ? "날짜 변경 규정 동의" : "날짜 및 옵션 변경 규정 동의"}
          />
        </div>

        <div className="flex flex-col gap-5 mt-6 p-4 bg-gray-50 rounded-lg">
          <div>
            <h3 className="text-2sm font-bold text-gray-900 mb-1">결제 안내</h3>
            <p className="text-2sm text-gray-900">
              결제는 <span className="font-bold">계좌이체</span>로 해요. 판매자가 예약을 확인하면
              입금 정보를 알려 드려요.
            </p>
          </div>
          <div>
            <h3 className="text-2sm font-bold text-gray-900 mb-2.5">환불/취소 규정</h3>
            {refundRules.length === 0 ? (
              <p className="text-2sm text-gray-500">등록된 환불·취소 규정이 없어요.</p>
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
            <p className="text-2sm text-gray-900">노쇼하면 서비스 이용이 제한될 수 있어요.</p>
          </div>
          <div>
            <h3 className="text-2sm font-bold text-gray-900 mb-1">
              {isQuote ? "날짜 변경 규정" : "날짜 및 옵션 변경 규정"}
            </h3>
            <p className="text-2sm text-gray-900">
              {isQuote
                ? "픽업 날짜는 예약신청 상태에서만 바꿀 수 있어요. 케이크 내용은 채팅으로 가게와 정해요."
                : "옵션은 예약신청 상태에서만 바꿀 수 있어요."}
            </p>
            <p className="text-2sm text-gray-900">
              예약 상태: 예약신청 → 입금대기 → 입금완료 → 예약확정
            </p>
          </div>
          {!isQuote && (
            <div>
              <h3 className="text-2sm font-bold text-gray-900 mb-1">기타 안내</h3>
              <p className="text-2sm text-gray-900">주문 제작 소요시간: 2 ~ 3일</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
