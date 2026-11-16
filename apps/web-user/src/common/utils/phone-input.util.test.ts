import { describe, expect, it } from "vitest";
import {
  PHONE_INPUT_MAX_LENGTH,
  fromAutofillPhone,
  toPhoneDigits,
} from "@/apps/web-user/common/utils/phone-input.util";

describe("phone-input.util — 번호 칸 입력·자동완성", () => {
  it.each([
    ["01012345678", "01012345678"],
    ["010-1234-5678", "01012345678"], // 크롬 자동완성
    ["010 1234 5678", "01012345678"],
    ["+82 10-1234-5678", "01012345678"], // 아이폰 연락처 카드
    ["+82 010-1234-5678", "01012345678"],
    ["+821012345678", "01012345678"],
    ["821012345678", "01012345678"],
    ["0101234567899", "01012345678"], // 11자리까지만
    ["", ""],
  ])("toPhoneDigits(%s) → %s", (raw, expected) => {
    expect(toPhoneDigits(raw)).toBe(expected);
  });

  it("손으로 쓰는 중인 값은 그대로 받는다(앞자리 8·82도)", () => {
    expect(toPhoneDigits("8")).toBe("8");
    expect(toPhoneDigits("82")).toBe("82");
    expect(toPhoneDigits("0101")).toBe("0101");
  });

  it("fromAutofillPhone은 국가번호 형식만 바꾸고 손으로 쓴 하이픈은 남긴다", () => {
    expect(fromAutofillPhone("010-1234-5678")).toBe("010-1234-5678");
    expect(fromAutofillPhone("+82 10-1234-5678")).toBe("01012345678");
    expect(fromAutofillPhone("02-123-4567")).toBe("02-123-4567");
    expect(fromAutofillPhone("+1 650-555-1234")).toBe("+1 650-555-1234");
  });

  it("칸 길이는 국가번호·하이픈이 붙은 자동완성 값이 잘리지 않을 만큼", () => {
    expect("+82 010-1234-5678".length).toBeLessThanOrEqual(PHONE_INPUT_MAX_LENGTH);
  });
});
