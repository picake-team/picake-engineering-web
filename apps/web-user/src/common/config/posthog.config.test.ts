import { describe, expect, it } from "vitest";
import { isReplayBlockedPath } from "@/apps/web-user/common/config/posthog.config";

describe("isReplayBlockedPath", () => {
  it("로그인·가입(/auth)과 사장님 견적 링크(/q)는 녹화하지 않는다", () => {
    expect(isReplayBlockedPath("/auth/login")).toBe(true);
    expect(isReplayBlockedPath("/auth/callback/kakao")).toBe(true);
    expect(isReplayBlockedPath("/q/abc123")).toBe(true);
  });

  it("그 밖의 화면은 녹화한다", () => {
    expect(isReplayBlockedPath("/")).toBe(false);
    expect(isReplayBlockedPath("/quote/new")).toBe(false);
    expect(isReplayBlockedPath("/qa")).toBe(false);
    expect(isReplayBlockedPath("/store/1")).toBe(false);
    expect(isReplayBlockedPath(null)).toBe(false);
  });
});
