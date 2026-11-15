import { describe, expect, it } from "vitest";
import { ProductCategoryType } from "@/apps/web-user/features/product/types/product.type";
import {
  buildCategorySearchHref,
  buildSizeSearchHref,
  readSearchCategory,
  readSearchSize,
  searchCategoryLabel,
} from "@/apps/web-user/features/search/utils/search-category.util";

describe("readSearchCategory", () => {
  it("카테고리 값은 그대로 읽는다 — 상황·디자인·모양·서비스 모두", () => {
    expect(readSearchCategory("BIRTHDAY")).toBe(ProductCategoryType.BIRTHDAY);
    expect(readSearchCategory("LETTERING")).toBe(ProductCategoryType.LETTERING);
    expect(readSearchCategory("TWO_TIER")).toBe(ProductCategoryType.TWO_TIER);
    expect(readSearchCategory("SAME_DAY_PICKUP")).toBe(ProductCategoryType.SAME_DAY_PICKUP);
  });

  it("11-15 전 값은 새 값으로 읽는다(공유된 옛 주소)", () => {
    expect(readSearchCategory("LOVER")).toBe(ProductCategoryType.COUPLE);
    expect(readSearchCategory("ANNIVERSARY")).toBe(ProductCategoryType.COUPLE);
    expect(readSearchCategory("FAMILY")).toBe(ProductCategoryType.THANKS);
    expect(readSearchCategory("FRIEND")).toBe(ProductCategoryType.BIRTHDAY);
  });

  it("없앤 값(빈티지·입체)은 카테고리 없이 연다", () => {
    expect(readSearchCategory("VINTAGE")).toBeUndefined();
    expect(readSearchCategory("SCULPTED")).toBeUndefined();
  });

  it("값이 없거나 모르는 값은 없는 것으로 본다", () => {
    expect(readSearchCategory(null)).toBeUndefined();
    expect(readSearchCategory(undefined)).toBeUndefined();
    expect(readSearchCategory("")).toBeUndefined();
    expect(readSearchCategory("birthday")).toBeUndefined();
    expect(readSearchCategory("WORK")).toBeUndefined();
    expect(readSearchCategory("constructor")).toBeUndefined();
  });
});

describe("readSearchSize", () => {
  it("필터 사이즈에 있는 값만 읽는다", () => {
    expect(readSearchSize("도시락")).toBe("도시락");
    expect(readSearchSize("미니")).toBe("미니");
    expect(readSearchSize("4호")).toBeUndefined();
    expect(readSearchSize(null)).toBeUndefined();
  });
});

describe("searchCategoryLabel", () => {
  it("묶음의 화면 이름", () => {
    expect(searchCategoryLabel(ProductCategoryType.BIRTHDAY)).toBe("생일");
    expect(searchCategoryLabel(ProductCategoryType.COUPLE)).toBe("연인·기념일");
    expect(searchCategoryLabel(ProductCategoryType.LETTERING)).toBe("레터링");
    expect(searchCategoryLabel(ProductCategoryType.SAME_DAY_PICKUP)).toBe("당일픽업");
  });
});

describe("검색 주소 만들기", () => {
  it("카테고리·디자인 탭·사이즈 주소", () => {
    expect(buildCategorySearchHref(ProductCategoryType.HEART)).toBe("/search?category=HEART");
    expect(buildCategorySearchHref(ProductCategoryType.BIRTHDAY, "design")).toBe(
      "/search?tab=design&category=BIRTHDAY",
    );
    expect(buildSizeSearchHref("도시락")).toBe(`/search?size=${encodeURIComponent("도시락")}`);
  });
});
