/**
 * 다른 캘린더로 내보내기 창(기획 I-42, 시안 "다른 캘린더로 내보내기"). 캘린더 화면 오른쪽 위 버튼으로 연다.
 * 아이폰·구글 캘린더가 구독하는 주소(ics)를 연다. Picake 예약과 직접 적은 주문이 같이 들어간다.
 * - 손님 이름은 기본으로 가림(켜면 일정 이름에 붙음, 누르자마자 바뀜)
 * - "주소 새로 만들기": 옛 주소로 추가한 캘린더는 더 이상 바뀌지 않는다(한 번 더 묻는다)
 * - 구글은 구글이 정한 간격으로 다시 읽어 새 주문이 몇 시간 늦게 보인다(줄 설명 한 줄)
 */
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BottomSheet } from "@/apps/web-seller/common/ui/Sheet";
import { Button, ButtonPair } from "@/apps/web-seller/common/ui/Button";
import { ListRow, ListRowButton, RowIconBox } from "@/apps/web-seller/common/ui/List";
import { Switch } from "@/apps/web-seller/common/ui/Toggle";
import { Icon } from "@/apps/web-seller/common/ui/icons";
import { LoadErrorState } from "@/apps/web-seller/common/ui/Surface";
import { useAlertStore } from "@/apps/web-seller/common/store/alert.store";
import getApiMessage from "@/apps/web-seller/common/utils/getApiMessage";
import { externalHref } from "@/apps/web-seller/common/utils/webview.bridge";
import { formatKeyMonthDayWeek } from "@/apps/web-seller/common/utils/kst-date.util";
import { manualOrderApi } from "@/apps/web-seller/features/manual-order/apis/manual-order.api";
import { manualOrderQueryKeys } from "@/apps/web-seller/features/manual-order/constants/manual-order.constant";
import type { CalendarFeedDto } from "@/apps/web-seller/features/manual-order/types/manual-order.dto";

const API_DOMAIN = import.meta.env.VITE_PUBLIC_API_DOMAIN as string;

/** 미리 보기 한 줄(그날 첫 주문). 없으면 예시 */
export interface CalendarExportSample {
  dateKey: string;
  time: string | null;
  title: string;
  source: string;
  customerName: string | null;
}

function openOutside(url: string) {
  window.location.href = externalHref(url);
}

