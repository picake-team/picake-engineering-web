import { describe, expect, it } from "vitest";
import {
  hasSellerCheckMark,
  splitBySellerCheckMark,
} from "@/apps/web-seller/features/product/utils/ai-draft.util";

describe("판매자 확인 필요 표시", () => {
  it("두 형태를 모두 찾는다 (저장 막기 기준)", () => {
    expect(hasSellerCheckMark("<p>보관은 [판매자 확인 필요]</p>")).toBe(true);
    expect(hasSellerCheckMark("<p>소비기한은 [판매자 확인 필요: 제작일 기준]입니다</p>")).toBe(
      true,
    );
    expect(hasSellerCheckMark("<p>판매자 확인을 마쳤어요</p>")).toBe(false);
    expect(hasSellerCheckMark(undefined)).toBe(false);
  });

  it("강조할 부분을 나눈다", () => {
    expect(splitBySellerCheckMark("앞 [판매자 확인 필요: 크기] 뒤 [판매자 확인 필요]")).toEqual([
      { text: "앞 ", isMark: false },
      { text: "[판매자 확인 필요: 크기]", isMark: true },
      { text: " 뒤 ", isMark: false },
      { text: "[판매자 확인 필요]", isMark: true },
    ]);
  });
});
