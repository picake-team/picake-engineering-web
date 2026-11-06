import { create } from "zustand";
import type { PushPermission } from "@/apps/web-seller/common/utils/webview.bridge";

/** 앱이 알려 준 이 휴대폰의 알림 허용 상태(앱이 아니거나 아직 모르면 unknown) */
export const usePushPermissionStore = create<{
  status: PushPermission | "unknown";
  setStatus: (s: PushPermission) => void;
}>((set) => ({
  status: "unknown",
  setStatus: (status) => set({ status }),
}));
