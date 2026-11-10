/**
 * 처리 확인·사유 창 (SC-77, 디자인 3-I·3-J·3-K·3-L·3-M·3-N, A77p).
 * 주문 상태를 바꾸는 일은 모두 이 창 한 번만 묻는다(지금 PC는 두 번 묻는 경우가 있다).
 * 문구·사유는 지금 PC 그대로, 버튼 이름은 하는 일 그대로.
 */
import { useEffect, useState } from "react";
import { ListRowButton } from "@/apps/web-seller/common/ui/List";
import { useQueryClient } from "@tanstack/react-query";
import { BottomSheet } from "@/apps/web-seller/common/ui/Sheet";
import { Button, ButtonPair, CircleIconButton } from "@/apps/web-seller/common/ui/Button";
import { Field, TextArea } from "@/apps/web-seller/common/ui/Field";
import { WarningBox } from "@/apps/web-seller/common/ui/Surface";
import { cx } from "@/apps/web-seller/common/ui/cx";
import { copyWithToast } from "@/apps/web-seller/common/utils/clipboard.util";
import { useUpdateOrderStatus } from "@/apps/web-seller/features/order/hooks/mutations/useOrderMutation";
import { orderQueryKeys } from "@/apps/web-seller/features/order/constants/orderQueryKeys.constant";
import {
  OrderStatus,
  type OrderResponseDto,
  type UpdateOrderStatusRequestDto,
} from "@/apps/web-seller/features/order/types/order.dto";
import { OrderSummaryBox } from "@/apps/web-seller/features/order/components/mobile/OrderCards";
import { formatWon } from "@/apps/web-seller/features/order/utils/order-mobile.util";
import { storeBankLabel } from "@/apps/web-seller/features/store/constants/store.constants";

const IRREVERSIBLE = "처리하면 되돌릴 수 없어요.";

/** 예약 취소 사유(지금 PC와 같음) */
const CANCEL_REASONS = ["재료 소진", "매장 사정 (휴무)", "손님 요청", "기타"] as const;

interface ActionCopy {
  title: string;
  button: string;
  note: string;
  /** 글로 받는 사유 칸 이름(필수) */
  reasonLabel?: string;
}

const COPY: Partial<Record<OrderStatus, ActionCopy>> = {
  [OrderStatus.PAYMENT_PENDING]: {
    title: "예약을 확인할까요?",
    button: "예약 확인",
    note: IRREVERSIBLE,
  },
  [OrderStatus.CONFIRMED]: {
    title: "예약을 확정할까요?",
    button: "예약 확정",
    note: IRREVERSIBLE,
  },
  [OrderStatus.PICKUP_COMPLETED]: {
    title: "픽업을 완료할까요?",
    button: "픽업 완료",
    note: IRREVERSIBLE,
  },
  [OrderStatus.CANCEL_COMPLETED]: {
    title: "예약을 취소할까요?",
    button: "예약 취소",
    note: "취소한 예약은 되돌릴 수 없어요.",
  },
  [OrderStatus.NO_SHOW]: {
    title: "노쇼로 처리할까요?",
    button: "노쇼 처리",
    note: IRREVERSIBLE,
    reasonLabel: "노쇼 사유 (필수)",
  },
  [OrderStatus.CANCEL_REFUND_PENDING]: {
    // 입금한 주문의 취소. 상태 이름(취소환불대기) 대신 하는 일로 말한다
    title: "예약을 취소하고 환불할까요?",
    button: "예약 취소",
    note: `입금한 예약이라 취소하면 환불할 주문으로 넘어가요. 송금한 뒤 '취소환불 완료'를 눌러 주세요. ${IRREVERSIBLE}`,
    reasonLabel: "취소 사유 (필수)",
  },
  [OrderStatus.CANCEL_REFUND_COMPLETED]: {
    title: "환불을 마쳤나요?",
    button: "취소환불 완료",
    note: `송금한 뒤 눌러 주세요. ${IRREVERSIBLE}`,
  },
};

export function refundAccountText(order: OrderResponseDto): string | null {
  const account = [storeBankLabel(order.refundBankName), order.refundBankAccountNumber]
    .filter((v) => v?.trim())
    .join(" ");
  return account || null;
}

