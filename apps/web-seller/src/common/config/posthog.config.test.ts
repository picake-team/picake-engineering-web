import { describe, expect, it } from "vitest";
import { isReplayBlockedPath } from "@/apps/web-seller/common/config/posthog.config";

describe("isReplayBlockedPath", () => {
  it("로그인·가입·OAuth 콜백(/auth)은 녹화하지 않는다", () => {
    expect(isReplayBlockedPath("/auth/login")).toBe(true);
    expect(isReplayBlockedPath("/auth/login/google")).toBe(true);
  });

  it("그 밖의 화면은 녹화한다", () => {
    expect(isReplayBlockedPath("/")).toBe(false);
    expect(isReplayBlockedPath("/stores/1/orders/2")).toBe(false);
    expect(isReplayBlockedPath(null)).toBe(false);
  });
});
