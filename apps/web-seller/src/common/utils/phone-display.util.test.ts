import { describe, expect, it } from "vitest";
import { formatPhoneDisplay } from "./phone-display.util";

describe("formatPhoneDisplay", () => {
  it("11자리 휴대폰 번호를 3-4-4로 나눈다", () => {
    expect(formatPhoneDisplay("01099990001")).toBe("010-9999-0001");
  });
  it("10자리는 3-3-4, 02로 시작하면 2-4-4", () => {
    expect(formatPhoneDisplay("0111234567")).toBe("011-123-4567");
    expect(formatPhoneDisplay("0212345678")).toBe("02-1234-5678");
  });
  it("이미 하이픈이 있어도 같은 모양", () => {
    expect(formatPhoneDisplay("010-9999-0001")).toBe("010-9999-0001");
  });
  it("10·11자리가 아니면 그대로", () => {
    expect(formatPhoneDisplay("E2E_FIXTURE")).toBe("E2E_FIXTURE");
    expect(formatPhoneDisplay("12345")).toBe("12345");
  });
});
