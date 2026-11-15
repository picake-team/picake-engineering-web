import { describe, expect, it } from "vitest";
import { ProductCategoryType } from "@/apps/web-user/features/product/types/product.type";
import {
  readDesignCategory,
  readSearchCategory,
  searchCategoryLabel,
} from "@/apps/web-user/features/search/utils/search-category.util";

describe("readSearchCategory", () => {
  it("필터 유형에 있는 값은 그대로 읽는다", () => {
    expect(readSearchCategory("BIRTHDAY")).toBe(ProductCategoryType.BIRTHDAY);
    expect(readSearchCategory("SAME_DAY_PICKUP")).toBe(ProductCategoryType.SAME_DAY_PICKUP);
  });

  it("값이 없으면 없는 것으로 본다", () => {
    expect(readSearchCategory(null)).toBeUndefined();
    expect(readSearchCategory(undefined)).toBeUndefined();
    expect(readSearchCategory("")).toBeUndefined();
  });

  it("모르는 값이나 필터에서 뺀 커스텀은 받지 않는다", () => {
    expect(readSearchCategory("birthday")).toBeUndefined();
    expect(readSearchCategory("WORK")).toBeUndefined();
    expect(readSearchCategory(ProductCategoryType.LETTERING)).toBeUndefined();
  });
});

describe("readDesignCategory", () => {
  it("디자인 모음 상황 값은 읽는다 — 레터링도", () => {
    expect(readDesignCategory("LETTERING")).toBe(ProductCategoryType.LETTERING);
    expect(readDesignCategory("FLOWER")).toBe(ProductCategoryType.FLOWER);
    expect(readDesignCategory("BIRTHDAY")).toBe(ProductCategoryType.BIRTHDAY);
  });

  it("디자인 모음에 없는 값·모르는 값은 받지 않는다", () => {
    expect(readDesignCategory("SAME_DAY_PICKUP")).toBeUndefined();
    expect(readDesignCategory("CHARACTER")).toBeUndefined();
    expect(readDesignCategory("constructor")).toBeUndefined();
    expect(readDesignCategory(null)).toBeUndefined();
  });
});

describe("searchCategoryLabel", () => {
  it("필터 유형 이름을 먼저, 없으면 디자인 상황 이름", () => {
    expect(searchCategoryLabel(ProductCategoryType.BIRTHDAY)).toBe("생일");
    expect(searchCategoryLabel(ProductCategoryType.SAME_DAY_PICKUP)).toBe("당일픽업");
    expect(searchCategoryLabel(ProductCategoryType.LETTERING)).toBe("레터링");
  });
});
