/**
 * 홈 "휴대폰 알림이 꺼져 있어요"(SC-70 ②, 디자인 8-H). 앱에서 알림을 허용하지 않았거나 "주문 알림 받기"를 껐을 때만.
 * "켜기": 아직 안 물었으면 허용 창, 거절했으면 휴대폰 설정, 설정을 껐으면 알림 설정(SC-93). 휴대폰 브라우저에서는 보이지 않는다.
 */
import { useNavigate } from "react-router-dom";
import { Button } from "@/apps/web-seller/common/ui/Button";
import { Icon } from "@/apps/web-seller/common/ui/icons";
import { RowIconBox } from "@/apps/web-seller/common/ui/List";
import { ROUTES } from "@/apps/web-seller/common/constants/route-paths.constant";
import { usePushPermissionStore } from "@/apps/web-seller/common/store/push-permission.store";
import {
  isSellerAppWebView,
  openAppSettings,
  requestPushPermission,
} from "@/apps/web-seller/common/utils/webview.bridge";

export function PushOffBanner({
  storeId,
  orderNotificationsEnabled,
}: {
  storeId: string;
  /** 이 스토어 "주문 알림 받기"(모르면 undefined) */
  orderNotificationsEnabled: boolean | undefined;
}) {
  const navigate = useNavigate();
  const status = usePushPermissionStore((s) => s.status);
  if (!isSellerAppWebView()) return null;
  const permissionOff = status === "denied" || status === "notDetermined";
  const settingOff = orderNotificationsEnabled === false;
  if (!permissionOff && !settingOff) return null;

  const turnOn = () => {
    if (status === "notDetermined") requestPushPermission();
    else if (status === "denied") openAppSettings();
    else navigate(ROUTES.STORE_DETAIL_NOTIFICATIONS_SETTINGS(storeId));
  };

  return (
    <div className="flex items-center gap-3 rounded-card border border-ink-100 px-4 py-3">
      <span className="shrink-0 text-brand">
        <Icon name="bell" size={22} strokeWidth={2} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-body font-semibold text-ink-900">휴대폰 알림이 꺼져 있어요</span>
        <span className="text-caption text-ink-600">새 예약을 놓칠 수 있어요</span>
      </span>
      <Button size="md" onClick={turnOn}>
        켜기
      </Button>
    </div>
  );
}

/**
 * 알림 설정 맨 위 "이 휴대폰 알림"(SC-93 ①, 앱에서만). 홈 "휴대폰 알림이 꺼져 있어요"와 같은 모양:
 * 켜져 있으면 회색 종 + "허용됨", 꺼져 있으면 연한 주황 종 + "켜기"(안 물었으면 허용 창, 거절했으면 휴대폰 설정).
 * 360 폭에서도 한 줄씩 들어가게 글을 짧게 둔다.
 */
export function DevicePushStatusCard() {
  const status = usePushPermissionStore((s) => s.status);
  if (!isSellerAppWebView()) return null;
  const on = status === "granted";
  const checking = status === "unknown";
  const off = !on && !checking;
  return (
    <div className="flex items-center gap-3 rounded-card border border-ink-100 px-4 py-3">
      <RowIconBox active={off}>
        <span className={off ? "text-brand" : "text-ink-600"}>
          <Icon name="bell" size={22} strokeWidth={2} />
        </span>
      </RowIconBox>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-body font-semibold text-ink-900">
          {off ? "알림이 꺼져 있어요" : "이 휴대폰 알림"}
        </span>
        <span className="text-caption text-ink-600">
          {on
            ? "새 예약을 바로 알려 드려요"
            : checking
              ? "확인하는 중이에요"
              : status === "denied"
                ? "휴대폰 설정에서 켜 주세요"
                : "새 예약을 놓칠 수 있어요"}
        </span>
      </span>
      {on ? (
        <span className="flex shrink-0 items-center gap-1 text-sub font-semibold text-ink-900">
          <Icon name="check" size={16} strokeWidth={2.4} />
          허용됨
        </span>
      ) : null}
      {off ? (
        <Button
          size="md"
          className="shrink-0"
          onClick={() => (status === "notDetermined" ? requestPushPermission() : openAppSettings())}
        >
          켜기
        </Button>
      ) : null}
    </div>
  );
}