export function CalendarExportSheet({
  storeId,
  open,
  onClose,
  sample,
}: {
  storeId: string;
  open: boolean;
  onClose: () => void;
  sample: CalendarExportSample | null;
}) {
  const queryClient = useQueryClient();
  const { addAlert } = useAlertStore();
  const key = manualOrderQueryKeys.calendarFeed(storeId);
  const feed = useQuery({
    queryKey: key,
    queryFn: () => manualOrderApi.getCalendarFeed(storeId),
    enabled: open && !!storeId,
    staleTime: 5 * 60_000,
  });
  const [resetOpen, setResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const httpsUrl = feed.data ? `${API_DOMAIN}${feed.data.path}` : "";
  const webcalUrl = httpsUrl.replace(/^https?:\/\//, "webcal://");

  // 누르자마자 바꾸고, 저장이 실패하면 되돌린다
  const toggleName = async (next: boolean) => {
    const before = feed.data;
    if (!before) return;
    queryClient.setQueryData<CalendarFeedDto>(key, { ...before, showCustomerName: next });
    try {
      queryClient.setQueryData<CalendarFeedDto>(
        key,
        await manualOrderApi.updateCalendarFeed(storeId, next),
      );
    } catch (e) {
      queryClient.setQueryData<CalendarFeedDto>(key, before);
      addAlert({ severity: "error", message: getApiMessage.error(e) });
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(httpsUrl);
      addAlert({ severity: "success", message: "주소를 복사했어요" });
    } catch {
      addAlert({ severity: "error", message: "주소를 복사하지 못했어요. 다시 시도해 주세요" });
    }
  };

  const reset = async () => {
    setResetting(true);
    try {
      queryClient.setQueryData<CalendarFeedDto>(
        key,
        await manualOrderApi.resetCalendarFeed(storeId),
      );
      setResetOpen(false);
      addAlert({ severity: "success", message: "새 주소를 만들었어요" });
    } catch (e) {
      addAlert({ severity: "error", message: getApiMessage.error(e) });
    } finally {
      setResetting(false);
    }
  };

  const showName = feed.data?.showCustomerName ?? false;
  const previewTitle = sample
    ? [sample.title, sample.source, showName ? sample.customerName : null]
        .filter(Boolean)
        .join(" · ")
    : ["2호 초코 리스", "카톡", showName ? "홍길동" : null].filter(Boolean).join(" · ");
  const previewWhen = sample
    ? `${formatKeyMonthDayWeek(sample.dateKey)} ${sample.time ?? "하루 종일"}`
    : "예: 12월 24일 (목) 12:00";

  return (
    <>
      <BottomSheet open={open} onClose={onClose} showClose title="다른 캘린더로 내보내기">
        {feed.isError && !feed.data ? (
          <LoadErrorState onRetry={() => void feed.refetch()} />
        ) : !feed.data ? (
          <span className="block h-48 animate-pulse rounded-card bg-ink-50" aria-busy="true" />
        ) : (
          <div className="-mt-2 flex flex-col pb-2">
            <ListRowButton
              leading={
                <RowIconBox>
                  <Icon name="calendar" size={20} strokeWidth={1.8} />
                </RowIconBox>
              }
              title="아이폰 캘린더에 추가"
              chevron
              onClick={() => openOutside(webcalUrl)}
            />
            <ListRowButton
              leading={
                <RowIconBox>
                  <Icon name="calendar" size={20} strokeWidth={1.8} />
                </RowIconBox>
              }
              title="구글 캘린더에 추가"
              description="새 주문은 몇 시간 늦게 보여요"
              chevron
              onClick={() =>
                openOutside(
                  `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcalUrl)}`,
                )
              }
            />
            <ListRowButton
              leading={
                <RowIconBox>
                  <Icon name="copy" size={20} strokeWidth={1.8} />
                </RowIconBox>
              }
              title="주소 복사"
              description="네이버 캘린더 등에 붙여 넣어요"
              divider={false}
              onClick={() => void copy()}
            />
            <div aria-hidden="true" className="my-2 h-px bg-ink-100" />
            <ListRow
              title="손님 이름 보이기"
              description="켜면 일정 이름에 손님 이름이 붙어요"
              divider={false}
              trailing={
                <Switch
                  label="손님 이름 보이기"
                  checked={showName}
                  onChange={(next) => void toggleName(next)}
                />
              }
            />
            <div className="mt-2 flex flex-col gap-0.5 rounded-control bg-ink-50 px-4 py-3">
              <span className="text-caption text-ink-600">{previewWhen}</span>
              <span className="text-body font-semibold text-ink-900">{previewTitle}</span>
            </div>
            <Button variant="quiet" block className="mt-2" onClick={() => setResetOpen(true)}>
              주소 새로 만들기
            </Button>
          </div>
        )}
      </BottomSheet>
      <BottomSheet
        open={resetOpen}
        onClose={() => (resetting ? undefined : setResetOpen(false))}
        title="새 주소를 만들까요?"
        description="지금 주소로 추가한 캘린더는 더 이상 새 주문이 들어가지 않아요."
        footer={
          <ButtonPair>
            <Button
              variant="secondary"
              block
              disabled={resetting}
              onClick={() => setResetOpen(false)}
            >
              취소
            </Button>
            <Button
              block
              loading={resetting}
              loadingLabel="만드는 중…"
              onClick={() => void reset()}
            >
              새로 만들기
            </Button>
          </ButtonPair>
        }
      >
        {null}
      </BottomSheet>
    </>
  );
}
