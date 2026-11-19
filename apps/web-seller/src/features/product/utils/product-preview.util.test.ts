import { describe, expect, it } from "vitest";
import { descriptionText, discountRate } from "./product-preview.util";

describe("손님 화면 미리보기 계산", () => {
  it("할인율은 반올림한 %, 할인 아니면 0", () => {
    expect(discountRate(40000, 32000)).toBe(20);
    expect(discountRate(30000, 30000)).toBe(0);
    expect(discountRate(undefined, 30000)).toBe(0);
    expect(discountRate(30000, 35000)).toBe(0);
  });
  it("상세 설명 HTML은 글자만", () => {
    expect(descriptionText("<p>생크림이 <b>부드러워요</b></p>")).toContain("부드러워요");
    expect(descriptionText("<p>생크림이 <b>부드러워요</b></p>")).not.toContain("<");
    expect(descriptionText(undefined)).toBe("");
  });
});
