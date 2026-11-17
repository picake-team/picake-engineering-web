import { describe, expect, it } from "vitest";
import { cakeDayOf } from "@/apps/web-seller/common/utils/cake-days.util";

describe("cakeDayOf (케이크 대목·기념일)", () => {
  it("해마다 같은 날", () => {
    expect(cakeDayOf("2026-11-11")?.short).toBe("빼빼로");
    expect(cakeDayOf("2026-12-24")?.full).toBe("크리스마스이브");
    expect(cakeDayOf("2027-01-01")?.short).toBe("새해");
    expect(cakeDayOf("2026-11-17")).toBeNull();
  });

  it("설날·추석은 해마다 다른 날(음력)", () => {
    expect(cakeDayOf("2026-02-17")?.short).toBe("설날");
    expect(cakeDayOf("2027-02-07")?.short).toBe("설날");
    expect(cakeDayOf("2027-02-17")).toBeNull();
    expect(cakeDayOf("2026-09-25")?.short).toBe("추석");
  });

  it("성년의날은 5월 셋째 월요일", () => {
    expect(cakeDayOf("2026-05-18")?.short).toBe("성년의날");
    expect(cakeDayOf("2027-05-17")?.short).toBe("성년의날");
    expect(cakeDayOf("2026-05-11")).toBeNull();
    expect(cakeDayOf("2026-05-15")?.short).toBe("스승의날");
    // 겹치는 해: 짧은 이름은 그날, 긴 이름은 둘 다
    expect(cakeDayOf("2028-05-15")).toEqual({ short: "스승의날", full: "스승의날 · 성년의날" });
    expect(cakeDayOf("2029-05-21")?.full).toBe("부부의날 · 성년의날");
  });
});
