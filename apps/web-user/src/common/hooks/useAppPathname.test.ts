import { describe, expect, it } from "vitest";
import { normalizeAppPathname } from "./useAppPathname";

describe("normalizeAppPathname", () => {
  it("Vercel이 홈을 다시 만들 때 오는 /index를 /로 맞춘다", () => {
    expect(normalizeAppPathname("/index")).toBe("/");
    expect(normalizeAppPathname("/")).toBe("/");
    expect(normalizeAppPathname(null)).toBe("/");
  });

  it("다른 주소는 그대로 둔다", () => {
    expect(normalizeAppPathname("/search")).toBe("/search");
    expect(normalizeAppPathname("/index/x")).toBe("/index/x");
  });
});