export function OrderActionSheet({
  order,
  target,
  onClose,
  fromList = false,
}: {
  order: OrderResponseDto | null;
  /** 바꿀 상태. null이면 닫힘 */
  target: OrderStatus | null;
  onClose: () => void;
  /** 주문 목록에서 바로 처리(분석용) */
  fromList?: boolean;
}) {
  const queryClient = useQueryClient();
  const mutation = useUpdateOrderStatus();
  const [cancelReason, setCancelReason] = useState<string>("");
  const [detail, setDetail] = useState("");
  const [reasonText, setReasonText] = useState("");

  const open = Boolean(order && target);
  useEffect(() => {
    if (open) {
      setCancelReason("");
      setDetail("");
      setReasonText("");
    }
  }, [open, target]);

  if (!order || !target) return null;
  const copy = COPY[target];
  if (!copy) return null;

  const isCancel = target === OrderStatus.CANCEL_COMPLETED;
  const needsText = Boolean(copy.reasonLabel);
  const canSubmit = isCancel
    ? Boolean(cancelReason)
    : needsText
      ? Boolean(reasonText.trim())
      : true;
  const pending = mutation.isPending;

  const submit = () => {
    if (!canSubmit || pending) return;
    const request: UpdateOrderStatusRequestDto = { orderStatus: target };
    if (isCancel) {
      request.sellerCancelReason = detail.trim()
        ? `${cancelReason} — ${detail.trim()}`
        : cancelReason;
    } else if (target === OrderStatus.NO_SHOW) {
      request.sellerNoShowReason = reasonText.trim();
    } else if (target === OrderStatus.CANCEL_REFUND_PENDING) {
      request.sellerCancelRefundPendingReason = reasonText.trim();
    }
    mutation.mutate(
      { orderId: order.id, request, meta: { fromStatus: order.orderStatus, fromList } },
      {
        onSettled: () => {
          // 그사이 상태가 바뀌어 처리하지 못했어도 바뀐 상태를 다시 보여 준다(SC-77 ④)
          void queryClient.invalidateQueries({ queryKey: orderQueryKeys.all });
          onClose();
        },
      },
    );
  };

  const account = target === OrderStatus.CANCEL_REFUND_COMPLETED ? refundAccountText(order) : null;

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      dismissible={!pending}
      title={copy.title}
      footer={
        <ButtonPair>
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            돌아가기
          </Button>
          <Button onClick={submit} disabled={!canSubmit} loading={pending}>
            {copy.button}
          </Button>
        </ButtonPair>
      }
    >
      <OrderSummaryBox order={order} />

      {target === OrderStatus.CONFIRMED && order.orderStatus === OrderStatus.PAYMENT_PENDING ? (
        <WarningBox className="rounded-control">
          손님이 아직 &apos;입금 완료했어요&apos;를 누르지 않았어요. 통장에서 입금을 확인했나요?
        </WarningBox>
      ) : null}

      {isCancel ? (
        <>
          <p className="text-body font-bold text-ink-900">사유</p>
          <div role="radiogroup" aria-label="취소 사유" className="-mt-2 flex flex-col">
            {CANCEL_REASONS.map((r) => {
              const on = cancelReason === r;
              return (
                <label
                  key={r}
                  className={cx(
                    "flex min-h-11 cursor-pointer items-center gap-3 border-b border-ink-100 text-body text-ink-900",
                    on ? "font-bold" : "font-normal",
                  )}
                >
                  <input
                    type="radio"
                    name="cancel-reason"
                    value={r}
                    checked={on}
                    onChange={() => setCancelReason(r)}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className={cx(
                      "inline-block size-[22px] shrink-0 rounded-full peer-focus-visible:ring-2 peer-focus-visible:ring-ink-900 peer-focus-visible:ring-offset-2",
                      on ? "border-[7px] border-brand" : "border-[1.5px] border-ink-200",
                    )}
                  />
                  {r}
                </label>
              );
            })}
          </div>
          <Field>
            {(p) => (
              <TextArea
                id={p.id}
                aria-label="상세 사유 (선택)"
                rows={3}
                className="min-h-[68px]"
                maxLength={500}
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                placeholder="손님에게 안내할 사유를 적어 주세요(선택)"
              />
            )}
          </Field>
        </>
      ) : null}

      {needsText ? (
        <Field label={copy.reasonLabel}>
          {(p) => (
            <TextArea
              id={p.id}
              rows={3}
              className="min-h-[68px]"
              maxLength={500}
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              placeholder="손님에게 안내할 사유를 적어 주세요"
            />
          )}
        </Field>
      ) : null}

      {target === OrderStatus.CANCEL_REFUND_COMPLETED ? (
        <div className="flex flex-col gap-1 rounded-control border border-ink-100 p-4">
          <span className="text-caption text-ink-600">환불 계좌</span>
          {account ? (
            <div className="flex items-center justify-between gap-2">
              <span className="min-w-0 break-all text-body font-bold text-ink-900">{account}</span>
              <CircleIconButton
                icon="copy"
                label="환불 계좌 복사"
                className="-my-1 -mr-1"
                onClick={() =>
                  void copyWithToast(
                    order.refundBankAccountNumber?.trim() || account,
                    "환불 계좌를 복사했어요",
                  )
                }
              />
            </div>
          ) : (
            <span className="text-body font-bold text-ink-900">손님이 적은 환불 계좌가 없어요</span>
          )}
          <span className="text-sub text-ink-600">
            {order.refundAccountHolderName?.trim()
              ? `예금주 ${order.refundAccountHolderName.trim()} · `
              : ""}
            {formatWon(order.totalPrice)}
          </span>
        </div>
      ) : null}

      <p className="text-sub leading-normal text-ink-600">{copy.note}</p>
    </BottomSheet>
  );
}

/** 다른 처리 창(SC-76 ⑧: 보조 버튼이 둘 이상이면 접는다, 디자인 3-L) */
const MORE_HINT: Partial<Record<OrderStatus, string>> = {
  [OrderStatus.NO_SHOW]: "손님이 오지 않았어요",
  [OrderStatus.CANCEL_REFUND_PENDING]: "취소하고 손님에게 환불해요",
  [OrderStatus.CANCEL_COMPLETED]: "예약을 받을 수 없어요",
};

export function OrderMoreActionsSheet({
  order,
  open,
  actions,
  onPick,
  onClose,
}: {
  order: OrderResponseDto;
  open: boolean;
  actions: OrderStatus[];
  onPick: (to: OrderStatus) => void;
  onClose: () => void;
}) {
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="다른 처리"
      footer={
        <Button variant="secondary" block onClick={onClose}>
          돌아가기
        </Button>
      }
    >
      <OrderSummaryBox order={order} />
      {/* 누르면 확인 창이 열리는 줄: 스토어 탭 메뉴 줄처럼 오른쪽 화살표 */}
      <div className="flex flex-col">
        {actions.map((to, i) => (
          <ListRowButton
            key={to}
            onClick={() => onPick(to)}
            title={COPY[to]?.button}
            description={MORE_HINT[to]}
            chevron
            divider={i < actions.length - 1}
          />
        ))}
      </div>
    </BottomSheet>
  );
}
