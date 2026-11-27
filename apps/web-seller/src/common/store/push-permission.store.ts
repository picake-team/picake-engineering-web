import { create } from "zustand";
import {
  openNotificationSettings,
  requestPushPermission,
  type PushPermission,
} from "@/apps/web-seller/common/utils/webview.bridge";

/** 앱이 알려 준 이 휴대폰의 알림 허용 상태(앱이 아니거나 아직 모르면 unknown) */
export const usePushPermissionStore = create<{
  status: PushPermission | "unknown";
  setStatus: (s: PushPermission) => void;
}>((set) => ({
  status: "unknown",
  setStatus: (status) => set({ status }),
}));

/** 휴대폰 알림 허용 창을 띄우고(이미 정했으면 창 없이) 결과를 저장한다. 허용되면 등록은 SellerAppBridgeProvider가 한다 */
export async function askPushPermission(): Promise<void> {
  const status = await requestPushPermission();
  if (status) usePushPermissionStore.getState().setStatus(status);
}

/**
 * "알림 받기" 버튼: 거절했으면 휴대폰 알림 설정을 열고, 아니면 허용 창. 휴대폰은 한 번 거절한 허용 창을 다시 띄우지
 * 않아(iOS는 처음 한 번만, 안드로이드 13+는 두 번 거절하면) 같은 창을 또 부르면 아무 일도 없다 — 홈 "켜기"(PushOffBanner)와 같게.
 * 설정에서 허용하고 돌아오면 앱이 pushPermission을 다시 알려 화면이 "허용했어요"로 바뀐다(SellerAppBridgeProvider).
 */
export async function askPushPermissionOrOpenSettings(): Promise<void> {
  if (usePushPermissionStore.getState().status === "denied") {
    await openNotificationSettings();
    return;
  }
  await askPushPermission();
}
