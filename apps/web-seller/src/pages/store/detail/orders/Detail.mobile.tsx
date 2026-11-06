/**
 * 휴대폰 주문 상세 (SC-76, 디자인 3-B·3-G·A76c·A76d·A76s, 처리 창 SC-77).
 * 상태와 단계 → 할 일 한 줄 → (입금 마감) → (취소환불대기면 취소·환불) → 픽업 → 예약자 → 주문 항목 → 주문 정보 → 취소·사유.
 * 휴대폰 알림을 누르면 여기로 온다. 다른 스토어의 주문이면 그 스토어 주소로 바꿔 연다.
 */
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { AppScreen, BackHeader, BottomActionBar } from "@/apps/web-seller/common/ui/Screen";
import {
  Button,
  ButtonPair,
  CircleIconButton,
  CircleIconLink,
  HeaderIconButton,
} from "@/apps/web-seller/common/ui/Button";
import { InfoRow } from "@/apps/web-seller/common/ui/List";
import { EmptyState, LoadErrorState, StepBar, Thumb } from "@/apps/web-seller/common/ui/Surface";
import { ImageLightbox } from "@/apps/web-seller/common/components/images/ImageLightbox";
import { useNow } from "@/apps/web-seller/common/hooks/useNow";
import { copyWithToast } from "@/apps/web-seller/common/utils/clipboard.util";
import {
  formatKstMonthDayTime,
  formatKstMonthDayWeekTime,
  formatRemainingClock,
} from "@/apps/web-seller/common/utils/kst-date.util";
import { ROUTES } from "@/apps/web-seller/common/constants/route-paths.constant";
import { useOrderDetail } from "@/apps/web-seller/features/order/hooks/queries/useOrderQuery";
import {
  OrderStatus,
  type OrderItemResponseDto,
  type OrderResponseDto,
} from "@/apps/web-seller/features/order/types/order.dto";
import {
  ORDER_ACTION_LABEL,
  ORDER_STEP_LABELS,
  ORDER_TASK_LINE,
  detailActionsFor,
  formatWon,
  orderStepState,
  paymentDeadlineMs,
  telHref,
} from "@/apps/web-seller/features/order/utils/order-mobile.util";
import {
  OrderActionSheet,
  OrderMoreActionsSheet,
  refundAccountText,
} from "@/apps/web-seller/features/order/components/mobile/OrderActionSheet";
import { OrderGuideSheet } from "@/apps/web-seller/features/order/components/mobile/OrderSheets";
import { orderThumbSrc } from "@/apps/web-seller/features/order/components/mobile/OrderCards";

function Divider() {
  return <div aria-hidden="true" className="h-px shrink-0 bg-ink-100" />;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-1 text-body font-bold text-ink-900">{children}</h2>;
}

function ContactActions({ phone }: { phone: string }) {
  return (
    <span className="-my-1 -mr-1 flex items-center">
      <CircleIconLink icon="phone" label="전화" href={telHref(phone, "tel")} />
      <CircleIconLink icon="message" label="문자" href={telHref(phone, "sms")} />
    </span>
  );
}

function CopyButton({ text, label, done }: { text: string; label: string; done: string }) {
  return (
    <CircleIconButton
      icon="copy"
      label={label}
      className="-my-1 -mr-1"
      onClick={() => void copyWithToast(text, done)}
    />
  );
}

/** 입금 유효 시간(입금대기일 때만, 1초마다 줄어듦) */
function PaymentDeadline({ order }: { order: OrderResponseDto }) {
  const now = useNow(1000);
  const left = paymentDeadlineMs(order) - now;
  return (
    <div className="flex items-center justify-between rounded-control border border-ink-100 px-4 py-3">
      <span className="text-sub text-ink-600">입금 유효 시간</span>
      {left > 0 ? (
        <span className="text-group font-bold tabular-nums text-ink-900">
          {formatRemainingClock(left)} 남음
        </span>
      ) : (
        <span className="max-w-[60%] text-right text-sub font-semibold text-brand-ink">
          유효 시간이 지났습니다. 서버에서는 자동으로 취소완료 처리될 수 있어요.
        </span>
      )}
    </div>
  );
}

