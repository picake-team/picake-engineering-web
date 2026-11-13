"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BottomSheet } from "@/apps/web-user/common/components/bottom-sheets/BottomSheet";
import { Button } from "@/apps/web-user/common/components/buttons/Button";
import { Icon } from "@/apps/web-user/common/components/icons";
import { useAlertStore } from "@/apps/web-user/common/store/alert.store";
import getApiMessage from "@/apps/web-user/common/utils/getApiMessage";
import { trackEvent } from "@/apps/web-user/common/utils/analytics.util";
import { useMypageProfile } from "@/apps/web-user/features/mypage/hooks/queries/useMypageProfile";
import { useStoreDetail } from "@/apps/web-user/features/store/hooks/queries/useStoreDetail";
import { ReservationCalendarView } from "@/apps/web-user/features/product/components/sections/reservation-bottom-sheet/ReservationCalendarView";
import { ReservationContactAgreements } from "@/apps/web-user/features/product/components/sections/reservation-bottom-sheet/ReservationContactAgreements";
import { useReserveQuote } from "@/apps/web-user/features/quote/hooks/useQuoteRequests";
import { quotePriceText } from "@/apps/web-user/features/quote/components/QuoteCards";
import type { ConsumerQuote } from "@/apps/web-user/features/quote/types/quote.type";

