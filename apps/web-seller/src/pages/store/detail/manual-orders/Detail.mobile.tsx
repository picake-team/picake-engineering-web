/**
 * 직접 적은 주문 상세 (기획 I-42, 시안 "직접 적은 주문").
 * 픽업 일시·케이크 → 레터링(손님이 쓴 글 모양: 테두리 칸 + 18 굵게) → 입금(금액 + 입금 전·받음, 누르면 바로 바뀜)
 * → 손님·받은 곳·메모 → 사진(누르면 크게). 아래 [고치기] + 회색 글자 [지우기](한 번 더 묻는다).
 */
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { AppScreen, BackHeader, BottomActionBar } from "@/apps/web-seller/common/ui/Screen";
import { Button, ButtonPair } from "@/apps/web-seller/common/ui/Button";
import { SegmentedTabs } from "@/apps/web-seller/common/ui/Choice";
import { InfoRow } from "@/apps/web-seller/common/ui/List";
import { BottomSheet } from "@/apps/web-seller/common/ui/Sheet";
import { LoadErrorState } from "@/apps/web-seller/common/ui/Surface";
import { ROUTES } from "@/apps/web-seller/common/constants/route-paths.constant";
import { NO_REPLAY } from "@/apps/web-seller/common/constants/replay.constant";
import { useAlertStore } from "@/apps/web-seller/common/store/alert.store";
import { canGoBackInApp } from "@/apps/web-seller/common/hooks/useLeaveAfterSave";
import getApiMessage from "@/apps/web-seller/common/utils/getApiMessage";
import { cakeDayOf } from "@/apps/web-seller/common/utils/cake-days.util";
import { formatKeyMonthDayWeek } from "@/apps/web-seller/common/utils/kst-date.util";
import { ImageLightbox } from "@/apps/web-seller/common/components/images/ImageLightbox";
import {
  isSellerAppWebView,
  saveImageToDevice,
} from "@/apps/web-seller/common/utils/webview.bridge";
import { formatWon } from "@/apps/web-seller/features/order/utils/order-mobile.util";
import { manualOrderApi } from "@/apps/web-seller/features/manual-order/apis/manual-order.api";
import { StatusPill } from "@/apps/web-seller/common/ui/Badge";
import { MANUAL_ORDER_SOURCE_LABEL } from "@/apps/web-seller/features/manual-order/constants/manual-order.constant";
import { manualOrderQueryKeys } from "@/apps/web-seller/features/manual-order/constants/manualOrderQueryKeys.constant";
import {
  useInvalidateManualOrders,
  useManualOrder,
} from "@/apps/web-seller/features/manual-order/hooks/queries/useManualOrderQuery";
import type { ManualOrderDto } from "@/apps/web-seller/features/manual-order/types/manual-order.dto";

type PaidTab = "unpaid" | "paid";

