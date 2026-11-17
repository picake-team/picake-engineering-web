/**
 * 다른 캘린더로 내보내기 창(기획 I-42, 시안 "다른 캘린더로 내보내기"). 캘린더 화면 오른쪽 위 버튼으로 연다.
 * 아이폰·구글 캘린더가 구독하는 주소(ics)를 연다. Picake 예약과 직접 적은 주문이 같이 들어간다.
 * - 손님 이름은 기본으로 가림(켜면 일정 이름에 붙음, 누르자마자 바뀜)
 * - 구글은 구글이 정한 간격으로 다시 읽어 새 주문이 몇 시간 늦게 보인다(줄 설명 한 줄)
 * - 미리 보기·"주소 새로 만들기"는 운영자가 뺌(11-17). 서버의 주소 새로 만들기 API는 남아 있다
 */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BottomSheet } from "@/apps/web-seller/common/ui/Sheet";
import { ListRow, ListRowButton, RowIconBox } from "@/apps/web-seller/common/ui/List";
import { Switch } from "@/apps/web-seller/common/ui/Toggle";
import { Icon } from "@/apps/web-seller/common/ui/icons";
import { LoadErrorState } from "@/apps/web-seller/common/ui/Surface";
import { useAlertStore } from "@/apps/web-seller/common/store/alert.store";
import getApiMessage from "@/apps/web-seller/common/utils/getApiMessage";
import { externalHref, isSellerAppWebView } from "@/apps/web-seller/common/utils/webview.bridge";
import { copyText } from "@/apps/web-seller/common/utils/clipboard.util";
import { manualOrderApi } from "@/apps/web-seller/features/manual-order/apis/manual-order.api";
import { manualOrderQueryKeys } from "@/apps/web-seller/features/manual-order/constants/manualOrderQueryKeys.constant";
import type { CalendarFeedDto } from "@/apps/web-seller/features/manual-order/types/manual-order.dto";

const API_DOMAIN = import.meta.env.VITE_PUBLIC_API_DOMAIN;

/** 앱 안이면 앱이 휴대폰 캘린더·브라우저로 연다. 휴대폰 브라우저에서 구글 주소는 새 탭으로(판매자 화면을 떠나지 않게) */
function openOutside(url: string) {
  if (!isSellerAppWebView() && url.startsWith("https://")) {
    window.open(url, "_blank", "noopener");
    return;
  }
  window.location.href = externalHref(url);
}

/** 안드로이드는 webcal 주소를 여는 앱이 없어 아이폰 줄을 숨긴다 */
function isAndroid(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.PicakeSellerApp?.platform === "android" || /Android/i.test(window.navigator.userAgent)
  );
}

export function CalendarExportSheet({
  storeId,
  open,
  onClose,
}: {
  storeId: string;
  open: boolean;
  onClose: () => void;
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

  // 앱 안 화면에서 clipboard API가 막히면 예전 방식으로(copyText)
  const copy = async () => {
    if (await copyText(httpsUrl)) {
      addAlert({ severity: "success", message: "주소를 복사했어요" });
    } else {
      addAlert({ severity: "error", message: "주소를 복사하지 못했어요. 다시 시도해 주세요" });
    }
  };

  return (
    <BottomSheet open={open} onClose={onClose} showClose title="다른 캘린더로 내보내기">
      {feed.isError && !feed.data ? (
        <LoadErrorState onRetry={() => void feed.refetch()} />
      ) : !feed.data ? (
        <span className="block h-48 animate-pulse rounded-card bg-ink-50" aria-busy="true" />
      ) : (
        <div className="-mt-2 flex flex-col pb-2">
          {isAndroid() ? null : (
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
          )}
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
                checked={feed.data.showCustomerName}
                onChange={(next) => void toggleName(next)}
              />
            }
          />
        </div>
      )}
    </BottomSheet>
  );
}