function optionLine(item: OrderItemResponseDto): string | null {
  const parts: string[] = [];
  for (const o of item.selectedOptions ?? []) {
    if (o.type === "SINGLE_SELECT" || o.type === "MULTI_SELECT") {
      const labels = (o.choices ?? []).map((c) =>
        c.price > 0 ? `${c.label}(+${c.price.toLocaleString("ko-KR")}원)` : c.label,
      );
      if (labels.length) parts.push(`${o.name} ${labels.join(", ")}`);
    }
  }
  return parts.length ? parts.join(" · ") : null;
}

function itemPriceLine(item: OrderItemResponseDto): string {
  const unitBeforeOptions = Math.max(0, item.itemPrice - (item.optionsPrice ?? 0));
  const parts = [
    item.sizeDisplayName?.trim(),
    `${item.quantity}개`,
    formatWon(unitBeforeOptions * item.quantity),
  ].filter(Boolean);
  return parts.join(" · ");
}

function referenceImages(item: OrderItemResponseDto): string[] {
  const urls = [
    ...(item.selectedOptions ?? []).reduce<string[]>(
      (acc, o) => (o.type === "IMAGE" ? acc.concat(o.imageUrls ?? []) : acc),
      [],
    ),
    ...(item.imageUrls ?? []),
  ];
  return Array.from(new Set(urls));
}

function OrderItemBlock({
  order,
  item,
  onOpenImages,
}: {
  order: OrderResponseDto;
  item: OrderItemResponseDto;
  onOpenImages: (images: string[], index: number) => void;
}) {
  const options = optionLine(item);
  const texts = (item.selectedOptions ?? []).filter((o) => o.type === "TEXT" && o.text?.trim());
  const images = referenceImages(item);
  const legacyLettering = item.letteringMessage?.trim();
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-3">
        <Thumb size={64} src={orderThumbSrc(order)} />
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-body font-bold text-ink-900">{order.productName}</span>
          <span className="text-sub text-ink-600">{itemPriceLine(item)}</span>
          {options ? <span className="text-sub text-ink-600">{options}</span> : null}
        </div>
      </div>
      {texts.map((o) => (
        <div
          key={o.optionId}
          className="flex flex-col gap-1 rounded-control border border-ink-100 px-4 py-3"
        >
          <span className="text-badge font-bold text-ink-600">{o.name}</span>
          <span className="whitespace-pre-wrap break-words text-heading font-bold text-ink-900">
            {o.text}
          </span>
        </div>
      ))}
      {legacyLettering && texts.length === 0 ? (
        <div className="flex flex-col gap-1 rounded-control border border-ink-100 px-4 py-3">
          <span className="text-badge font-bold text-ink-600">레터링</span>
          <span className="whitespace-pre-wrap break-words text-heading font-bold text-ink-900">
            {legacyLettering}
          </span>
        </div>
      ) : null}
      {images.length > 0 ? (
        <div className="flex flex-col gap-2">
          <span className="text-sub font-bold text-ink-700">참고 사진 {images.length}장</span>
          <div className="flex flex-wrap gap-2">
            {images.map((src, i) => (
              <button
                key={src}
                type="button"
                aria-label={`참고 사진 ${i + 1} 크게 보기`}
                onClick={() => onOpenImages(images, i)}
                className="rounded-control"
              >
                <Thumb size={88} src={src} />
              </button>
            ))}
          </div>
          <span className="text-caption text-ink-600">
            누르면 크게 보고 사진첩에 저장할 수 있어요
          </span>
        </div>
      ) : null}
      {item.requestMessage?.trim() ? (
        <span className="text-sub text-ink-600">요청 · {item.requestMessage.trim()}</span>
      ) : null}
    </div>
  );
}

