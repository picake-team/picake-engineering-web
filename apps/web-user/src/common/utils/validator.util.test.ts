import { describe, expect, it } from "vitest";
import { isValidPhone } from "@/apps/web-user/common/utils/validator.util";

describe("isValidPhone — 010은 11자리만(11-16 검토)", () => {
  it("010 11자리, 옛 번호 011·016~019 10·11자리는 통과", () => {
    expect(isValidPhone("01012345678")).toBe(true);
    expect(isValidPhone("0111234567")).toBe(true);
    expect(isValidPhone("01712345678")).toBe(true);
  });

  it("한 자리 빠진 010 번호와 휴대폰이 아닌 앞자리는 거절", () => {
    expect(isValidPhone("0101234567")).toBe(false);
    expect(isValidPhone("0121234567")).toBe(false);
    expect(isValidPhone("REVIEW_ACCOUNT")).toBe(false);
  });
});
