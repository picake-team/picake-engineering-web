/**
 * 홈 "휴대폰 알림이 꺼져 있어요"(SC-70 ②, 디자인 8-H). 앱에서 알림을 허용하지 않았거나 "주문 알림 받기"를 껐을 때만.
 * "켜기": 아직 안 물었으면 허용 창, 거절했으면 휴대폰 설정, 설정을 껐으면 알림 설정(SC-93). 휴대폰 브라우저에서는 보이지 않는다.
 */
import { useNavigate } from "react-router-dom";
import { Button } from "@/apps/web-seller/common/ui/Button";
import { Icon } from "@/apps/web-seller/common/ui/icons";
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

/** 알림 설정 맨 위 "이 휴대폰 알림"(SC-93 ①, 앱에서만) */
export function DevicePushStatusCard() {
  const status = usePushPermissionStore((s) => s.status);
  if (!isSellerAppWebView()) return null;
  const on = status === "granted";
  return (
    <div className="flex items-center justify-between gap-3 rounded-card border border-ink-100 p-4 text-body">
      <span>
        이 휴대폰 알림{" "}
        <b className={on ? "text-ink-900" : "text-brand-ink"}>
          {on ? "허용됨" : status === "unknown" ? "확인 중" : "꺼짐"}
        </b>
      </span>
      {!on && status !== "unknown" ? (
        <Button
          variant="link"
          onClick={() => (status === "notDetermined" ? requestPushPermission() : openAppSettings())}
        >
          {status === "notDetermined" ? "허용하기" : "휴대폰 설정 열기"}
        </Button>
      ) : null}
    </div>
  );
}