/** 취소·환불·사유(있을 때만, SC-76 ⑦). 누가 왜 바꿨는지를 경위·사유 줄로 */
function CancelSection({ order }: { order: OrderResponseDto }) {
  const rows: { label: string; value: React.ReactNode; sub?: string; action?: React.ReactNode }[] =
    [];
  const reason = (how: string, text?: string | null, label = "사유") => {
    if (!text?.trim()) return;
    rows.push({ label: "경위", value: how });
    rows.push({ label, value: text.trim() });
  };
  if (order.paymentPendingExpiredAt) {
    rows.push({
      label: "경위",
      value: "입금 기한 만료로 자동 취소됨",
      sub: `${formatKstMonthDayTime(order.paymentPendingExpiredAt)} · 고객이 입금했는지 통장 내역 확인이 필요할 수 있습니다`,
    });
  }
  reason("손님이 입금 전에 취소함", order.userCancelReason);
  reason("사장님이 예약을 취소함", order.sellerCancelReason);
  reason("손님이 환불을 요청함", order.refundRequestReason);
  reason("사장님이 취소환불대기로 바꿈", order.sellerCancelRefundPendingReason);
  if (order.sellerNoShowReason?.trim()) {
    rows.push({ label: "노쇼 사유", value: order.sellerNoShowReason.trim() });
  }
  const account = refundAccountText(order);
  if (account) {
    rows.push({
      label: "환불 계좌",
      value: account,
      sub: order.refundAccountHolderName?.trim()
        ? `예금주 ${order.refundAccountHolderName.trim()}`
        : undefined,
      action: (
        <CopyButton
          text={order.refundBankAccountNumber?.trim() || account}
          label="환불 계좌 복사"
          done="환불 계좌를 복사했어요"
        />
      ),
    });
  }
  if (rows.length === 0) return null;
  return (
    <>
      <Divider />
      <SectionTitle>
        {order.orderStatus === OrderStatus.NO_SHOW ? "노쇼" : "취소·환불"}
      </SectionTitle>
      {rows.map((r, i) => (
        <InfoRow
          key={`${r.label}-${i}`}
          label={r.label}
          value={
            <>
              <span>{r.value}</span>
              {r.sub ? (
                <span className="text-caption font-normal text-ink-600">{r.sub}</span>
              ) : null}
            </>
          }
          action={r.action}
        />
      ))}
    </>
  );
}