export const StoreDetailManualOrderDetailMobilePage: React.FC = () => {
  const { storeId = "", manualOrderId = "" } = useParams<{
    storeId: string;
    manualOrderId: string;
  }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addAlert } = useAlertStore();
  const invalidate = useInvalidateManualOrders();
  const q = useManualOrder(storeId, manualOrderId);
  const m = q.data;

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [photoIndex, setPhotoIndex] = useState<number | null>(null);

  useEffect(() => {
    // 지운 주문을 다시 열면(뒤로 가기 등) 캘린더로
    if (q.isError && (q.error as { response?: { status?: number } })?.response?.status === 404) {
      navigate(ROUTES.STORE_DETAIL_CALENDAR(storeId), { replace: true });
    }
  }, [q.isError, q.error, navigate, storeId]);

  // 입금 전·받음은 누르자마자 바꾸고, 저장이 실패하면 되돌린다(디자인 기준 "바로 되는 일은 바로").
  // 빨리 두 번 누르면 마지막에 누른 것만 화면에 남긴다(앞 응답·다시 읽기가 덮어쓰지 않게)
  const paidSeq = useRef(0);
  const setPaid = async (paid: boolean) => {
    if (!m || m.paid === paid) return;
    const seq = ++paidSeq.current;
    const key = manualOrderQueryKeys.detail(storeId, m.id);
    await queryClient.cancelQueries({ queryKey: key });
    const before = queryClient.getQueryData<ManualOrderDto>(key) ?? m;
    queryClient.setQueryData<ManualOrderDto>(key, { ...before, paid });
    try {
      const saved = await manualOrderApi.setPaid(storeId, m.id, paid);
      if (seq !== paidSeq.current) return;
      queryClient.setQueryData<ManualOrderDto>(key, saved);
      void invalidate({ exceptId: m.id });
    } catch (e) {
      if (seq === paidSeq.current) {
        queryClient.setQueryData<ManualOrderDto>(key, before);
        void invalidate();
      }
      addAlert({ severity: "error", message: getApiMessage.error(e) });
    }
  };

  const onDelete = async () => {
    if (!m) return;
    setDeleting(true);
    try {
      await manualOrderApi.remove(storeId, m.id);
      await invalidate({ exceptId: m.id });
      setConfirmOpen(false);
      addAlert({ severity: "success", message: "주문을 지웠어요" });
      if (canGoBackInApp()) navigate(-1);
      else
        navigate(`${ROUTES.STORE_DETAIL_CALENDAR(storeId)}?date=${m.pickupDate}`, {
          replace: true,
        });
    } catch (e) {
      addAlert({ severity: "error", message: getApiMessage.error(e) });
    } finally {
      setDeleting(false);
    }
  };

  const tag = m ? cakeDayOf(m.pickupDate) : null;

  return (
    <AppScreen
      header={<BackHeader title="직접 적은 주문" />}
      bodyClassName="gap-5 pt-2"
      footer={
        m ? (
          <BottomActionBar>
            <Button
              block
              onClick={() => navigate(ROUTES.STORE_DETAIL_MANUAL_ORDER_EDIT(storeId, m.id))}
            >
              고치기
            </Button>
            <Button variant="quiet" block onClick={() => setConfirmOpen(true)}>
              지우기
            </Button>
          </BottomActionBar>
        ) : undefined
      }
    >
      {q.isError && !m ? (
        <LoadErrorState big onRetry={() => void q.refetch()} />
      ) : !m ? (
        <span className="block h-40 animate-pulse rounded-card bg-ink-50" aria-busy="true" />
      ) : (
        <>
          <div className="flex flex-col gap-1">
            <span className="text-title font-bold text-ink-900">
              {formatKeyMonthDayWeek(m.pickupDate)} {m.pickupTime ?? "시간 미정"} 픽업
            </span>
            <span className="text-group font-semibold text-ink-900 [overflow-wrap:anywhere]">
              {m.cakeName}
            </span>
            {tag ? <span className="text-sub text-ink-600">{tag.full}</span> : null}
            {/* 운영자가 가게 대신 적은 주문(기획 I-41) */}
            {m.enteredByOperator ? (
              <StatusPill tone="wait" className="mt-1 self-start">
                운영자 입력
              </StatusPill>
            ) : null}
          </div>

          {m.lettering ? (
            <div className="flex flex-col gap-1 rounded-card border border-ink-200 px-4 py-3.5">
              <span className="text-sub font-bold text-ink-900">레터링</span>
              <span
                className={`${NO_REPLAY} text-heading font-bold leading-snug text-ink-900 [overflow-wrap:anywhere]`}
              >
                {m.lettering}
              </span>
            </div>
          ) : null}

          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-body font-bold text-ink-900">입금</span>
              <span className="text-body font-bold tabular-nums text-ink-900">
                {m.price === null ? "금액 미입력" : formatWon(m.price)}
              </span>
            </div>
            <SegmentedTabs<PaidTab>
              label="입금"
              value={m.paid === true ? "paid" : m.paid === false ? "unpaid" : ("" as PaidTab)}
              onChange={(v) => void setPaid(v === "paid")}
              options={[
                { value: "unpaid", label: "입금 전" },
                { value: "paid", label: "받음" },
              ]}
            />
          </div>

          <div aria-hidden="true" className="h-px bg-ink-100" />

          <dl className="flex flex-col">
            <InfoRow
              label="손님"
              value={<span className={NO_REPLAY}>{m.customerName ?? "–"}</span>}
            />
            <InfoRow label="받은 곳" value={MANUAL_ORDER_SOURCE_LABEL[m.source]} />
            {m.memo ? (
              <InfoRow
                label="메모"
                value={<span className={`${NO_REPLAY} whitespace-pre-wrap`}>{m.memo}</span>}
              />
            ) : null}
          </dl>

          {m.photoUrls.length > 0 ? (
            <div className="flex flex-col gap-2">
              <span className="text-sub font-bold text-ink-700">사진</span>
              <div className="flex gap-2">
                {m.photoUrls.map((url, i) => (
                  <button
                    key={url}
                    type="button"
                    aria-label={`사진 ${i + 1} 크게 보기`}
                    onClick={() => setPhotoIndex(i)}
                    className="overflow-hidden rounded-control"
                  >
                    <img src={url} alt="" className="size-[72px] object-cover" />
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {photoIndex !== null ? (
            <ImageLightbox
              images={m.photoUrls}
              initialIndex={photoIndex}
              alt="주문 사진"
              onClose={() => setPhotoIndex(null)}
              onSave={isSellerAppWebView() ? (src) => saveImageToDevice(src) : undefined}
            />
          ) : null}
        </>
      )}

      <BottomSheet
        open={confirmOpen}
        onClose={() => (deleting ? undefined : setConfirmOpen(false))}
        title="이 주문을 지울까요?"
        description="지우면 되돌릴 수 없어요. 달력과 매출에서도 빠져요."
        footer={
          <ButtonPair>
            <Button
              variant="secondary"
              block
              disabled={deleting}
              onClick={() => setConfirmOpen(false)}
            >
              취소
            </Button>
            <Button
              block
              loading={deleting}
              loadingLabel="지우는 중…"
              onClick={() => void onDelete()}
            >
              지우기
            </Button>
          </ButtonPair>
        }
      >
        {null}
      </BottomSheet>
    </AppScreen>
  );
};
