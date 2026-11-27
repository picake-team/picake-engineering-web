import { beforeEach, describe, expect, it, vi } from "vitest";

const bridge = vi.hoisted(() => ({
  requestPushPermission: vi.fn(),
  openNotificationSettings: vi.fn(),
}));
vi.mock("@/apps/web-seller/common/utils/webview.bridge", () => bridge);

import {
  askPushPermission,
  askPushPermissionOrOpenSettings,
  usePushPermissionStore,
} from "./push-permission.store";

describe("알림 받기 버튼(처음 사용 안내 SC-69)", () => {
  beforeEach(() => {
    bridge.requestPushPermission.mockReset();
    bridge.openNotificationSettings.mockReset();
    usePushPermissionStore.setState({ status: "unknown" });
  });

  it("거절한 뒤에 다시 누르면 휴대폰 알림 설정을 연다", async () => {
    usePushPermissionStore.getState().setStatus("denied");
    await askPushPermissionOrOpenSettings();
    expect(bridge.openNotificationSettings).toHaveBeenCalledTimes(1);
    expect(bridge.requestPushPermission).not.toHaveBeenCalled();
  });

  it("예전처럼 허용 창만 부르면 거절한 뒤에는 아무 일도 일어나지 않는다(휴대폰이 창을 다시 띄우지 않음)", async () => {
    usePushPermissionStore.getState().setStatus("denied");
    bridge.requestPushPermission.mockResolvedValue("denied");
    await askPushPermission();
    expect(bridge.openNotificationSettings).not.toHaveBeenCalled();
    expect(usePushPermissionStore.getState().status).toBe("denied");
  });

  it("아직 안 물었거나 모르면 허용 창을 띄우고 결과를 저장한다", async () => {
    bridge.requestPushPermission.mockResolvedValue("granted");
    await askPushPermissionOrOpenSettings();
    expect(bridge.requestPushPermission).toHaveBeenCalledTimes(1);
    expect(bridge.openNotificationSettings).not.toHaveBeenCalled();
    expect(usePushPermissionStore.getState().status).toBe("granted");

    usePushPermissionStore.getState().setStatus("notDetermined");
    bridge.requestPushPermission.mockResolvedValue("denied");
    await askPushPermissionOrOpenSettings();
    expect(bridge.requestPushPermission).toHaveBeenCalledTimes(2);
    expect(usePushPermissionStore.getState().status).toBe("denied");
  });
});
