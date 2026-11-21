import { create } from "zustand";
import {
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
