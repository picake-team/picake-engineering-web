import type { CaptureResult } from "posthog-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { isReplayBlockedPath, sanitizeEvent } from "@/apps/web-seller/common/config/posthog.config";

describe("isReplayBlockedPath", () => {
  it("로그인·가입·OAuth 콜백(/auth)은 녹화하지 않는다", () => {
    expect(isReplayBlockedPath("/auth/login")).toBe(true);
    expect(isReplayBlockedPath("/auth/login/google")).toBe(true);
  });

  it("채팅 목록·방은 녹화하지 않는다", () => {
    expect(isReplayBlockedPath("/stores/1/chats")).toBe(true);
    expect(isReplayBlockedPath("/stores/1/chats/t-1")).toBe(true);
    expect(isReplayBlockedPath("/stores/1/chats/order/o-1")).toBe(true);
    expect(isReplayBlockedPath("/stores/1/chatsx")).toBe(false);
  });

  it("그 밖의 화면은 녹화한다", () => {
    expect(isReplayBlockedPath("/")).toBe(false);
    expect(isReplayBlockedPath("/stores/1/orders/2")).toBe(false);
    expect(isReplayBlockedPath(null)).toBe(false);
  });
});

describe("sanitizeEvent — 앱 버전", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function send(properties: Record<string, unknown>) {
    return sanitizeEvent({ uuid: "u", event: "x", properties } as CaptureResult)!.properties;
  }

  it("앱 안이면 앱이 알려 준 버전·빌드·OS를 붙이고, 이벤트가 넣은 surface는 그대로 둔다", () => {
    vi.stubGlobal("window", {
      PicakeApp: { app: "seller", platform: "android", version: "1.0.0", build: "1" },
    });
    expect(send({ surface: "app" })).toEqual({
      surface: "app",
      app_version: "1.0.0",
      app_build: "1",
      app_platform: "android",
    });
  });

  it("브라우저(휴대폰·PC)면 앱 버전 속성이 없다", () => {
    vi.stubGlobal("window", {});
    expect(send({ surface: "pc" })).toEqual({ surface: "pc" });
  });
});
