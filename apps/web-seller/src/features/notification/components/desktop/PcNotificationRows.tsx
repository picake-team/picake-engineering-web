/**
 * 알림 설정의 "이 컴퓨터" 묶음(PC 틀에서만, 기획 I-54).
 * - 주문 알림 소리: 화면을 켜 둔 동안 새 예약에 소리(서버 설정, 예전 PC 알림 설정에 있던 것)
 * - 브라우저 알림: 탭이 뒤에 있거나 다른 창을 보고 있어도 운영체제 알림(이 브라우저에만, 운영자 결정 2026-11-19)
 * 휴대폰 앱·휴대폰 화면은 휴대폰 알림(FCM)이 있어 보이지 않는다.
 */
import { useState } from "react";
import { ListRow } from "@/apps/web-seller/common/ui/List";
import { Switch } from "@/apps/web-seller/common/ui/Toggle";
import {
  browserNotifyPermission,
  browserNotifySupported,
  isBrowserNotifyOn,
  requestBrowserNotify,
  setBrowserNotifyOn,
  type BrowserNotifyPermission,
} from "@/apps/web-seller/features/notification/utils/browser-notification.util";

export function PcNotificationRows({
  soundOn,
  loaded,
  onSoundChange,
}: {
  soundOn: boolean;
  loaded: boolean;
  onSoundChange: (next: boolean) => void;
}) {
  const [permission, setPermission] = useState<BrowserNotifyPermission>(() =>
    browserNotifyPermission(),
  );
  const [on, setOn] = useState(
    () => isBrowserNotifyOn() && browserNotifyPermission() === "granted",
  );
  const supported = browserNotifySupported();

  const toggleBrowser = async (next: boolean) => {
    if (!next) {
      setBrowserNotifyOn(false);
      setOn(false);
      return;
    }
    const result = permission === "granted" ? "granted" : await requestBrowserNotify();
    setPermission(result);
    if (result === "granted") {
      setBrowserNotifyOn(true);
      setOn(true);
    }
  };

  return (
    <>
      <h2 className="text-group font-bold text-ink-900">이 컴퓨터</h2>
      <div className="-mt-2">
        <ListRow
          title="주문 알림 소리"
          description="화면을 켜 두면 새 예약에 소리가 나요"
          trailing={
            <Switch
              label="주문 알림 소리"
              disabled={!loaded}
              checked={soundOn}
              onChange={onSoundChange}
            />
          }
        />
        <ListRow
          title="브라우저 알림"
          description={
            !supported
              ? "이 브라우저는 알림을 띄우지 못해요"
              : permission === "denied"
                ? "브라우저에서 알림을 막아 두었어요. 주소창 왼쪽에서 알림을 허용해 주세요"
                : "다른 창을 보고 있어도 새 예약·채팅을 화면 구석에 띄워요"
          }
          divider={false}
          trailing={
            <Switch
              label="브라우저 알림"
              disabled={!supported || permission === "denied"}
              checked={on}
              onChange={(next) => void toggleBrowser(next)}
            />
          }
        />
      </div>
    </>
  );
}
