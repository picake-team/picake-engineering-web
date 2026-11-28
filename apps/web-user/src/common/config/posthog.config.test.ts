import type { CaptureResult } from "posthog-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { isReplayBlockedPath, sanitizeEvent } from "@/apps/web-user/common/config/posthog.config";

describe("isReplayBlockedPath", () => {
  it("로그인·가입(/auth)과 사장님 견적 링크(/q)는 녹화하지 않는다", () => {
    expect(isReplayBlockedPath("/auth/login")).toBe(true);
    expect(isReplayBlockedPath("/auth/callback/kakao")).toBe(true);
    expect(isReplayBlockedPath("/q/abc123")).toBe(true);
  });

  it("채팅 목록·방(/chat)은 녹화하지 않는다(F-66)", () => {
    expect(isReplayBlockedPath("/chat")).toBe(true);
    expect(isReplayBlockedPath("/chat/thread-1")).toBe(true);
    expect(isReplayBlockedPath("/chat/store/store-1")).toBe(true);
    expect(isReplayBlockedPath("/chatting")).toBe(false);
  });

  it("그 밖의 화면은 녹화한다", () => {
    expect(isReplayBlockedPath("/")).toBe(false);
    expect(isReplayBlockedPath("/quote/new")).toBe(false);
    expect(isReplayBlockedPath("/qa")).toBe(false);
    expect(isReplayBlockedPath("/store/1")).toBe(false);
    expect(isReplayBlockedPath(null)).toBe(false);
  });
});

describe("sanitizeEvent — 앱 버전", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function send(properties: Record<string, unknown>) {
    return sanitizeEvent({ uuid: "u", event: "$pageview", properties } as CaptureResult)!
      .properties;
  }

  it("앱 안이면 surface app과 앱이 알려 준 버전·빌드·OS를 붙인다", () => {
    vi.stubGlobal("window", {
      PicakeApp: { app: "customer", platform: "ios", version: "1.0.1", build: "18" },
    });
    expect(send({ $current_url: "https://picakes.com/" })).toMatchObject({
      surface: "app",
      app_version: "1.0.1",
      app_build: "18",
      app_platform: "ios",
    });
  });

  it("브라우저면 surface web이고 앱 버전 속성은 없다", () => {
    vi.stubGlobal("window", {});
    const properties = send({});
    expect(properties.surface).toBe("web");
    expect(properties).not.toHaveProperty("app_version");
    expect(properties).not.toHaveProperty("app_build");
    expect(properties).not.toHaveProperty("app_platform");
  });

  it("앱이 버전을 못 읽었으면(빈 글자) 그 속성만 뺀다", () => {
    vi.stubGlobal("window", { PicakeApp: { platform: "android", version: "", build: "" } });
    const properties = send({});
    expect(properties).toMatchObject({ surface: "app", app_platform: "android" });
    expect(properties).not.toHaveProperty("app_version");
    expect(properties).not.toHaveProperty("app_build");
  });

  it("민감한 주소 값은 그대로 지운다", () => {
    vi.stubGlobal("window", { PicakeApp: { platform: "android", version: "1.0.1", build: "18" } });
    expect(send({ $current_url: "https://picakes.com/x?code=secret&a=1" }).$current_url).toBe(
      "https://picakes.com/x?a=1",
    );
  });
});