export const StoreDetailOrderDetailMobilePage: React.FC = () => {
  const { storeId = "", orderId = "" } = useParams<{ storeId: string; orderId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: order, isLoading, isError, refetch } = useOrderDetail(orderId);
  const [guideOpen, setGuideOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [target, setTarget] = useState<OrderStatus | null>(null);
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);

  // 다른 스토어의 주문이면 그 스토어로 바꿔서 연다(알림을 눌러 들어온 경우)
  useEffect(() => {
    if (order && order.storeId !== storeId) {
      navigate(ROUTES.STORE_DETAIL_ORDERS_DETAIL(order.storeId, order.id), { replace: true });
    }
  }, [order, storeId, navigate]);

  // 처음 연 화면(알림으로 바로 들어옴)이면 뒤로 = 주문 목록
  const goBack = () => {
    if (location.key === "default")
      navigate(ROUTES.STORE_DETAIL_ORDERS_LIST(storeId), { replace: true });
    else navigate(-1);
  };

  const header = (
    <BackHeader
      title="주문 상세"
      onBack={goBack}
      actions={
        <HeaderIconButton
          icon="help"
          label="주문 상태 안내"
          className="text-ink-600"
          onClick={() => setGuideOpen(true)}
        />
      }
    />
  );

  if (isLoading) {
    return (
      <AppScreen header={header}>
        <div className="flex flex-col gap-3 pt-2" aria-busy="true" aria-label="불러오는 중">
          <span className="block h-8 w-full animate-pulse rounded-check bg-ink-50" />
          <span className="block h-7 w-3/4 animate-pulse rounded-check bg-ink-50" />
          <span className="block h-40 w-full animate-pulse rounded-card bg-ink-50" />
        </div>
      </AppScreen>
    );
  }

  if (!order) {
    return (
      <AppScreen header={header}>
        {isError ? (
          <LoadErrorState big onRetry={() => void refetch()} />
        ) : (
          <EmptyState big icon="search" title="주문을 찾을 수 없습니다." />
        )}
      </AppScreen>
    );
  }

  const status = order.orderStatus;
  const step = orderStepState(order);
  const actions = detailActionsFor(status);
  const hasActions = Boolean(actions.primary || actions.secondary || actions.more?.length);
  const phone = order.reservationPhone?.trim();
  const depositor = order.depositorName?.trim();
  const refundFirst = status === OrderStatus.CANCEL_REFUND_PENDING;
  const pickupAddress = [order.pickupRoadAddress || order.pickupAddress, order.pickupDetailAddress]
    .filter((v) => v?.trim())
    .join(", ");

  const footer = hasActions ? (
    <BottomActionBar>
      {actions.secondary || actions.more?.length ? (
        <ButtonPair>
          <Button
            variant="secondary"
            onClick={() =>
              actions.more?.length ? setMoreOpen(true) : setTarget(actions.secondary!)
            }
          >
            {actions.more?.length ? "다른 처리" : ORDER_ACTION_LABEL[actions.secondary!]}
          </Button>
          <Button
            onClick={() => actions.primary && setTarget(actions.primary)}
            disabled={!actions.primary}
          >
            {actions.primary ? ORDER_ACTION_LABEL[actions.primary] : ""}
          </Button>
        </ButtonPair>
      ) : (
        <Button block onClick={() => actions.primary && setTarget(actions.primary)}>
          {actions.primary ? ORDER_ACTION_LABEL[actions.primary] : ""}
        </Button>
      )}
    </BottomActionBar>
  ) : undefined;

  return (
    <AppScreen header={header} footer={footer}>
      <StepBar
        steps={ORDER_STEP_LABELS.map((label) => ({ label }))}
        current={step.current}
        filledThrough={step.filledThrough}
      />
      <p className="text-heading font-bold text-ink-900">{ORDER_TASK_LINE[status]}</p>
      {status === OrderStatus.PAYMENT_PENDING ? <PaymentDeadline order={order} /> : null}

      {refundFirst ? <CancelSection order={order} /> : null}

      <Divider />
      <SectionTitle>픽업</SectionTitle>
      <InfoRow label="일시" value={formatKstMonthDayWeekTime(order.pickupDate)} />
      {pickupAddress ? <InfoRow label="주소" value={pickupAddress} /> : null}

      <Divider />
      <SectionTitle>예약자</SectionTitle>
      <InfoRow label="이름" value={order.reservationContactName?.trim() || "예약자 미입력"} />
      {phone ? (
        <InfoRow
          label="연락처"
          value={<span className="select-all">{phone}</span>}
          action={<ContactActions phone={phone} />}
        />
      ) : null}
      {depositor ? (
        <InfoRow
          label="입금자명"
          value={depositor}
          action={
            <CopyButton text={depositor} label="입금자명 복사" done="입금자명을 복사했어요" />
          }
        />
      ) : null}

      <Divider />
      <SectionTitle>주문 항목</SectionTitle>
      {order.orderItems.map((item) => (
        <OrderItemBlock
          key={item.id}
          order={order}
          item={item}
          onOpenImages={(images, index) => setLightbox({ images, index })}
        />
      ))}

      <Divider />
      <SectionTitle>주문 정보</SectionTitle>
      <InfoRow
        label="주문번호"
        value={order.orderNumber}
        action={
          <CopyButton text={order.orderNumber} label="주문번호 복사" done="주문번호를 복사했어요" />
        }
      />
      <InfoRow label="주문일시" value={formatKstMonthDayWeekTime(order.createdAt)} />
      <InfoRow label="총 수량" value={`${order.totalQuantity}개`} />
      <InfoRow
        label="총 금액"
        value={<span className="text-group font-bold">{formatWon(order.totalPrice)}</span>}
      />

      {refundFirst ? null : <CancelSection order={order} />}

      <OrderGuideSheet open={guideOpen} onClose={() => setGuideOpen(false)} />
      {actions.more?.length ? (
        <OrderMoreActionsSheet
          order={order}
          open={moreOpen}
          actions={actions.more}
          onClose={() => setMoreOpen(false)}
          onPick={(to) => {
            setMoreOpen(false);
            setTarget(to);
          }}
        />
      ) : null}
      <OrderActionSheet order={order} target={target} onClose={() => setTarget(null)} />
      {lightbox ? (
        <ImageLightbox
          images={lightbox.images}
          initialIndex={lightbox.index}
          alt="참고 사진"
          onClose={() => setLightbox(null)}
        />
      ) : null}
    </AppScreen>
  );
};