/** "2026.11.21(토) · 오후 2:00"(상품 예약 창과 같은 모양) */
function formatDateTime(date: Date | null): string {
  if (!date) return "";
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
  const h = date.getHours();
  const period = h >= 12 ? "오후" : "오전";
  const hh = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}(${dayNames[date.getDay()]}) · ${period} ${hh}:${String(date.getMinutes()).padStart(2, "0")}`;
}

/** 요청서 픽업 시간 "부터"를 그 날의 시각으로(없으면 null) */
function timeOf(ymd: string, hour: number | null): Date | null {
  const day = dayOf(ymd);
  if (!day || hour === null) return null;
  day.setHours(hour, 0, 0, 0);
  return day;
}

/** 요청서 픽업 날짜("2026-11-21")를 그 날 0시로. 이미 지난 날짜면 비워 둔다(손님이 새로 고름) */
function dayOf(ymd: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return null;
  const day = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return day.getTime() < today.getTime() ? null : day;
}

/**
 * 고른 견적으로 예약하기(기획 I-01, 운영자 결정 2026-11-13). 상품 예약 창과 같은 두 단계:
 * 픽업 일시(요청서 날짜가 골라져 있고 가게 영업 시간 안에서) → 예약정보 확인(견적 카드, 예약자, 필수 동의).
 * 신청하면 예약신청 주문이 생기고 이후는 상품 예약과 같은 흐름(사장님 예약 확인 → 입금 안내).
 */
export function QuoteReservationSheet({
  isOpen,
  onClose,
  requestId,
  quote,
  pickupDate,
  pickupHourFrom,
  fallbackImageUrl,
}: {
  isOpen: boolean;
  onClose: () => void;
  requestId: string;
  quote: ConsumerQuote;
  /** 요청서 픽업 날짜(YYYY-MM-DD) */
  pickupDate: string;
  /** 요청서 픽업 시간 "부터"(없으면 아무 때나) */
  pickupHourFrom: number | null;
  fallbackImageUrl: string | null;
}) {
  const router = useRouter();
  const { showAlert } = useAlertStore();
  const reserve = useReserveQuote();
  const { data: store } = useStoreDetail(quote.storeId ?? "");
  const { data: profile } = useMypageProfile();

  const [view, setView] = useState<"calendar" | "confirm">("calendar");
  // 달력은 날짜가 비어 있으면 오늘을 저절로 고르므로, 창이 열리기 전부터 요청서 날짜·시간을 넣어 둔다
  const [tempDate, setTempDate] = useState<Date | null>(() => dayOf(pickupDate));
  const [tempTime, setTempTime] = useState<Date | null>(() => timeOf(pickupDate, pickupHourFrom));
  const [selected, setSelected] = useState<Date | null>(null);
  const [reserverName, setReserverName] = useState("");
  const [reserverPhone, setReserverPhone] = useState("");
  const [agreePayment, setAgreePayment] = useState(false);
  const [agreeRefund, setAgreeRefund] = useState(false);
  const [agreeChange, setAgreeChange] = useState(false);
  const allAgreed = agreePayment && agreeRefund && agreeChange;

  // 닫히면 다음에 열 때를 위해 요청서 날짜·시간으로 되돌린다(열릴 때 바꾸면 달력이 먼저 오늘을 고름)
  useEffect(() => {
    if (isOpen) return;
    setView("calendar");
    setTempDate(dayOf(pickupDate));
    setTempTime(timeOf(pickupDate, pickupHourFrom));
    setSelected(null);
    setAgreePayment(false);
    setAgreeRefund(false);
    setAgreeChange(false);
  }, [isOpen, pickupDate, pickupHourFrom]);

  // 예약자 칸은 가입한 이름·번호로(상품 예약 창과 같게)
  useEffect(() => {
    if (!isOpen || !profile) return;
    setReserverName((v) => v || profile.name || "");
    setReserverPhone((v) => v || profile.phone || "");
  }, [isOpen, profile]);

  const image = quote.photoUrls[0] ?? fallbackImageUrl;
  const canNext = !!tempDate && !!tempTime;
  const goConfirm = () => {
    if (!tempDate || !tempTime) return;
    const at = new Date(tempDate);
    at.setHours(tempTime.getHours(), tempTime.getMinutes(), 0, 0);
    setSelected(at);
    setView("confirm");
  };

  const submit = () => {
    if (!selected || reserve.isPending) return;
    trackEvent("request_quote_reservation", { quote_request_id: requestId });
    reserve.mutate(
      {
        requestId,
        body: {
          pickupDate: selected.toISOString(),
          expectedTotal: quote.total,
          ...(reserverName.trim() && { reservationContactName: reserverName.trim() }),
          ...(reserverPhone.trim() && { reservationPhone: reserverPhone.trim() }),
        },
      },
      {
        onSuccess: ({ orderId }) => {
          trackEvent("success_quote_reservation", {
            quote_request_id: requestId,
            reservation_id: orderId,
          });
          // 상품 예약과 같은 완료 화면
          router.push(`/reservation/complete?orderId=${orderId}`);
        },
        onError: (e) => {
          trackEvent("fail_quote_reservation", {
            quote_request_id: requestId,
            fail_reason: "api_error",
          });
          showAlert({ type: "error", title: "예약하지 못했어요", message: getApiMessage.error(e) });
          // 금액이 바뀌었거나 그사이 예약됐으면 창을 닫고 바뀐 견적 화면을 보여 준다
          onClose();
        },
      },
    );
  };

  const footer =
    view === "calendar" ? (
      <div className="px-[20px] py-[12px] flex gap-[8px]">
        <span className="w-[100px]">
          <Button variant="outline" onClick={onClose}>
            닫기
          </Button>
        </span>
        <span className="flex-1">
          <Button onClick={goConfirm} disabled={!canNext}>
            선택완료
          </Button>
        </span>
      </div>
    ) : (
      <div className="px-[20px]">
        <div className="flex items-center justify-between pt-[14px]">
          <span className="text-sm text-gray-700">총 금액 ({quote.quantity}개)</span>
          <span className="text-xl font-bold text-gray-900">
            {quote.total.toLocaleString("ko-KR")}원
          </span>
        </div>
        <div className="py-[12px]">
          <Button
            onClick={submit}
            loading={reserve.isPending}
            disabled={!reserverName.trim() || !reserverPhone.trim() || !allAgreed}
          >
            {reserve.isPending ? "예약 신청 중…" : "예약신청"}
          </Button>
        </div>
      </div>
    );

  const confirmView = useMemo(
    () => (
      <>
        <div className="px-5 pt-5 pb-10 flex flex-col border-b-[14px] border-gray-50">
          <h2 className="mb-1 py-2.5 text-lg font-bold text-gray-900">예약상품</h2>
          <div className="rounded-lg border border-gray-100 overflow-hidden">
            <button
              type="button"
              onClick={() => setView("calendar")}
              className="flex w-full items-center gap-[12px] py-[12px] px-[10px] text-sm bg-blue-50 border-b border-gray-100"
            >
              <span className="flex items-center gap-[2px] font-bold text-blue-400">
                <Icon name="takeout" width={16} height={16} className="text-blue-400" />
                픽업
              </span>
              <span className="flex-1 text-left text-sm text-gray-900">
                {formatDateTime(selected)}
              </span>
              <span className="text-xs text-gray-500 underline">바꾸기</span>
            </button>
            <div className="flex gap-[12px] bg-gray-50 p-[12px]">
              <div className="h-[64px] w-[64px] shrink-0 overflow-hidden rounded-lg bg-white">
                {image ? (
                  <img src={image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Icon name="logoPicake" width={32} height={32} />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-gray-900 [overflow-wrap:anywhere]">
                  {quote.storeName} 견적
                </p>
                <p className="mt-[2px] text-xs text-gray-500">
                  {quotePriceText(quote)} · {quote.similarityLabel}
                </p>
                {quote.memo && (
                  <p className="mt-[6px] text-xs text-gray-700 whitespace-pre-wrap">
                    <span className="font-bold text-gray-500">사장님 메모 </span>
                    {quote.memo}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
        <ReservationContactAgreements
          variant="quote"
          reserverName={reserverName}
          setReserverName={setReserverName}
          reserverPhone={reserverPhone}
          setReserverPhone={setReserverPhone}
          agreePayment={agreePayment}
          setAgreePayment={setAgreePayment}
          agreeRefund={agreeRefund}
          setAgreeRefund={setAgreeRefund}
          agreeOptionChange={agreeChange}
          setAgreeOptionChange={setAgreeChange}
          allAgreed={allAgreed}
          handleToggleAllAgreements={(v) => {
            setAgreePayment(v);
            setAgreeRefund(v);
            setAgreeChange(v);
          }}
          refundCancellationPolicy={store?.refundCancellationPolicy}
        />
      </>
    ),
    [
      selected,
      image,
      quote,
      reserverName,
      reserverPhone,
      agreePayment,
      agreeRefund,
      agreeChange,
      allAgreed,
      store?.refundCancellationPolicy,
    ],
  );

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={view === "calendar" ? "날짜 선택" : "주문확인"}
      footer={footer}
      fullScreen={view === "confirm"}
    >
      {view === "calendar" ? (
        <ReservationCalendarView
          tempSelectedDate={tempDate}
          setTempSelectedDate={setTempDate}
          tempSelectedTime={tempTime}
          setTempSelectedTime={setTempTime}
          businessCalendar={store?.businessCalendar}
        />
      ) : (
        confirmView
      )}
    </BottomSheet>
  );
}
